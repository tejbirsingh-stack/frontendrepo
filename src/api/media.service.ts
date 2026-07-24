import { getAccessToken, handleUnauthorized } from '../auth/authTokenBridge';
import { env } from '../config/env';
import { apiClient } from './client';

export interface UploadMediaProgress {
  loaded: number;
  total: number;
}

export interface MediaAssetResponseDto {
  id: string;
  name: string;
  path?: string;
  type: string;
  size: number;
  uploadDate: string;
  url: string;
  thumbnail?: string | null;
  metadata?: Record<string, unknown>;
  status?: string;
  customMetadata?: Record<string, unknown>;
  transcodingStatus?: string | null;
  compressionStatus?: string | null;
  uploadedByUserId?: string;
}

const CHUNK_SIZE = 5 * 1024 * 1024; // 5 MB chunks for Backblaze B2 / AWS S3 multipart upload

async function uploadChunkDirectToB2(
  url: string,
  chunkBlob: Blob,
  onProgress?: (loaded: number) => void,
): Promise<string | null> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url, true);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(event.loaded);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const etag =
          xhr.getResponseHeader('ETag') ||
          xhr.getResponseHeader('etag') ||
          xhr.getResponseHeader('x-amz-meta-etag');
        if (!etag) {
          // If CORS policy blocks reading ETag header, resolve as null to trigger backend fallback
          resolve(null);
          return;
        }
        resolve(etag);
      } else {
        reject(new Error(`Direct B2 upload failed with status ${xhr.status}`));
      }
    };

    xhr.onerror = () => {
      reject(new Error('Network error during direct B2 upload'));
    };

    xhr.send(chunkBlob);
  });
}

async function uploadChunkViaServer(
  sessionId: string,
  partNumber: number,
  chunkBlob: Blob,
  onProgress?: (loaded: number) => void,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const token = getAccessToken();
    const base = (env.apiBaseUrl || '/api').replace(/\/$/, '');
    const url = `${base}/media/upload/chunk?sessionId=${encodeURIComponent(sessionId)}&partNumber=${partNumber}`;

    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url, true);
    xhr.withCredentials = true;
    xhr.setRequestHeader('Content-Type', 'application/octet-stream');

    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(event.loaded);
      }
    };

    xhr.onload = () => {
      if (xhr.status === 401) {
        handleUnauthorized();
        reject(new Error('Unauthorized'));
        return;
      }
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const res = JSON.parse(xhr.responseText);
          if (res.success && res.etag) {
            resolve(res.etag);
          } else {
            reject(new Error(res.message || 'Server did not return ETag for chunk'));
          }
        } catch {
          reject(new Error('Failed to parse server response for chunk upload'));
        }
      } else {
        reject(new Error(`Server chunk upload failed with status ${xhr.status}`));
      }
    };

    xhr.onerror = () => {
      reject(new Error('Network error during server chunk upload'));
    };

    xhr.send(chunkBlob);
  });
}

async function uploadSingleChunkWithFallback(
  sessionId: string,
  partNumber: number,
  chunkBlob: Blob,
  presignedUrl: string | null,
  onProgress?: (loaded: number) => void,
  onDirectB2Fail?: () => void,
): Promise<string> {
  if (presignedUrl) {
    try {
      const etag = await uploadChunkDirectToB2(presignedUrl, chunkBlob, onProgress);
      if (etag) {
        return etag;
      }
      if (onDirectB2Fail) onDirectB2Fail();
    } catch (err) {
      console.warn(`Direct B2 upload failed for chunk ${partNumber}, falling back to server upload...`, err);
      if (onDirectB2Fail) onDirectB2Fail();
    }
  }
  return await uploadChunkViaServer(sessionId, partNumber, chunkBlob, onProgress);
}

export interface UploadMediaMetadataOptions {
  durationSeconds?: number;
  title?: string;
  summary?: string;
  folderId?: string;
  tagIds?: string[];
  technicalSpecs?: Record<string, any>;
  onProgress?: (progress: UploadMediaProgress) => void;
}

async function uploadResumableChunkedFile(
  file: File,
  options?: UploadMediaMetadataOptions,
  progressCallback?: (progress: UploadMediaProgress) => void,
): Promise<MediaAssetResponseDto> {
  const initRes = await apiClient.post<{ sessionId: string; uploadId: string; key: string }>(
    '/media/upload/init',
    {
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type || 'application/octet-stream',
      durationSeconds: options?.durationSeconds || null,
      title: options?.title || null,
      summary: options?.summary || null,
      folderId: options?.folderId || null,
      tagIds: options?.tagIds || [],
      technicalSpecs: options?.technicalSpecs || null,
    },
  );

  const { sessionId } = initRes;
  const totalParts = Math.max(1, Math.ceil(file.size / CHUNK_SIZE));
  const parts: { PartNumber: number; ETag: string }[] = [];
  const partLoadedBytes = new Array(totalParts + 1).fill(0);
  let directB2Failed = false; // Once direct B2 fails (CORS/network), skip trying it for remaining chunks to avoid delay!

  const reportProgress = () => {
    if (!progressCallback) return;
    const totalLoadedBytes = partLoadedBytes.reduce((a, b) => a + b, 0);
    progressCallback({ loaded: Math.min(totalLoadedBytes, file.size), total: file.size });
  };

  const uploadTasks = Array.from({ length: totalParts }, (_, i) => i + 1);
  const CONCURRENCY = 3; // Upload up to 3 chunks in parallel for maximum speed!

  try {
    const runWorker = async () => {
      while (uploadTasks.length > 0) {
        const partNumber = uploadTasks.shift()!;
        const start = (partNumber - 1) * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        const chunkBlob = file.slice(start, end);

        let presignedUrl: string | null = null;
        if (!directB2Failed) {
          try {
            const urlRes = await apiClient.get<{ success: boolean; partNumber: number; presignedUrl: string }>(
              `/media/upload/chunk-url?sessionId=${encodeURIComponent(sessionId)}&partNumber=${partNumber}`,
            );
            presignedUrl = urlRes.presignedUrl;
          } catch (err) {
            console.warn(`Could not get presigned B2 URL for chunk ${partNumber}`, err);
            directB2Failed = true;
          }
        }

        const etag = await uploadSingleChunkWithFallback(
          sessionId,
          partNumber,
          chunkBlob,
          presignedUrl,
          (chunkLoaded) => {
            partLoadedBytes[partNumber] = chunkLoaded;
            reportProgress();
          },
          () => {
            directB2Failed = true;
          },
        );

        partLoadedBytes[partNumber] = chunkBlob.size;
        parts.push({ PartNumber: partNumber, ETag: etag });
        reportProgress();
      }
    };

    const workers = Array.from({ length: Math.min(CONCURRENCY, totalParts) }, () => runWorker());
    await Promise.all(workers);

    const completeRes = await apiClient.post<{ success: boolean; asset: MediaAssetResponseDto }>(
      '/media/upload/complete',
      {
        sessionId,
        parts,
        title: options?.title,
        summary: options?.summary,
        folderId: options?.folderId,
        tagIds: options?.tagIds,
        technicalSpecs: options?.technicalSpecs,
      },
    );

    if (progressCallback) {
      progressCallback({ loaded: file.size, total: file.size });
    }

    if (!completeRes.asset) {
      throw new Error('Upload completed but server did not return asset metadata');
    }

    return completeRes.asset;
  } catch (error) {
    try {
      await apiClient.delete(`/media/upload/abort/${encodeURIComponent(sessionId)}`);
    } catch {
      // Ignore cleanup error
    }
    throw error;
  }
}

/**
 * Uploads a file directly to Backblaze B2 via backend API and records it in the PostgreSQL database.
 */
export async function uploadMediaFileRequest(
  file: File,
  options?: UploadMediaMetadataOptions,
  onProgress?: (progress: UploadMediaProgress) => void,
): Promise<MediaAssetResponseDto> {
  const progressCallback = onProgress || options?.onProgress;
  return uploadResumableChunkedFile(file, options, progressCallback);
}

/**
 * Fetch all media assets stored in backend database.
 */
export async function getMediaAssetsRequest(): Promise<MediaAssetResponseDto[]> {
  const res = await apiClient.get<{ success: boolean; assets: MediaAssetResponseDto[] }>(
    '/media/getmediaassets?limit=500',
  );
  return res.assets || [];
}

/**
 * Delete a media asset by filename or ID.
 */
export async function deleteMediaFileRequest(filenameOrId: string): Promise<void> {
  await apiClient.delete(`/media/${encodeURIComponent(filenameOrId)}`);
}

/**
 * Fetch a single media asset by ID (with metadata).
 */
export async function getMediaAssetByIdRequest(id: string): Promise<MediaAssetResponseDto> {
  const res = await apiClient.get<{ success: boolean; asset: MediaAssetResponseDto }>(
    `/media/${encodeURIComponent(id)}?meta=true`,
  );
  return res.asset;
}

/**
 * Update tags for a media asset in database.
 */
export async function updateAssetTagsRequest(id: string, tags: string[]): Promise<void> {
  await apiClient.post(`/media/${encodeURIComponent(id)}/tags`, { tags });
}

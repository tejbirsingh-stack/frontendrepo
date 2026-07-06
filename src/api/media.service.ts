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

async function uploadResumableChunkedFile(
  file: File,
  options?: { durationSeconds?: number },
  progressCallback?: (progress: UploadMediaProgress) => void,
): Promise<MediaAssetResponseDto> {
  const initRes = await apiClient.post<{ sessionId: string; uploadId: string; key: string }>(
    '/media/upload/init',
    {
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type || 'application/octet-stream',
      durationSeconds: options?.durationSeconds || null,
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
  options?: {
    durationSeconds?: number;
    onProgress?: (progress: UploadMediaProgress) => void;
  },
  onProgress?: (progress: UploadMediaProgress) => void,
): Promise<MediaAssetResponseDto> {
  const progressCallback = onProgress || options?.onProgress;

  // Use chunked resumable B2 upload for video assets or large files (> 5MB)
  if (file.type.startsWith('video/') || file.size > CHUNK_SIZE) {
    return uploadResumableChunkedFile(file, options, progressCallback);
  }

  const formData = new FormData();
  formData.append('file', file);

  const queryParams = new URLSearchParams();
  queryParams.set('fileSize', file.size.toString());
  if (options?.durationSeconds !== undefined && options?.durationSeconds !== null) {
    queryParams.set('durationSeconds', options.durationSeconds.toString());
  }

  const token = getAccessToken();
  const headers = new Headers();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const base = (env.apiBaseUrl || '/api').replace(/\/$/, '');
  const url = `${base}/media/upload?${queryParams.toString()}`;

  return new Promise<MediaAssetResponseDto>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url, true);
    xhr.withCredentials = true;

    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }

    // Real-time upload progress from browser
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && progressCallback) {
        progressCallback({ loaded: event.loaded, total: event.total });
      }
    };

    let completedAsset: MediaAssetResponseDto | null = null;
    let errorMessage: string | null = null;

    const processResponseText = () => {
      if (!xhr.responseText) return;
      const normalized = xhr.responseText.replace(/}\s*{/g, '}\n{');
      const lines = normalized.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
          const data = JSON.parse(trimmed);
          if (data.type === 'progress' && progressCallback) {
            progressCallback({ loaded: data.loaded, total: data.total });
          } else if (data.type === 'complete' && data.asset) {
            completedAsset = data.asset;
          } else if (data.type === 'error') {
            errorMessage = data.message || data.error || 'Upload failed on server';
          }
        } catch {
          // Ignore incomplete lines during streaming until the chunk completes
        }
      }
    };

    xhr.onprogress = () => {
      processResponseText();
    };

    xhr.onload = () => {
      if (xhr.status === 401) {
        handleUnauthorized();
        reject(new Error('Unauthorized'));
        return;
      }
      if (xhr.status < 200 || xhr.status >= 300) {
        reject(new Error(`Upload failed with status ${xhr.status}`));
        return;
      }

      processResponseText();

      if (errorMessage) {
        reject(new Error(errorMessage));
      } else if (completedAsset) {
        if (progressCallback) progressCallback({ loaded: file.size, total: file.size });
        resolve(completedAsset);
      } else {
        if (progressCallback) progressCallback({ loaded: file.size, total: file.size });
        // Fallback asset if backend didn't return NDJSON complete object
        resolve({
          id: `media-${Date.now()}`,
          name: file.name,
          type: file.type.split('/')[0] || 'document',
          size: file.size,
          uploadDate: new Date().toISOString(),
          url: '',
        });
      }
    };

    xhr.onerror = () => {
      reject(new Error('Network error during upload'));
    };

    xhr.send(formData);
  });
}

/**
 * Fetch all media assets stored in backend database.
 */
export async function getMediaAssetsRequest(): Promise<MediaAssetResponseDto[]> {
  const res = await apiClient.get<{ success: boolean; assets: MediaAssetResponseDto[] }>(
    '/media/getmediaassets',
  );
  return res.assets || [];
}

/**
 * Delete a media asset by filename or ID.
 */
export async function deleteMediaFileRequest(filenameOrId: string): Promise<void> {
  await apiClient.delete(`/media/${encodeURIComponent(filenameOrId)}`);
}

import { apiClient } from './client';
import type { AiAnalyzeFeature } from './ai.service';

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
  folderId?: string | null;
  folderName?: string | null;
  workspaceId?: string;
}

const CHUNK_SIZE = 5 * 1024 * 1024; // 5 MB chunks for Backblaze B2 / AWS S3 multipart upload

async function uploadChunkDirectToB2(
  url: string,
  chunkBlob: Blob,
  partNumber: number,
  onProgress?: (loaded: number) => void,
): Promise<string> {
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
          reject(new Error(`Direct B2 upload succeeded for chunk ${partNumber}, but 'ETag' header was blocked by CORS. Ensure B2 bucket exposes 'ETag'.`));
          return;
        }
        resolve(etag.replace(/"/g, ''));
      } else {
        reject(new Error(`Direct B2 upload failed for chunk ${partNumber} with status ${xhr.status}`));
      }
    };

    xhr.onerror = () => {
      reject(new Error(`Direct storage upload failed for chunk ${partNumber} (CORS or network error). Please verify Backblaze B2 Bucket CORS settings for this domain.`));
    };

    xhr.send(chunkBlob);
  });
}

export interface UploadMediaMetadataOptions {
  durationSeconds?: number;
  title?: string;
  summary?: string;
  folderId?: string;
  tagIds?: string[];
  technicalSpecs?: Record<string, any>;
  visibility?: 'public' | 'private';
  aiFeatures?: AiAnalyzeFeature[];
  onProgress?: (progress: UploadMediaProgress) => void;
}

async function uploadResumableChunkedFile(
  file: File,
  options?: UploadMediaMetadataOptions & { ownerType?: string; ownerId?: string; linkedProjectId?: string },
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
      ownerType: options?.ownerType,
      ownerId: options?.ownerId,
      linkedProjectId: options?.linkedProjectId,
      visibility: options?.visibility,
    },
    { timeoutMs: 60_000 },
  );

  const { sessionId } = initRes;
  const totalParts = Math.max(1, Math.ceil(file.size / CHUNK_SIZE));
  const parts: { PartNumber: number; ETag: string }[] = [];
  const partLoadedBytes = new Array(totalParts + 1).fill(0);

  const reportProgress = () => {
    if (!progressCallback) return;
    const totalLoadedBytes = partLoadedBytes.reduce((a, b) => a + b, 0);
    progressCallback({ loaded: Math.min(totalLoadedBytes, file.size), total: file.size });
  };

  const uploadTasks = Array.from({ length: totalParts }, (_, i) => i + 1);
  const CONCURRENCY = 3; // Upload up to 3 chunks in parallel directly to B2

  try {
    const runWorker = async () => {
      while (uploadTasks.length > 0) {
        const partNumber = uploadTasks.shift()!;
        const start = (partNumber - 1) * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        const chunkBlob = file.slice(start, end);

        const urlRes = await apiClient.get<{ success: boolean; partNumber: number; presignedUrl: string }>(
          `/media/upload/chunk-url?sessionId=${encodeURIComponent(sessionId)}&partNumber=${partNumber}`,
        );

        if (!urlRes?.presignedUrl) {
          throw new Error(`Failed to generate direct B2 upload URL for chunk ${partNumber}`);
        }

        const etag = await uploadChunkDirectToB2(
          urlRes.presignedUrl,
          chunkBlob,
          partNumber,
          (chunkLoaded) => {
            partLoadedBytes[partNumber] = chunkLoaded;
            reportProgress();
          },
        );

        partLoadedBytes[partNumber] = chunkBlob.size;
        parts.push({ PartNumber: partNumber, ETag: etag });
        reportProgress();
      }
    };

    const workers = Array.from({ length: Math.min(CONCURRENCY, totalParts) }, () => runWorker());
    await Promise.all(workers);
    parts.sort((a, b) => a.PartNumber - b.PartNumber);

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
        visibility: options?.visibility,
        aiFeatures: options?.aiFeatures,
      },
      { timeoutMs: 300_000 },
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
    ownerType?: string;
    ownerId?: string;
    linkedProjectId?: string;
    title?: string;
    summary?: string;
    folderId?: string;
    tagIds?: string[];
    technicalSpecs?: Record<string, any>;
    visibility?: 'public' | 'private';
    aiFeatures?: AiAnalyzeFeature[];
    onProgress?: (progress: UploadMediaProgress) => void;
  },
  onProgress?: (progress: UploadMediaProgress) => void,
): Promise<MediaAssetResponseDto> {
  const progressCallback = onProgress || options?.onProgress;
  return uploadResumableChunkedFile(file, options, progressCallback);
}

/**
 * Fetch all media assets stored in backend database.
 */
export async function getMediaAssetsRequest(workspaceId: string): Promise<MediaAssetResponseDto[]> {
  const res = await apiClient.get<{ success: boolean; assets: MediaAssetResponseDto[] }>(
    `/media/getmediaassets?ownerId=${workspaceId}&ownerType=WORKSPACE`,
  );
  return res.assets || [];
}

/**
 * Fetch all media assets that have been explicitly shared with the current user.
 */
export async function getSharedMediaAssetsRequest(): Promise<MediaAssetResponseDto[]> {
  const res = await apiClient.get<{ success: boolean; assets: MediaAssetResponseDto[] }>(
    `/media/shared-with-me`,
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
export async function getMediaAssetByIdRequest(id: string, projectId?: string): Promise<MediaAssetResponseDto> {
  const params = new URLSearchParams({ meta: 'true' });
  if (projectId) params.set('projectId', projectId);
  const res = await apiClient.get<{ success: boolean; asset: MediaAssetResponseDto }>(
    `/media/${encodeURIComponent(id)}?${params.toString()}`,
  );
  return res.asset;
}

/**
 * Update tags for a media asset in database.
 */
export async function updateAssetTagsRequest(id: string, tags: string[]): Promise<void> {
  await apiClient.post(`/media/${encodeURIComponent(id)}/tags`, { tags });
}

export async function updateAssetReviewStatusRequest(
  id: string,
  reviewStatus: string,
): Promise<{ success: boolean; reviewStatus: string }> {
  return apiClient.patch<{ success: boolean; reviewStatus: string }>(
    `/media/${encodeURIComponent(id)}/review-status`,
    { reviewStatus },
  );
}

/**
 * Retry transcode for a failed media asset.
 */
export async function retryTranscodeRequest(id: string): Promise<void> {
  await apiClient.post(`/media/${encodeURIComponent(id)}/retry-transcode`);
}

/**
 * Fetch asset-specific role overrides (direct access users).
 */
export async function getAssetAccessOverrides(id: string): Promise<{ overrides: any[], groupOverrides: any[] }> {
  const res = await apiClient.get<{ success: boolean; overrides: any[]; groupOverrides?: any[] }>(
    `/media/${encodeURIComponent(id)}/access`,
  );
  return { overrides: res.overrides || [], groupOverrides: res.groupOverrides || [] };
}

/**
 * Update an asset-specific role override (direct access user).
 */
export async function updateAssetAccessOverride(id: string, userId: string, accessLevel: string, sendInviteEmail?: boolean): Promise<void> {
  await apiClient.patch(
    `/media/${encodeURIComponent(id)}/access/${encodeURIComponent(userId)}`,
    { accessLevel, sendInviteEmail },
  );
}

/**
 * Remove an asset-specific role override (direct access user).
 */
export async function removeAssetAccessOverride(id: string, userId: string): Promise<void> {
  await apiClient.delete(
    `/media/${encodeURIComponent(id)}/access/${encodeURIComponent(userId)}`,
  );
}

/**
 * Update an asset-specific role override for a group.
 */
export async function updateAssetGroupAccessOverride(id: string, groupId: string, accessLevel: string): Promise<void> {
  await apiClient.put(
    `/media/${encodeURIComponent(id)}/group-access/${encodeURIComponent(groupId)}`,
    { accessLevel },
  );
}

/**
 * Remove an asset-specific role override for a group.
 */
export async function removeAssetGroupAccessOverride(id: string, groupId: string): Promise<void> {
  await apiClient.delete(
    `/media/${encodeURIComponent(id)}/group-access/${encodeURIComponent(groupId)}`,
  );
}

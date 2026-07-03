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
        return;
      }

      if (completedAsset) {
        resolve(completedAsset);
        return;
      }

      // Fallback asset if backend didn't return NDJSON complete object
      resolve({
        id: `media-${Date.now()}`,
        name: file.name,
        type: file.type.split('/')[0] || 'document',
        size: file.size,
        uploadDate: new Date().toISOString(),
        url: '',
      });
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

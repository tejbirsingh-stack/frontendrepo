import { apiRequest } from './client';
import { getAccessToken } from '../auth/authTokenBridge';
import { env } from '../config/env';

export interface UpdateProfileDto {
  name?: string;
  timezone?: string;
  shareLinkActivityEnabled?: boolean;
}

export interface UploadProfilePhotoResponse {
  success: boolean;
  avatarUrl: string;
  avatarKey?: string;
  user?: any;
}

export async function updateProfileRequest(data: UpdateProfileDto) {
  const response = await apiRequest('/users/profile', {
    method: 'PUT',
    body: data,
  });
  return response;
}

export async function uploadProfilePhotoRequest(file: File): Promise<UploadProfilePhotoResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const token = getAccessToken();
  const base = (env.apiBaseUrl || '/api').replace(/\/$/, '');
  const response = await fetch(`${base}/users/profile/photo`, {
    method: 'POST',
    body: formData,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.message || errorBody.error || 'Failed to upload photo');
  }

  return await response.json();
}

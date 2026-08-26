import { apiRequest } from './client';
import { getAccessToken } from '../auth/authTokenBridge';
import { env } from '../config/env';

export interface UpdateCompanyInfoDto {
  id?: string;
  name?: string;
  website?: string;
  industry?: string;
  logoUrl?: string;
  logoKey?: string;
}

export interface UploadCompanyLogoResponse {
  success: boolean;
  logoUrl: string;
  b2Key: string;
}

export async function getCompanyInfoRequest(id: string = 'current'): Promise<any> {
  return await apiRequest(`/api/organizations/${id}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

export async function updateCompanyInfoRequest(data: UpdateCompanyInfoDto): Promise<any> {
  return await apiRequest('/api/organizations/company-info', {
    method: 'PUT',
    body: data,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

export async function uploadCompanyLogoRequest(file: File, orgId?: string): Promise<UploadCompanyLogoResponse> {
  const formData = new FormData();
  if (orgId) {
    formData.append('orgId', orgId);
  }
  formData.append('file', file);

  // apiRequest defaults to JSON if body is present, so we'll use standard fetch or customize headers
  // For file uploads, we shouldn't set Content-Type header so the browser can set multipart/form-data boundary.
  const token = getAccessToken();
  const base = (env.apiBaseUrl || '/api').replace(/\/$/, '');
  const response = await fetch(`${base}/organizations/upload-logo`, {
    method: 'POST',
    body: formData,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.message || errorBody.error || 'Failed to upload logo');
  }

  return await response.json();
}

export async function getBrandingSettingsApi(): Promise<any> {
  return await apiRequest('/api/organizations/branding', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

export async function updateBrandingSettingsApi(data: {
  accountName?: string;
  accentColor?: string;
  reelBackgroundColor?: string;
  reelTitleColor?: string;
}): Promise<any> {
  return await apiRequest('/api/organizations/branding', {
    method: 'PUT',
    body: data,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

export async function uploadBrandingHeaderRequest(file: File): Promise<any> {
  const formData = new FormData();
  formData.append('file', file);

  const token = getAccessToken();
  const base = (env.apiBaseUrl || '/api').replace(/\/$/, '');
  const response = await fetch(`${base}/organizations/branding/upload-header`, {
    method: 'POST',
    body: formData,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.message || errorBody.error || 'Failed to upload header image');
  }

  return await response.json();
}

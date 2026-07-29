import { apiRequest } from './client';

export interface CreateSharePayload {
  mode?: 'email' | 'link';
  email?: string;
  password?: string;
  expiresInDays?: number;
  expiresAt?: string;
  permissions?: {
    view: boolean;
    comment: boolean;
    download: boolean;
    downloadProxy: boolean;
  };
}

export interface BackendShareLink {
  id: string;
  assetId: string;
  token: string;
  mode: 'email' | 'link';
  expiresAt: string;
  permissions: {
    view: boolean;
    comment: boolean;
    download: boolean;
    downloadProxy: boolean;
  };
  hasPassword: boolean;
  downloadCount: number;
  createdAt: string;
  url: string;
  recipients?: Array<{
    id: string;
    email: string;
    accessCount: number;
    lastAccessedAt?: string;
    sentAt: string;
  }>;
}

export async function createShareLinkApi(assetId: string, payload: CreateSharePayload) {
  return apiRequest<{ success: boolean; message: string; shareLink: BackendShareLink }>(
    `/api/media/${assetId}/share`,
    {
      method: 'POST',
      body: payload,
    }
  );
}

export async function getShareLinksApi(assetId: string) {
  return apiRequest<{ data: BackendShareLink[] }>(`/api/media/${assetId}/share-links`, {
    method: 'GET',
  });
}

export async function deleteShareLinkApi(shareLinkId: string) {
  return apiRequest<{ success: boolean; message: string }>(`/api/share-links/${shareLinkId}`, {
    method: 'DELETE',
  });
}

export async function resendShareInviteApi(shareLinkId: string) {
  return apiRequest<{ success: boolean; message: string }>(`/api/share-links/${shareLinkId}/resend`, {
    method: 'POST',
  });
}

export async function validateShareTokenApi(token: string) {
  return apiRequest<{
    valid: boolean;
    requiresPassword: boolean;
    permissions: {
      view: boolean;
      comment: boolean;
      download: boolean;
      downloadProxy: boolean;
    };
    expiresAt: string;
    assetMeta: {
      id: string;
      title: string;
      fileType: string;
      mimeType: string;
      fileSize: number;
    };
  }>(`/api/share/${token}`, {
    method: 'GET',
    skipAuth: true,
  });
}

export async function unlockShareTokenApi(token: string, password?: string) {
  return apiRequest<{ success: boolean; unlocked: boolean; sessionToken?: string }>(
    `/api/share/${token}/unlock`,
    {
      method: 'POST',
      body: { password },
      skipAuth: true,
    }
  );
}

export async function getShareAnnotationsApi(token: string) {
  return apiRequest<{ data: any[] }>(`/api/share/${token}/annotations`, {
    method: 'GET',
    skipAuth: true,
  });
}

export async function createShareAnnotationApi(
  token: string,
  payload: { guestName: string; text: string; videoTimestamp?: number; type?: string; data?: any }
) {
  return apiRequest<{ success: boolean; annotation: any }>(`/api/share/${token}/annotations`, {
    method: 'POST',
    body: payload,
    skipAuth: true,
  });
}

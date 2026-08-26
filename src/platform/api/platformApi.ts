import { platformRequest } from './platformClient';
import { readPlatformToken, type PlatformAdmin } from '../auth/platformStorage';
import { env } from '../../config/env';

export type PlanFeature = {
  id: string;
  name: string;
  description?: string | null;
  sortOrder: number;
  isActive: boolean;
};

export type PlatformPlan = {
  id: string;
  slug?: string;
  name: string;
  description?: string | null;
  monthlyPriceCents: number;
  yearlyPriceCents?: number;
  annualPriceCents?: number;
  storageQuotaBytes: string;
  maxUsers: number;
  maxWorkspaces: number;
  maxProjects?: number;
  showProjectQuota?: boolean;
  showStorageQuota?: boolean;
  showMemberQuota?: boolean;
  features: PlanFeature[];  // Now an array of feature objects from the DB
  isPublic: boolean;
  isFeatured: boolean;
  hasAI: boolean;
  sortOrder: number;
  ctaLabel?: string | null;
  monthlyPriceId?: string | null;
  yearlyPriceId?: string | null;
};

export async function platformLogin(email: string, password: string) {
  return platformRequest<{ success: boolean; accessToken: string; admin: PlatformAdmin }>(
    '/platform/auth/login',
    {
      method: 'POST',
      skipAuth: true,
      body: JSON.stringify({ email, password }),
    },
  );
}

export async function platformMe() {
  return platformRequest<{ success: boolean; admin: PlatformAdmin }>('/platform/auth/me');
}

export async function platformLogout() {
  return platformRequest<{ success: boolean }>('/platform/auth/logout', { method: 'POST' });
}

export async function fetchDashboardSummary() {
  return platformRequest<{ success: boolean; summary: Record<string, unknown> }>(
    '/platform/dashboard/summary',
  );
}

export async function fetchOrganizations(params: Record<string, string> = {}) {
  const qs = new URLSearchParams(params).toString();
  return platformRequest<{
    success: boolean;
    total: number;
    organizations: Array<Record<string, unknown>>;
  }>(`/platform/organizations${qs ? `?${qs}` : ''}`);
}

export async function createOrganization(body: Record<string, unknown>) {
  return platformRequest<{
    success: boolean;
    organization: Record<string, unknown>;
    adminUser?: Record<string, unknown> | null;
  }>('/platform/organizations', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function inviteOrganization(body: { email: string }) {
  return platformRequest<{ success: boolean; message: string }>('/platform/organizations/invite', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function fetchOrganization(orgId: string) {
  return platformRequest<{ success: boolean; organization: Record<string, unknown> }>(
    `/platform/organizations/${orgId}`,
  );
}

export async function patchOrganization(orgId: string, body: Record<string, unknown>) {
  return platformRequest<{ success: boolean; organization: Record<string, unknown> }>(
    `/platform/organizations/${orgId}`,
    { method: 'PATCH', body: JSON.stringify(body) },
  );
}

export async function fetchPlatformUsers(params: Record<string, string> = {}) {
  const qs = new URLSearchParams(params).toString();
  return platformRequest<{
    success: boolean;
    total: number;
    users: Array<Record<string, unknown>>;
  }>(`/platform/users${qs ? `?${qs}` : ''}`);
}

export async function invitePlatformUser(body: Record<string, unknown>) {
  return platformRequest<{
    success: boolean;
    message?: string;
    user: Record<string, unknown>;
  }>('/platform/users', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function fetchPlatformRoles(params: Record<string, string> = {}) {
  const qs = new URLSearchParams(params).toString();
  return platformRequest<{
    success: boolean;
    roles: Array<{ id: string; name: string; show?: number | null }>;
  }>(`/platform/roles${qs ? `?${qs}` : ''}`);
}

export async function patchPlatformUser(userId: string, body: Record<string, unknown>) {
  return platformRequest<{ success: boolean; user: Record<string, unknown> }>(
    `/platform/users/${userId}`,
    { method: 'PATCH', body: JSON.stringify(body) },
  );
}

export async function fetchPlatformWorkspaces(params: Record<string, string> = {}) {
  const qs = new URLSearchParams(params).toString();
  return platformRequest<{
    success: boolean;
    total: number;
    workspaces: Array<Record<string, unknown>>;
  }>(`/platform/workspaces${qs ? `?${qs}` : ''}`);
}

export async function patchPlatformWorkspace(
  orgId: string,
  workspaceId: string,
  body: Record<string, unknown>,
) {
  return platformRequest<{ success: boolean; workspace: Record<string, unknown> }>(
    `/platform/organizations/${orgId}/workspaces/${workspaceId}`,
    { method: 'PATCH', body: JSON.stringify(body) },
  );
}

export async function fetchPlans() {
  return platformRequest<{ success: boolean; plans: PlatformPlan[] }>('/platform/plans');
}

export async function fetchPublicCatalogPlans() {
  return platformRequest<{ success: boolean; plans: PlatformPlan[] }>('/platform/catalog/plans', {
    skipAuth: true,
  });
}

export async function createPlan(body: Record<string, unknown>) {
  return platformRequest<{ success: boolean; plan: PlatformPlan }>('/platform/plans', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function updatePlan(planId: string, body: Record<string, unknown>) {
  return platformRequest<{ success: boolean; plan: PlatformPlan }>(`/platform/plans/${planId}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export async function deletePlan(planId: string) {
  return platformRequest<{ success: boolean }>(`/platform/plans/${planId}`, { method: 'DELETE' });
}

export async function fetchPlanFeatures() {
  return platformRequest<{ success: boolean; features: PlanFeature[] }>('/platform/plan-features');
}

export async function createPlanFeature(body: { name: string; description?: string; sortOrder?: number }) {
  return platformRequest<{ success: boolean; feature: PlanFeature }>('/platform/plan-features', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function updatePlanFeature(featureId: string, body: Partial<{ name: string; description: string; sortOrder: number; isActive: boolean }>) {
  return platformRequest<{ success: boolean; feature: PlanFeature }>(`/platform/plan-features/${featureId}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export async function deletePlanFeature(featureId: string) {
  return platformRequest<{ success: boolean }>(`/platform/plan-features/${featureId}`, { method: 'DELETE' });
}

export async function fetchBillingOverview(params: Record<string, string> = {}) {
  const qs = new URLSearchParams(params).toString();
  return platformRequest<{ success: boolean; billing: Record<string, unknown> }>(
    `/platform/billing/overview${qs ? `?${qs}` : ''}`,
  );
}

export async function fetchPaymentLogOrgs() {
  return platformRequest<{ success: boolean; orgs: Array<{ id: string; name: string }> }>(
    '/platform/billing/logs/orgs',
  );
}

export async function fetchPaymentLogs(params: Record<string, string> = {}) {
  const qs = new URLSearchParams(params).toString();
  return platformRequest<{
    success: boolean;
    logs: any[];
    total: number;
    failed30Days: number;
  }>(`/platform/billing/logs${qs ? `?${qs}` : ''}`);
}

export async function fetchPaymentLogEvents(logId: string) {
  return platformRequest<{ success: boolean; events: any[] }>(`/platform/billing/logs/${logId}/events`);
}

export async function fetchUsageOverview(params: Record<string, string> = {}) {
  const qs = new URLSearchParams(params).toString();
  return platformRequest<{
    success: boolean;
    total?: number;
    usage: Array<Record<string, unknown>>;
  }>(`/platform/usage/overview${qs ? `?${qs}` : ''}`);
}

export async function fetchActivity(params: Record<string, string> = {}) {
  const qs = new URLSearchParams(params).toString();
  return platformRequest<{
    success: boolean;
    total?: number;
    activities: Array<Record<string, unknown>>;
  }>(`/platform/activity${qs ? `?${qs}` : ''}`);
}

export async function fetchReportingSummary(params: Record<string, string> = {}) {
  const qs = new URLSearchParams(params).toString();
  return platformRequest<{ success: boolean; report: Record<string, unknown> }>(
    `/platform/reporting/summary${qs ? `?${qs}` : ''}`,
  );
}

export type PlatformReportType =
  | 'growth'
  | 'organizations'
  | 'users'
  | 'usage'
  | 'activity';

export async function exportPlatformReports(params: Record<string, string> = {}) {
  const qs = new URLSearchParams(params).toString();
  return platformRequest<{
    success: boolean;
    filters: Record<string, unknown>;
    selectedReports: PlatformReportType[];
    reports: Record<string, unknown>;
  }>(`/platform/reporting/export${qs ? `?${qs}` : ''}`);
}

export async function fetchLanding(slug = 'main') {
  return platformRequest<{ success: boolean; page: Record<string, unknown> }>(
    `/platform/landing/${slug}`,
  );
}

export async function fetchPublicLanding(slug = 'main') {
  return platformRequest<{ success: boolean; page: Record<string, unknown> }>(
    `/platform/public/landing?slug=${encodeURIComponent(slug)}`,
    { skipAuth: true },
  );
}

export type DemoRequestPayload = {
  name: string;
  email: string;
  company?: string;
  teamSize?: string;
  message?: string;
};

export async function submitDemoRequest(body: DemoRequestPayload) {
  return platformRequest<{ success: boolean }>('/platform/public/demo-request', {
    method: 'POST',
    skipAuth: true,
    body: JSON.stringify(body),
  });
}

export async function updateLanding(slug: string, body: Record<string, unknown>) {
  return platformRequest<{ success: boolean; page: Record<string, unknown> }>(
    `/platform/landing/${slug}`,
    { method: 'PUT', body: JSON.stringify(body) },
  );
}

export type PlatformDefaultContentItem = {
  id: string;
  title: string;
  fileName: string;
  filePath: string;
  mimeType: string;
  sizeBytes: string;
  assetType: string;
  sortOrder: number;
  isEnabled: boolean;
  uploadedById?: string | null;
  createdAt?: string;
  updatedAt?: string;
  previewUrl?: string | null;
  globalMedia?: boolean;
};

export async function fetchDefaultContent() {
  return platformRequest<{
    success: boolean;
    total: number;
    items: PlatformDefaultContentItem[];
  }>('/platform/default-content');
}

export async function uploadDefaultContent(
  formData: FormData,
  onProgress?: (progressPercent: number, loadedBytes: number, totalBytes: number) => void,
) {
  const token = readPlatformToken();
  const baseUrl = (env.apiBaseUrl || '/api').replace(/\/$/, '');
  const url = `${baseUrl}/platform/default-content`;

  return new Promise<{ success: boolean; item: PlatformDefaultContentItem }>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);
    xhr.setRequestHeader('Accept', 'application/json');
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }

    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          onProgress(percent, e.loaded, e.total);
        }
      };
    }

    xhr.onload = () => {
      let data: any = {};
      try {
        data = JSON.parse(xhr.responseText);
      } catch (e) {}

      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(data);
      } else {
        reject(new Error(data?.message || 'Upload failed'));
      }
    };

    xhr.onerror = () => {
      reject(new Error('Network error during upload'));
    };

    xhr.send(formData);
  });
}

export async function uploadSingleChunk(
  sessionId: string,
  partNumber: number,
  chunkBlob: Blob,
  presignedUrl: string | null,
  token: string | null,
  baseUrl: string,
  onProgress?: (loaded: number) => void,
): Promise<string> {
  if (presignedUrl) {
    try {
      const etag = await new Promise<string>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', presignedUrl);
        if (xhr.upload && onProgress) {
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) onProgress(e.loaded);
          };
        }
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const rawEtag = xhr.getResponseHeader('ETag') || `"${partNumber}"`;
            resolve(rawEtag.replace(/"/g, ''));
          } else {
            reject(new Error(`Direct B2 PUT failed status ${xhr.status}`));
          }
        };
        xhr.onerror = () => reject(new Error('Direct B2 network error'));
        xhr.send(chunkBlob);
      });
      return etag;
    } catch (e) {
      console.warn(`[ChunkUpload] Direct B2 PUT failed for part ${partNumber}, using backend fallback:`, e);
    }
  }

  return new Promise<string>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const chunkApiUrl = `${baseUrl}/media/upload/chunk?sessionId=${encodeURIComponent(sessionId)}&partNumber=${partNumber}`;
    xhr.open('PUT', chunkApiUrl);
    xhr.setRequestHeader('Content-Type', 'application/octet-stream');
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress(e.loaded);
      };
    }

    xhr.onload = () => {
      let data: any = {};
      try {
        data = JSON.parse(xhr.responseText);
      } catch (err) {}
      if (xhr.status >= 200 && xhr.status < 300 && data.etag) {
        resolve(String(data.etag).replace(/"/g, ''));
      } else {
        reject(new Error(data.message || `Chunk upload failed status ${xhr.status}`));
      }
    };
    xhr.onerror = () => reject(new Error('Backend chunk upload network error'));
    xhr.send(chunkBlob);
  });
}

export async function uploadGlobalMediaChunked(
  file: File,
  title?: string,
  onProgress?: (loadedBytes: number, totalBytes: number) => void,
) {
  const token = readPlatformToken();
  const baseUrl = (env.apiBaseUrl || '/api').replace(/\/$/, '');
  const displayTitle = title?.trim() || file.name.replace(/\.[^/.]+$/, '');

  // 1. Initiate resumable upload session with isGlobalMedia = true
  const initRes = await platformRequest<{ sessionId: string; uploadId: string; key: string }>(
    '/media/upload/init',
    {
      method: 'POST',
      body: JSON.stringify({
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type || 'application/octet-stream',
        title: displayTitle,
        isGlobalMedia: true,
        visibility: 'public',
      }),
    },
  );

  const { sessionId } = initRes;
  const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks
  const totalParts = Math.max(1, Math.ceil(file.size / CHUNK_SIZE));
  const parts: { PartNumber: number; ETag: string }[] = [];
  const partLoadedBytes = new Array(totalParts + 1).fill(0);

  const reportProgress = () => {
    if (!onProgress) return;
    const totalLoadedBytes = partLoadedBytes.reduce((a, b) => a + b, 0);
    onProgress(Math.min(totalLoadedBytes, file.size), file.size);
  };

  const uploadTasks = Array.from({ length: totalParts }, (_, i) => i + 1);
  const CONCURRENCY = 3;

  const runWorker = async () => {
    while (uploadTasks.length > 0) {
      const partNumber = uploadTasks.shift()!;
      const start = (partNumber - 1) * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, file.size);
      const chunkBlob = file.slice(start, end);

      let presignedUrl: string | null = null;
      try {
        const urlRes = await platformRequest<{ success: boolean; partNumber: number; presignedUrl: string }>(
          `/media/upload/chunk-url?sessionId=${encodeURIComponent(sessionId)}&partNumber=${partNumber}`,
        );
        presignedUrl = urlRes.presignedUrl;
      } catch (err) {
        console.warn(`[ChunkUpload] Could not get presigned URL for part ${partNumber}`, err);
      }

      const etag = await uploadSingleChunk(
        sessionId,
        partNumber,
        chunkBlob,
        presignedUrl,
        token,
        baseUrl,
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

  // 3. Complete resumable upload session
  const completeRes = await platformRequest<{ success: boolean; asset: any }>(
    '/media/upload/complete',
    {
      method: 'POST',
      body: JSON.stringify({
        sessionId,
        parts,
        isGlobalMedia: true,
      }),
    },
  );

  return completeRes;
}

export async function updateDefaultContent(id: string, body: Record<string, unknown>) {
  return platformRequest<{ success: boolean; item: PlatformDefaultContentItem }>(
    `/platform/default-content/${id}`,
    { method: 'PATCH', body: JSON.stringify(body) },
  );
}

export async function deleteDefaultContent(id: string) {
  return platformRequest<{ success: boolean }>(`/platform/default-content/${id}`, {
    method: 'DELETE',
  });
}

export type GlobalSecuritySettings = {
  ssoConfigured: boolean;
  ssoProvider: string;
  ssoDomain: string;
  sessionTimeoutDays: number;
  contentSecurityPolicy: string;
  updatedAt?: string;
};

export async function fetchGlobalSecuritySettings() {
  return platformRequest<{ success: boolean; settings: GlobalSecuritySettings }>('/platform/security', {
    skipAuth: true,
  });
}

export async function updateGlobalSecuritySettings(body: Partial<GlobalSecuritySettings>) {
  return platformRequest<{ success: boolean; message: string; settings: GlobalSecuritySettings }>(
    '/platform/security',
    {
      method: 'PUT',
      body: JSON.stringify(body),
    },
  );
}

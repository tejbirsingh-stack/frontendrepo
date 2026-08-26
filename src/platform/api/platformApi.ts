import { platformRequest } from './platformClient';
import type { PlatformAdmin } from '../auth/platformStorage';

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
};

export async function fetchDefaultContent() {
  return platformRequest<{
    success: boolean;
    total: number;
    items: PlatformDefaultContentItem[];
  }>('/platform/default-content');
}

export async function uploadDefaultContent(formData: FormData) {
  return platformRequest<{ success: boolean; item: PlatformDefaultContentItem }>(
    '/platform/default-content',
    { method: 'POST', body: formData },
  );
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

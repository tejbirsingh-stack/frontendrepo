import { platformRequest } from './platformClient';
import type { PlatformAdmin } from '../auth/platformStorage';

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
  features: string[];
  isPublic: boolean;
  isFeatured: boolean;
  isActive?: boolean;
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

export async function fetchBillingOverview() {
  return platformRequest<{ success: boolean; billing: Record<string, unknown> }>(
    '/platform/billing/overview',
  );
}

export async function fetchUsageOverview() {
  return platformRequest<{ success: boolean; usage: Array<Record<string, unknown>> }>(
    '/platform/usage/overview',
  );
}

export async function fetchActivity(params: Record<string, string> = {}) {
  const qs = new URLSearchParams(params).toString();
  return platformRequest<{ success: boolean; activities: Array<Record<string, unknown>> }>(
    `/platform/activity${qs ? `?${qs}` : ''}`,
  );
}

export async function fetchReportingSummary() {
  return platformRequest<{ success: boolean; report: Record<string, unknown> }>(
    '/platform/reporting/summary',
  );
}

export async function fetchModerationFlags(status?: string) {
  const qs = status ? `?status=${encodeURIComponent(status)}` : '';
  return platformRequest<{ success: boolean; flags: Array<Record<string, unknown>> }>(
    `/platform/moderation/flags${qs}`,
  );
}

export async function updateModerationFlag(flagId: string, body: Record<string, unknown>) {
  return platformRequest<{ success: boolean; flag: Record<string, unknown> }>(
    `/platform/moderation/flags/${flagId}`,
    { method: 'PATCH', body: JSON.stringify(body) },
  );
}

export async function searchMedia(params: Record<string, string> = {}) {
  const qs = new URLSearchParams(params).toString();
  return platformRequest<{ success: boolean; assets: Array<Record<string, unknown>> }>(
    `/platform/media/search${qs ? `?${qs}` : ''}`,
  );
}

export async function forceDeleteMedia(assetId: string) {
  return platformRequest<{ success: boolean }>(`/platform/media/${assetId}/force-delete`, {
    method: 'POST',
  });
}

export async function fetchLanding(slug = 'main') {
  return platformRequest<{ success: boolean; page: Record<string, unknown> }>(
    `/platform/landing/${slug}`,
  );
}

export async function updateLanding(slug: string, body: Record<string, unknown>) {
  return platformRequest<{ success: boolean; page: Record<string, unknown> }>(
    `/platform/landing/${slug}`,
    { method: 'PUT', body: JSON.stringify(body) },
  );
}

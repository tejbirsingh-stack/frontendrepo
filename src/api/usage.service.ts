import { apiRequest } from './client';
import type { UsageSummaryResponse } from '../types/usage';

export async function getUsageSummary(): Promise<UsageSummaryResponse> {
  return apiRequest<UsageSummaryResponse>('/api/usage/summary', {
    method: 'GET',
  });
}

export async function reconcileUsage(): Promise<{ message: string; data: any }> {
  return apiRequest<{ message: string; data: any }>('/api/usage/reconcile', {
    method: 'POST',
  });
}

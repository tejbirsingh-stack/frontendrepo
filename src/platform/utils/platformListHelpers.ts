/** Shared formatting helpers for platform admin list pages. */

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

const dateTimeFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

export function text(value: unknown, fallback = '—'): string {
  if (typeof value === 'string') return value || fallback;
  if (typeof value === 'number' || typeof value === 'bigint') return String(value);
  return fallback;
}

export function formatDate(value: unknown): string {
  if (typeof value !== 'string' && typeof value !== 'number' && !(value instanceof Date)) {
    return '—';
  }
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? '—' : dateFormatter.format(parsed);
}

export function formatDateTime(value: unknown): string {
  if (typeof value !== 'string' && typeof value !== 'number' && !(value instanceof Date)) {
    return '—';
  }
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? '—' : dateTimeFormatter.format(parsed);
}

export function daysAgoIso(days: number): string {
  const from = new Date();
  from.setDate(from.getDate() - days);
  return from.toISOString();
}

export function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export const GB = 1024 ** 3;

export const STORAGE_FILTER_OPTIONS = [
  { value: '', label: 'Any storage' },
  { value: 'empty', label: 'Empty (0 B)', min: 0, max: 0 },
  { value: 'lt1', label: 'Under 1 GB', max: GB },
  { value: '1to10', label: '1 – 10 GB', min: GB, max: 10 * GB },
  { value: '10to100', label: '10 – 100 GB', min: 10 * GB, max: 100 * GB },
  { value: 'gt100', label: 'Over 100 GB', min: 100 * GB },
] as const;

export const CREATED_FILTER_OPTIONS = [
  { value: '', label: 'Any time' },
  { value: '7d', label: 'Last 7 days', days: 7 },
  { value: '30d', label: 'Last 30 days', days: 30 },
  { value: '90d', label: 'Last 90 days', days: 90 },
  { value: '365d', label: 'Last 12 months', days: 365 },
] as const;

export const SUBSCRIPTION_FILTER_OPTIONS = [
  { value: '', label: 'All subscriptions' },
  { value: 'active', label: 'Active' },
  { value: 'trialing', label: 'Trialing' },
  { value: 'past_due', label: 'Past due' },
  { value: 'canceling', label: 'Canceling' },
  { value: 'canceled', label: 'Canceled' },
  { value: 'none', label: 'No subscription' },
] as const;

export function applyStorageParams(
  params: Record<string, string>,
  storageValue: string,
): void {
  const option = STORAGE_FILTER_OPTIONS.find((item) => item.value === storageValue);
  if (!option) return;
  if ('min' in option && option.min !== undefined) params.minStorageBytes = String(option.min);
  if ('max' in option && option.max !== undefined) params.maxStorageBytes = String(option.max);
}

export function applyCreatedParams(
  params: Record<string, string>,
  created: string,
  createdFrom: string,
  createdTo: string,
): void {
  if (created === 'custom') {
    if (createdFrom) params.createdFrom = createdFrom;
    if (createdTo) params.createdTo = createdTo;
    return;
  }
  const option = CREATED_FILTER_OPTIONS.find((item) => item.value === created);
  if (option && 'days' in option && option.days) {
    params.createdFrom = daysAgoIso(option.days);
  }
}

export function formatMoneyCents(cents: number | undefined | null): string {
  if (typeof cents !== 'number' || isNaN(cents)) return '—';
  return `$${(cents / 100).toFixed(2)}`;
}

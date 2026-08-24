import type { MediaType } from '../data/mockMedia';

export type MediaTypeFilter = 'all' | MediaType | 'project';

export type StorageFilter = 'all' | 'local' | 'b2';

export const STORAGE_FILTER_OPTIONS: { value: StorageFilter; label: string }[] = [
  { value: 'all', label: 'All Storage' },
  { value: 'local', label: 'Local Only' },
  { value: 'b2', label: 'B2 Cloud' },
];

export type DateRangeFilter = 'all' | 'today' | 'week' | 'month' | 'year' | 'custom';

export const MEDIA_TYPE_FILTER_OPTIONS: { value: MediaTypeFilter; label: string }[] = [
  { value: 'all', label: 'All Types' },
  { value: 'folder', label: 'Folders' },
  { value: 'project', label: 'Projects' },
  { value: 'video', label: 'Videos' },
  { value: 'image', label: 'Images' },
  { value: 'audio', label: 'Audio' },
];

export function matchesMediaTypeFilter(
  item: { type: MediaType; isProject?: boolean },
  filter: MediaTypeFilter,
): boolean {
  if (filter === 'all') return true;
  if (filter === 'project') return item.type === 'folder' && Boolean(item.isProject);
  if (filter === 'folder') return item.type === 'folder' && !item.isProject;
  return item.type === filter;
}

export const DATE_RANGE_OPTIONS: { value: DateRangeFilter; label: string }[] = [
  { value: 'all', label: 'All Time' },
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'year', label: 'This Year' },
  { value: 'custom', label: 'Custom' },
];

export const TAG_OPTIONS = ['important', 'project', 'brand', 'archived'] as const;

/** Fallback only when AI tag catalog has not loaded yet. Prefer GET /api/ai/tags. */
export const AI_TAG_OPTIONS = ['person', 'outdoor', 'technology'] as const;

export function matchesDateRange(createdAt: string, range: DateRangeFilter): boolean {
  if (range === 'all' || range === 'custom') return true;

  const date = new Date(createdAt);
  const now = new Date();

  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfDay);
  startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  switch (range) {
    case 'today':
      return date >= startOfDay;
    case 'week':
      return date >= startOfWeek;
    case 'month':
      return date >= startOfMonth;
    case 'year':
      return date >= startOfYear;
    default:
      return true;
  }
}

export function matchesCustomDateRange(
  createdAt: string | number,
  startDate: string,
  endDate: string,
): boolean {
  const time = typeof createdAt === 'number' ? createdAt : new Date(createdAt).getTime();
  if (!Number.isFinite(time)) return false;

  if (startDate) {
    const start = new Date(startDate).getTime();
    if (Number.isFinite(start) && time < start) return false;
  }

  if (endDate) {
    const end = new Date(endDate).getTime() + 24 * 60 * 60 * 1000;
    if (Number.isFinite(end) && time >= end) return false;
  }

  return true;
}

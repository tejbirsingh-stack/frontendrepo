import type { MediaType } from '../data/mockMedia';

export type MediaTypeFilter = 'all' | MediaType;

export type StorageFilter = 'all' | 'local' | 'b2';

export const STORAGE_FILTER_OPTIONS: { value: StorageFilter; label: string }[] = [
  { value: 'all', label: 'All Storage' },
  { value: 'local', label: 'Local Only' },
  { value: 'b2', label: 'B2 Cloud' },
];

export type DateRangeFilter = 'all' | 'today' | 'week' | 'month' | 'year';

export const MEDIA_TYPE_FILTER_OPTIONS: { value: MediaTypeFilter; label: string }[] = [
  { value: 'all', label: 'All Types' },
  { value: 'folder', label: 'Folders' },
  { value: 'video', label: 'Videos' },
  { value: 'image', label: 'Images' },
  { value: 'audio', label: 'Audio' },
];

export const DATE_RANGE_OPTIONS: { value: DateRangeFilter; label: string }[] = [
  { value: 'all', label: 'All Time' },
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'year', label: 'This Year' },
];

export const TAG_OPTIONS = ['important', 'project', 'brand', 'archived'] as const;

export const AI_TAG_OPTIONS = ['person', 'outdoor', 'technology'] as const;

export function matchesDateRange(createdAt: string, range: DateRangeFilter): boolean {
  if (range === 'all') return true;

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

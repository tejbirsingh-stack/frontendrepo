import type { MediaItem } from '../data/mockMedia';

/** English month names used for auto-created upload date folders. */
const MONTH_FOLDER_NAMES = new Set([
  'january',
  'february',
  'march',
  'april',
  'may',
  'june',
  'july',
  'august',
  'september',
  'october',
  'november',
  'december',
]);

/** Year folders are titled like `2026`. */
const YEAR_FOLDER_PATTERN = /^\d{4}$/;

/**
 * Organizational year/month folders created by the upload path
 * (e.g. `2026` / `July`). Projects are never treated as date folders.
 */
export function isYearOrMonthFolder(
  item: Pick<MediaItem, 'type' | 'title' | 'isProject'>,
): boolean {
  if (item.type !== 'folder' || item.isProject) return false;

  const title = item.title.trim();
  if (YEAR_FOLDER_PATTERN.test(title)) return true;
  return MONTH_FOLDER_NAMES.has(title.toLowerCase());
}

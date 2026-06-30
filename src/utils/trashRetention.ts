import { TRASH_RETENTION_DAYS, TRASH_RETENTION_MS } from '../constants/trash';
import type { TrashedMediaRecord } from './trashStorage';

export function getTrashExpiresAt(deletedAt: string): number {
  return new Date(deletedAt).getTime() + TRASH_RETENTION_MS;
}

export function getTrashDaysRemaining(deletedAt: string): number {
  const remainingMs = getTrashExpiresAt(deletedAt) - Date.now();
  return Math.max(0, Math.ceil(remainingMs / (24 * 60 * 60 * 1000)));
}

export function isTrashExpired(deletedAt: string, now = Date.now()): boolean {
  return getTrashExpiresAt(deletedAt) <= now;
}

export function getExpiredTrashIds(
  trashedAtById: TrashedMediaRecord,
  now = Date.now(),
): string[] {
  return Object.entries(trashedAtById)
    .filter(([, deletedAt]) => isTrashExpired(deletedAt, now))
    .map(([id]) => id);
}

export function formatTrashDaysRemaining(deletedAt: string): string {
  const days = getTrashDaysRemaining(deletedAt);
  if (days === 0) return 'Deletes today';
  if (days === 1) return 'Deletes in 1 day';
  return `Deletes in ${days} days`;
}

export function getTrashRetentionLabel(): string {
  return `${TRASH_RETENTION_DAYS} days`;
}

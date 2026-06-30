import { isAnnotationVisibleAtTime } from './commentTimestampVisibility';

export function buildResolvedOverlayEntryIds(
  entryIds: Iterable<{ id: string; resolved?: boolean; erasedAt?: number }>,
): ReadonlySet<string> {
  const resolved = new Set<string>();

  for (const entry of entryIds) {
    if (entry.resolved && !entry.erasedAt) {
      resolved.add(entry.id);
    }
  }

  return resolved;
}

export function isOverlayAnnotationVisible(
  historyEntryId: string,
  videoTimestamp: number,
  currentVideoTime: number,
  resolvedEntryIds: ReadonlySet<string>,
  endTimestamp?: number,
): boolean {
  return (
    isAnnotationVisibleAtTime(videoTimestamp, currentVideoTime, endTimestamp) &&
    !resolvedEntryIds.has(historyEntryId)
  );
}

export function getDrawingHistoryEntryId(strokeId: string): string {
  return `drawing-${strokeId}`;
}

export function getLegacyDrawingHistoryEntryId(videoTimestamp: number): string {
  return `drawing-${Math.floor(videoTimestamp)}`;
}

export function getShapeHistoryEntryId(shapeId: string): string {
  return `shape-${shapeId}`;
}

export function getStampHistoryEntryId(stampId: string): string {
  return `stamp-${stampId}`;
}

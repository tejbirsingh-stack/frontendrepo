export const MIN_ANNOTATION_DURATION = 0.25;

export const DEFAULT_ANNOTATION_DURATION = 4.0;

export function getAnnotationEndTime(
  videoTimestamp: number,
  endTimestamp?: number,
): number {
  const start = Number(videoTimestamp) || 0;
  const rawEnd = endTimestamp !== undefined ? Number(endTimestamp) : undefined;
  if (rawEnd !== undefined && !isNaN(rawEnd) && rawEnd > start + MIN_ANNOTATION_DURATION) {
    return Math.max(rawEnd, start + MIN_ANNOTATION_DURATION);
  }

  return start + DEFAULT_ANNOTATION_DURATION;
}

export function isAnnotationVisibleInRange(
  videoTimestamp: number,
  currentTime: number,
  endTimestamp?: number,
): boolean {
  const start = Number(videoTimestamp) || 0;
  const current = Number(currentTime) || 0;
  const end = getAnnotationEndTime(start, endTimestamp);
  return current >= start && current < end;
}

export function clampAnnotationRange(
  startTime: number,
  endTime: number,
  videoDuration: number,
): { startTime: number; endTime: number } {
  const safeDuration = Math.max(videoDuration, MIN_ANNOTATION_DURATION);
  let start = Math.max(0, Math.min(startTime, safeDuration));
  let end = Math.max(start + MIN_ANNOTATION_DURATION, Math.min(endTime, safeDuration));

  if (end - start < MIN_ANNOTATION_DURATION) {
    end = Math.min(safeDuration, start + MIN_ANNOTATION_DURATION);
    start = Math.max(0, end - MIN_ANNOTATION_DURATION);
  }

  return { startTime: start, endTime: end };
}

export function createDefaultAnnotationEndTime(videoTimestamp: number): number {
  return videoTimestamp + DEFAULT_ANNOTATION_DURATION;
}

export function getEffectiveTimelineDuration(
  videoDuration: number,
  items: { endTime: number }[],
  fallbackDuration?: number,
): number {
  const maxItemEnd = items.reduce((max, item) => Math.max(max, item.endTime), 0);
  const resolvedVideoDuration =
    Number.isFinite(videoDuration) && videoDuration > 0 ? videoDuration : 0;

  return Math.max(resolvedVideoDuration, fallbackDuration ?? 0, maxItemEnd, 1);
}

export const MIN_ANNOTATION_DURATION = 0.25;

export function getAnnotationEndTime(
  videoTimestamp: number,
  endTimestamp?: number,
): number {
  if (endTimestamp !== undefined) {
    return Math.max(endTimestamp, videoTimestamp + MIN_ANNOTATION_DURATION);
  }

  return Math.floor(videoTimestamp) + 1;
}

export function isAnnotationVisibleInRange(
  videoTimestamp: number,
  currentTime: number,
  endTimestamp?: number,
): boolean {
  const start = videoTimestamp;
  const end = getAnnotationEndTime(videoTimestamp, endTimestamp);
  return currentTime >= start && currentTime < end;
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
  return Math.floor(videoTimestamp) + 1;
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

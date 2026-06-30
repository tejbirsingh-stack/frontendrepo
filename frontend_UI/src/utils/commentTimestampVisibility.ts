import { isAnnotationVisibleInRange } from './annotationTimeRange';

/**
 * Timestamped annotations are visible while playback is within their range.
 * Legacy items without endTimestamp use the second they were placed on.
 */
export function isCommentVisibleAtTime(
  videoTimestamp: number,
  currentTime: number,
  endTimestamp?: number,
): boolean {
  return isAnnotationVisibleInRange(videoTimestamp, currentTime, endTimestamp);
}

export const isAnnotationVisibleAtTime = isCommentVisibleAtTime;

import type { TimelineAnnotationItem } from '../types/annotationTimeline';

export interface TimelineLaneLayout {
  laneById: Map<string, number>;
  laneCount: number;
}

/** Assigns non-overlapping horizontal lanes for items that share the same track. */
export function assignTimelineLanes(items: TimelineAnnotationItem[]): TimelineLaneLayout {
  const sorted = [...items].sort((a, b) => {
    if (a.startTime !== b.startTime) return a.startTime - b.startTime;
    return a.endTime - b.endTime;
  });

  const laneById = new Map<string, number>();
  const laneEnds: number[] = [];

  sorted.forEach((item) => {
    let laneIndex = laneEnds.findIndex((laneEnd) => laneEnd <= item.startTime);

    if (laneIndex === -1) {
      laneIndex = laneEnds.length;
      laneEnds.push(item.endTime);
    } else {
      laneEnds[laneIndex] = item.endTime;
    }

    laneById.set(item.id, laneIndex);
  });

  return {
    laneById,
    laneCount: Math.max(laneEnds.length, 1),
  };
}

export function itemsOverlap(
  a: Pick<TimelineAnnotationItem, 'startTime' | 'endTime'>,
  b: Pick<TimelineAnnotationItem, 'startTime' | 'endTime'>,
): boolean {
  return a.startTime < b.endTime && b.startTime < a.endTime;
}

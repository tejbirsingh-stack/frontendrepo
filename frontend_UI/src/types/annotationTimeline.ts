export type TimelineAnnotationType = 'comment' | 'drawing' | 'shape' | 'stamp';

export interface TimelineAnnotationItem {
  id: string;
  type: TimelineAnnotationType;
  startTime: number;
  endTime: number;
  label: string;
}

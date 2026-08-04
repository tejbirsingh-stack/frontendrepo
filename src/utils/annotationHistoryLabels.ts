import type { AnnotationHistoryType } from '../types/annotationHistory';

export const HISTORY_TYPE_LABELS: Record<AnnotationHistoryType, string> = {
  comment: 'Comment',
  reply: 'Reply',
  drawing: 'Drawing',
  shape: 'Shape',
  stamp: 'Stamp',
  system: 'System Event',
};

export function getHistoryTypeLabel(type: AnnotationHistoryType): string {
  return HISTORY_TYPE_LABELS[type];
}

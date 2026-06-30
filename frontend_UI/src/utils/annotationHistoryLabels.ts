import type { AnnotationHistoryType } from '../types/annotationHistory';

export const HISTORY_TYPE_LABELS: Record<AnnotationHistoryType, string> = {
  comment: 'Comment',
  reply: 'Reply',
  drawing: 'Drawing',
  text: 'Text',
  shape: 'Shape',
  sticky_note: 'Sticky note',
  stamp: 'Stamp',
};

export function getHistoryTypeLabel(type: AnnotationHistoryType): string {
  return HISTORY_TYPE_LABELS[type];
}

import type { CommentAuthor } from './videoComments';
import type { AnnotationVisibility } from './annotationVisibility';

export type AnnotationHistoryType =
  | 'comment'
  | 'reply'
  | 'drawing'
  | 'text'
  | 'shape'
  | 'sticky_note'
  | 'stamp';

export interface AnnotationHistoryEntry {
  id: string;
  index: number;
  type: AnnotationHistoryType;
  author: CommentAuthor;
  createdAt: number;
  videoTimestamp: number;
  summary: string;
  detail?: string;
  resolved?: boolean;
  resolvedAt?: number;
  resolvedBy?: CommentAuthor;
  reopenedAt?: number;
  reopenedBy?: CommentAuthor;
  erasedAt?: number;
  erasedBy?: CommentAuthor;
  unread?: boolean;
  sourceCommentId?: string;
  linkedDrawingId?: string;
  linkedShapeId?: string;
  replyCount?: number;
  visibility?: AnnotationVisibility;
  groupId?: string;
}

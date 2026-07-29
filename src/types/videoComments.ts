import type { AnnotationVisibility } from './annotationVisibility';

export interface CommentAuthor {
  name: string;
  avatarUrl?: string;
  initials?: string;
}

export interface CommentReply {
  id: string;
  text: string;
  imageUrl?: string;
  createdAt: number;
  author: CommentAuthor;
}

export interface VideoComment {
  id: string;
  historyIndex?: number;
  xPercent: number;
  yPercent: number;
  text: string;
  imageUrl?: string;
  createdAt: number;
  videoTimestamp: number;
  endTimestamp?: number;
  author: CommentAuthor;
  replies: CommentReply[];
  resolved?: boolean;
  resolvedAt?: number;
  resolvedBy?: CommentAuthor;
  reopenedAt?: number;
  reopenedBy?: CommentAuthor;
  visibility?: AnnotationVisibility;
  groupId?: string;
  linkedDrawingId?: string;
  linkedShapeId?: string;
  pinned?: boolean;
  erasedAt?: number;
  erasedBy?: CommentAuthor;
}

export type LinkedAnnotationKind = 'drawing' | 'shape';

export interface DraftVideoComment {
  xPercent: number;
  yPercent: number;
  text: string;
  imageUrl?: string;
  linkedDrawingId?: string;
  linkedShapeId?: string;
  linkedAnnotationKind?: LinkedAnnotationKind;
  linkedVideoTimestamp?: number;
}

import type { StampId } from '../constants/stamps';
import type { AnnotationVisibility } from './annotationVisibility';

export interface VideoStamp {
  id: string;
  stampId: StampId;
  /** Persisted emoji glyph for custom stamps placed on the video */
  customEmoji?: string;
  xPercent: number;
  yPercent: number;
  videoTimestamp: number;
  endTimestamp?: number;
  userId?: string;
  author?: any;
  pinned?: boolean;
  erasedAt?: number;
  erasedBy?: { name: string; avatarUrl?: string; initials?: string };
  visibility?: AnnotationVisibility;
  groupId?: string;
}

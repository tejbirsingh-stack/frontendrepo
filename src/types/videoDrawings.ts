import type { DrawTool } from '../components/media/DrawSubToolbar';
import type { AnnotationVisibility } from './annotationVisibility';

export interface VideoDrawingStroke {
  id: string;
  points: string;
  tool: DrawTool;
  color: string;
  colorId: string;
  width: number;
  opacity: number;
  rainbow?: boolean;
  videoTimestamp: number;
  endTimestamp?: number;
  commentId?: string;
  userId?: string;
  author?: any;
  pinned?: boolean;
  erasedAt?: number;
  erasedBy?: { name: string; avatarUrl?: string; initials?: string };
  visibility?: AnnotationVisibility;
  groupId?: string;
}

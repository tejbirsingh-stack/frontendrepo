import type { ShapeTool } from '../components/media/ShapeSubToolbar';
import type { AnnotationVisibility } from './annotationVisibility';

export interface VideoShape {
  id: string;
  type: ShapeTool;
  x1Percent: number;
  y1Percent: number;
  x2Percent: number;
  y2Percent: number;
  color: string;
  colorId: string;
  strokeWidth: number;
  videoTimestamp: number;
  endTimestamp?: number;
  rainbow?: boolean;
  commentId?: string;
  userId?: string;
  author?: any;
  pinned?: boolean;
  erasedAt?: number;
  erasedBy?: { name: string; avatarUrl?: string; initials?: string };
  visibility?: AnnotationVisibility;
  groupId?: string;
}

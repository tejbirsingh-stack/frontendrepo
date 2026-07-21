import type { ShapeTool } from '../components/media/ShapeSubToolbar';

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
}

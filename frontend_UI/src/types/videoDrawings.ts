import type { DrawTool } from '../components/media/DrawSubToolbar';

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
}

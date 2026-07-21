import type { StampId } from '../constants/stamps';

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
}

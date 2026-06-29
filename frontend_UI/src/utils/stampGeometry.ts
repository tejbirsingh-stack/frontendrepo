import type { VideoStamp } from '../types/videoStamps';

/** Legacy toolbar size reference */
export const STAMP_SIZE_PX = 44;

export const STAMP_EMOJI_SIZE_PX = 72;
export const STAMP_HIT_WIDTH_PX = 136;
export const STAMP_HIT_HEIGHT_PX = 112;

interface PercentPoint {
  xPercent: number;
  yPercent: number;
}

function percentToPixel(point: PercentPoint, containerRect: DOMRect) {
  return {
    x: (point.xPercent / 100) * containerRect.width,
    y: (point.yPercent / 100) * containerRect.height,
  };
}

export function hitTestStamp(
  point: PercentPoint,
  stamp: VideoStamp,
  containerRect: DOMRect,
): boolean {
  const center = percentToPixel(
    { xPercent: stamp.xPercent, yPercent: stamp.yPercent },
    containerRect,
  );
  const pointer = percentToPixel(point, containerRect);
  const halfWidth = STAMP_HIT_WIDTH_PX / 2;
  const halfHeight = STAMP_HIT_HEIGHT_PX / 2;

  return (
    pointer.x >= center.x - halfWidth &&
    pointer.x <= center.x + halfWidth &&
    pointer.y >= center.y - halfHeight &&
    pointer.y <= center.y + halfHeight
  );
}

export function findTopStampAtPoint(
  point: PercentPoint,
  stamps: VideoStamp[],
  containerRect: DOMRect,
): VideoStamp | null {
  for (let index = stamps.length - 1; index >= 0; index -= 1) {
    if (hitTestStamp(point, stamps[index], containerRect)) {
      return stamps[index];
    }
  }

  return null;
}

export function translateStamp(stamp: VideoStamp, dx: number, dy: number): VideoStamp {
  return {
    ...stamp,
    xPercent: stamp.xPercent + dx,
    yPercent: stamp.yPercent + dy,
  };
}

export function updateStampById(
  stamps: VideoStamp[],
  stampId: string,
  patch: Partial<VideoStamp>,
): VideoStamp[] {
  return stamps.map((stamp) => (stamp.id === stampId ? { ...stamp, ...patch } : stamp));
}

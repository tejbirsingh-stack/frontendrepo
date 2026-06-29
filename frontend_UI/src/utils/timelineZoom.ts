export const TIMELINE_ZOOM_DEFAULT = 1;
export const TIMELINE_ZOOM_MIN = 1;
export const TIMELINE_ZOOM_MAX = 6;
export const TIMELINE_ZOOM_STEP = 0.25;

export const timelineZoomShortcuts = {
  in: '+',
  out: '-',
} as const;

export function clampTimelineZoom(value: number): number {
  return Math.min(TIMELINE_ZOOM_MAX, Math.max(TIMELINE_ZOOM_MIN, value));
}

export function stepTimelineZoom(current: number, direction: 'in' | 'out'): number {
  const next =
    direction === 'in' ? current + TIMELINE_ZOOM_STEP : current - TIMELINE_ZOOM_STEP;
  return clampTimelineZoom(Number(next.toFixed(2)));
}

/** Continuous zoom from trackpad pinch / ctrl+wheel delta (negative deltaY zooms in). */
export function applyTimelineZoomDelta(current: number, deltaY: number): number {
  if (!Number.isFinite(deltaY) || deltaY === 0) return current;

  const normalizedDelta =
    Math.abs(deltaY) > 0 && Math.abs(deltaY) < 1 ? deltaY * 12 : deltaY;
  const factor = Math.exp(-normalizedDelta * 0.006);
  return clampTimelineZoom(Number((current * factor).toFixed(3)));
}

export function isTimelineZoomed(zoom: number): boolean {
  return zoom > TIMELINE_ZOOM_DEFAULT + 0.001;
}

export function formatTimelineZoomLabel(zoom: number): string {
  return `${Math.round(zoom * 100)}%`;
}

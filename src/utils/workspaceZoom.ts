export const WORKSPACE_ZOOM_DEFAULT = 1;
export const WORKSPACE_ZOOM_MIN = 0.5;
export const WORKSPACE_ZOOM_MAX = 3;
export const WORKSPACE_ZOOM_STEP = 0.1;

export function clampWorkspaceZoom(value: number): number {
  return Math.min(WORKSPACE_ZOOM_MAX, Math.max(WORKSPACE_ZOOM_MIN, value));
}

export function stepWorkspaceZoom(current: number, direction: 'in' | 'out'): number {
  const next =
    direction === 'in' ? current + WORKSPACE_ZOOM_STEP : current - WORKSPACE_ZOOM_STEP;
  return clampWorkspaceZoom(Number(next.toFixed(2)));
}

export function formatWorkspaceZoomLabel(zoom: number): string {
  return `${Math.round(zoom * 100)}%`;
}

export function isWorkspaceZoomDefault(zoom: number): boolean {
  return Math.abs(zoom - WORKSPACE_ZOOM_DEFAULT) < 0.001;
}

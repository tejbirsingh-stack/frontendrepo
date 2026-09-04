export const WORKSPACE_ZOOM_DEFAULT = 1;
export const WORKSPACE_ZOOM_MIN = 0.5;
export const WORKSPACE_ZOOM_MAX = 3;
export const WORKSPACE_ZOOM_STEP = 0.1;

export type WorkspacePanOffset = { x: number; y: number };

export const WORKSPACE_PAN_DEFAULT: WorkspacePanOffset = { x: 0, y: 0 };

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

export function getWorkspacePanLimits(
  zoom: number,
  width: number,
  height: number,
): { maxX: number; maxY: number } {
  if (zoom <= 1 || width <= 0 || height <= 0) {
    return { maxX: 0, maxY: 0 };
  }

  return {
    maxX: (width * (zoom - 1)) / 2,
    maxY: (height * (zoom - 1)) / 2,
  };
}

export function clampWorkspacePan(
  pan: WorkspacePanOffset,
  zoom: number,
  width: number,
  height: number,
): WorkspacePanOffset {
  const { maxX, maxY } = getWorkspacePanLimits(zoom, width, height);
  return {
    x: Math.min(maxX, Math.max(-maxX, pan.x)),
    y: Math.min(maxY, Math.max(-maxY, pan.y)),
  };
}

export function isWorkspacePanDefault(pan: WorkspacePanOffset): boolean {
  return Math.abs(pan.x) < 0.5 && Math.abs(pan.y) < 0.5;
}

export function canPanWorkspace(zoom: number): boolean {
  return zoom > WORKSPACE_ZOOM_DEFAULT + 0.001;
}

import type { AnnotationColor } from '../constants/annotationColors';
import { palette } from '../theme/cssVars';
import type { DrawTool } from '../components/media/DrawSubToolbar';

export const DRAW_STROKE_MIN = 1;
export const DRAW_STROKE_MAX = 100;
export const DEFAULT_DRAW_STROKE_THICKNESS = 35;

const GRID_DIVISIONS = 20;

function lerp(min: number, max: number, t: number): number {
  return min + (max - min) * t;
}

function strokeThicknessRatio(thickness: number): number {
  const clamped = Math.min(DRAW_STROKE_MAX, Math.max(DRAW_STROKE_MIN, thickness));
  return (clamped - DRAW_STROKE_MIN) / (DRAW_STROKE_MAX - DRAW_STROKE_MIN);
}

export function snapToGrid(point: { xPercent: number; yPercent: number }) {
  const step = 100 / GRID_DIVISIONS;
  return {
    xPercent: Math.round(point.xPercent / step) * step,
    yPercent: Math.round(point.yPercent / step) * step,
  };
}

export function resolveDrawColor(color: AnnotationColor): string {
  return color.gradient ? palette.purple : color.value;
}

export function getStrokeWidth(tool: DrawTool, thickness: number): number {
  const ratio = strokeThicknessRatio(thickness);

  if (tool === 'eraser' || tool === 'highlighter') {
    return lerp(6, 24, ratio);
  }

  return lerp(1.5, 8, ratio);
}

export function getThicknessFromPencilWidth(width: number): number {
  const ratio = Math.min(1, Math.max(0, (width - 1.5) / (8 - 1.5)));
  return Math.round(DRAW_STROKE_MIN + ratio * (DRAW_STROKE_MAX - DRAW_STROKE_MIN));
}

export function getStrokeOpacity(tool: DrawTool): number {
  if (tool === 'highlighter') return 0.45;
  return 1;
}

export function appendOrthogonalSegment(
  from: { xPercent: number; yPercent: number },
  to: { xPercent: number; yPercent: number },
): { xPercent: number; yPercent: number }[] {
  if (from.xPercent === to.xPercent && from.yPercent === to.yPercent) {
    return [];
  }

  const corner = { xPercent: to.xPercent, yPercent: from.yPercent };
  if (corner.xPercent === from.xPercent && corner.yPercent === to.yPercent) {
    return [to];
  }

  return [corner, to];
}

export function parsePathPoints(path: string): { xPercent: number; yPercent: number }[] {
  const tokens = path.trim().split(/\s+/);
  const points: { xPercent: number; yPercent: number }[] = [];

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (token === 'M' || token === 'L') {
      const xPercent = Number.parseFloat(tokens[index + 1]);
      const yPercent = Number.parseFloat(tokens[index + 2]);
      if (!Number.isNaN(xPercent) && !Number.isNaN(yPercent)) {
        points.push({ xPercent, yPercent });
      }
      index += 2;
    }
  }

  return points;
}

function distancePointToSegment(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): number {
  const dx = x2 - x1;
  const dy = y2 - y1;

  if (dx === 0 && dy === 0) {
    return Math.hypot(px - x1, py - y1);
  }

  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy)));
  const nearestX = x1 + t * dx;
  const nearestY = y1 + t * dy;
  return Math.hypot(px - nearestX, py - nearestY);
}

export function strokeHitsEraser(
  path: string,
  eraserPoint: { xPercent: number; yPercent: number },
  eraserRadiusPx: number,
  containerRect: DOMRect,
  strokeWidthPx = 2,
): boolean {
  const points = parsePathPoints(path);
  if (points.length === 0) return false;

  const px = (eraserPoint.xPercent / 100) * containerRect.width;
  const py = (eraserPoint.yPercent / 100) * containerRect.height;
  const hitTolerance = eraserRadiusPx + strokeWidthPx / 2 + 4;

  if (points.length === 1) {
    const sx = (points[0].xPercent / 100) * containerRect.width;
    const sy = (points[0].yPercent / 100) * containerRect.height;
    return Math.hypot(px - sx, py - sy) <= hitTolerance;
  }

  for (let index = 1; index < points.length; index += 1) {
    const start = points[index - 1];
    const end = points[index];
    const x1 = (start.xPercent / 100) * containerRect.width;
    const y1 = (start.yPercent / 100) * containerRect.height;
    const x2 = (end.xPercent / 100) * containerRect.width;
    const y2 = (end.yPercent / 100) * containerRect.height;
    const segmentLength = Math.hypot(x2 - x1, y2 - y1);
    const sampleCount = Math.max(1, Math.ceil(segmentLength / 6));

    for (let step = 0; step <= sampleCount; step += 1) {
      const t = step / sampleCount;
      const sampleX = x1 + (x2 - x1) * t;
      const sampleY = y1 + (y2 - y1) * t;

      if (Math.hypot(px - sampleX, py - sampleY) <= hitTolerance) {
        return true;
      }
    }

    if (distancePointToSegment(px, py, x1, y1, x2, y2) <= hitTolerance) {
      return true;
    }
  }

  return false;
}

export function translateStrokePath(path: string, dx: number, dy: number): string {
  return parsePathPoints(path)
    .map((point, index) => {
      const command = index === 0 ? 'M' : 'L';
      const xPercent = point.xPercent + dx;
      const yPercent = point.yPercent + dy;
      return `${command} ${xPercent} ${yPercent}`;
    })
    .join(' ');
}

export function findTopStrokeAtPoint(
  point: { xPercent: number; yPercent: number },
  strokes: { id: string; points: string; width: number }[],
  containerRect: DOMRect,
): { id: string; points: string; width: number } | null {
  for (let index = strokes.length - 1; index >= 0; index -= 1) {
    const stroke = strokes[index];
    if (
      strokeHitsEraser(stroke.points, point, 12, containerRect, stroke.width)
    ) {
      return stroke;
    }
  }

  return null;
}

export const GRID_LINE_COUNT = GRID_DIVISIONS;

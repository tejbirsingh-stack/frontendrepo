import type { VideoShape } from '../types/videoShapes';
import type { ShapeTool } from '../components/media/ShapeSubToolbar';

export interface PercentPoint {
  xPercent: number;
  yPercent: number;
}

export interface ShapeBounds {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export type ResizeHandle = 'nw' | 'ne' | 'sw' | 'se';

const LINE_SHAPE_TYPES: ShapeTool[] = [
  'line',
  'straight-arrow',
  'elbow-connector',
  'curved-connector',
];

export function shapeToBounds(
  shape: Pick<VideoShape, 'x1Percent' | 'y1Percent' | 'x2Percent' | 'y2Percent'>,
): ShapeBounds {
  return {
    x1: shape.x1Percent,
    y1: shape.y1Percent,
    x2: shape.x2Percent,
    y2: shape.y2Percent,
  };
}

export function getNormalizedBounds(bounds: ShapeBounds) {
  const left = Math.min(bounds.x1, bounds.x2);
  const top = Math.min(bounds.y1, bounds.y2);
  const right = Math.max(bounds.x1, bounds.x2);
  const bottom = Math.max(bounds.y1, bounds.y2);

  return {
    left,
    top,
    right,
    bottom,
    width: right - left,
    height: bottom - top,
    centerX: (left + right) / 2,
    centerY: (top + bottom) / 2,
  };
}

export function getHandlePositions(bounds: ShapeBounds) {
  const { left, top, right, bottom } = getNormalizedBounds(bounds);

  return {
    nw: { xPercent: left, yPercent: top },
    ne: { xPercent: right, yPercent: top },
    sw: { xPercent: left, yPercent: bottom },
    se: { xPercent: right, yPercent: bottom },
  } satisfies Record<ResizeHandle, PercentPoint>;
}

function pointDistance(a: PercentPoint, b: PercentPoint): number {
  return Math.hypot(a.xPercent - b.xPercent, a.yPercent - b.yPercent);
}

function hitRadiusPercent(containerRect: DOMRect): number {
  return Math.max((10 / containerRect.width) * 100, (10 / containerRect.height) * 100, 0.75);
}

function distancePointToSegment(
  point: PercentPoint,
  start: PercentPoint,
  end: PercentPoint,
): number {
  const dx = end.xPercent - start.xPercent;
  const dy = end.yPercent - start.yPercent;

  if (dx === 0 && dy === 0) {
    return pointDistance(point, start);
  }

  const t = Math.max(
    0,
    Math.min(
      1,
      ((point.xPercent - start.xPercent) * dx + (point.yPercent - start.yPercent) * dy) /
        (dx * dx + dy * dy),
    ),
  );

  return pointDistance(point, {
    xPercent: start.xPercent + t * dx,
    yPercent: start.yPercent + t * dy,
  });
}

function hitTestLineShape(point: PercentPoint, shape: VideoShape, tolerance: number): boolean {
  const start = { xPercent: shape.x1Percent, yPercent: shape.y1Percent };
  const end = { xPercent: shape.x2Percent, yPercent: shape.y2Percent };

  if (shape.type === 'elbow-connector') {
    const corner = { xPercent: shape.x2Percent, yPercent: shape.y1Percent };
    return (
      distancePointToSegment(point, start, corner) <= tolerance ||
      distancePointToSegment(point, corner, end) <= tolerance
    );
  }

  if (shape.type === 'curved-connector') {
    const samples = 12;
    let previous = start;

    for (let index = 1; index <= samples; index += 1) {
      const t = index / samples;
      const control = { xPercent: (start.xPercent + end.xPercent) / 2, yPercent: start.yPercent };
      const sample = {
        xPercent:
          (1 - t) * (1 - t) * start.xPercent +
          2 * (1 - t) * t * control.xPercent +
          t * t * end.xPercent,
        yPercent:
          (1 - t) * (1 - t) * start.yPercent +
          2 * (1 - t) * t * control.yPercent +
          t * t * end.yPercent,
      };

      if (distancePointToSegment(point, previous, sample) <= tolerance) {
        return true;
      }

      previous = sample;
    }

    return false;
  }

  return distancePointToSegment(point, start, end) <= tolerance;
}

export function hitTestResizeHandle(
  point: PercentPoint,
  bounds: ShapeBounds,
  containerRect: DOMRect,
): ResizeHandle | null {
  const radius = hitRadiusPercent(containerRect);
  const handles = getHandlePositions(bounds);

  for (const handle of Object.keys(handles) as ResizeHandle[]) {
    if (pointDistance(point, handles[handle]) <= radius) {
      return handle;
    }
  }

  return null;
}

export function hitTestShape(
  point: PercentPoint,
  shape: VideoShape,
  containerRect: DOMRect,
): boolean {
  const bounds = shapeToBounds(shape);
  const { left, top, right, bottom } = getNormalizedBounds(bounds);
  const padding = hitRadiusPercent(containerRect);

  if (LINE_SHAPE_TYPES.includes(shape.type)) {
    return hitTestLineShape(point, shape, padding);
  }

  return (
    point.xPercent >= left - padding &&
    point.xPercent <= right + padding &&
    point.yPercent >= top - padding &&
    point.yPercent <= bottom + padding
  );
}

export function findTopShapeAtPoint(
  point: PercentPoint,
  shapes: VideoShape[],
  containerRect: DOMRect,
): VideoShape | null {
  for (let index = shapes.length - 1; index >= 0; index -= 1) {
    if (hitTestShape(point, shapes[index], containerRect)) {
      return shapes[index];
    }
  }

  return null;
}

export function translateShape(shape: VideoShape, dx: number, dy: number): VideoShape {
  return {
    ...shape,
    x1Percent: shape.x1Percent + dx,
    y1Percent: shape.y1Percent + dy,
    x2Percent: shape.x2Percent + dx,
    y2Percent: shape.y2Percent + dy,
  };
}

export function resizeShapeWithHandle(
  origin: VideoShape,
  handle: ResizeHandle,
  point: PercentPoint,
): Pick<VideoShape, 'x1Percent' | 'y1Percent' | 'x2Percent' | 'y2Percent'> {
  const { left, top, right, bottom } = getNormalizedBounds(shapeToBounds(origin));

  switch (handle) {
    case 'nw':
      return {
        x1Percent: point.xPercent,
        y1Percent: point.yPercent,
        x2Percent: right,
        y2Percent: bottom,
      };
    case 'ne':
      return {
        x1Percent: left,
        y1Percent: point.yPercent,
        x2Percent: point.xPercent,
        y2Percent: bottom,
      };
    case 'sw':
      return {
        x1Percent: point.xPercent,
        y1Percent: top,
        x2Percent: right,
        y2Percent: point.yPercent,
      };
    case 'se':
      return {
        x1Percent: left,
        y1Percent: top,
        x2Percent: point.xPercent,
        y2Percent: point.yPercent,
      };
    default:
      return {
        x1Percent: origin.x1Percent,
        y1Percent: origin.y1Percent,
        x2Percent: origin.x2Percent,
        y2Percent: origin.y2Percent,
      };
  }
}

export function updateShapeById(
  shapes: VideoShape[],
  shapeId: string,
  patch: Partial<VideoShape>,
): VideoShape[] {
  return shapes.map((shape) => (shape.id === shapeId ? { ...shape, ...patch } : shape));
}

import type { LinkedAnnotationKind } from '../types/videoComments';

export interface AnnotationCommentPromptRequest {
  kind: LinkedAnnotationKind;
  id: string;
  xPercent: number;
  yPercent: number;
  videoTimestamp: number;
}

export function getAnnotationCommentPlaceholder(kind: LinkedAnnotationKind): string {
  return kind === 'drawing'
    ? 'Explain why you drew this...'
    : 'Explain why you added this shape...';
}

export function averagePercentPoints(
  points: { xPercent: number; yPercent: number }[],
): { xPercent: number; yPercent: number } {
  if (points.length === 0) {
    return { xPercent: 50, yPercent: 50 };
  }

  const total = points.reduce(
    (sum, point) => ({
      xPercent: sum.xPercent + point.xPercent,
      yPercent: sum.yPercent + point.yPercent,
    }),
    { xPercent: 0, yPercent: 0 },
  );

  return {
    xPercent: total.xPercent / points.length,
    yPercent: total.yPercent / points.length,
  };
}

export function getShapeCentroid(shape: {
  x1Percent: number;
  y1Percent: number;
  x2Percent: number;
  y2Percent: number;
}): { xPercent: number; yPercent: number } {
  return {
    xPercent: (shape.x1Percent + shape.x2Percent) / 2,
    yPercent: (shape.y1Percent + shape.y2Percent) / 2,
  };
}

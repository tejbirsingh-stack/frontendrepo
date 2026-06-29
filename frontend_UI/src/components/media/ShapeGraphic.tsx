import type { ShapeTool } from './ShapeSubToolbar';

interface ShapeBounds {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

function getBounds(shape: ShapeBounds) {
  const left = Math.min(shape.x1, shape.x2);
  const top = Math.min(shape.y1, shape.y2);
  const right = Math.max(shape.x1, shape.x2);
  const bottom = Math.max(shape.y1, shape.y2);

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

const shapeStrokeProps = {
  fill: 'none' as const,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  vectorEffect: 'non-scaling-stroke' as const,
};

interface ShapeGraphicProps extends ShapeBounds {
  type: ShapeTool;
  color: string;
  strokeWidth: number;
  rainbow?: boolean;
}

export function shapeSummary(type: ShapeTool): string {
  const label = type
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
  return `${label} added`;
}

export function shapeHasMinSize(shape: ShapeBounds, minSize = 0.75): boolean {
  const { width, height } = getBounds(shape);
  return width >= minSize || height >= minSize;
}

export default function ShapeGraphic({
  type,
  x1,
  y1,
  x2,
  y2,
  color,
  strokeWidth,
  rainbow,
}: ShapeGraphicProps) {
  const stroke = rainbow ? 'url(#draw-rainbow-gradient)' : color;
  const bounds = getBounds({ x1, y1, x2, y2 });

  switch (type) {
    case 'rectangle':
      return (
        <rect
          x={bounds.left}
          y={bounds.top}
          width={bounds.width}
          height={bounds.height}
          stroke={stroke}
          strokeWidth={strokeWidth}
          {...shapeStrokeProps}
        />
      );

    case 'circle':
      return (
        <ellipse
          cx={bounds.centerX}
          cy={bounds.centerY}
          rx={bounds.width / 2}
          ry={bounds.height / 2}
          stroke={stroke}
          strokeWidth={strokeWidth}
          {...shapeStrokeProps}
        />
      );

    case 'line':
      return (
        <line
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke={stroke}
          strokeWidth={strokeWidth}
          {...shapeStrokeProps}
        />
      );

    case 'straight-arrow':
      return (
        <line
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke={stroke}
          strokeWidth={strokeWidth}
          markerEnd="url(#shape-arrowhead)"
          {...shapeStrokeProps}
        />
      );

    case 'elbow-connector':
      return (
        <path
          d={`M ${x1} ${y1} H ${x2} V ${y2}`}
          stroke={stroke}
          strokeWidth={strokeWidth}
          {...shapeStrokeProps}
        />
      );

    case 'curved-connector': {
      const controlX = (x1 + x2) / 2;
      const controlY = y1;
      return (
        <path
          d={`M ${x1} ${y1} Q ${controlX} ${controlY} ${x2} ${y2}`}
          stroke={stroke}
          strokeWidth={strokeWidth}
          {...shapeStrokeProps}
        />
      );
    }

    case 'diamond':
      return (
        <polygon
          points={`${bounds.centerX},${bounds.top} ${bounds.right},${bounds.centerY} ${bounds.centerX},${bounds.bottom} ${bounds.left},${bounds.centerY}`}
          stroke={stroke}
          strokeWidth={strokeWidth}
          {...shapeStrokeProps}
        />
      );

    case 'triangle-up':
      return (
        <polygon
          points={`${bounds.centerX},${bounds.top} ${bounds.right},${bounds.bottom} ${bounds.left},${bounds.bottom}`}
          stroke={stroke}
          strokeWidth={strokeWidth}
          {...shapeStrokeProps}
        />
      );

    case 'triangle-down':
      return (
        <polygon
          points={`${bounds.left},${bounds.top} ${bounds.right},${bounds.top} ${bounds.centerX},${bounds.bottom}`}
          stroke={stroke}
          strokeWidth={strokeWidth}
          {...shapeStrokeProps}
        />
      );

    default:
      return null;
  }
}

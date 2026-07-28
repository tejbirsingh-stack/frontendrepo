import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { cv, palette } from '../../theme/cssVars';
import { Box } from '@mui/material';
import {
  annotationColors,
  DEFAULT_ANNOTATION_COLOR,
  type AnnotationColor,
} from '../../constants/annotationColors';
import type { VideoDrawingStroke } from '../../types/videoDrawings';
import type { VideoShape } from '../../types/videoShapes';
import type { CustomStamp } from '../../types/customStamps';
import type { VideoStamp } from '../../types/videoStamps';
import {
  DEFAULT_STAMP_ID,
  getStampEmoji,
  getStampSummary,
  type StampId,
} from '../../constants/stamps';
import {
  getDrawingHistoryEntryId,
  getShapeHistoryEntryId,
  getStampHistoryEntryId,
  isOverlayAnnotationVisible,
} from '../../utils/annotationOverlayVisibility';
import { isAnnotationVisibleAtTime } from '../../utils/commentTimestampVisibility';
import {
  averagePercentPoints,
  getShapeCentroid,
  type AnnotationCommentPromptRequest,
} from '../../utils/annotationCommentPrompt';
import { createDefaultAnnotationEndTime } from '../../utils/annotationTimeRange';
import {
  findTopShapeAtPoint,
  hitTestResizeHandle,
  resizeShapeWithHandle,
  shapeToBounds,
  translateShape,
  updateShapeById,
  type ResizeHandle,
} from '../../utils/shapeGeometry';
import {
  findTopStampAtPoint,
  translateStamp,
  updateStampById,
} from '../../utils/stampGeometry';
import {
  appendOrthogonalSegment,
  DEFAULT_DRAW_STROKE_THICKNESS,
  getStrokeOpacity,
  getStrokeWidth,
  getThicknessFromPencilWidth,
  GRID_LINE_COUNT,
  resolveDrawColor,
  snapToGrid,
  strokeHitsEraser,
  translateStrokePath,
  findTopStrokeAtPoint,
} from '../../utils/drawStrokeStyle';
import { useActiveUser } from '../../hooks/useActiveUser';
import SelectedShapeToolbar from './SelectedShapeToolbar';
import SelectedStampToolbar from './SelectedStampToolbar';
import SelectedDrawingToolbar from './SelectedDrawingToolbar';
import StampMarker from './StampMarker';
import ShapeGraphic, { shapeHasMinSize, shapeSummary } from './ShapeGraphic';
import type { DrawStrokeThickness, DrawTool } from './DrawSubToolbar';
import type { ShapeStrokeThickness, ShapeTool } from './ShapeSubToolbar';
import type { AnnotationTool } from './AnnotationToolbar';

interface PercentPoint {
  xPercent: number;
  yPercent: number;
}

interface ShapeDraft {
  x1Percent: number;
  y1Percent: number;
  x2Percent: number;
  y2Percent: number;
}

type ShapePointerInteraction =
  | { mode: 'create' }
  | {
      mode: 'move';
      shapeId: string;
      startPointer: PercentPoint;
      origin: VideoShape;
    }
  | {
      mode: 'resize';
      shapeId: string;
      handle: ResizeHandle;
      origin: VideoShape;
    };

function getResizeCursor(handle: ResizeHandle): string {
  switch (handle) {
    case 'nw':
    case 'se':
      return 'nwse-resize';
    case 'ne':
    case 'sw':
      return 'nesw-resize';
    default:
      return 'crosshair';
  }
}

export interface AnnotationSurfaceRecord {
  type: 'drawing' | 'shape' | 'stamp';
  summary: string;
  detail?: string;
  videoTimestamp: number;
  /** Mark the existing drawing history entry at this timestamp as erased */
  markDrawingErased?: boolean;
  /** Stable id for drawing create/delete history updates */
  drawingId?: string;
  /** Stable id for shape create/delete history updates */
  shapeId?: string;
  /** Mark the existing shape history entry as deleted */
  markShapeDeleted?: boolean;
  /** Stable id for stamp create/delete history updates */
  videoStampId?: string;
  /** Mark the existing stamp history entry as deleted */
  markStampDeleted?: boolean;
  strokeId?: string;
}

interface VideoAnnotationSurfaceProps {
  activeTool: AnnotationTool;
  enabled: boolean;
  annotationsVisible?: boolean;
  resolvedOverlayEntryIds?: ReadonlySet<string>;
  videoRef?: React.RefObject<HTMLVideoElement | null>;
  strokes: VideoDrawingStroke[];
  onStrokesChange: (strokes: VideoDrawingStroke[]) => void;
  shapes: VideoShape[];
  onShapesChange: (shapes: VideoShape[]) => void;
  stamps: VideoStamp[];
  onStampsChange: (stamps: VideoStamp[]) => void;
  activeStamp?: StampId;
  customStamp?: CustomStamp | null;
  drawTool?: DrawTool;
  drawStroke?: DrawStrokeThickness;
  drawColor?: AnnotationColor;
  shapeTool?: ShapeTool;
  shapeStroke?: ShapeStrokeThickness;
  shapeColor?: AnnotationColor;
  onRecord: (record: AnnotationSurfaceRecord) => void;
  onAnnotationActionStart?: () => void;
  onAnnotationNeedsComment?: (request: AnnotationCommentPromptRequest) => void;
  annotationCommentPending?: boolean;
  onMoveLinkedComment?: (move: LinkedCommentMove) => void;
  selectedShapeId?: string | null;
  onSelectedShapeIdChange?: (id: string | null) => void;
  selectedStampId?: string | null;
  onSelectedStampIdChange?: (id: string | null) => void;
  selectedDrawingId?: string | null;
  onSelectedDrawingIdChange?: (id: string | null) => void;
}

export interface LinkedCommentMove {
  shapeId?: string;
  strokeId?: string;
  dx: number;
  dy: number;
}

type StampPointerInteraction = {
  mode: 'move';
  stampId: string;
  startPointer: PercentPoint;
  origin: VideoStamp;
};

type DrawingPointerInteraction = {
  mode: 'move';
  strokeId: string;
  startPointer: PercentPoint;
  originPoints: string;
};

function pointsToSvgPath(points: PercentPoint[]): string {
  if (points.length === 0) return '';
  return points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.xPercent} ${point.yPercent}`)
    .join(' ');
}

function normalizeDrawPoint(
  point: PercentPoint,
  drawTool: DrawTool,
): PercentPoint {
  if (drawTool === 'grid') {
    return snapToGrid(point);
  }
  return point;
}

function appendDrawPoint(
  points: PercentPoint[],
  nextPoint: PercentPoint,
  drawTool: DrawTool,
): PercentPoint[] {
  if (points.length === 0) {
    return [nextPoint];
  }

  const lastPoint = points[points.length - 1];
  if (lastPoint.xPercent === nextPoint.xPercent && lastPoint.yPercent === nextPoint.yPercent) {
    return points;
  }

  if (drawTool === 'grid') {
    const segments = appendOrthogonalSegment(lastPoint, nextPoint);
    return [...points, ...segments];
  }

  return [...points, nextPoint];
}

function drawToolSummary(tool: DrawTool): string {
  switch (tool) {
    case 'highlighter':
      return 'Highlighter stroke added';
    case 'grid':
      return 'Grid line added';
    case 'eraser':
      return 'Drawing erased';
    default:
      return 'Drawing added';
  }
}

function StrokePath({
  stroke,
}: {
  stroke: Pick<VideoDrawingStroke, 'points' | 'color' | 'width' | 'opacity' | 'rainbow'>;
}) {
  if (stroke.rainbow) {
    return (
      <path
        d={stroke.points}
        fill="none"
        stroke="url(#draw-rainbow-gradient)"
        strokeWidth={stroke.width}
        strokeOpacity={stroke.opacity}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    );
  }

  return (
    <path
      d={stroke.points}
      fill="none"
      stroke={stroke.color}
      strokeWidth={stroke.width}
      strokeOpacity={stroke.opacity}
      strokeLinecap="round"
      strokeLinejoin="round"
      vectorEffect="non-scaling-stroke"
    />
  );
}

export default function VideoAnnotationSurface({
  activeTool,
  enabled,
  annotationsVisible = true,
  resolvedOverlayEntryIds = new Set<string>(),
  videoRef,
  strokes,
  onStrokesChange,
  shapes,
  onShapesChange,
  stamps,
  onStampsChange,
  activeStamp = DEFAULT_STAMP_ID,
  customStamp = null,
  drawTool = 'pencil',
  drawStroke = DEFAULT_DRAW_STROKE_THICKNESS,
  drawColor,
  shapeTool = 'rectangle',
  shapeStroke = DEFAULT_DRAW_STROKE_THICKNESS,
  shapeColor,
  onRecord,
  onAnnotationActionStart,
  onAnnotationNeedsComment,
  annotationCommentPending = false,
  onMoveLinkedComment,
  selectedShapeId: externalSelectedShapeId,
  onSelectedShapeIdChange,
  selectedStampId: externalSelectedStampId,
  onSelectedStampIdChange,
  selectedDrawingId: externalSelectedDrawingId,
  onSelectedDrawingIdChange,
}: VideoAnnotationSurfaceProps) {
  const activeUser = useActiveUser();
  const containerRef = useRef<HTMLDivElement>(null);
  const stampInteractionRef = useRef<StampPointerInteraction | null>(null);
  const drawingInteractionRef = useRef<DrawingPointerInteraction | null>(null);
  const drawingRef = useRef(false);
  const shapeInteractionRef = useRef<ShapePointerInteraction | null>(null);
  const erasingRef = useRef(false);
  const strokesRef = useRef(strokes);
  const currentPointsRef = useRef<PercentPoint[]>([]);
  const erasedThisGestureRef = useRef(false);
  const erasedRemainingAtTimestampRef = useRef<number | null>(null);
  const [currentVideoTime, setCurrentVideoTime] = useState(0);
  const [livePath, setLivePath] = useState('');
  const [liveStrokeStyle, setLiveStrokeStyle] = useState<{
    color: string;
    width: number;
    opacity: number;
    rainbow?: boolean;
  } | null>(null);
  const [shapeDraft, setShapeDraft] = useState<ShapeDraft | null>(null);
  const [internalSelectedShapeId, setInternalSelectedShapeId] = useState<string | null>(null);
  const selectedShapeId = externalSelectedShapeId !== undefined ? externalSelectedShapeId : internalSelectedShapeId;
  const setSelectedShapeId = (id: string | null) => {
    setInternalSelectedShapeId(id);
    onSelectedShapeIdChange?.(id);
  };
  const [shapeCursor, setShapeCursor] = useState('crosshair');
  const [internalSelectedStampId, setInternalSelectedStampId] = useState<string | null>(null);
  const selectedStampId = externalSelectedStampId !== undefined ? externalSelectedStampId : internalSelectedStampId;
  const setSelectedStampId = (id: string | null) => {
    setInternalSelectedStampId(id);
    onSelectedStampIdChange?.(id);
  };
  const [internalSelectedDrawingId, setInternalSelectedDrawingId] = useState<string | null>(null);
  const selectedDrawingId = externalSelectedDrawingId !== undefined ? externalSelectedDrawingId : internalSelectedDrawingId;
  const setSelectedDrawingId = (id: string | null) => {
    setInternalSelectedDrawingId(id);
    onSelectedDrawingIdChange?.(id);
  };
  const [stampCursor, setStampCursor] = useState('crosshair');
  const [panCursor, setPanCursor] = useState('default');

  const resolvedDrawColor = drawColor ? resolveDrawColor(drawColor) : cv.purpleLight;
  const isDrawRainbow = Boolean(drawColor?.gradient);
  const resolvedShapeColor = shapeColor ? resolveDrawColor(shapeColor) : palette.green;
  const isShapeRainbow = Boolean(shapeColor?.gradient);
  const shapeStrokeWidth = getStrokeWidth('pencil', shapeStroke);
  const isEraser = drawTool === 'eraser';

  const visibleStrokes = useMemo(
    () =>
      strokes.filter((stroke) =>
        isOverlayAnnotationVisible(
          getDrawingHistoryEntryId(stroke.id),
          stroke.videoTimestamp,
          currentVideoTime,
          resolvedOverlayEntryIds,
          stroke.endTimestamp,
        ),
      ),
    [strokes, currentVideoTime, resolvedOverlayEntryIds],
  );

  const visibleShapes = useMemo(
    () =>
      shapes.filter((shape) =>
        isOverlayAnnotationVisible(
          getShapeHistoryEntryId(shape.id),
          shape.videoTimestamp,
          currentVideoTime,
          resolvedOverlayEntryIds,
          shape.endTimestamp,
        ),
      ),
    [shapes, currentVideoTime, resolvedOverlayEntryIds],
  );

  const visibleStamps = useMemo(
    () =>
      stamps.filter((stamp) =>
        isOverlayAnnotationVisible(
          getStampHistoryEntryId(stamp.id),
          stamp.videoTimestamp,
          currentVideoTime,
          resolvedOverlayEntryIds,
          stamp.endTimestamp,
        ),
      ),
    [stamps, currentVideoTime, resolvedOverlayEntryIds],
  );

  useEffect(() => {
    const video = videoRef?.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentVideoTime(video.currentTime);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('seeked', handleTimeUpdate);
    handleTimeUpdate();

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('seeked', handleTimeUpdate);
    };
  }, [videoRef]);

  useEffect(() => {
    strokesRef.current = strokes;
  }, [strokes]);

  useEffect(() => {
    if (activeTool !== 'shape') {
      setSelectedShapeId(null);
      setShapeDraft(null);
      shapeInteractionRef.current = null;
      setShapeCursor('crosshair');
    }
  }, [activeTool]);

  useEffect(() => {
    if (activeTool !== 'stamp' && activeTool !== 'pan') {
      setSelectedStampId(null);
      stampInteractionRef.current = null;
      setStampCursor('crosshair');
    }
  }, [activeTool]);

  useEffect(() => {
    if (activeTool !== 'pan') {
      drawingInteractionRef.current = null;
      setPanCursor('default');
    }
  }, [activeTool]);

  const selectedShape = useMemo(
    () => visibleShapes.find((shape) => shape.id === selectedShapeId) ?? null,
    [selectedShapeId, visibleShapes],
  );

  const selectedShapeColor = useMemo(() => {
    if (!selectedShape) return DEFAULT_ANNOTATION_COLOR;

    return (
      annotationColors.find((color) => color.id === selectedShape.colorId) ?? {
        id: selectedShape.colorId,
        label: 'Color',
        value: selectedShape.color,
        gradient: selectedShape.rainbow,
      }
    );
  }, [selectedShape]);

  const selectedShapeStroke = useMemo(() => {
    if (!selectedShape) return shapeStroke;
    return getThicknessFromPencilWidth(selectedShape.strokeWidth);
  }, [selectedShape, shapeStroke]);

  const handleSelectedShapeColorChange = useCallback(
    (color: AnnotationColor) => {
      if (!selectedShapeId) return;

      onShapesChange(
        updateShapeById(shapes, selectedShapeId, {
          color: resolveDrawColor(color),
          colorId: color.id,
          rainbow: Boolean(color.gradient),
        }),
      );
    },
    [onShapesChange, selectedShapeId, shapes],
  );

  const handleSelectedShapeStrokeChange = useCallback(
    (thickness: number) => {
      if (!selectedShapeId) return;

      onShapesChange(
        updateShapeById(shapes, selectedShapeId, {
          strokeWidth: getStrokeWidth('pencil', thickness),
        }),
      );
    },
    [onShapesChange, selectedShapeId, shapes],
  );

  const handleDeleteSelectedShape = useCallback(() => {
    if (!selectedShapeId) return;

    const shapeToDelete = shapes.find((shape) => shape.id === selectedShapeId);
    if (!shapeToDelete) return;

    onAnnotationActionStart?.();
    onShapesChange(shapes.filter((shape) => shape.id !== selectedShapeId));
    onRecord({
      type: 'shape',
      summary: shapeSummary(shapeToDelete.type),
      videoTimestamp: shapeToDelete.videoTimestamp,
      shapeId: selectedShapeId,
      markShapeDeleted: true,
    });
    setSelectedShapeId(null);
  }, [onAnnotationActionStart, onRecord, onShapesChange, selectedShapeId, shapes]);

  const getVideoTimestamp = useCallback(() => {
    const video = containerRef.current
      ?.closest('[data-video-stage]')
      ?.querySelector('video');
    return video instanceof HTMLVideoElement ? video.currentTime : 0;
  }, []);

  const selectedStamp = useMemo(
    () => stamps.find((stamp) => stamp.id === selectedStampId) ?? null,
    [selectedStampId, stamps],
  );

  const placeStamp = useCallback(
    (point: PercentPoint) => {
      onAnnotationActionStart?.();
      const videoTimestamp = getVideoTimestamp();
      const stampInstanceId = crypto.randomUUID();
      const customEmoji = getStampEmoji(activeStamp, customStamp) ?? undefined;

      onStampsChange([
        ...stamps,
        {
          id: stampInstanceId,
          stampId: activeStamp,
          customEmoji,
          xPercent: point.xPercent,
          yPercent: point.yPercent,
          videoTimestamp,
          endTimestamp: createDefaultAnnotationEndTime(videoTimestamp),
          author: { name: activeUser.name, avatarUrl: activeUser.avatarUrl, initials: activeUser.initials },
        },
      ]);

      onRecord({
        type: 'stamp',
        summary: getStampSummary(activeStamp, customStamp, customEmoji),
        videoTimestamp,
        videoStampId: stampInstanceId,
      });
    },
    [activeStamp, customStamp, getVideoTimestamp, onAnnotationActionStart, onRecord, onStampsChange, stamps],
  );

  const handleDeleteSelectedStamp = useCallback(() => {
    if (!selectedStampId) return;

    const stampToDelete = stamps.find((stamp) => stamp.id === selectedStampId);
    if (!stampToDelete) return;

    onAnnotationActionStart?.();
    onStampsChange(stamps.filter((stamp) => stamp.id !== selectedStampId));
    onRecord({
      type: 'stamp',
      summary: getStampSummary(
        stampToDelete.stampId,
        customStamp,
        stampToDelete.customEmoji,
      ),
      videoTimestamp: stampToDelete.videoTimestamp,
      videoStampId: selectedStampId,
      markStampDeleted: true,
    });
    setSelectedStampId(null);
  }, [customStamp, onAnnotationActionStart, onRecord, onStampsChange, selectedStampId, stamps]);

  const selectedDrawing = useMemo(
    () => visibleStrokes.find((stroke) => stroke.id === selectedDrawingId) ?? null,
    [selectedDrawingId, visibleStrokes],
  );

  const handleDeleteSelectedDrawing = useCallback(() => {
    if (!selectedDrawingId) return;

    const strokeToDelete = visibleStrokes.find((stroke) => stroke.id === selectedDrawingId);
    if (!strokeToDelete) return;

    onAnnotationActionStart?.();
    onStrokesChange(strokes.filter((stroke) => stroke.id !== selectedDrawingId));
    onRecord({
      type: 'drawing',
      summary: 'Drawing erased',
      videoTimestamp: strokeToDelete.videoTimestamp,
      strokeId: selectedDrawingId,
      markDrawingErased: true,
    });
    setSelectedDrawingId(null);
  }, [onAnnotationActionStart, onRecord, onStrokesChange, selectedDrawingId, strokes, visibleStrokes]);

  const getPercentPoint = useCallback((event: React.PointerEvent | React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return null;

    return {
      xPercent: ((event.clientX - rect.left) / rect.width) * 100,
      yPercent: ((event.clientY - rect.top) / rect.height) * 100,
    };
  }, []);

  const updateLivePreview = useCallback(
    (points: PercentPoint[]) => {
      setLivePath(pointsToSvgPath(points));
      setLiveStrokeStyle({
        color: resolvedDrawColor,
        width: getStrokeWidth(drawTool, drawStroke),
        opacity: getStrokeOpacity(drawTool),
        rainbow: isDrawRainbow && !isEraser,
      });
    },
    [drawStroke, drawTool, isDrawRainbow, isEraser, resolvedDrawColor],
  );

  const eraseAtPoint = useCallback(
    (point: PercentPoint) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const eraserRadius = getStrokeWidth('eraser', drawStroke);
      const eraseTimestamp = getVideoTimestamp();
      const currentStrokes = strokesRef.current;

      const nextStrokes = currentStrokes.filter((stroke) => {
        if (!isAnnotationVisibleAtTime(stroke.videoTimestamp, eraseTimestamp, stroke.endTimestamp)) {
          return true;
        }

        if (stroke.author?.name !== activeUser.name) {
          return true;
        }

        return !strokeHitsEraser(
          stroke.points,
          point,
          eraserRadius,
          rect,
          stroke.width,
        );
      });

      if (nextStrokes.length !== currentStrokes.length) {
        erasedThisGestureRef.current = true;
        strokesRef.current = nextStrokes;
        onStrokesChange(nextStrokes);

        const timestampSecond = Math.floor(eraseTimestamp);
        erasedRemainingAtTimestampRef.current = nextStrokes.filter(
          (stroke) => Math.floor(stroke.videoTimestamp) === timestampSecond,
        ).length;
      }
    },
    [drawStroke, getVideoTimestamp, onStrokesChange, activeUser.name],
  );

  const finishStroke = useCallback(() => {
    if (currentPointsRef.current.length < 2) {
      currentPointsRef.current = [];
      setLivePath('');
      setLiveStrokeStyle(null);
      return;
    }

    const path = pointsToSvgPath(currentPointsRef.current);
    const activeDrawTool = drawTool === 'eraser' ? 'pencil' : drawTool;
    const videoTimestamp = getVideoTimestamp();
    const strokeId = crypto.randomUUID();
    const anchor = averagePercentPoints(currentPointsRef.current);

    onStrokesChange([
      ...strokes,
      {
        id: strokeId,
        points: path,
        tool: activeDrawTool,
        color: resolvedDrawColor,
        colorId: drawColor?.id ?? 'purple',
        width: getStrokeWidth(activeDrawTool, drawStroke),
        opacity: getStrokeOpacity(activeDrawTool),
        rainbow: isDrawRainbow,
        videoTimestamp,
        endTimestamp: createDefaultAnnotationEndTime(videoTimestamp),
        author: { name: activeUser.name, avatarUrl: activeUser.avatarUrl, initials: activeUser.initials },
      },
    ]);

    onRecord({
      type: 'drawing',
      summary: drawToolSummary(activeDrawTool),
      videoTimestamp,
      drawingId: strokeId,
    });

    onAnnotationNeedsComment?.({
      kind: 'drawing',
      id: strokeId,
      xPercent: anchor.xPercent,
      yPercent: anchor.yPercent,
      videoTimestamp,
    });

    currentPointsRef.current = [];
    setLivePath('');
    setLiveStrokeStyle(null);
  }, [
    drawColor?.id,
    drawStroke,
    drawTool,
    getVideoTimestamp,
    isDrawRainbow,
    onAnnotationNeedsComment,
    onRecord,
    onStrokesChange,
    resolvedDrawColor,
    strokes,
  ]);

  const finishShape = useCallback(() => {
    if (!shapeDraft) return;

    if (
      !shapeHasMinSize({
        x1: shapeDraft.x1Percent,
        y1: shapeDraft.y1Percent,
        x2: shapeDraft.x2Percent,
        y2: shapeDraft.y2Percent,
      })
    ) {
      setShapeDraft(null);
      return;
    }

    const videoTimestamp = getVideoTimestamp();
    const newShapeId = crypto.randomUUID();

    onShapesChange([
      ...shapes,
      {
        id: newShapeId,
        type: shapeTool,
        x1Percent: shapeDraft.x1Percent,
        y1Percent: shapeDraft.y1Percent,
        x2Percent: shapeDraft.x2Percent,
        y2Percent: shapeDraft.y2Percent,
        color: resolvedShapeColor,
        colorId: shapeColor?.id ?? 'green',
        strokeWidth: shapeStrokeWidth,
        videoTimestamp,
        endTimestamp: createDefaultAnnotationEndTime(videoTimestamp),
        rainbow: isShapeRainbow,
        author: { name: activeUser.name, avatarUrl: activeUser.avatarUrl, initials: activeUser.initials },
      },
    ]);

    onRecord({
      type: 'shape',
      summary: shapeSummary(shapeTool),
      videoTimestamp,
      shapeId: newShapeId,
    });

    onAnnotationNeedsComment?.({
      kind: 'shape',
      id: newShapeId,
      ...getShapeCentroid({
        x1Percent: shapeDraft.x1Percent,
        y1Percent: shapeDraft.y1Percent,
        x2Percent: shapeDraft.x2Percent,
        y2Percent: shapeDraft.y2Percent,
      }),
      videoTimestamp,
    });

    setSelectedShapeId(newShapeId);
    setShapeDraft(null);
    shapeInteractionRef.current = null;
  }, [
    getVideoTimestamp,
    isShapeRainbow,
    onAnnotationNeedsComment,
    onRecord,
    onShapesChange,
    resolvedShapeColor,
    shapeColor?.id,
    shapeDraft,
    shapeStrokeWidth,
    shapeTool,
    shapes,
  ]);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!enabled) return;

    const point = getPercentPoint(event);
    if (!point) return;

    if (activeTool === 'pan' || activeTool === 'select') {
      if ((event.target as HTMLElement).closest('[data-video-stamp]')) {
        return;
      }

      if ((event.target as HTMLElement).closest('[data-stamp-toolbar]')) {
        return;
      }

      if ((event.target as HTMLElement).closest('[data-shape-toolbar]')) {
        return;
      }

      if ((event.target as HTMLElement).closest('[data-drawing-toolbar]')) {
        return;
      }

      event.preventDefault();
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const hitShape = findTopShapeAtPoint(point, visibleShapes, rect);
      if (hitShape) {
        setSelectedShapeId(hitShape.id);
        setSelectedStampId(null);
        setInternalSelectedDrawingId(null);
        onAnnotationActionStart?.();
        shapeInteractionRef.current = {
          mode: 'move',
          shapeId: hitShape.id,
          startPointer: point,
          origin: hitShape,
        };
        setPanCursor('grabbing');
        event.currentTarget.setPointerCapture(event.pointerId);
        return;
      }

      const hitStroke = findTopStrokeAtPoint(point, visibleStrokes, rect);
      if (hitStroke) {
        setInternalSelectedDrawingId(hitStroke.id);
        setSelectedShapeId(null);
        setSelectedStampId(null);
        onAnnotationActionStart?.();
        drawingInteractionRef.current = {
          mode: 'move',
          strokeId: hitStroke.id,
          startPointer: point,
          originPoints: hitStroke.points,
        };
        setPanCursor('grabbing');
        event.currentTarget.setPointerCapture(event.pointerId);
        return;
      }

      // If we clicked on nothing, deselect everything
      setSelectedShapeId(null);
      setSelectedStampId(null);
      setInternalSelectedDrawingId(null);
      return;
    }

    if (activeTool === 'stamp') {
      if ((event.target as HTMLElement).closest('[data-video-stamp]')) {
        return;
      }

      if ((event.target as HTMLElement).closest('[data-stamp-toolbar]')) {
        return;
      }

      event.preventDefault();
      setSelectedStampId(null);
      placeStamp(point);
      return;
    }

    if (activeTool === 'shape') {
      event.preventDefault();

      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      if (selectedShape) {
        const resizeHandle = hitTestResizeHandle(
          point,
          shapeToBounds(selectedShape),
          rect,
        );

        if (resizeHandle) {
          shapeInteractionRef.current = {
            mode: 'resize',
            shapeId: selectedShape.id,
            handle: resizeHandle,
            origin: selectedShape,
          };
          setShapeCursor(getResizeCursor(resizeHandle));
          event.currentTarget.setPointerCapture(event.pointerId);
          return;
        }
      }

      const hitShape = findTopShapeAtPoint(point, visibleShapes, rect);

      if (hitShape) {
        setSelectedShapeId(hitShape.id);
        onAnnotationActionStart?.();
        shapeInteractionRef.current = {
          mode: 'move',
          shapeId: hitShape.id,
          startPointer: point,
          origin: hitShape,
        };
        setShapeCursor('grabbing');
        event.currentTarget.setPointerCapture(event.pointerId);
        return;
      }

      if (annotationCommentPending) return;

      setSelectedShapeId(null);
      onAnnotationActionStart?.();
      shapeInteractionRef.current = { mode: 'create' };
      setShapeDraft({
        x1Percent: point.xPercent,
        y1Percent: point.yPercent,
        x2Percent: point.xPercent,
        y2Percent: point.yPercent,
      });
      setShapeCursor('crosshair');
      event.currentTarget.setPointerCapture(event.pointerId);
      return;
    }

    if (activeTool !== 'draw') return;

    if (annotationCommentPending && drawTool !== 'eraser') return;

    event.preventDefault();

    if (isEraser) {
      onAnnotationActionStart?.();
      erasingRef.current = true;
      erasedThisGestureRef.current = false;
      erasedRemainingAtTimestampRef.current = null;
      eraseAtPoint(point);
      event.currentTarget.setPointerCapture(event.pointerId);
      return;
    }

    onAnnotationActionStart?.();
    drawingRef.current = true;
    const startPoint = normalizeDrawPoint(point, drawTool);
    currentPointsRef.current = [startPoint];
    updateLivePreview(currentPointsRef.current);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!enabled) return;

    const point = getPercentPoint(event);
    if (!point) return;

    if (activeTool === 'stamp' || activeTool === 'pan') {
      const interaction = stampInteractionRef.current;
      const rect = containerRef.current?.getBoundingClientRect();

      if (interaction?.mode === 'move') {
        const dx = point.xPercent - interaction.startPointer.xPercent;
        const dy = point.yPercent - interaction.startPointer.yPercent;

        onStampsChange(
          updateStampById(
            stamps,
            interaction.stampId,
            translateStamp(interaction.origin, dx, dy),
          ),
        );
        if (activeTool === 'pan') {
          setPanCursor('grabbing');
        }
        return;
      }

      if (activeTool === 'stamp') {
        if (rect && !interaction) {
          const hoverStamp = findTopStampAtPoint(point, visibleStamps, rect);
          setStampCursor(hoverStamp ? 'grab' : 'crosshair');
        }
        return;
      }
    }

    if (activeTool === 'pan') {
      const shapeInteraction = shapeInteractionRef.current;
      const drawingInteraction = drawingInteractionRef.current;
      const rect = containerRef.current?.getBoundingClientRect();

      if (shapeInteraction?.mode === 'move') {
        const dx = point.xPercent - shapeInteraction.startPointer.xPercent;
        const dy = point.yPercent - shapeInteraction.startPointer.yPercent;
        const translated = translateShape(shapeInteraction.origin, dx, dy);

        onShapesChange(
          updateShapeById(shapes, shapeInteraction.shapeId, translated),
        );

        onMoveLinkedComment?.({
          shapeId: shapeInteraction.shapeId,
          dx,
          dy,
        });

        setPanCursor('grabbing');
        return;
      }

      if (drawingInteraction?.mode === 'move') {
        const dx = point.xPercent - drawingInteraction.startPointer.xPercent;
        const dy = point.yPercent - drawingInteraction.startPointer.yPercent;
        const nextPoints = translateStrokePath(drawingInteraction.originPoints, dx, dy);

        onStrokesChange(
          strokes.map((stroke) =>
            stroke.id === drawingInteraction.strokeId
              ? { ...stroke, points: nextPoints }
              : stroke,
          ),
        );

        onMoveLinkedComment?.({
          strokeId: drawingInteraction.strokeId,
          dx,
          dy,
        });

        setPanCursor('grabbing');
        return;
      }

      if (rect) {
        const hoverStamp = findTopStampAtPoint(point, visibleStamps, rect);
        const hoverShape = findTopShapeAtPoint(point, visibleShapes, rect);
        const hoverStroke = findTopStrokeAtPoint(point, visibleStrokes, rect);
        setPanCursor(hoverStamp || hoverShape || hoverStroke ? 'grab' : 'default');
      }

      return;
    }

    if (activeTool === 'shape') {
      const interaction = shapeInteractionRef.current;
      const rect = containerRef.current?.getBoundingClientRect();

      if (interaction?.mode === 'move') {
        const dx = point.xPercent - interaction.startPointer.xPercent;
        const dy = point.yPercent - interaction.startPointer.yPercent;
        const translated = translateShape(interaction.origin, dx, dy);

        onShapesChange(
          updateShapeById(shapes, interaction.shapeId, translated),
        );

        onMoveLinkedComment?.({
          shapeId: interaction.shapeId,
          dx,
          dy,
        });

        return;
      }

      if (interaction?.mode === 'resize') {
        onShapesChange(
          updateShapeById(
            shapes,
            interaction.shapeId,
            resizeShapeWithHandle(interaction.origin, interaction.handle, point),
          ),
        );
        return;
      }

      if (interaction?.mode === 'create') {
        setShapeDraft((current) =>
          current
            ? {
                ...current,
                x2Percent: point.xPercent,
                y2Percent: point.yPercent,
              }
            : current,
        );
        return;
      }

      if (rect && !interaction) {
        if (selectedShape) {
          const resizeHandle = hitTestResizeHandle(
            point,
            shapeToBounds(selectedShape),
            rect,
          );

          if (resizeHandle) {
            setShapeCursor(getResizeCursor(resizeHandle));
            return;
          }
        }

        const hoverShape = findTopShapeAtPoint(point, visibleShapes, rect);
        setShapeCursor(hoverShape ? 'grab' : 'crosshair');
      }

      return;
    }

    if (activeTool !== 'draw') return;

    if (isEraser && erasingRef.current) {
      eraseAtPoint(point);
      return;
    }

    if (!drawingRef.current) return;

    const nextPoint = normalizeDrawPoint(point, drawTool);
    currentPointsRef.current = appendDrawPoint(
      currentPointsRef.current,
      nextPoint,
      drawTool,
    );
    updateLivePreview(currentPointsRef.current);
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!enabled) return;

    if (activeTool === 'stamp' || activeTool === 'pan') {
      const interaction = stampInteractionRef.current;

      if (interaction?.mode === 'move') {
        stampInteractionRef.current = null;
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
          event.currentTarget.releasePointerCapture(event.pointerId);
        }
        if (activeTool === 'pan') {
          setPanCursor('grab');
        } else {
          setStampCursor('grab');
        }
        return;
      }
    }

    if (activeTool === 'shape' || activeTool === 'pan') {
      const interaction = shapeInteractionRef.current;

      if (interaction?.mode === 'move') {
        shapeInteractionRef.current = null;
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
          event.currentTarget.releasePointerCapture(event.pointerId);
        }
        if (activeTool === 'pan') {
          setPanCursor('grab');
        } else {
          setShapeCursor('grab');
        }
        return;
      }

      if (activeTool === 'shape' && interaction?.mode === 'resize') {
        shapeInteractionRef.current = null;
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
          event.currentTarget.releasePointerCapture(event.pointerId);
        }
        setShapeCursor('grab');
        return;
      }

      if (activeTool === 'shape' && interaction?.mode === 'create') {
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
          event.currentTarget.releasePointerCapture(event.pointerId);
        }
        finishShape();
        return;
      }
    }

    if (activeTool === 'pan') {
      const drawingInteraction = drawingInteractionRef.current;

      if (drawingInteraction?.mode === 'move') {
        drawingInteractionRef.current = null;
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
          event.currentTarget.releasePointerCapture(event.pointerId);
        }
        setPanCursor('grab');
        return;
      }
    }

    if (activeTool !== 'draw') return;

    if (isEraser && erasingRef.current) {
      erasingRef.current = false;
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }

      if (
        erasedThisGestureRef.current &&
        erasedRemainingAtTimestampRef.current === 0
      ) {
        onRecord({
          type: 'drawing',
          summary: 'Drawing added',
          videoTimestamp: getVideoTimestamp(),
          markDrawingErased: true,
        });
      }
      return;
    }

    if (!drawingRef.current) return;

    drawingRef.current = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    finishStroke();
  };

  const interactive =
    annotationsVisible &&
    enabled &&
    ['draw', 'shape', 'stamp', 'pan'].includes(activeTool);

  const showGridOverlay =
    annotationsVisible && activeTool === 'draw' && drawTool === 'grid';

  return (
    <Box
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      sx={{
        position: 'absolute',
        inset: 0,
        zIndex: 3,
        pointerEvents: interactive ? 'auto' : 'none',
        cursor:
          activeTool === 'draw'
            ? isEraser
              ? 'cell'
              : 'crosshair'
            : activeTool === 'shape'
              ? shapeCursor
              : activeTool === 'stamp'
                ? stampCursor
                : activeTool === 'pan'
                  ? panCursor
                  : 'default',
        touchAction:
          activeTool === 'draw' ||
          activeTool === 'shape' ||
          activeTool === 'stamp' ||
          activeTool === 'pan'
            ? 'none'
            : 'auto',
      }}
    >
      {annotationsVisible ? (
      <Box
        component="svg"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        sx={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
        }}
      >
        <defs>
          <linearGradient id="draw-rainbow-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={cv.rainbowRed} />
            <stop offset="20%" stopColor={cv.rainbowYellow} />
            <stop offset="40%" stopColor={cv.rainbowGreen} />
            <stop offset="60%" stopColor={cv.rainbowBlue} />
            <stop offset="80%" stopColor={cv.rainbowPurple} />
            <stop offset="100%" stopColor={cv.rainbowRed} />
          </linearGradient>
          <marker
            id="shape-arrowhead"
            markerWidth="6"
            markerHeight="6"
            refX="5"
            refY="3"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path d="M0,0 L0,6 L6,3 z" fill="context-stroke" />
          </marker>
        </defs>

        {showGridOverlay &&
          Array.from({ length: GRID_LINE_COUNT + 1 }, (_, index) => {
            const position = (index / GRID_LINE_COUNT) * 100;
            return (
              <g key={`grid-${index}`}>
                <line
                  x1={position}
                  y1={0}
                  x2={position}
                  y2={100}
                  stroke={cv.annotationGuide}
                  strokeWidth={0.15}
                  vectorEffect="non-scaling-stroke"
                />
                <line
                  x1={0}
                  y1={position}
                  x2={100}
                  y2={position}
                  stroke={cv.annotationGuide}
                  strokeWidth={0.15}
                  vectorEffect="non-scaling-stroke"
                />
              </g>
            );
          })}

        {visibleStrokes.map((stroke) => (
          <StrokePath key={stroke.id} stroke={stroke} />
        ))}

        {visibleShapes.map((shape) => (
          <ShapeGraphic
            key={shape.id}
            type={shape.type}
            x1={shape.x1Percent}
            y1={shape.y1Percent}
            x2={shape.x2Percent}
            y2={shape.y2Percent}
            color={shape.color}
            strokeWidth={shape.strokeWidth}
            rainbow={shape.rainbow}
          />
        ))}

        {shapeDraft ? (
          <ShapeGraphic
            type={shapeTool}
            x1={shapeDraft.x1Percent}
            y1={shapeDraft.y1Percent}
            x2={shapeDraft.x2Percent}
            y2={shapeDraft.y2Percent}
            color={resolvedShapeColor}
            strokeWidth={shapeStrokeWidth}
            rainbow={isShapeRainbow}
          />
        ) : null}

        {livePath && liveStrokeStyle ? (
          liveStrokeStyle.rainbow ? (
            <path
              d={livePath}
              fill="none"
              stroke="url(#draw-rainbow-gradient)"
              strokeWidth={liveStrokeStyle.width}
              strokeOpacity={liveStrokeStyle.opacity}
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          ) : (
            <path
              d={livePath}
              fill="none"
              stroke={liveStrokeStyle.color}
              strokeWidth={liveStrokeStyle.width}
              strokeOpacity={liveStrokeStyle.opacity}
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          )
        ) : null}
      </Box>
      ) : null}

      {annotationsVisible && selectedShape && (activeTool === 'shape' || activeTool === 'select' || activeTool === 'pan') ? (
        <SelectedShapeToolbar
          bounds={shapeToBounds(selectedShape)}
          activeColor={selectedShapeColor}
          activeStroke={selectedShapeStroke}
          onColorChange={handleSelectedShapeColorChange}
          onStrokeChange={handleSelectedShapeStrokeChange}
          onDelete={selectedShape.author?.name === activeUser.name ? handleDeleteSelectedShape : undefined}
        />
      ) : null}

      {annotationsVisible && visibleStamps.map((stamp) => (
        <StampMarker
          key={stamp.id}
          stamp={stamp}
          selected={selectedStampId === stamp.id}
          interactive={activeTool === 'stamp' || activeTool === 'pan' || activeTool === 'select'}
          onSelect={() => setSelectedStampId(stamp.id)}
          onPointerDown={(event) => {
            const point = getPercentPoint(event);
            if (!point) return;

            if (activeTool === 'pan') {
              onAnnotationActionStart?.();
            }

            setSelectedStampId(stamp.id);
            stampInteractionRef.current = {
              mode: 'move',
              stampId: stamp.id,
              startPointer: point,
              origin: stamp,
            };
            if (activeTool === 'pan') {
              setPanCursor('grabbing');
            } else {
              setStampCursor('grabbing');
            }
            containerRef.current?.setPointerCapture(event.pointerId);
          }}
        />
      ))}

      {annotationsVisible && selectedStamp && activeTool === 'stamp' ? (
        <SelectedStampToolbar
          xPercent={selectedStamp.xPercent}
          yPercent={selectedStamp.yPercent}
          onDelete={selectedStamp.author?.name === activeUser.name ? handleDeleteSelectedStamp : undefined}
        />
      ) : null}

      {annotationsVisible && selectedDrawing && (activeTool === 'draw' || activeTool === 'select' || activeTool === 'pan') ? (
        <SelectedDrawingToolbar
          stroke={selectedDrawing}
          onDelete={selectedDrawing.author?.name === activeUser.name ? handleDeleteSelectedDrawing : undefined}
        />
      ) : null}

    </Box>
  );
}

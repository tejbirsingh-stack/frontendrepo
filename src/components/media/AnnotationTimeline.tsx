import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { cv, palette } from '../../theme/cssVars';
import { Box, Typography } from '@mui/material';
import ChatBubbleOutlineOutlinedIcon from '@mui/icons-material/ChatBubbleOutlineOutlined';
import DrawOutlinedIcon from '@mui/icons-material/DrawOutlined';
import InterestsOutlinedIcon from '@mui/icons-material/InterestsOutlined';
import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined';
import type {
  TimelineAnnotationItem,
  TimelineAnnotationType,
} from '../../types/annotationTimeline';
import {
  clampAnnotationRange,
  getEffectiveTimelineDuration,
} from '../../utils/annotationTimeRange';
import { assignTimelineLanes } from '../../utils/timelineLaneLayout';
import {
  applyTimelineZoomDelta,
  clampTimelineZoom,
  formatTimelineZoomLabel,
  isTimelineZoomed,
  stepTimelineZoom,
  TIMELINE_ZOOM_DEFAULT,
  timelineZoomShortcuts,
} from '../../utils/timelineZoom';
import { formatVideoTimestamp } from '../../utils/formatVideoTimestamp';
import {
  shouldBlockAnnotationShortcuts,
} from '../../constants/annotationShortcuts';
import { useResolvedKeyboardShortcuts } from '../../hooks/useResolvedKeyboardShortcuts';
import { matchesKeyboardShortcut } from '../../utils/matchKeyboardShortcut';

const LANE_HEIGHT = 20;
const LANE_GAP = 2;
const TRACK_PADDING_Y = 4;
const TRACK_LABEL_WIDTH = 76;
const VIDEO_TRACK_HEIGHT = 16;
const PLAYHEAD_MARKER_SIZE = 7;
const HANDLE_WIDTH = 8;
const MIN_SEGMENT_PX = 14;
const MAX_VISIBLE_LANES = 3;
const RULER_HEIGHT = 16;
const MAX_TIMELINE_EXPANDED_HEIGHT = 200;
const SEGMENT_CLICK_MOVE_THRESHOLD_PX = 5;

const TRACKS: {
  type: TimelineAnnotationType;
  label: string;
  color: string;
  Icon: typeof ChatBubbleOutlineOutlinedIcon;
}[] = [
  { type: 'comment', label: 'Comments', color: palette.pink, Icon: ChatBubbleOutlineOutlinedIcon },
  { type: 'drawing', label: 'Drawings', color: cv.brandPurple, Icon: DrawOutlinedIcon },
  { type: 'shape', label: 'Shapes', color: palette.blue, Icon: InterestsOutlinedIcon },
  { type: 'stamp', label: 'Stamps', color: palette.orange, Icon: LocalOfferOutlinedIcon },
];

type SegmentInteractionKind = 'resize-start' | 'resize-end' | 'move';

type SegmentInteraction = {
  kind: SegmentInteractionKind;
  itemId: string;
  itemType: TimelineAnnotationType;
  pointerId: number;
  startTime: number;
  endTime: number;
  originX: number;
  originY: number;
  activated: boolean;
};

type DragMode =
  | {
      kind: SegmentInteractionKind;
      itemId: string;
      itemType: TimelineAnnotationType;
      pointerId: number;
      startTime: number;
      endTime: number;
      originX: number;
    }
  | {
      kind: 'scrub';
      pointerId: number;
    };

interface AnnotationTimelineProps {
  duration: number;
  currentTime: number;
  items: TimelineAnnotationItem[];
  onSeek: (time: number) => void;
  onRangeChange?: (
    id: string,
    type: TimelineAnnotationType,
    startTime: number,
    endTime: number,
  ) => void;
  onScrubStart?: () => void;
  onScrubEnd?: () => void;
  fallbackDuration?: number;
  onAnnotationClick?: (id: string, type: TimelineAnnotationType) => void;
  inPoint?: number | null;
  outPoint?: number | null;
  rangeEnabled?: boolean;
}

function getTickStep(duration: number, zoom: number): number {
  const visibleDuration = duration / zoom;
  if (visibleDuration <= 12) return 1;
  if (visibleDuration <= 30) return 2;
  if (visibleDuration <= 90) return 5;
  if (visibleDuration <= 300) return 10;
  return 30;
}

function timeToPercent(time: number, duration: number): number {
  if (duration <= 0) return 0;
  return Math.max(0, Math.min(100, (time / duration) * 100));
}

function buildTimelineTicks(duration: number, step: number): number[] {
  if (duration <= 0) return [0];

  const values: number[] = [0];
  let time = step;

  while (time < duration - step * 0.001) {
    values.push(time);
    time += step;
  }

  const last = values[values.length - 1];
  if (Math.abs(last - duration) > 0.001) {
    values.push(duration);
  }

  return values.filter((tick, index, allTicks) => {
    if (index === 0) return true;

    const previous = allTicks[index - 1];
    const sameLabel = formatVideoTimestamp(tick) === formatVideoTimestamp(previous);
    const samePosition =
      Math.abs(timeToPercent(tick, duration) - timeToPercent(previous, duration)) < 1.5;

    return !(sameLabel && samePosition);
  });
}

function getRulerTickTransform(index: number, total: number): string {
  if (index === 0) return 'translateX(0)';
  if (index === total - 1) return 'translateX(-100%)';
  return 'translateX(-50%)';
}

function getTrackBodyHeight(laneCount: number): {
  contentHeight: number;
  visibleHeight: number;
  scrollable: boolean;
} {
  const contentHeight =
    laneCount * LANE_HEIGHT + Math.max(0, laneCount - 1) * LANE_GAP + TRACK_PADDING_Y * 2;
  const maxVisibleHeight =
    MAX_VISIBLE_LANES * LANE_HEIGHT +
    Math.max(0, MAX_VISIBLE_LANES - 1) * LANE_GAP +
    TRACK_PADDING_Y * 2;
  const scrollable = laneCount > MAX_VISIBLE_LANES;

  return {
    contentHeight,
    visibleHeight: scrollable ? maxVisibleHeight : contentHeight,
    scrollable,
  };
}

export default function AnnotationTimeline({
  duration,
  currentTime,
  items,
  onSeek,
  onRangeChange,
  onScrubStart,
  onScrubEnd,
  fallbackDuration,
  onAnnotationClick,
  inPoint,
  outPoint,
  rangeEnabled,
}: AnnotationTimelineProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const horizontalScrollRef = useRef<HTMLDivElement>(null);
  const contentInnerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragMode | null>(null);
  const segmentInteractionRef = useRef<SegmentInteraction | null>(null);
  const isPointerOverRef = useRef(false);
  const timelineZoomRef = useRef(TIMELINE_ZOOM_DEFAULT);
  const pendingScrollLeftRef = useRef<number | null>(null);
  const wheelDeltaRef = useRef(0);
  const wheelAnchorXRef = useRef(0);
  const wheelFrameRef = useRef<number | null>(null);
  const gestureStartZoomRef = useRef(TIMELINE_ZOOM_DEFAULT);
  const lastPointerXRef = useRef(0);
  const [dragPreview, setDragPreview] = useState<{
    id: string;
    startTime: number;
    endTime: number;
  } | null>(null);
  const [timelineZoom, setTimelineZoom] = useState(TIMELINE_ZOOM_DEFAULT);
  const { getShortcut } = useResolvedKeyboardShortcuts();
  const timelineZoomInShortcut = getShortcut('timeline-zoom-in') ?? timelineZoomShortcuts.in;
  const timelineZoomOutShortcut = getShortcut('timeline-zoom-out') ?? timelineZoomShortcuts.out;

  useEffect(() => {
    timelineZoomRef.current = timelineZoom;
  }, [timelineZoom]);

  useLayoutEffect(() => {
    const scrollEl = horizontalScrollRef.current;
    if (scrollEl && pendingScrollLeftRef.current != null) {
      scrollEl.scrollLeft = pendingScrollLeftRef.current;
      pendingScrollLeftRef.current = null;
    }
  }, [timelineZoom]);

  const hasAnnotations = items.length > 0;
  const isZoomed = isTimelineZoomed(timelineZoom);
  const safeDuration = getEffectiveTimelineDuration(duration, items, fallbackDuration);
  const playheadPercent = timeToPercent(currentTime, safeDuration);
  const tickStep = getTickStep(safeDuration, timelineZoom);

  const ticks = useMemo(
    () => buildTimelineTicks(safeDuration, tickStep),
    [safeDuration, tickStep],
  );

  const itemsByTrack = useMemo(() => {
    const grouped: Record<TimelineAnnotationType, TimelineAnnotationItem[]> = {
      comment: [],
      drawing: [],
      shape: [],
      stamp: [],
    };

    items.forEach((item) => {
      grouped[item.type].push(item);
    });

    return grouped;
  }, [items]);

  const activeTracks = useMemo(
    () => TRACKS.filter((track) => itemsByTrack[track.type].length > 0),
    [itemsByTrack],
  );

  const laneLayouts = useMemo(() => {
    const layouts: Record<TimelineAnnotationType, ReturnType<typeof assignTimelineLanes>> = {
      comment: assignTimelineLanes(itemsByTrack.comment),
      drawing: assignTimelineLanes(itemsByTrack.drawing),
      shape: assignTimelineLanes(itemsByTrack.shape),
      stamp: assignTimelineLanes(itemsByTrack.stamp),
    };
    return layouts;
  }, [itemsByTrack]);

  const getTimeFromClientX = useCallback(
    (clientX: number) => {
      const scrollEl = horizontalScrollRef.current;
      const innerEl = contentInnerRef.current;
      if (!scrollEl || !innerEl || innerEl.clientWidth <= 0) return 0;

      const rect = scrollEl.getBoundingClientRect();
      const x = clientX - rect.left + scrollEl.scrollLeft;
      const time = (x / innerEl.clientWidth) * safeDuration;
      return Math.max(0, Math.min(safeDuration, time));
    },
    [safeDuration],
  );

  const applyZoomLevel = useCallback((nextZoom: number, anchorClientX?: number) => {
    const currentZoom = timelineZoomRef.current;
    if (nextZoom === currentZoom) return;

    const scrollEl = horizontalScrollRef.current;
    const innerEl = contentInnerRef.current;

    if (scrollEl && innerEl && anchorClientX != null && innerEl.clientWidth > 0) {
      const rect = scrollEl.getBoundingClientRect();
      const pointerOffset = anchorClientX - rect.left + scrollEl.scrollLeft;
      const pointerRatio = pointerOffset / innerEl.clientWidth;
      const nextInnerWidth = scrollEl.clientWidth * nextZoom;
      pendingScrollLeftRef.current = Math.max(
        0,
        pointerRatio * nextInnerWidth - (anchorClientX - rect.left),
      );
    } else {
      pendingScrollLeftRef.current = null;
    }

    timelineZoomRef.current = nextZoom;
    setTimelineZoom(nextZoom);
  }, []);

  const applyDiscreteZoom = useCallback(
    (direction: 'in' | 'out', anchorClientX?: number) => {
      const nextZoom = stepTimelineZoom(timelineZoomRef.current, direction);
      applyZoomLevel(nextZoom, anchorClientX);
    },
    [applyZoomLevel],
  );

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const flushWheelZoom = () => {
      wheelFrameRef.current = null;
      const delta = wheelDeltaRef.current;
      wheelDeltaRef.current = 0;
      if (Math.abs(delta) < 0.25) return;

      const nextZoom = applyTimelineZoomDelta(timelineZoomRef.current, delta);
      applyZoomLevel(nextZoom, wheelAnchorXRef.current);
    };

    const isTimelineWheelTarget = (target: EventTarget | null) =>
      target instanceof Node && root.contains(target);

    const onWheel = (event: WheelEvent) => {
      if (!event.ctrlKey && !event.metaKey) return;
      if (!isTimelineWheelTarget(event.target)) return;

      event.preventDefault();
      event.stopImmediatePropagation();

      let deltaY = event.deltaY;
      if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) {
        deltaY *= 16;
      } else if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) {
        deltaY *= window.innerHeight;
      }

      wheelDeltaRef.current += deltaY;
      wheelAnchorXRef.current = event.clientX;
      lastPointerXRef.current = event.clientX;

      if (wheelFrameRef.current == null) {
        wheelFrameRef.current = requestAnimationFrame(flushWheelZoom);
      }
    };

    const onGestureStart = (event: Event) => {
      if (!isTimelineWheelTarget(event.target)) return;
      event.preventDefault();
      gestureStartZoomRef.current = timelineZoomRef.current;
    };

    const onGestureChange = (event: Event) => {
      if (!isTimelineWheelTarget(event.target)) return;
      event.preventDefault();
      const gesture = event as Event & { scale?: number };
      if (!gesture.scale) return;

      const anchorX =
        lastPointerXRef.current ||
        root.getBoundingClientRect().left + root.clientWidth / 2;
      const nextZoom = clampTimelineZoom(gestureStartZoomRef.current * gesture.scale);
      applyZoomLevel(nextZoom, anchorX);
    };

    const onGestureEnd = (event: Event) => {
      if (!isTimelineWheelTarget(event.target)) return;
      event.preventDefault();
    };

    const gestureTargets = [root, horizontalScrollRef.current].filter(
      (element): element is HTMLDivElement => element != null,
    );

    root.addEventListener('wheel', onWheel, { passive: false, capture: true });
    gestureTargets.forEach((target) => {
      target.addEventListener('gesturestart', onGestureStart, { passive: false });
      target.addEventListener('gesturechange', onGestureChange, { passive: false });
      target.addEventListener('gestureend', onGestureEnd, { passive: false });
    });

    return () => {
      root.removeEventListener('wheel', onWheel, { capture: true });
      gestureTargets.forEach((target) => {
        target.removeEventListener('gesturestart', onGestureStart);
        target.removeEventListener('gesturechange', onGestureChange);
        target.removeEventListener('gestureend', onGestureEnd);
      });
      if (wheelFrameRef.current != null) {
        cancelAnimationFrame(wheelFrameRef.current);
      }
    };
  }, [applyZoomLevel]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isPointerOverRef.current) return;
      if (shouldBlockAnnotationShortcuts(event.target)) return;

      if (matchesKeyboardShortcut(event, timelineZoomInShortcut)) {
        event.preventDefault();
        event.stopPropagation();
        applyDiscreteZoom('in', lastPointerXRef.current || undefined);
        return;
      }

      if (matchesKeyboardShortcut(event, timelineZoomOutShortcut)) {
        event.preventDefault();
        event.stopPropagation();
        applyDiscreteZoom('out', lastPointerXRef.current || undefined);
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [applyDiscreteZoom, timelineZoomInShortcut, timelineZoomOutShortcut]);

  useEffect(() => {
    if (!isZoomed) return;

    const scrollEl = horizontalScrollRef.current;
    const innerEl = contentInnerRef.current;
    if (!scrollEl || !innerEl) return;

    const playheadX = (currentTime / safeDuration) * innerEl.clientWidth;
    const margin = 56;
    const viewStart = scrollEl.scrollLeft;
    const viewEnd = viewStart + scrollEl.clientWidth;

    if (playheadX < viewStart + margin) {
      scrollEl.scrollLeft = Math.max(0, playheadX - margin);
    } else if (playheadX > viewEnd - margin) {
      scrollEl.scrollLeft = playheadX - scrollEl.clientWidth + margin;
    }
  }, [currentTime, isZoomed, safeDuration]);

  useEffect(() => {
    if (!hasAnnotations && timelineZoom !== TIMELINE_ZOOM_DEFAULT) {
      setTimelineZoom(TIMELINE_ZOOM_DEFAULT);
    }
  }, [hasAnnotations, timelineZoom]);

  const activateSegmentDrag = useCallback(
    (interaction: SegmentInteraction) => {
      onScrubStart?.();
      dragRef.current = {
        kind: interaction.kind,
        itemId: interaction.itemId,
        itemType: interaction.itemType,
        pointerId: interaction.pointerId,
        startTime: interaction.startTime,
        endTime: interaction.endTime,
        originX: interaction.originX,
      };
      setDragPreview({
        id: interaction.itemId,
        startTime: interaction.startTime,
        endTime: interaction.endTime,
      });
      interaction.activated = true;
    },
    [onScrubStart],
  );

  const finishDrag = useCallback(() => {
    const pendingInteraction = segmentInteractionRef.current;

    if (pendingInteraction && !pendingInteraction.activated) {
      if (pendingInteraction.kind === 'move') {
        onSeek(pendingInteraction.startTime);
        onAnnotationClick?.(pendingInteraction.itemId, pendingInteraction.itemType);
      } else if (pendingInteraction.kind === 'resize-start') {
        onSeek(pendingInteraction.startTime);
      } else {
        onSeek(pendingInteraction.endTime);
      }

      segmentInteractionRef.current = null;
      return;
    }

    const drag = dragRef.current;
    if (
      drag &&
      drag.kind !== 'scrub' &&
      dragPreview &&
      onRangeChange &&
      (dragPreview.startTime !== drag.startTime || dragPreview.endTime !== drag.endTime)
    ) {
      onRangeChange(drag.itemId, drag.itemType, dragPreview.startTime, dragPreview.endTime);
    }

    dragRef.current = null;
    segmentInteractionRef.current = null;
    setDragPreview(null);
    onScrubEnd?.();
  }, [dragPreview, getTimeFromClientX, onRangeChange, onScrubEnd, onSeek, onAnnotationClick]);

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      const pendingInteraction = segmentInteractionRef.current;
      if (pendingInteraction && event.pointerId === pendingInteraction.pointerId) {
        if (!pendingInteraction.activated) {
          const deltaX = event.clientX - pendingInteraction.originX;
          const deltaY = event.clientY - pendingInteraction.originY;
          const threshold =
            pendingInteraction.kind === 'move'
              ? SEGMENT_CLICK_MOVE_THRESHOLD_PX
              : SEGMENT_CLICK_MOVE_THRESHOLD_PX / 2;

          if (Math.hypot(deltaX, deltaY) >= threshold) {
            activateSegmentDrag(pendingInteraction);
          }
        }
      }

      const drag = dragRef.current;
      if (!drag || event.pointerId !== drag.pointerId) return;

      if (drag.kind === 'scrub') {
        onSeek(getTimeFromClientX(event.clientX));
        return;
      }

      const pointerTime = getTimeFromClientX(event.clientX);
      let nextStart = drag.startTime;
      let nextEnd = drag.endTime;

      if (drag.kind === 'resize-start') {
        nextStart = pointerTime;
      } else if (drag.kind === 'resize-end') {
        nextEnd = pointerTime;
      } else {
        const originTime = getTimeFromClientX(drag.originX);
        const deltaTime = pointerTime - originTime;
        nextStart = drag.startTime + deltaTime;
        nextEnd = drag.endTime + deltaTime;
      }

      const clamped = clampAnnotationRange(nextStart, nextEnd, safeDuration);
      setDragPreview({
        id: drag.itemId,
        startTime: clamped.startTime,
        endTime: clamped.endTime,
      });
    };

    const handlePointerUp = (event: PointerEvent) => {
      const pendingInteraction = segmentInteractionRef.current;
      const drag = dragRef.current;

      if (
        pendingInteraction &&
        event.pointerId === pendingInteraction.pointerId &&
        (!drag || drag.pointerId === event.pointerId)
      ) {
        finishDrag();
        return;
      }

      if (!drag || event.pointerId !== drag.pointerId) return;
      finishDrag();
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [activateSegmentDrag, finishDrag, getTimeFromClientX, onSeek, safeDuration]);

  const handleTimelineSeek = (event: React.PointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest('[data-timeline-segment]')) return;
    onScrubStart?.();
    dragRef.current = { kind: 'scrub', pointerId: event.pointerId };
    onSeek(getTimeFromClientX(event.clientX));
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const startSegmentInteraction = (
    event: React.PointerEvent<HTMLElement>,
    item: TimelineAnnotationItem,
    kind: SegmentInteractionKind,
  ) => {
    event.stopPropagation();
    segmentInteractionRef.current = {
      kind,
      itemId: item.id,
      itemType: item.type,
      pointerId: event.pointerId,
      startTime: item.startTime,
      endTime: item.endTime,
      originX: event.clientX,
      originY: event.clientY,
      activated: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const renderSegment = (
    item: TimelineAnnotationItem,
    trackColor: string,
    laneIndex: number,
    Icon: typeof ChatBubbleOutlineOutlinedIcon,
  ) => {
    const preview =
      dragPreview?.id === item.id
        ? dragPreview
        : { startTime: item.startTime, endTime: item.endTime };
    const innerWidth = contentInnerRef.current?.clientWidth || 320;
    const left = timeToPercent(preview.startTime, safeDuration);
    const endPercent = timeToPercent(preview.endTime, safeDuration);
    const minWidthPercent = (MIN_SEGMENT_PX / innerWidth) * 100;
    const width = Math.max(Math.min(endPercent - left, 100 - left), minWidthPercent);
    const top = TRACK_PADDING_Y + laneIndex * (LANE_HEIGHT + LANE_GAP);

    return (
      <Box
        key={item.id}
        data-timeline-segment
        title={`${item.label} (${formatVideoTimestamp(preview.startTime)} – ${formatVideoTimestamp(preview.endTime)}). Click to seek, drag to move.`}
        sx={{
          position: 'absolute',
          top,
          left: `${left}%`,
          width: `${width}%`,
          minWidth: MIN_SEGMENT_PX,
          height: LANE_HEIGHT,
          borderRadius: '6px',
          backgroundColor: `${trackColor}33`,
          border: `1px solid ${trackColor}`,
          boxShadow: `inset 0 0 0 1px ${trackColor}55`,
          display: 'flex',
          alignItems: 'center',
          overflow: 'hidden',
          cursor: 'pointer',
          touchAction: 'none',
          zIndex: 2,
          '&:active': { cursor: 'grabbing' },
        }}
        onPointerDown={(event) => startSegmentInteraction(event, item, 'move')}
      >
        <Box
          role="separator"
          aria-orientation="vertical"
          aria-label={`Adjust start time for ${item.label}`}
          onPointerDown={(event) => startSegmentInteraction(event, item, 'resize-start')}
          sx={{
            width: HANDLE_WIDTH,
            alignSelf: 'stretch',
            flexShrink: 0,
            cursor: 'ew-resize',
            backgroundColor: `${trackColor}88`,
            borderRight: `1px solid ${trackColor}`,
          }}
        />
        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 0.35,
            px: 0.5,
          }}
        >
          <Icon sx={{ fontSize: 11, color: trackColor, flexShrink: 0 }} />
          <Typography
            noWrap
            sx={{
              fontSize: '0.625rem',
              fontWeight: 600,
              lineHeight: 1,
              color: cv.textPrimary,
            }}
          >
            {item.label}
          </Typography>
        </Box>
        <Box
          role="separator"
          aria-orientation="vertical"
          aria-label={`Adjust end time for ${item.label}`}
          onPointerDown={(event) => startSegmentInteraction(event, item, 'resize-end')}
          sx={{
            width: HANDLE_WIDTH,
            alignSelf: 'stretch',
            flexShrink: 0,
            cursor: 'ew-resize',
            backgroundColor: `${trackColor}88`,
            borderLeft: `1px solid ${trackColor}`,
          }}
        />
      </Box>
    );
  };

  const innerContentHeight = useMemo(() => {
    let height = VIDEO_TRACK_HEIGHT;
    if (hasAnnotations) {
      height += RULER_HEIGHT;
      height += activeTracks.reduce((total, track) => {
        const { visibleHeight } = getTrackBodyHeight(laneLayouts[track.type].laneCount);
        return total + visibleHeight;
      }, 0);
    }
    return height;
  }, [activeTracks, hasAnnotations, laneLayouts]);

  const footerHint = hasAnnotations
    ? isZoomed
      ? `Timeline ${formatTimelineZoomLabel(timelineZoom)} · scroll horizontally`
      : `Pinch or ${timelineZoomShortcuts.in}/${timelineZoomShortcuts.out} over timeline to zoom`
    : isZoomed
      ? `Timeline ${formatTimelineZoomLabel(timelineZoom)} · scroll horizontally`
      : `Pinch or ${timelineZoomShortcuts.in}/${timelineZoomShortcuts.out} to zoom timeline`;

  return (
    <Box
      ref={rootRef}
      onClick={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
      onMouseEnter={() => {
        isPointerOverRef.current = true;
      }}
      onMouseLeave={() => {
        isPointerOverRef.current = false;
      }}
      onPointerMove={(event) => {
        lastPointerXRef.current = event.clientX;
      }}
      sx={{
        borderTop: "1px solid var(--noah-border)",
        background: 'var(--noah-footer-tint)',
        px: { xs: 1.25, md: 2 },
        py: hasAnnotations ? 0.75 : 0.5,
        transition: 'padding 0.2s ease',
        overscrollBehavior: 'contain',
        touchAction: 'pan-x',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          borderRadius: '10px',
          border: "1px solid var(--noah-border)",
          backgroundColor: cv.inkOverlay28,
          maxHeight: hasAnnotations ? MAX_TIMELINE_EXPANDED_HEIGHT : undefined,
          overflowX: 'hidden',
          overflowY: hasAnnotations ? 'auto' : 'hidden',
        }}
      >
        {hasAnnotations ? (
          <Box
            sx={{
              width: TRACK_LABEL_WIDTH,
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column',
              borderRight: `1px solid ${cv.dividerSubtle}`,
              backgroundColor: cv.surfaceSubtle,
            }}
          >
            <Box sx={{ height: RULER_HEIGHT, flexShrink: 0 }} />
            {activeTracks.map((track) => {
              const { visibleHeight } = getTrackBodyHeight(laneLayouts[track.type].laneCount);
              const Icon = track.Icon;
              return (
                <Box
                  key={track.type}
                  sx={{
                    height: visibleHeight,
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 0.5,
                    px: 0.75,
                    py: 0.75,
                    borderBottom: `1px solid ${cv.dividerSubtle}`,
                  }}
                >
                  <Icon sx={{ fontSize: 14, color: track.color, mt: 0.15 }} />
                  <Typography
                    sx={{
                      fontSize: '0.625rem',
                      fontWeight: 600,
                      lineHeight: 1.25,
                      color: cv.textMuted,
                    }}
                  >
                    {track.label}
                  </Typography>
                </Box>
              );
            })}
            <Box sx={{ height: VIDEO_TRACK_HEIGHT, flexShrink: 0 }} />
          </Box>
        ) : null}

        <Box
          ref={horizontalScrollRef}
          onPointerDown={handleTimelineSeek}
          sx={{
            position: 'relative',
            flex: 1,
            minWidth: 0,
            overflowX: isZoomed ? 'auto' : 'hidden',
            overflowY: 'hidden',
            cursor: 'pointer',
            touchAction: isZoomed ? 'pan-x' : 'none',
          }}
        >
          <Box
            ref={contentInnerRef}
            sx={{
              position: 'relative',
              width: `${timelineZoom * 100}%`,
              minWidth: '100%',
              height: innerContentHeight,
            }}
          >
            {hasAnnotations ? (
              <Box
                sx={{
                  position: 'relative',
                  height: RULER_HEIGHT,
                  color: cv.textMuted,
                  borderBottom: `1px solid ${cv.dividerSubtle}`,
                }}
              >
                {ticks.map((time, index) => (
                  <Typography
                    key={`${time}-${index}`}
                    component="span"
                    sx={{
                      position: 'absolute',
                      left: `${timeToPercent(time, safeDuration)}%`,
                      transform: getRulerTickTransform(index, ticks.length),
                      fontSize: '0.625rem',
                      fontVariantNumeric: 'tabular-nums',
                      lineHeight: 1,
                      userSelect: 'none',
                      top: 2,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {formatVideoTimestamp(time)}
                  </Typography>
                ))}
              </Box>
            ) : null}

            {hasAnnotations
              ? activeTracks.map((track) => {
                  const trackItems = itemsByTrack[track.type];
                  const { laneById, laneCount } = laneLayouts[track.type];
                  const { contentHeight, visibleHeight, scrollable } =
                    getTrackBodyHeight(laneCount);
                  const Icon = track.Icon;

                  return (
                    <Box
                      key={track.type}
                      sx={{
                        position: 'relative',
                        height: visibleHeight,
                        borderBottom: `1px solid ${cv.dividerSubtle}`,
                        overflowY: scrollable ? 'auto' : 'hidden',
                      }}
                    >
                      <Box sx={{ position: 'relative', height: contentHeight }}>
                        {trackItems.map((item) =>
                          renderSegment(
                            item,
                            track.color,
                            laneById.get(item.id) ?? 0,
                            Icon,
                          ),
                        )}
                      </Box>
                    </Box>
                  );
                })
              : null}

            <Box
              sx={{
                position: 'relative',
                height: VIDEO_TRACK_HEIGHT,
                background:
                  cv.bluePurpleGradient,
              }}
            >
              {(inPoint != null || outPoint != null) && (
                <Box
                  sx={{
                    position: 'absolute',
                    inset: '0 auto 0 0',
                    left: inPoint != null ? `${timeToPercent(inPoint, safeDuration)}%` : '0%',
                    right: outPoint != null ? `${100 - timeToPercent(outPoint, safeDuration)}%` : '0%',
                    width: 'auto',
                    backgroundColor: rangeEnabled ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.1)',
                    borderLeft: inPoint != null ? `2px solid ${rangeEnabled ? '#fff' : 'rgba(255,255,255,0.4)'}` : 'none',
                    borderRight: outPoint != null ? `2px solid ${rangeEnabled ? '#fff' : 'rgba(255,255,255,0.4)'}` : 'none',
                    pointerEvents: 'none',
                    zIndex: 4,
                  }}
                />
              )}

              <Box
                sx={{
                  position: 'absolute',
                  inset: '0 auto 0 0',
                  width: `${playheadPercent}%`,
                  background: `linear-gradient(90deg, ${cv.brandBlue}55 0%, ${cv.brandPurple}55 100%)`,
                  pointerEvents: 'none',
                  zIndex: 3,
                }}
              />
            </Box>

            <Box
              aria-hidden
              sx={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: `${playheadPercent}%`,
                width: 2,
                transform: 'translateX(-50%)',
                backgroundColor: palette.red,
                boxShadow: cv.playheadRing,
                pointerEvents: 'none',
                zIndex: 5,
              }}
            />
            <Box
              aria-hidden
              sx={{
                position: 'absolute',
                top: hasAnnotations ? -3 : 4,
                left: `${playheadPercent}%`,
                transform: 'translateX(-50%)',
                width: PLAYHEAD_MARKER_SIZE,
                height: PLAYHEAD_MARKER_SIZE,
                rotate: '45deg',
                backgroundColor: palette.red,
                border: `1px solid ${cv.inkOverlay35}`,
                pointerEvents: 'none',
                zIndex: 6,
              }}
            />
          </Box>
        </Box>
      </Box>

      {!hasAnnotations ? (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            mt: 0.5,
            gap: 1,
          }}
        >
          <Typography
            sx={{
              fontSize: '0.75rem',
              color: cv.textMuted,
            }}
          >
            {footerHint}
          </Typography>
        </Box>
      ) : null}
    </Box>
  );
}

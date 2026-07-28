import type { AnnotationHistoryEntry } from '../types/annotationHistory';
import type { TimelineAnnotationItem } from '../types/annotationTimeline';
import type { VideoComment } from '../types/videoComments';
import type { VideoDrawingStroke } from '../types/videoDrawings';
import type { VideoShape } from '../types/videoShapes';
import type { VideoStamp } from '../types/videoStamps';
import { getStampSummary } from '../constants/stamps';
import type { CustomStamp } from '../types/customStamps';
import type { ShapeTool } from '../components/media/ShapeSubToolbar';
import { getAnnotationEndTime } from './annotationTimeRange';

const SHAPE_LABELS: Partial<Record<ShapeTool, string>> = {
  rectangle: 'Rectangle',
  circle: 'Circle',
  line: 'Line',
  'curved-connector': 'Curved connector',
  'elbow-connector': 'Elbow connector',
  'straight-arrow': 'Arrow',
  diamond: 'Diamond',
  'triangle-up': 'Triangle',
  'triangle-down': 'Triangle',
};

const SKIPPED_HISTORY_TYPES = new Set<AnnotationHistoryEntry['type']>(['reply']);

interface BuildTimelineItemsInput {
  comments: VideoComment[];
  drawings: VideoDrawingStroke[];
  shapes: VideoShape[];
  stamps: VideoStamp[];
  history?: AnnotationHistoryEntry[];
  customStamp?: CustomStamp | null;
}

function itemKey(type: TimelineAnnotationItem['type'], id: string): string {
  return `${type}:${id}`;
}

function pushItem(
  items: TimelineAnnotationItem[],
  seen: Set<string>,
  item: TimelineAnnotationItem,
) {
  const key = itemKey(item.type, item.id);
  if (seen.has(key)) return;
  seen.add(key);
  items.push(item);
}

export function buildTimelineItems({
  comments,
  drawings,
  shapes,
  stamps,
  history = [],
  customStamp,
}: BuildTimelineItemsInput): TimelineAnnotationItem[] {
  const items: TimelineAnnotationItem[] = [];
  const seen = new Set<string>();

  comments
    .filter(
      (comment) =>
        !comment.resolved && !comment.linkedDrawingId && !comment.linkedShapeId,
    )
    .forEach((comment) => {
      const label = comment.text.trim() || 'Comment';
      pushItem(items, seen, {
        id: comment.id,
        type: 'comment',
        startTime: comment.videoTimestamp,
        endTime: getAnnotationEndTime(comment.videoTimestamp, comment.endTimestamp),
        label: label.length > 24 ? `${label.slice(0, 24)}…` : label,
      });
    });

  const commentById = new Map(comments.map((comment) => [comment.id, comment]));

  drawings.forEach((drawing, index) => {
    const linkedComment = drawing.commentId
      ? commentById.get(drawing.commentId)
      : undefined;
    const explanation = linkedComment?.text.trim();
    const label = explanation
      ? explanation.length > 24
        ? `${explanation.slice(0, 24)}…`
        : explanation
      : 'Drawing';

    pushItem(items, seen, {
      id: drawing.id || `drawing-stroke-${index}`,
      type: 'drawing',
      startTime: drawing.videoTimestamp,
      endTime: getAnnotationEndTime(drawing.videoTimestamp, drawing.endTimestamp),
      label,
    });
  });

  shapes.forEach((shape) => {
    const linkedComment = shape.commentId ? commentById.get(shape.commentId) : undefined;
    const explanation = linkedComment?.text.trim();
    const defaultLabel = SHAPE_LABELS[shape.type] ?? 'Shape';
    const label = explanation
      ? explanation.length > 24
        ? `${explanation.slice(0, 24)}…`
        : explanation
      : defaultLabel;

    pushItem(items, seen, {
      id: shape.id,
      type: 'shape',
      startTime: shape.videoTimestamp,
      endTime: getAnnotationEndTime(shape.videoTimestamp, shape.endTimestamp),
      label,
    });
  });

  stamps.forEach((stamp) => {
    pushItem(items, seen, {
      id: stamp.id,
      type: 'stamp',
      startTime: stamp.videoTimestamp,
      endTime: getAnnotationEndTime(stamp.videoTimestamp, stamp.endTimestamp),
      label: getStampSummary(stamp.stampId, customStamp, stamp.customEmoji),
    });
  });

  history.forEach((entry) => {
    if (entry.erasedAt || entry.resolved || SKIPPED_HISTORY_TYPES.has(entry.type)) {
      return;
    }

    if (entry.type === 'comment') {
      const commentId = entry.sourceCommentId ?? entry.id.replace(/^comment-/, '');
      if (seen.has(itemKey('comment', commentId))) return;

      const label = entry.detail?.trim() || entry.summary || 'Comment';
      pushItem(items, seen, {
        id: commentId,
        type: 'comment',
        startTime: entry.videoTimestamp,
        endTime: getAnnotationEndTime(entry.videoTimestamp),
        label: label.length > 24 ? `${label.slice(0, 24)}…` : label,
      });
      return;
    }

    if (entry.type === 'drawing') {
      const strokeId = entry.id.startsWith('drawing-')
        ? entry.id.slice('drawing-'.length)
        : '';
      const hasStroke = strokeId
        ? drawings.some((drawing) => drawing.id === strokeId)
        : drawings.some(
            (drawing) =>
              Math.floor(drawing.videoTimestamp) === Math.floor(entry.videoTimestamp),
          );
      if (hasStroke) return;

      pushItem(items, seen, {
        id: entry.id,
        type: 'drawing',
        startTime: entry.videoTimestamp,
        endTime: getAnnotationEndTime(entry.videoTimestamp),
        label: entry.summary || 'Drawing',
      });
      return;
    }

    if (entry.type === 'shape' && entry.id.startsWith('shape-')) {
      const shapeId = entry.id.slice('shape-'.length);
      if (seen.has(itemKey('shape', shapeId))) return;

      pushItem(items, seen, {
        id: shapeId,
        type: 'shape',
        startTime: entry.videoTimestamp,
        endTime: getAnnotationEndTime(entry.videoTimestamp),
        label: entry.summary || 'Shape',
      });
      return;
    }

    if (entry.type === 'stamp' && entry.id.startsWith('stamp-')) {
      const stampId = entry.id.slice('stamp-'.length);
      if (seen.has(itemKey('stamp', stampId))) return;

      pushItem(items, seen, {
        id: stampId,
        type: 'stamp',
        startTime: entry.videoTimestamp,
        endTime: getAnnotationEndTime(entry.videoTimestamp),
        label: entry.summary || 'Stamp',
      });
    }
  });

  return items;
}

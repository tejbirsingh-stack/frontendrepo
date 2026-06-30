import type { AnnotationHistoryEntry } from './annotationHistory';
import type { VideoComment } from './videoComments';
import type { VideoDrawingStroke } from './videoDrawings';
import type { VideoShape } from './videoShapes';
import type { VideoStamp } from './videoStamps';
export interface AnnotationSnapshot {
  comments: VideoComment[];
  drawings: VideoDrawingStroke[];
  shapes: VideoShape[];
  stamps: VideoStamp[];
  history: AnnotationHistoryEntry[];
}

export const EMPTY_ANNOTATION_SNAPSHOT: AnnotationSnapshot = {
  comments: [],
  drawings: [],
  shapes: [],
  stamps: [],
  history: [],
};

import type { VideoDrawingStroke } from '../types/videoDrawings';

const STORAGE_PREFIX = 'noah-video-drawings:';

export function loadVideoDrawings(mediaId: string): VideoDrawingStroke[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(`${STORAGE_PREFIX}${mediaId}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Partial<VideoDrawingStroke>[];
    if (!Array.isArray(parsed)) return [];

    return parsed.map((stroke, index) => ({
      ...stroke,
      id: stroke.id ?? `legacy-stroke-${index}-${stroke.videoTimestamp ?? 0}`,
      videoTimestamp: stroke.videoTimestamp ?? 0,
    })) as VideoDrawingStroke[];
  } catch {
    return [];
  }
}

export function saveVideoDrawings(mediaId: string, strokes: VideoDrawingStroke[]) {
  if (typeof window === 'undefined') return;

  window.localStorage.setItem(`${STORAGE_PREFIX}${mediaId}`, JSON.stringify(strokes));
}

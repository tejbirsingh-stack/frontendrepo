import type { VideoShape } from '../types/videoShapes';

const STORAGE_PREFIX = 'noah-video-shapes:';

export function loadVideoShapes(mediaId: string): VideoShape[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(`${STORAGE_PREFIX}${mediaId}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Partial<VideoShape>[];
    if (!Array.isArray(parsed)) return [];

    return parsed.map((shape) => ({
      ...shape,
      videoTimestamp: shape.videoTimestamp ?? 0,
    })) as VideoShape[];
  } catch {
    return [];
  }
}

export function saveVideoShapes(mediaId: string, shapes: VideoShape[]) {
  if (typeof window === 'undefined') return;

  window.localStorage.setItem(`${STORAGE_PREFIX}${mediaId}`, JSON.stringify(shapes));
}

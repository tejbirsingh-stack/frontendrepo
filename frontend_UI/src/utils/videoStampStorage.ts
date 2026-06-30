import type { VideoStamp } from '../types/videoStamps';

const STORAGE_PREFIX = 'noah-video-stamps:';

export function loadVideoStamps(mediaId: string): VideoStamp[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(`${STORAGE_PREFIX}${mediaId}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Partial<VideoStamp>[];
    if (!Array.isArray(parsed)) return [];

    return parsed.map((stamp) => ({
      ...stamp,
      videoTimestamp: stamp.videoTimestamp ?? 0,
    })) as VideoStamp[];
  } catch {
    return [];
  }
}

export function saveVideoStamps(mediaId: string, stamps: VideoStamp[]) {
  if (typeof window === 'undefined') return;

  window.localStorage.setItem(`${STORAGE_PREFIX}${mediaId}`, JSON.stringify(stamps));
}

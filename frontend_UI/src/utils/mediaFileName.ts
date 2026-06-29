import type { MediaItem } from '../data/mockMedia';

export function getMediaFileName(item: MediaItem): string {
  if (item.videoSrc) {
    try {
      const url = new URL(item.videoSrc, window.location.origin);
      const segment = url.pathname.split('/').filter(Boolean).pop();
      if (segment) return decodeURIComponent(segment);
    } catch {
      const segment = item.videoSrc.split('/').filter(Boolean).pop();
      if (segment) return segment;
    }
  }

  const slug = item.title.trim().replace(/\s+/g, '_');
  switch (item.type) {
    case 'video':
      return `${slug}.mp4`;
    case 'audio':
      return `${slug}.mp3`;
    case 'image':
      return `${slug}.jpg`;
    default:
      return item.title;
  }
}

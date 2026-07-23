import type { MediaItem } from '../data/mockMedia';

export function getMediaFileName(item: MediaItem): string {
  if (item.title && item.title !== 'stream') {
    return item.title;
  }

  if (item.videoSrc) {
    try {
      const url = new URL(item.videoSrc, window.location.origin);
      const segment = url.pathname.split('/').filter(Boolean).pop();
      if (segment && segment !== 'stream') return decodeURIComponent(segment);
    } catch {
      const segment = item.videoSrc.split('/').filter(Boolean).pop();
      if (segment && segment !== 'stream') return segment;
    }
  }

  const slug = (item.title || 'video').trim().replace(/\s+/g, '_');
  switch (item.type) {
    case 'video':
      return `${slug}.mp4`;
    case 'audio':
      return `${slug}.mp3`;
    case 'image':
      return `${slug}.jpg`;
    default:
      return item.title || 'media';
  }
}

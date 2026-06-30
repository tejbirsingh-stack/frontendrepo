import type { MediaType } from '../data/mockMedia';

const extensionMap: Record<string, MediaType> = {
  jpg: 'image',
  jpeg: 'image',
  png: 'image',
  gif: 'image',
  webp: 'image',
  svg: 'image',
  mp4: 'video',
  mov: 'video',
  webm: 'video',
  mkv: 'video',
  mp3: 'audio',
  wav: 'audio',
  m4a: 'audio',
  aac: 'audio',
  ogg: 'audio',
};

export function getMediaTypeFromFile(file: File): MediaType | null {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('video/')) return 'video';
  if (file.type.startsWith('audio/')) return 'audio';

  const extension = file.name.split('.').pop()?.toLowerCase();
  if (!extension) return null;

  return extensionMap[extension] ?? null;
}

export function getUploadableFiles(files: FileList | File[]): File[] {
  return Array.from(files).filter((file) => getMediaTypeFromFile(file) !== null);
}

export const UPLOAD_ACCEPT = 'image/*,video/*,audio/*';

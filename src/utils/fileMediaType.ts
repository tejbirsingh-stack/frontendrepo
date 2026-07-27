import type { MediaType } from '../data/mockMedia';

const extensionMap: Record<string, MediaType> = {
  // Standard Web Images
  jpg: 'image',
  jpeg: 'image',
  jpf: 'image',
  png: 'image',
  gif: 'image',
  webp: 'image',
  svg: 'image',
  avif: 'image',
  bmp: 'image',

  // Professional Design & Vector Formats
  psd: 'image',
  psb: 'image',
  ai: 'image',
  eps: 'image',

  // Deep Raster & Professional VFX / Sequence Formats
  exr: 'image',
  openexr: 'image',
  tiff: 'image',
  tif: 'image',
  pcx: 'image',
  mpo: 'image',
  dpx: 'image',
  cin: 'image',

  // Video Formats
  mp4: 'video',
  m4v: 'video',
  mov: 'video',
  qt: 'video',
  avi: 'video',
  mkv: 'video',
  webm: 'video',
  ogg: 'video',
  mxf: 'video',
  mpeg: 'video',
  m2v: 'video',
  mpg: 'video',
  ts: 'video',
  gxf: 'video',

  // Audio Formats
  mp3: 'audio',
  wav: 'audio',
  m4a: 'audio',
  m4b: 'audio',
  aac: 'audio',
  flac: 'audio',
  aiff: 'audio',
  aif: 'audio',
  aifc: 'audio',
  '3g2': 'audio',
  ape: 'audio',
  au: 'audio',
  mp2: 'audio',
  oga: 'audio',
  pdf: 'document',
  doc: 'document',
  docx: 'document',
  rtf: 'document',
  txt: 'document',
  pproj: 'document',
  drp: 'document',
  aep: 'document',
  fcp: 'document',
  fcpxmld: 'document',
};

export function getMediaTypeFromFile(file: File): MediaType | null {
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (extension && extensionMap[extension]) {
    return extensionMap[extension];
  }

  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('video/')) return 'video';
  if (file.type.startsWith('audio/')) return 'audio';

  return null;
}

export function getUploadableFiles(files: FileList | File[]): File[] {
  return Array.from(files).filter((file) => getMediaTypeFromFile(file) !== null);
}

export const UPLOAD_ACCEPT =
  'image/*,video/*,audio/*,.jpg,.jpeg,.bmp,.pdf,.doc,.docx,.rtf,.txt,.pproj,.drp,.aep,.fcp,.fcpxmld,.psd,.psb,.ai,.eps,.exr,.openexr,.tiff,.tif,.dpx,.cin,.jpf,.pcx,.mpo,.avif,.m4b,.flac,.aiff,.aif,.aifc,.3g2,.ape,.au,.mp2';

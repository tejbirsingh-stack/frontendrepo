import ExifReader from 'exifreader';
import * as mmb from 'music-metadata-browser';
import { formatVideoTimestamp } from './formatVideoTimestamp';
import { estimateBitrate } from './videoTechnicalMetadata';

export interface ImageMetadataResult {
  width?: number;
  height?: number;
  resolution?: string;
  displayResolution?: string;
  megapixels?: string;
  aspectRatio?: string;
  orientation?: string;
  containerFormat?: string;
  exif?: {
    make?: string;
    model?: string;
    lens?: string;
    iso?: string;
    exposureTime?: string;
    fNumber?: string;
    focalLength?: string;
    dateTimeOriginal?: string;
    resolution?: string;
    orientation?: string;
  };
}

export interface AudioMetadataResult {
  durationSeconds?: number;
  duration?: string;
  sampleRate?: string;
  hasAudio?: string;
  channels?: string;
  estimatedBitrate?: string;
  containerFormat?: string;
  audioCodec?: string;
  artist?: string;
  album?: string;
  title?: string;
  year?: string;
  genre?: string;
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

function formatAspectRatio(width: number, height: number): string {
  if (width <= 0 || height <= 0) return '—';
  const divisor = gcd(width, height) || 1;
  const ratioW = width / divisor;
  const ratioH = height / divisor;
  const decimal = (width / height).toFixed(2);

  const commonRatios: [number, number, string][] = [
    [16, 9, '16:9'],
    [9, 16, '9:16'],
    [4, 3, '4:3'],
    [3, 4, '3:4'],
    [21, 9, '21:9'],
    [1, 1, '1:1'],
  ];

  for (const [w, h, label] of commonRatios) {
    if (Math.abs(width / height - w / h) < 0.03) {
      return `${label} (${decimal}:1)`;
    }
  }

  if (ratioW > 100 || ratioH > 100) {
    return `${decimal}:1`;
  }

  return `${ratioW}:${ratioH} (${decimal}:1)`;
}

export async function extractImageMetadata(file: File): Promise<ImageMetadataResult> {
  const result: ImageMetadataResult = {
    containerFormat: file.name.split('.').pop()?.toUpperCase() || 'JPEG',
  };

  // 1. Instant Dimension Extraction via createImageBitmap API
  try {
    const bitmap = await createImageBitmap(file);
    if (bitmap && bitmap.width > 0 && bitmap.height > 0) {
      const w = bitmap.width;
      const h = bitmap.height;
      bitmap.close();
      result.width = w;
      result.height = h;
      result.resolution = `${w} × ${h} px`;
      result.displayResolution = `${w} × ${h} px`;
      result.megapixels = `${((w * h) / 1_000_000).toFixed(2)} MP`;
      result.aspectRatio = formatAspectRatio(w, h);
      result.orientation = w >= h ? 'Landscape' : 'Portrait';
    }
  } catch (err) {
    console.warn('[ImageMetadata] createImageBitmap error:', err);
  }

  // 2. Fallback to HTMLImageElement (FileReader DataURL) if dimensions not found yet
  if (!result.width) {
    try {
      await new Promise<void>((resolve) => {
        const reader = new FileReader();
        reader.onload = (evt) => {
          const src = evt.target?.result as string;
          if (!src) return resolve();
          const img = new Image();
          img.onload = () => {
            if (img.width > 0 && img.height > 0) {
              const w = img.width;
              const h = img.height;
              result.width = w;
              result.height = h;
              result.resolution = `${w} × ${h} px`;
              result.displayResolution = `${w} × ${h} px`;
              result.megapixels = `${((w * h) / 1_000_000).toFixed(2)} MP`;
              result.aspectRatio = formatAspectRatio(w, h);
              result.orientation = w >= h ? 'Landscape' : 'Portrait';
            }
            resolve();
          };
          img.onerror = () => resolve();
          img.src = src;
        };
        reader.onerror = () => resolve();
        reader.readAsDataURL(file);
      });
    } catch (err) {
      console.warn('[ImageMetadata] FileReader Image fallback error:', err);
    }
  }

  // 3. Camera EXIF Metadata Extraction via ExifReader
  try {
    const arrayBuffer = await file.arrayBuffer();
    const tags = ExifReader.load(arrayBuffer);
    const exifData: NonNullable<ImageMetadataResult['exif']> = {};

    const exifWidth = tags['Image Width']?.value || tags.PixelXDimension?.value;
    const exifHeight = tags['Image Height']?.value || tags.PixelYDimension?.value;
    if (!result.width && exifWidth && exifHeight) {
      const w = Number(exifWidth);
      const h = Number(exifHeight);
      if (w > 0 && h > 0) {
        result.width = w;
        result.height = h;
        result.resolution = `${w} × ${h} px`;
        result.displayResolution = `${w} × ${h} px`;
        result.megapixels = `${((w * h) / 1_000_000).toFixed(2)} MP`;
        result.aspectRatio = formatAspectRatio(w, h);
        result.orientation = w >= h ? 'Landscape' : 'Portrait';
      }
    }

    if (tags.Make?.description) exifData.make = String(tags.Make.description).trim();
    if (tags.Model?.description) exifData.model = String(tags.Model.description).trim();
    if (tags.LensModel?.description || tags['Lens Model']?.description) {
      exifData.lens = String(tags.LensModel?.description || tags['Lens Model']?.description || '').trim();
    }
    if (tags.ISOSpeedRatings?.description || tags.PhotographicSensitivity?.description) {
      const isoVal = String(tags.ISOSpeedRatings?.description || tags.PhotographicSensitivity?.description);
      exifData.iso = isoVal.startsWith('ISO') ? isoVal : `ISO ${isoVal}`;
    }
    if (tags.ExposureTime?.description) exifData.exposureTime = `${tags.ExposureTime.description} sec`;
    if (tags.FNumber?.description) {
      const fNum = String(tags.FNumber.description);
      exifData.fNumber = fNum.startsWith('f/') ? fNum : `f/${fNum}`;
    }
    if (tags.FocalLength?.description) exifData.focalLength = String(tags.FocalLength.description);
    if (tags.DateTimeOriginal?.description || tags.DateTime?.description) {
      exifData.dateTimeOriginal = String(tags.DateTimeOriginal?.description || tags.DateTime?.description);
    }
    if (result.resolution) exifData.resolution = result.resolution;
    if (result.orientation) exifData.orientation = result.orientation;

    if (Object.keys(exifData).length > 0) {
      result.exif = exifData;
    }
  } catch (err) {
    console.warn('[ImageMetadata] ExifReader error:', err);
  }

  return result;
}

export async function extractAudioMetadata(file: File): Promise<AudioMetadataResult> {
  const result: AudioMetadataResult = {};
  const containerExt = file.name.split('.').pop()?.toUpperCase() || 'MP3';
  result.containerFormat = containerExt;
  result.hasAudio = 'Yes';

  // 1. Try music-metadata-browser
  try {
    const metadata = await mmb.parseBlob(file);
    const format = metadata.format;
    const common = metadata.common;

    if (format.duration && format.duration > 0) {
      result.durationSeconds = Math.round(format.duration);
      result.duration = formatVideoTimestamp(format.duration);
    }
    if (format.sampleRate) {
      result.sampleRate = `${(format.sampleRate / 1000).toFixed(1)} kHz`;
    }
    if (format.numberOfChannels) {
      result.channels = format.numberOfChannels === 2 ? 'Stereo' : format.numberOfChannels === 1 ? 'Mono' : `${format.numberOfChannels} channels`;
    }
    if (format.bitrate && format.duration) {
      const kbps = Math.round(format.bitrate / 1000);
      result.estimatedBitrate = `${kbps} kbps`;
    } else if (file.size > 0 && result.durationSeconds) {
      result.estimatedBitrate = estimateBitrate(file.size, result.durationSeconds);
    }
    if (format.codec) {
      result.audioCodec = format.codec;
    }

    if (common.artist) result.artist = common.artist;
    if (common.album) result.album = common.album;
    if (common.title) result.title = common.title;
    if (common.year) result.year = String(common.year);
    if (common.genre && common.genre.length > 0) result.genre = common.genre.join(', ');
  } catch (err) {
    console.warn('[AudioMetadata] music-metadata-browser failed, using Web Audio fallback:', err);
  }

  // 2. Web Audio API / Audio Element Fallback if duration not found
  if (!result.durationSeconds || result.durationSeconds <= 0) {
    try {
      const objectUrl = URL.createObjectURL(file);
      await new Promise<void>((resolve) => {
        const audio = new Audio();
        audio.preload = 'metadata';
        audio.onloadedmetadata = () => {
          if (Number.isFinite(audio.duration) && audio.duration > 0) {
            result.durationSeconds = Math.round(audio.duration);
            result.duration = formatVideoTimestamp(audio.duration);
            result.estimatedBitrate = estimateBitrate(file.size, audio.duration);
          }
          URL.revokeObjectURL(objectUrl);
          resolve();
        };
        audio.onerror = () => {
          URL.revokeObjectURL(objectUrl);
          resolve();
        };
        audio.src = objectUrl;
      });
    } catch (fallbackErr) {
      console.warn('[AudioMetadata] Fallback audio metadata failed:', fallbackErr);
    }
  }

  return result;
}

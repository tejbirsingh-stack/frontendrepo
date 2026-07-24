import ExifReader from 'exifreader';
import * as mmb from 'music-metadata-browser';
import { formatVideoTimestamp } from './formatVideoTimestamp';
import { estimateBitrate } from './videoTechnicalMetadata';

export interface TechnicalExifDetails {
  make?: string;
  model?: string;
  lens?: string;
  exposureTime?: string;
  fNumber?: string;
  iso?: string;
  focalLength?: string;
  dateTimeOriginal?: string;
  resolution?: string;
  orientation?: string;
}

export interface ImageMetadataResult {
  width?: number;
  height?: number;
  resolution?: string;
  displayResolution?: string;
  megapixels?: string;
  aspectRatio?: string;
  orientation?: string;
  containerFormat?: string;
  exif?: TechnicalExifDetails;
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

export async function extractExifFromFile(file: File): Promise<TechnicalExifDetails | undefined> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    let rawTags: any = {};
    try {
      rawTags = await (ExifReader as any).load(arrayBuffer, { async: true, expanded: true });
    } catch {
      try {
        rawTags = ExifReader.load(arrayBuffer);
      } catch {
        rawTags = {};
      }
    }

    const tags: Record<string, any> = {};
    if (rawTags) {
      if (rawTags.file) Object.assign(tags, rawTags.file);
      if (rawTags.exif) Object.assign(tags, rawTags.exif);
      if (rawTags.gps) Object.assign(tags, rawTags.gps);
      if (rawTags.iptc) Object.assign(tags, rawTags.iptc);
      if (rawTags.xmp) Object.assign(tags, rawTags.xmp);
      Object.assign(tags, rawTags);
    }

    const allKeys = Object.keys(tags);
    const getValue = (...tagKeys: string[]): string | undefined => {
      for (const k of tagKeys) {
        if (tags[k]?.description != null && String(tags[k].description).trim() !== '') {
          return String(tags[k].description).trim();
        }
        if (tags[k]?.value != null) {
          const val = tags[k].value;
          if (Array.isArray(val) && val.length > 0 && val[0] != null && String(val[0]).trim() !== '') {
            return String(val[0]).trim();
          }
          if (String(val).trim() !== '') return String(val).trim();
        }

        const lowerK = k.toLowerCase().replace(/[^a-z0-9]/g, '');
        const matchedKey = allKeys.find((key) => {
          const lowerKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
          return lowerKey === lowerK || lowerKey.endsWith(lowerK);
        });

        if (matchedKey && tags[matchedKey]) {
          const tagObj = tags[matchedKey];
          if (tagObj?.description != null && String(tagObj.description).trim() !== '') {
            return String(tagObj.description).trim();
          }
          if (tagObj?.value != null) {
            const val = tagObj.value;
            if (Array.isArray(val) && val.length > 0 && val[0] != null && String(val[0]).trim() !== '') {
              return String(val[0]).trim();
            }
            if (String(val).trim() !== '') return String(val).trim();
          }
        }
      }
      return undefined;
    };

    const exifData: TechnicalExifDetails = {};

    const exifWidth = getValue('Image Width', 'PixelXDimension', 'Width', 'SourceImageWidth', 'Imagewidth');
    const exifHeight = getValue('Image Height', 'PixelYDimension', 'Height', 'SourceImageHeight', 'Imageheight');
    if (exifWidth && exifHeight && !isNaN(Number(exifWidth)) && !isNaN(Number(exifHeight))) {
      const w = Number(exifWidth);
      const h = Number(exifHeight);
      exifData.resolution = `${w} × ${h} px`;
      exifData.orientation = w >= h ? 'Landscape' : 'Portrait';
    }

    const make = getValue('Make', 'com.apple.quicktime.make', 'Manufacturer', 'hardware');
    if (make) exifData.make = make;

    const model = getValue('Model', 'com.apple.quicktime.model', 'DeviceModel', 'Device');
    if (model) exifData.model = model;

    const lens = getValue('LensModel', 'Lens Model', 'Lens', 'LensMake', 'com.apple.quicktime.lens-model', 'lens-model');
    if (lens) exifData.lens = lens;

    const iso = getValue('ISOSpeedRatings', 'PhotographicSensitivity', 'ISO', 'ISOSpeed', 'iso-speed');
    if (iso) exifData.iso = iso.startsWith('ISO') ? iso : `ISO ${iso}`;

    const exp = getValue('ExposureTime', 'Exposure Time', 'ShutterSpeedValue', 'ShutterSpeed', 'exposure-time');
    if (exp) exifData.exposureTime = exp.includes('sec') || exp.includes('s') ? exp : `${exp} sec`;

    const fNum = getValue('FNumber', 'ApertureValue', 'Aperture', 'f-number');
    if (fNum) exifData.fNumber = fNum.startsWith('f/') ? fNum : `f/${fNum}`;

    const focal = getValue('FocalLength', 'Focal Length', 'FocalLengthIn35mmFormat', 'focal-length');
    if (focal) exifData.focalLength = focal.includes('mm') ? focal : `${focal} mm`;

    const dateVal = getValue('DateTimeOriginal', 'DateTime', 'Creation Date', 'com.apple.quicktime.creationdate', 'CreateDate');
    if (dateVal) exifData.dateTimeOriginal = dateVal;

    if (Object.keys(exifData).length > 0) {
      return exifData;
    }
  } catch (err) {
    console.warn('[ExifReader] Could not extract EXIF dynamically from file:', err);
  }
  return undefined;
}

export async function extractAudioMetadata(file: File): Promise<AudioMetadataResult> {
  const result: AudioMetadataResult = {};
  const containerExt = file.name.split('.').pop()?.toUpperCase() || 'MP3';
  result.containerFormat = containerExt;
  result.hasAudio = 'Yes';

  // 1. Try music-metadata-browser with a timeout
  try {
    const metadata = await Promise.race([
      mmb.parseBlob(file),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 2000))
    ]);
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
    console.warn('[AudioMetadata] music-metadata-browser failed or timed out, using Web Audio fallback:', err);
  }

  // 2. Web Audio API / Audio Element Fallback if duration not found
  if (!result.durationSeconds || result.durationSeconds <= 0) {
    try {
      const objectUrl = URL.createObjectURL(file);
      await new Promise<void>((resolve, reject) => {
        const audio = new Audio();
        
        // Timeout to prevent hanging forever
        const timeoutId = setTimeout(() => {
          URL.revokeObjectURL(objectUrl);
          audio.src = '';
          reject(new Error('Web Audio fallback timeout'));
        }, 3000);

        audio.preload = 'metadata';
        audio.onloadedmetadata = () => {
          clearTimeout(timeoutId);
          if (Number.isFinite(audio.duration) && audio.duration > 0) {
            result.durationSeconds = Math.round(audio.duration);
            result.duration = formatVideoTimestamp(audio.duration);
            result.estimatedBitrate = estimateBitrate(file.size, audio.duration);
          }
          URL.revokeObjectURL(objectUrl);
          resolve();
        };
        audio.onerror = () => {
          clearTimeout(timeoutId);
          URL.revokeObjectURL(objectUrl);
          resolve(); // Resolve anyway so it doesn't break the flow
        };
        audio.src = objectUrl;
      });
    } catch (fallbackErr) {
      console.warn('[AudioMetadata] Fallback audio metadata failed:', fallbackErr);
    }
  }

  return result;
}

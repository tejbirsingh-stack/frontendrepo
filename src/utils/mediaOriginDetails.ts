import type { MediaTechnicalDetails } from '../components/media/MediaDetailsPanel';
import type { TechnicalExifDetails } from '../components/media/TechnicalFileOriginSummary';
import type { MediaItem } from '../data/mockMedia';

export interface ResolvedMediaOriginDetails {
  uploadedBy: string;
  uploadedAt: string;
  originallyCreatedAt?: string;
}

export function resolveMediaOriginDetails(
  mediaItem: MediaItem,
  technicalDetails?: MediaTechnicalDetails,
): ResolvedMediaOriginDetails {
  const uploader =
    (technicalDetails as any)?.uploadedBy?.name ||
    (technicalDetails as any)?.uploadedBy ||
    mediaItem.uploadedBy ||
    'Uploader';

  return {
    uploadedBy: (typeof uploader === 'string' && uploader !== 'User') ? uploader : (mediaItem.uploadedBy || 'Uploader'),
    uploadedAt: (technicalDetails as any)?.uploadedAt || mediaItem.createdAt,
    originallyCreatedAt:
      technicalDetails?.originallyCreatedAt || (technicalDetails as any)?.originallyCreated || mediaItem.originallyCreatedAt,
  };
}

export function resolveMediaExifDetails(
  mediaItem: MediaItem,
  technicalDetails?: MediaTechnicalDetails,
): TechnicalExifDetails | undefined {
  const itemAny = mediaItem as any;
  const exif = technicalDetails?.exif || itemAny?.exif || itemAny?.customMetadata?.exif || itemAny?.metadata?.exif;
  const t = (technicalDetails as any) || itemAny?.customMetadata || itemAny?.metadata || {};

  const make = exif?.make || t?.make || itemAny?.make;
  const model = exif?.model || t?.model || itemAny?.model;
  const lens = exif?.lens || t?.lens || itemAny?.lens;
  const exposureTime = exif?.exposureTime || t?.exposureTime;
  const fNumber = exif?.fNumber || t?.fNumber;
  const iso = exif?.iso || t?.iso;
  const focalLength = exif?.focalLength || t?.focalLength;
  const resolution = exif?.resolution || t?.resolution || itemAny?.resolution;
  const orientation = exif?.orientation || t?.orientation || itemAny?.orientation;
  const dateTimeOriginal = exif?.dateTimeOriginal || t?.dateTimeOriginal || t?.originallyCreated || mediaItem.originallyCreatedAt;

  if (make || model || lens || exposureTime || fNumber || iso || focalLength || resolution || orientation || dateTimeOriginal) {
    return {
      make,
      model,
      lens,
      exposureTime,
      fNumber,
      iso,
      focalLength,
      resolution,
      orientation,
      dateTimeOriginal,
    };
  }
  return undefined;
}

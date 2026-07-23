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
  _mediaItem: MediaItem,
  technicalDetails?: MediaTechnicalDetails,
): TechnicalExifDetails | undefined {
  if (technicalDetails?.exif && Object.keys(technicalDetails.exif).length > 0) {
    return technicalDetails.exif;
  }
  return undefined;
}

import type { MediaTechnicalDetails } from '../components/media/MediaDetailsPanel';
import type { TechnicalExifDetails } from '../components/media/TechnicalFileOriginSummary';
import { CURRENT_USER } from '../constants/currentUser';
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
  return {
    uploadedBy: technicalDetails?.uploadedBy ?? mediaItem.uploadedBy ?? CURRENT_USER.name,
    uploadedAt: technicalDetails?.uploadedAt ?? mediaItem.createdAt,
    originallyCreatedAt:
      technicalDetails?.originallyCreatedAt ?? mediaItem.originallyCreatedAt,
  };
}

export function resolveMediaExifDetails(
  mediaItem: MediaItem,
  technicalDetails?: MediaTechnicalDetails,
): TechnicalExifDetails | undefined {
  if (technicalDetails?.exif) {
    return technicalDetails.exif;
  }

  const originallyCreatedAt =
    technicalDetails?.originallyCreatedAt ?? mediaItem.originallyCreatedAt;
  const resolution = technicalDetails?.resolution;
  const orientation = technicalDetails?.orientation;

  if (!originallyCreatedAt && !resolution) {
    return undefined;
  }

  return {
    dateTimeOriginal: originallyCreatedAt,
    resolution,
    orientation,
    make: 'Apple',
    model: mediaItem.type === 'video' ? 'iPhone 15 Pro' : 'iPhone 15 Pro',
    lens: 'Wide Camera',
    exposureTime: '1/120',
    fNumber: 'f/1.8',
    iso: 'ISO 64',
    focalLength: '24mm',
  };
}

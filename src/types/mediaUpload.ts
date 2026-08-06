import type { MediaType } from '../data/mockMedia';

export type UploadableMediaType = Exclude<MediaType, 'folder'>;

export interface MediaUploadOptions {
  /** Media library folder to nest uploaded files under (dashboard folder view). */
  parentFolderId?: string | null;
  /** Project to nest uploaded files under */
  linkedProjectId?: string | null;
}

export interface PendingMediaUpload {
  id: string;
  type: UploadableMediaType;
  file: File;
  previewSrc: string;
  defaultTitle: string;
  parentFolderId?: string | null;
  linkedProjectId?: string | null;
}

export interface MediaUploadDetails {
  title: string;
  summary?: string;
  thumbnail?: string;
  tagIds: string[];
  folderId: string | null;
  duration?: string;
  visibility?: 'public' | 'private';
}

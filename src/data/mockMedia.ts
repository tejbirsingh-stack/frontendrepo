import { BRAND_REEL_VIDEO_SRC } from '../constants/mediaAssets';

export type MediaType = 'folder' | 'video' | 'image' | 'audio' | 'document';

export type StorageProvider = 'local' | 'b2';

export interface MediaLocation {
  folderId: string;
  childLabel?: string;
}

export interface MediaItem {
  id: string;
  title: string;
  type: MediaType;
  workspaceId: string;
  createdAt: string;
  sizeBytes: number;
  storageProvider: StorageProvider;
  thumbnail?: string;
  url?: string;
  name?: string;
  videoSrc?: string;
  duration?: string;
  /** Known or measured frame rate label, e.g. "24 fps" */
  frameRate?: string;
  summary?: string;
  itemCount?: number;
  tags?: string[];
  aiTags?: string[];
  location?: MediaLocation | null;
  linkedProjectIds?: string[];
  /** Placement in the Projects sidebar (separate from files & folders location). */
  projectLocations?: MediaLocation[];
  projectLocation?: MediaLocation;
  parentFolderId?: string | null;
  /** Custom folder color for media library folders */
  folderColor?: string;
  /** User who uploaded the file to NOAH */
  uploadedBy?: string;
  uploadedByUserId?: string;
  /** Original capture/creation time from file metadata (e.g. EXIF) */
  originallyCreatedAt?: string;
  compressionStatus?: string;
  customMetadata?: Record<string, unknown>;
  status?: 'active' | 'duplicate' | 'archived' | 'trash';
  isProject?: boolean;
}

export const initialMediaItems: MediaItem[] = [];

export interface SidebarFolder {
  id: string;
  label: string;
  children?: string[];
  color?: string;
  /** Set when the current user creates the folder via the sidebar or upload flow. */
  createdByEmail?: string;
  /** Project admin display name — used for invite permissions in Projects view. */
  projectAdminName?: string;
}

export const MEDIA_DRAG_TYPE = 'application/x-noah-media-id';
export const MEDIA_DRAG_IDS_TYPE = 'application/x-noah-media-ids';

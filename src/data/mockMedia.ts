import { BRAND_REEL_VIDEO_SRC } from '../constants/mediaAssets';

export type MediaType = 'folder' | 'video' | 'image' | 'audio';

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
  videoSrc?: string;
  duration?: string;
  /** Known or measured frame rate label, e.g. "24 fps" */
  frameRate?: string;
  summary?: string;
  itemCount?: number;
  tags?: string[];
  aiTags?: string[];
  location: MediaLocation | null;
  /** Placement in the Projects sidebar (separate from files & folders location). */
  projectLocation?: MediaLocation | null;
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
  status?: 'active' | 'duplicate' | 'archived';
}

export const initialMediaItems: MediaItem[] = [
  {
    id: 'media-1',
    title: 'Drone Shots',
    type: 'folder',
    workspaceId: 'noah',
    createdAt: '2025-11-02T10:30:00Z',
    sizeBytes: 2_580_000_000,
    storageProvider: 'local',
    itemCount: 0,
    tags: ['project'],
    aiTags: ['outdoor'],
    location: null,
    projectLocation: { folderId: 'project-brand-reel' },
  },
  {
    id: 'media-2',
    title: 'Brand Reel',
    type: 'video',
    workspaceId: 'noah',
    createdAt: '2026-01-15T14:20:00Z',
    sizeBytes: 156_400_000,
    storageProvider: 'b2',
    uploadedBy: 'Aviral Kataria',
    originallyCreatedAt: '2025-11-10T09:30:00Z',
    thumbnail: 'https://picsum.photos/seed/reel/640/360',
    videoSrc: BRAND_REEL_VIDEO_SRC,
    duration: '0:05',
    frameRate: '24 fps',
    summary:
      'A short brand reel highlighting product moments, team culture, and the visual identity for the latest campaign launch.',
    tags: ['brand', 'project'],
    aiTags: ['person', 'technology'],
    location: null,
    projectLocation: { folderId: 'project-brand-reel' },
  },
  {
    id: 'media-3',
    title: 'Sunset Portrait',
    type: 'image',
    workspaceId: 'noah',
    createdAt: '2024-05-26T16:45:00Z',
    sizeBytes: 373_760,
    storageProvider: 'local',
    uploadedBy: 'Aviral Kataria',
    originallyCreatedAt: '2023-03-28T11:20:00Z',
    thumbnail: 'https://picsum.photos/seed/sunset/640/360',
    tags: ['important'],
    aiTags: ['person', 'outdoor'],
    location: null,
  },
  {
    id: 'vid-duplicate-001',
    title: 'Duplicate_Promo_Final.mp4',
    type: 'video',
    workspaceId: 'ws-1',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    sizeBytes: 85900000,
    storageProvider: 'b2',
    duration: '0:35',
    thumbnail: 'https://images.unsplash.com/photo-1579373903781-42136bfe4ae3?auto=format&fit=crop&q=80&w=300&h=200',
    tags: ['promo'],
    status: 'duplicate',
    location: null,
  },
  {
    id: 'media-4',
    title: 'Podcast Intro',
    type: 'audio',
    workspaceId: 'noah',
    createdAt: '2025-10-19T16:45:00Z',
    sizeBytes: 8_900_000,
    storageProvider: 'b2',
    duration: '0:48',
    tags: ['project'],
    aiTags: ['technology'],
    location: null,
    projectLocation: { folderId: 'project-noah-rebrand' },
  },
  {
    id: 'media-5',
    title: 'Food Photography',
    type: 'folder',
    workspaceId: 'noah',
    createdAt: '2026-02-01T11:00:00Z',
    sizeBytes: 1_120_000_000,
    storageProvider: 'local',
    itemCount: 4,
    tags: ['brand', 'important'],
    aiTags: ['person'],
    location: null,
    projectLocation: { folderId: 'project-noah-rebrand' },
    folderColor: '#f59e0b',
  },
  {
    id: 'media-fp-1',
    title: 'Brunch Flat Lay',
    type: 'image',
    workspaceId: 'noah',
    createdAt: '2026-01-18T09:15:00Z',
    sizeBytes: 4_280_000,
    storageProvider: 'local',
    uploadedBy: 'Aviral Kataria',
    thumbnail: 'https://picsum.photos/seed/brunch-flatlay/640/360',
    tags: ['brand'],
    aiTags: ['person', 'outdoor'],
    location: null,
    parentFolderId: 'media-5',
  },
  {
    id: 'media-fp-2',
    title: 'Chef Plating',
    type: 'video',
    workspaceId: 'noah',
    createdAt: '2026-01-22T14:40:00Z',
    sizeBytes: 86_500_000,
    storageProvider: 'b2',
    uploadedBy: 'Aviral Kataria',
    thumbnail: 'https://picsum.photos/seed/chef-plating/640/360',
    videoSrc:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    duration: '0:15',
    summary: 'Slow-motion plating sequence for a seasonal menu launch.',
    tags: ['brand', 'project'],
    aiTags: ['person'],
    location: null,
    parentFolderId: 'media-5',
  },
  {
    id: 'media-fp-3',
    title: 'Restaurant Ambience',
    type: 'audio',
    workspaceId: 'noah',
    createdAt: '2026-01-25T18:05:00Z',
    sizeBytes: 12_400_000,
    storageProvider: 'local',
    duration: '1:12',
    tags: ['brand'],
    aiTags: ['technology'],
    location: null,
    parentFolderId: 'media-5',
  },
  {
    id: 'media-fp-4',
    title: 'Menu Close-ups',
    type: 'image',
    workspaceId: 'noah',
    createdAt: '2026-02-03T10:20:00Z',
    sizeBytes: 3_150_000,
    storageProvider: 'local',
    uploadedBy: 'Aviral Kataria',
    thumbnail: 'https://picsum.photos/seed/menu-closeups/640/360',
    tags: ['important'],
    aiTags: ['outdoor'],
    location: null,
    parentFolderId: 'media-5',
  },
  {
    id: 'media-6',
    title: 'Mountain Timelapse',
    type: 'video',
    workspaceId: 'noah',
    createdAt: '2025-09-24T08:30:00Z',
    sizeBytes: 312_800_000,
    storageProvider: 'b2',
    thumbnail: 'https://picsum.photos/seed/mountains/640/360',
    videoSrc:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    duration: '4:12',
    summary:
      'Timelapse footage captured at sunrise across alpine peaks, showing shifting light, cloud movement, and changing weather over the ridgeline.',
    tags: ['archived', 'project'],
    aiTags: ['outdoor'],
    location: null,
  },
  {
    id: 'media-7',
    title: 'Nature Collection',
    type: 'folder',
    workspaceId: 'noah',
    createdAt: '2026-01-28T13:10:00Z',
    sizeBytes: 6_750_000,
    storageProvider: 'local',
    itemCount: 0,
    thumbnail: 'https://picsum.photos/seed/nature/640/360',
    tags: ['archived'],
    aiTags: ['outdoor'],
    location: { folderId: 'personal' },
    folderColor: '#22c55e',
  },
  {
    id: 'media-8',
    title: 'Ambient Score',
    type: 'audio',
    workspaceId: 'noah',
    createdAt: '2025-11-30T17:25:00Z',
    sizeBytes: 24_600_000,
    storageProvider: 'b2',
    duration: '3:21',
    tags: ['brand'],
    aiTags: ['technology'],
    location: null,
    projectLocation: { folderId: 'project-brand-reel' },
  },
  {
    id: 'media-9',
    title: 'Client Assets',
    type: 'folder',
    workspaceId: 'noah',
    createdAt: '2025-08-12T12:00:00Z',
    sizeBytes: 890_000_000,
    storageProvider: 'local',
    itemCount: 0,
    tags: ['important'],
    aiTags: ['person'],
    location: null,
    projectLocation: { folderId: 'project-client-work' },
  },
  {
    id: 'media-10',
    title: 'Campaign B-Roll',
    type: 'video',
    workspaceId: 'client-media',
    createdAt: '2026-02-10T15:40:00Z',
    sizeBytes: 98_200_000,
    storageProvider: 'b2',
    thumbnail: 'https://picsum.photos/seed/campaign/640/360',
    duration: '1:58',
    summary:
      'Supplemental campaign footage featuring behind-the-scenes clips, product close-ups, and candid moments intended for social and paid media edits.',
    tags: ['brand', 'project'],
    aiTags: ['person', 'technology'],
    location: null,
    projectLocation: { folderId: 'project-acme-campaign' },
  },
  {
    id: 'media-11',
    title: 'Logo Pack',
    type: 'folder',
    workspaceId: 'client-media',
    createdAt: '2025-12-22T10:05:00Z',
    sizeBytes: 45_300_000,
    storageProvider: 'local',
    itemCount: 6,
    tags: ['brand'],
    aiTags: ['technology'],
    location: null,
    projectLocation: { folderId: 'project-acme-campaign' },
  },
];

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

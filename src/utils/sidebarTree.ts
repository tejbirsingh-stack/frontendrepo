import type { MediaItem, MediaType } from '../data/mockMedia';
import type { SidebarSelection } from '../types/sidebarSelection';
import { isProjectSidebarSelection } from './mediaProjectLocation';

export const ALL_FILES_BUCKET_LABELS = ['Documents', 'Images', 'Videos', 'Audio'] as const;
export type AllFilesBucketLabel = (typeof ALL_FILES_BUCKET_LABELS)[number];

const CHILD_LABEL_TYPE_MAP: Record<string, MediaType[]> = {
  documents: [],
  images: ['image'],
  photos: ['image'],
  videos: ['video'],
  audio: ['audio'],
};

function normalizeLabel(label: string): string {
  return label.trim().toLowerCase();
}

export function getTypesForChildLabel(childLabel: string): MediaType[] | null {
  const types = CHILD_LABEL_TYPE_MAP[normalizeLabel(childLabel)];
  return types ?? null;
}

export function matchesAllFilesBucket(item: MediaItem, childLabel: string): boolean {
  if (item.type === 'folder') return false;
  const types = getTypesForChildLabel(childLabel);
  if (!types || types.length === 0) return false;
  return types.includes(item.type);
}

export function getArchiveYearFromItem(item: MediaItem): string {
  return new Date(item.createdAt).getFullYear().toString();
}

export function matchesArchiveYear(item: MediaItem, year: string): boolean {
  if (item.type === 'folder') return false;
  return getArchiveYearFromItem(item) === year;
}

export function belongsToProject(
  item: MediaItem,
  projectId: string,
  mediaItems: MediaItem[],
): boolean {
  if ((item.linkedProjectIds || []).includes(projectId)) return true;
  if (!item.parentFolderId) return false;

  const parent = mediaItems.find((candidate) => candidate.id === item.parentFolderId);
  if (!parent) return false;
  return belongsToProject(parent, projectId, mediaItems);
}

export function belongsToPersonal(
  item: MediaItem,
  mediaItems: MediaItem[],
): boolean {
  if (item.location?.folderId === 'personal' && !item.parentFolderId) return true;
  if (!item.parentFolderId) return false;

  const parent = mediaItems.find((candidate) => candidate.id === item.parentFolderId);
  if (!parent) return false;
  return belongsToPersonal(parent, mediaItems);
}

export function getProjectRootItems(
  projectId: string,
  mediaItems: MediaItem[],
  workspaceId: string,
  trashedIds: Set<string>,
): MediaItem[] {
  return mediaItems
    .filter(
      (item) =>
        item.workspaceId === workspaceId &&
        !trashedIds.has(item.id) &&
        (item.linkedProjectIds || []).includes(projectId),
    )
    .sort((a, b) => {
      if (a.type === 'folder' && b.type !== 'folder') return -1;
      if (a.type !== 'folder' && b.type === 'folder') return 1;
      return a.title.localeCompare(b.title);
    });
}

export function getPersonalRootItems(
  mediaItems: MediaItem[],
  workspaceId: string,
  trashedIds: Set<string>,
): MediaItem[] {
  return mediaItems
    .filter(
      (item) =>
        item.workspaceId === workspaceId &&
        !trashedIds.has(item.id) &&
        !item.parentFolderId &&
        item.location?.folderId === 'personal',
    )
    .sort((a, b) => {
      if (a.type === 'folder' && b.type !== 'folder') return -1;
      if (a.type !== 'folder' && b.type === 'folder') return 1;
      return a.title.localeCompare(b.title);
    });
}

export function getAllFilesBucketItems(
  childLabel: string,
  mediaItems: MediaItem[],
  workspaceId: string,
  trashedIds: Set<string>,
): MediaItem[] {
  return mediaItems
    .filter(
      (item) =>
        item.workspaceId === workspaceId &&
        !trashedIds.has(item.id) &&
        matchesAllFilesBucket(item, childLabel),
    )
    .sort((a, b) => a.title.localeCompare(b.title));
}

export function getArchiveYearItems(
  year: string,
  mediaItems: MediaItem[],
  workspaceId: string,
  trashedIds: Set<string>,
): MediaItem[] {
  return mediaItems
    .filter(
      (item) =>
        item.workspaceId === workspaceId &&
        !trashedIds.has(item.id) &&
        matchesArchiveYear(item, year),
    )
    .sort((a, b) => a.title.localeCompare(b.title));
}

export function getAllFilesBucketForType(type: MediaType): AllFilesBucketLabel | null {
  switch (type) {
    case 'image':
      return 'Images';
    case 'video':
      return 'Videos';
    case 'audio':
      return 'Audio';
    default:
      return null;
  }
}

export function matchesSidebarSelection(
  item: MediaItem,
  selection: SidebarSelection,
  mediaItems: MediaItem[],
): boolean {
  if (isProjectSidebarSelection(selection)) {
    return belongsToProject(item, selection.folderId, mediaItems);
  }

  if (selection.folderId === 'all-files') {
    if (!selection.childLabel) {
      return item.type !== 'folder' && ALL_FILES_BUCKET_LABELS.some((bucket) =>
        matchesAllFilesBucket(item, bucket),
      );
    }
    return matchesAllFilesBucket(item, selection.childLabel);
  }

  if (selection.folderId === 'archive') {
    if (!selection.childLabel) {
      return item.type !== 'folder';
    }
    return matchesArchiveYear(item, selection.childLabel);
  }

  if (selection.folderId === 'personal') {
    return belongsToPersonal(item, mediaItems);
  }

  const location = item.location;
  if (location?.folderId === selection.folderId) {
    if (!selection.childLabel) return true;
    if (location.childLabel === selection.childLabel) return true;
    return false;
  }

  return false;
}

export function filterMediaBySidebarSelection(
  items: MediaItem[],
  selection: SidebarSelection | null,
  allMediaItems?: MediaItem[],
): MediaItem[] {
  if (!selection) return items;
  const lookup = allMediaItems ?? items;
  return items.filter((item) => matchesSidebarSelection(item, selection, lookup));
}

export function getSidebarSelectionTitle(selection: SidebarSelection | null): string | null {
  if (!selection) return null;
  if (selection.childLabel) {
    return `${selection.folderLabel} / ${selection.childLabel}`;
  }
  return selection.folderLabel;
}

export function getSidebarChildKey(folderId: string, childLabel: string): string {
  return `${folderId}:${childLabel}`;
}

export function getMediaFolderOpenKey(mediaFolderId: string): string {
  return `media:${mediaFolderId}`;
}

export function getMediaLibraryFolderChildren(
  folderId: string,
  mediaItems: MediaItem[],
  workspaceId: string,
  trashedIds: Set<string>,
): MediaItem[] {
  return mediaItems
    .filter(
      (item) =>
        item.parentFolderId === folderId &&
        item.workspaceId === workspaceId &&
        !trashedIds.has(item.id),
    )
    .sort((a, b) => {
      if (a.type === 'folder' && b.type !== 'folder') return -1;
      if (a.type !== 'folder' && b.type === 'folder') return 1;
      return a.title.localeCompare(b.title);
    });
}

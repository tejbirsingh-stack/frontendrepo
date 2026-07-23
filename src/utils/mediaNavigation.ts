import type { MediaItem } from '../data/mockMedia';

export interface MediaFolderBreadcrumb {
  id: string;
  title: string;
}

export function getMediaFolderPath(folderId: string): string {
  return `/home/folder/${folderId}`;
}

/** Walks parentFolderId to build root → current folder trail for breadcrumbs. */
export function getMediaFolderBreadcrumbs(
  folder: MediaItem,
  mediaItems: MediaItem[],
): MediaFolderBreadcrumb[] {
  const trail: MediaFolderBreadcrumb[] = [];
  let current: MediaItem | undefined = folder;

  while (current) {
    trail.unshift({ id: current.id, title: current.title });
    if (!current.parentFolderId) break;

    current = mediaItems.find(
      (item) => item.id === current!.parentFolderId && item.type === 'folder',
    );
  }

  return trail;
}

export function getMediaViewerPath(item: MediaItem): string | null {
  if (item.type === 'folder') {
    return getMediaFolderPath(item.id);
  }

  if (item.type === 'video' || item.type === 'audio' || item.type === 'image') {
    return `/media/${item.id}`;
  }

  return null;
}

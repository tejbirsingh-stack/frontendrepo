import type { MediaItem } from '../data/mockMedia';

export interface MediaFolderBreadcrumb {
  id: string;
  title: string;
}

export function getMediaFolderPath(folderId: string, projectId?: string): string {
  if (projectId) {
    return `/home/project/${projectId}/folder/${folderId}`;
  }
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

export function getMediaViewerPath(item: MediaItem, projectId?: string): string | null {
  if (item.type === 'folder') {
    if (item.isProject) {
      return `/home/project/${item.id}`;
    }
    return getMediaFolderPath(item.id, projectId);
  }

  if (item.type === 'video' || item.type === 'audio' || item.type === 'image') {
    const base = projectId
      ? `/home/project/${projectId}/media/${item.id}`
      : `/media/${item.id}`;
    const startMs = item.searchMatch?.startMs;
    if (typeof startMs === 'number' && startMs >= 0) {
      return `${base}?t=${(startMs / 1000).toFixed(3)}`;
    }
    return base;
  }

  return null;
}

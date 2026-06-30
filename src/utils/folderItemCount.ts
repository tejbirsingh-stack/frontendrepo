import type { MediaItem } from '../data/mockMedia';

export function getFolderChildCount(
  folderId: string,
  mediaItems: MediaItem[],
  options?: {
    workspaceId?: string;
    trashedIds?: Set<string>;
  },
): number {
  return mediaItems.filter((item) => {
    if (item.parentFolderId !== folderId) return false;
    if (options?.workspaceId && item.workspaceId !== options.workspaceId) return false;
    if (options?.trashedIds?.has(item.id)) return false;
    return true;
  }).length;
}

export function formatFolderItemCount(count: number): string {
  return `${count} ${count === 1 ? 'item' : 'items'}`;
}

import type { MediaItem, MediaLocation } from '../data/mockMedia';
import type { SidebarSelection } from '../types/sidebarSelection';

export function isProjectSidebarSelection(selection: SidebarSelection): boolean {
  return selection.browseMode === 'projects' || selection.folderId.startsWith('project-');
}

/** Sidebar placement for an item — project tree vs files & folders tree. */
export function getMediaSidebarPlacement(
  item: MediaItem,
  selection: SidebarSelection,
): MediaLocation | null {
  if (isProjectSidebarSelection(selection)) {
    if (item.projectLocation?.folderId === selection.folderId) {
      return item.projectLocation;
    }
    if (item.location?.folderId.startsWith('project-')) {
      return item.location;
    }
    return null;
  }

  return item.location ?? null;
}

export function getProjectLabel(
  projectLocation: MediaLocation | null | undefined,
  projectFolders: { id: string; label: string }[],
): string | null {
  if (!projectLocation?.folderId) return null;
  return projectFolders.find((folder) => folder.id === projectLocation.folderId)?.label ?? null;
}

export function formatProjectLocationLabel(
  projectLocation: MediaLocation | null | undefined,
  projectFolders: { id: string; label: string }[],
): string | null {
  return getProjectLabel(projectLocation, projectFolders);
}

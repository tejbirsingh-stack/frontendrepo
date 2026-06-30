import type { MediaItem, SidebarFolder } from '../data/mockMedia';
import type { SidebarBrowseMode } from '../types/sidebarSelection';
import { getMediaFileName } from './mediaFileName';
import {
  getAllFilesBucketItems,
  getArchiveYearItems,
} from './sidebarTree';

export {
  ALL_FILES_BUCKET_LABELS,
  belongsToPersonal,
  belongsToProject,
  filterMediaBySidebarSelection,
  getAllFilesBucketForType,
  getAllFilesBucketItems,
  getArchiveYearFromItem,
  getArchiveYearItems,
  getMediaFolderOpenKey,
  getMediaLibraryFolderChildren,
  getPersonalRootItems,
  getProjectRootItems,
  getSidebarChildKey,
  getSidebarSelectionTitle,
  matchesAllFilesBucket,
  matchesArchiveYear,
  matchesSidebarSelection,
} from './sidebarTree';

export function getMediaInSidebarChild(
  items: MediaItem[],
  folder: SidebarFolder,
  childLabel: string,
  _browseMode: SidebarBrowseMode,
  workspaceId: string,
  trashedIds: Set<string>,
): MediaItem[] {
  if (folder.id === 'all-files') {
    return getAllFilesBucketItems(childLabel, items, workspaceId, trashedIds);
  }

  if (folder.id === 'archive') {
    return getArchiveYearItems(childLabel, items, workspaceId, trashedIds);
  }

  return items
    .filter(
      (item) =>
        item.workspaceId === workspaceId &&
        !trashedIds.has(item.id) &&
        item.location?.folderId === folder.id &&
        item.location?.childLabel === childLabel,
    )
    .sort((a, b) => a.title.localeCompare(b.title));
}

export function filterSidebarChildMediaBySearch(
  childMedia: MediaItem[],
  childLabel: string,
  searchQuery: string,
): MediaItem[] {
  const query = searchQuery.trim().toLowerCase();
  if (!query) return childMedia;
  if (childLabel.toLowerCase().includes(query)) return childMedia;
  return childMedia.filter((item) => {
    const fileName = getMediaFileName(item).toLowerCase();
    return item.title.toLowerCase().includes(query) || fileName.includes(query);
  });
}

export function filterMediaLibraryFolderChildrenBySearch(
  children: MediaItem[],
  folderTitle: string,
  searchQuery: string,
): MediaItem[] {
  const query = searchQuery.trim().toLowerCase();
  if (!query) return children;
  if (folderTitle.toLowerCase().includes(query)) return children;
  return children.filter((item) => {
    const fileName = getMediaFileName(item).toLowerCase();
    return item.title.toLowerCase().includes(query) || fileName.includes(query);
  });
}

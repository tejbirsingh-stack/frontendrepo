import { CURRENT_USER } from '../constants/currentUser';
import type { SidebarFolder } from '../data/mockMedia';
import type { SidebarSelection } from '../types/sidebarSelection';

export function isFolderOwnedByCurrentUser(folder: SidebarFolder | undefined): boolean {
  if (!folder) return false;
  if (folder.createdByEmail?.toLowerCase() === CURRENT_USER.email.toLowerCase()) {
    return true;
  }
  if (folder.projectAdminName === CURRENT_USER.name) {
    return true;
  }
  return false;
}

export function isProjectSelection(selection: SidebarSelection): boolean {
  return selection.browseMode === 'projects' || selection.folderId.startsWith('project-');
}

function getSelectedFolder(
  selection: SidebarSelection,
  folders: SidebarFolder[],
  projectFolders: SidebarFolder[],
): SidebarFolder | undefined {
  const primaryList = selection.browseMode === 'projects' ? projectFolders : folders;
  const directMatch = primaryList.find((item) => item.id === selection.folderId);
  if (directMatch) return directMatch;

  // Fallback when browse mode and folder location are out of sync.
  return [...projectFolders, ...folders].find((item) => item.id === selection.folderId);
}

export function canInviteTeamMembersToFolderSelection(
  selection: SidebarSelection | null,
  folders: SidebarFolder[],
  projectFolders: SidebarFolder[],
  options?: { isFavoritesView?: boolean },
): boolean {
  if (options?.isFavoritesView) return false;
  if (!selection) return false;

  const folder = getSelectedFolder(selection, folders, projectFolders);
  if (!folder) return false;

  if (isProjectSelection(selection)) {
    return isFolderOwnedByCurrentUser(folder);
  }

  if (selection.browseMode !== 'files-folders') return false;
  return isFolderOwnedByCurrentUser(folder);
}

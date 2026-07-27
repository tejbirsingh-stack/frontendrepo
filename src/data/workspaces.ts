import type { SidebarFolder } from './mockMedia';
import { cv, palette } from '../theme/cssVars';
import { CURRENT_USER } from '../constants/currentUser';

export interface Workspace {
  id: string;
  name: string;
  description: string;
  color: string;
  folders: SidebarFolder[];
  projectFolders: SidebarFolder[];
}

function projectFolder(
  id: string,
  label: string,
  ownerEmail?: string,
  projectAdminName?: string,
): SidebarFolder {
  return {
    id,
    label,
    ...(ownerEmail ? { createdByEmail: ownerEmail } : {}),
    ...(projectAdminName ? { projectAdminName } : {}),
  };
}

const noahFolders: SidebarFolder[] = [];
const noahProjectFolders: SidebarFolder[] = [];
const clientMediaFolders: SidebarFolder[] = [];
const clientProjectFolders: SidebarFolder[] = [];
const personalArchiveFolders: SidebarFolder[] = [];
const personalProjectFolders: SidebarFolder[] = [];

export const initialWorkspaces: Workspace[] = [];

export const defaultWorkspaceFolders: SidebarFolder[] = [];
export const defaultWorkspaceProjectFolders: SidebarFolder[] = [];

function mergeFolderMetadata(folder: SidebarFolder, seed?: SidebarFolder): SidebarFolder {
  if (!seed) return folder;
  return {
    ...folder,
    createdByEmail: folder.createdByEmail ?? seed.createdByEmail,
    projectAdminName: folder.projectAdminName ?? seed.projectAdminName,
  };
}

function mergeWorkspaceFolderLists(
  folders: SidebarFolder[],
  seedFolders: SidebarFolder[],
): SidebarFolder[] {
  return folders.map((folder) =>
    mergeFolderMetadata(folder, seedFolders.find((seed) => seed.id === folder.id)),
  );
}

/** Backfill invite metadata on folders when workspace state predates new fields. */
export function mergeWorkspaceFolderMetadata(
  workspaces: Workspace[],
  seedWorkspaces: Workspace[] = initialWorkspaces,
): Workspace[] {
  return workspaces.map((workspace) => {
    const seed = seedWorkspaces.find((item) => item.id === workspace.id);
    if (!seed) return workspace;

    return {
      ...workspace,
      folders: mergeWorkspaceFolderLists(workspace.folders, seed.folders),
      projectFolders: mergeWorkspaceFolderLists(workspace.projectFolders, seed.projectFolders),
    };
  });
}

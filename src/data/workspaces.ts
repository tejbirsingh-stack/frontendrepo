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

const noahFolders: SidebarFolder[] = [
  {
    id: 'all-files',
    label: 'All Files',
    children: ['Documents', 'Images', 'Videos', 'Audio'],
  },
  {
    id: 'personal',
    label: 'Personal',
  },
  {
    id: 'archive',
    label: 'Archive',
    children: ['2026', '2025', '2024', '2023', '2022'],
  },
];

const noahProjectFolders: SidebarFolder[] = [
  projectFolder('project-brand-reel', 'Brand Reel Q1', CURRENT_USER.email, CURRENT_USER.name),
  projectFolder('project-product-launch', 'Product Launch', undefined, 'Priya Sharma'),
  projectFolder('project-noah-rebrand', 'NOAH Rebrand', CURRENT_USER.email, CURRENT_USER.name),
  projectFolder('project-client-work', 'Client Work', CURRENT_USER.email, CURRENT_USER.name),
];

const clientMediaFolders: SidebarFolder[] = [
  {
    id: 'all-files',
    label: 'All Files',
    children: ['Documents', 'Images', 'Videos', 'Audio'],
  },
  {
    id: 'personal',
    label: 'Personal',
  },
  {
    id: 'archive',
    label: 'Archive',
    children: ['2026', '2025', '2024'],
  },
];

const clientProjectFolders: SidebarFolder[] = [
  projectFolder('project-acme-campaign', 'Acme Corp Campaign'),
  projectFolder('project-northwind-launch', 'Northwind Launch'),
  projectFolder('project-globex-rebrand', 'Globex Rebrand'),
];

const personalArchiveFolders: SidebarFolder[] = [
  {
    id: 'all-files',
    label: 'All Files',
    children: ['Documents', 'Images', 'Videos', 'Audio'],
  },
  {
    id: 'personal',
    label: 'Personal',
  },
  {
    id: 'archive',
    label: 'Archive',
    children: ['2026', '2025', '2024', '2023'],
  },
];

const personalProjectFolders: SidebarFolder[] = [
  projectFolder('project-travel-2024', 'Travel 2024', CURRENT_USER.email, CURRENT_USER.name),
  projectFolder('project-family-album', 'Family Album', CURRENT_USER.email, CURRENT_USER.name),
];

export const initialWorkspaces: Workspace[] = [
  {
    id: 'noah',
    name: 'Noah Workspace',
    description: 'Primary media workspace for NOAH production assets.',
    color: palette.green,
    folders: noahFolders,
    projectFolders: noahProjectFolders,
  },
  {
    id: 'client-media',
    name: 'Client Media',
    description: 'Client deliverables, campaigns, and shared brand assets.',
    color: palette.red,
    folders: clientMediaFolders,
    projectFolders: clientProjectFolders,
  },
  {
    id: 'personal',
    name: 'Personal Archive',
    description: 'Personal photos, notes, and archived side projects.',
    color: cv.brandBlue,
    folders: personalArchiveFolders,
    projectFolders: personalProjectFolders,
  },
];

export const defaultWorkspaceFolders: SidebarFolder[] = [
  {
    id: 'all-files',
    label: 'All Files',
    children: ['Documents', 'Images', 'Videos', 'Audio'],
  },
  {
    id: 'personal',
    label: 'Personal',
  },
  {
    id: 'archive',
    label: 'Archive',
    children: ['2026', '2025', '2024'],
  },
];

export const defaultWorkspaceProjectFolders: SidebarFolder[] = [
  projectFolder('project-new', 'New Project'),
];

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

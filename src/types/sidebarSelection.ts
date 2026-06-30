export type SidebarBrowseMode = 'files-folders' | 'projects';

export interface SidebarSelection {
  browseMode: SidebarBrowseMode;
  folderId: string;
  folderLabel: string;
  childLabel?: string;
}

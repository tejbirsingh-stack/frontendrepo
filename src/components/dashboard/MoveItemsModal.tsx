import { useEffect, useMemo, useState } from 'react';
import { cv } from '../../theme/cssVars';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import WorkOutlineOutlinedIcon from '@mui/icons-material/WorkOutlineOutlined';
import WorkspacesOutlinedIcon from '@mui/icons-material/WorkspacesOutlined';
import type { MediaItem } from '../../data/mockMedia';
import type { Workspace } from '../../data/workspaces';
import { isYearOrMonthFolder } from '../../utils/dateFolder';
import {
  PROJECT_ACCENT_COLOR,
  resolveFolderColor,
} from '../../utils/folderColorStyle';

export type MoveDestination =
  | { kind: 'folder'; folderId: string; workspaceId: string }
  | { kind: 'project'; projectId: string; workspaceId: string };

type DestinationSubTab = 'folder' | 'project';

interface MoveItemsModalProps {
  open: boolean;
  itemCount: number;
  /** Item being moved — used to exclude itself from folder destinations. */
  excludeItemId?: string;
  mediaItems: MediaItem[];
  workspaces: Workspace[];
  activeWorkspaceId: string;
  trashedIds: Set<string>;
  onClose: () => void;
  onMove: (destination: MoveDestination) => void;
}

const dialogPaperSx = {
  borderRadius: '20px',
  border: '1px solid var(--noah-border)',
  background: 'var(--noah-dialog-surface)',
  backdropFilter: 'blur(40px) saturate(180%)',
  boxShadow: cv.dialogShadow,
  maxWidth: 480,
};

const tabRowSx = {
  display: 'flex',
  gap: 0.5,
  p: 0.5,
  borderRadius: '12px',
  backgroundColor: cv.surface,
  border: `1px solid ${cv.border}`,
  mb: 1.5,
};

function tabButtonSx(active: boolean) {
  return {
    flex: 1,
    border: 'none',
    borderRadius: '8px',
    px: 1.5,
    py: 0.85,
    fontSize: '0.8125rem',
    fontWeight: active ? 600 : 500,
    cursor: 'pointer',
    color: active ? cv.textPrimary : cv.textSecondary,
    backgroundColor: active ? cv.purpleSelectionHover : 'transparent',
    boxShadow: active ? `inset 0 0 0 1px ${cv.purpleSelectionStrong}` : 'none',
    transition: 'background-color 0.15s ease, color 0.15s ease',
    '&:hover': {
      color: cv.textPrimary,
      backgroundColor: active ? cv.purpleSelectionMedium : cv.glassBackground,
    },
  };
}

function listButtonSx(selected: boolean) {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: 1.25,
    width: '100%',
    textAlign: 'left' as const,
    border: selected ? `1px solid ${cv.purpleFocusBorder}` : '1px solid transparent',
    borderRadius: '10px',
    px: 1.25,
    py: 1,
    mb: 0.5,
    cursor: 'pointer',
    backgroundColor: selected ? cv.purpleSelectionSoft : 'transparent',
    color: cv.textPrimary,
    '&:hover': {
      backgroundColor: selected ? cv.purpleSelectionHover : cv.surfaceHover,
    },
  };
}

function destinationFolders(
  mediaItems: MediaItem[],
  workspaceId: string,
  trashedIds: Set<string>,
  excludeItemId?: string,
): MediaItem[] {
  return mediaItems
    .filter(
      (item) =>
        item.workspaceId === workspaceId &&
        item.type === 'folder' &&
        !item.isProject &&
        !isYearOrMonthFolder(item) &&
        !trashedIds.has(item.id) &&
        item.id !== excludeItemId,
    )
    .sort((a, b) => a.title.localeCompare(b.title));
}

function destinationProjects(
  mediaItems: MediaItem[],
  workspaceId: string,
  trashedIds: Set<string>,
  excludeItemId?: string,
): MediaItem[] {
  return mediaItems
    .filter(
      (item) =>
        item.workspaceId === workspaceId &&
        item.isProject &&
        !trashedIds.has(item.id) &&
        item.id !== excludeItemId,
    )
    .sort((a, b) => a.title.localeCompare(b.title));
}

function destinationFoldersForWorkspace(
  workspace: Workspace,
  mediaItems: MediaItem[],
  trashedIds: Set<string>,
  excludeItemId?: string,
): Array<{ id: string; title: string; folderColor?: string }> {
  const fromMedia = destinationFolders(mediaItems, workspace.id, trashedIds, excludeItemId);
  if (fromMedia.length > 0) {
    return fromMedia.map((item) => ({
      id: item.id,
      title: item.title,
      folderColor: item.folderColor,
    }));
  }

  return (workspace.folders || [])
    .filter((folder) => folder.id !== excludeItemId)
    .filter((folder) => !isYearOrMonthFolder({ type: 'folder', title: folder.label }))
    .map((folder) => ({
      id: folder.id,
      title: folder.label,
      folderColor: folder.color,
    }))
    .sort((a, b) => a.title.localeCompare(b.title));
}

function destinationProjectsForWorkspace(
  workspace: Workspace,
  mediaItems: MediaItem[],
  trashedIds: Set<string>,
  excludeItemId?: string,
): Array<{ id: string; title: string }> {
  const fromMedia = destinationProjects(mediaItems, workspace.id, trashedIds, excludeItemId);
  if (fromMedia.length > 0) {
    return fromMedia.map((item) => ({
      id: item.id,
      title: item.title,
    }));
  }

  return (workspace.projectFolders || [])
    .filter((project) => project.id !== excludeItemId)
    .map((project) => ({
      id: project.id,
      title: project.label,
    }))
    .sort((a, b) => a.title.localeCompare(b.title));
}

export default function MoveItemsModal({
  open,
  itemCount,
  excludeItemId,
  mediaItems,
  workspaces,
  activeWorkspaceId,
  trashedIds,
  onClose,
  onMove,
}: MoveItemsModalProps) {
  const [destinationSubTab, setDestinationSubTab] = useState<DestinationSubTab>('folder');
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState(activeWorkspaceId);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setDestinationSubTab('folder');
    setSelectedWorkspaceId(activeWorkspaceId);
    setSelectedFolderId(null);
    setSelectedProjectId(null);
  }, [open, activeWorkspaceId]);

  const selectedWorkspace = useMemo(
    () =>
      workspaces.find((workspace) => workspace.id === selectedWorkspaceId) ??
      workspaces.find((workspace) => workspace.id === activeWorkspaceId) ??
      workspaces[0],
    [activeWorkspaceId, selectedWorkspaceId, workspaces],
  );

  const workspaceFolders = useMemo(
    () =>
      selectedWorkspace
        ? destinationFoldersForWorkspace(selectedWorkspace, mediaItems, trashedIds, excludeItemId)
        : [],
    [excludeItemId, mediaItems, selectedWorkspace, trashedIds],
  );

  const workspaceProjects = useMemo(
    () =>
      selectedWorkspace
        ? destinationProjectsForWorkspace(selectedWorkspace, mediaItems, trashedIds, excludeItemId)
        : [],
    [excludeItemId, mediaItems, selectedWorkspace, trashedIds],
  );

  const canMove =
    destinationSubTab === 'folder'
      ? Boolean(selectedFolderId)
      : Boolean(selectedProjectId);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!canMove) return;

    if (destinationSubTab === 'folder' && selectedFolderId) {
      onMove({
        kind: 'folder',
        folderId: selectedFolderId,
        workspaceId: selectedWorkspaceId,
      });
    } else if (destinationSubTab === 'project' && selectedProjectId) {
      onMove({
        kind: 'project',
        projectId: selectedProjectId,
        workspaceId: selectedWorkspaceId,
      });
    } else {
      return;
    }

    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      aria-labelledby="move-items-title"
      slotProps={{
        paper: { sx: dialogPaperSx },
        backdrop: {
          sx: { backgroundColor: cv.backdropScrim, backdropFilter: 'blur(4px)' },
        },
      }}
    >
      <Box component="form" onSubmit={handleSubmit}>
        <DialogTitle
          id="move-items-title"
          sx={{
            pb: 0.5,
            fontWeight: 600,
            fontSize: '1.5rem',
            color: cv.textPrimary,
          }}
        >
          Move items
        </DialogTitle>
        <DialogContent sx={{ pt: '8px !important' }}>
          <Typography variant="body2" sx={{ color: cv.textSecondary, mb: 2 }}>
            Choose where to move {itemCount} {itemCount === 1 ? 'item' : 'items'}.
          </Typography>

          <Typography
            sx={{
              fontSize: '0.75rem',
              fontWeight: 600,
              color: cv.textMuted,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              mb: 1,
            }}
          >
            1. Select workspace
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2.5 }}>
            {workspaces.map((workspace) => {
              const selected = selectedWorkspaceId === workspace.id;
              return (
                <Box
                  key={workspace.id}
                  component="button"
                  type="button"
                  onClick={() => {
                    setSelectedWorkspaceId(workspace.id);
                    setSelectedFolderId(null);
                    setSelectedProjectId(null);
                  }}
                  sx={{
                    ...listButtonSx(selected),
                    alignItems: 'flex-start',
                    mb: 0,
                    border: selected
                      ? `1px solid ${cv.purpleFocusBorder}`
                      : `1px solid ${cv.border}`,
                  }}
                >
                  <WorkspacesOutlinedIcon
                    sx={{
                      fontSize: 20,
                      color: workspace.color || cv.brandPurple,
                      mt: 0.15,
                      flexShrink: 0,
                    }}
                  />
                  <Box sx={{ minWidth: 0 }}>
                    <Typography
                      sx={{
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        color: cv.textPrimary,
                      }}
                    >
                      {workspace.name}
                    </Typography>
                    {workspace.description ? (
                      <Typography
                        sx={{
                          fontSize: '0.75rem',
                          color: cv.textMuted,
                          mt: 0.25,
                        }}
                      >
                        {workspace.description}
                      </Typography>
                    ) : null}
                  </Box>
                </Box>
              );
            })}
          </Box>

          <Typography
            sx={{
              fontSize: '0.75rem',
              fontWeight: 600,
              color: cv.textMuted,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              mb: 1,
            }}
          >
            2. Move into folder or project
          </Typography>

          <Box sx={tabRowSx} role="tablist" aria-label="Move into folder or project">
            {(
              [
                { value: 'folder', label: 'Folder' },
                { value: 'project', label: 'Project' },
              ] as const
            ).map((option) => (
              <Box
                key={option.value}
                component="button"
                type="button"
                role="tab"
                aria-selected={destinationSubTab === option.value}
                onClick={() => {
                  setDestinationSubTab(option.value);
                  setSelectedFolderId(null);
                  setSelectedProjectId(null);
                }}
                sx={tabButtonSx(destinationSubTab === option.value)}
              >
                {option.label}
              </Box>
            ))}
          </Box>

          <Box sx={{ maxHeight: 240, overflowY: 'auto', pr: 0.5 }}>
            {destinationSubTab === 'folder' ? (
              workspaceFolders.length === 0 ? (
                <Typography
                  sx={{ fontSize: '0.875rem', color: cv.textMuted, py: 2, textAlign: 'center' }}
                >
                  No folders available
                </Typography>
              ) : (
                workspaceFolders.map((folder) => {
                  const color = resolveFolderColor(folder.folderColor);
                  const selected = selectedFolderId === folder.id;
                  return (
                    <Box
                      key={folder.id}
                      component="button"
                      type="button"
                      onClick={() => {
                        setSelectedFolderId(folder.id);
                        setSelectedProjectId(null);
                      }}
                      sx={listButtonSx(selected)}
                    >
                      <FolderOutlinedIcon sx={{ fontSize: 18, color, flexShrink: 0 }} />
                      <Typography
                        noWrap
                        sx={{ fontSize: '0.875rem', fontWeight: selected ? 600 : 500 }}
                      >
                        {folder.title}
                      </Typography>
                    </Box>
                  );
                })
              )
            ) : workspaceProjects.length === 0 ? (
              <Typography
                sx={{ fontSize: '0.875rem', color: cv.textMuted, py: 2, textAlign: 'center' }}
              >
                No projects available
              </Typography>
            ) : (
              workspaceProjects.map((project) => {
                const selected = selectedProjectId === project.id;
                return (
                  <Box
                    key={project.id}
                    component="button"
                    type="button"
                    onClick={() => {
                      setSelectedProjectId(project.id);
                      setSelectedFolderId(null);
                    }}
                    sx={listButtonSx(selected)}
                  >
                    <WorkOutlineOutlinedIcon
                      sx={{ fontSize: 18, color: PROJECT_ACCENT_COLOR, flexShrink: 0 }}
                    />
                    <Typography
                      noWrap
                      sx={{ fontSize: '0.875rem', fontWeight: selected ? 600 : 500 }}
                    >
                      {project.title}
                    </Typography>
                  </Box>
                );
              })
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, pt: 1, gap: 1 }}>
          <Button
            type="button"
            onClick={onClose}
            sx={{
              color: cv.textSecondary,
              borderRadius: '10px',
              '&:hover': { backgroundColor: cv.surfaceHover },
            }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={!canMove}
            sx={{
              borderRadius: '10px',
              px: 2.5,
              background: cv.brandGradient,
              boxShadow: cv.brandShadow,
              '&:hover': { background: cv.brandGradientHover },
              '&.Mui-disabled': {
                background: cv.surfaceHover,
                color: cv.textMuted,
              },
            }}
          >
            Move
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}

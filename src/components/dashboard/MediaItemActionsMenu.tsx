import toast from 'react-hot-toast';
import { useState, type MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { PERMISSIONS, hasPermission, canDeleteFolder } from '../../constants/permissions';
import { cv } from '../../theme/cssVars';
import {
  Box,
  IconButton,
  ListItemIcon,
  Menu,
  MenuItem,
  Tooltip,
  Typography,
  Divider,
  type SxProps,
  type Theme,
} from '@mui/material';
import { parseFileReviewStatus, getFileReviewStatusColor } from '../../constants/fileReviewStatus';
import FolderOpenOutlinedIcon from '@mui/icons-material/FolderOpenOutlined';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline';
import DriveFileMoveOutlinedIcon from '@mui/icons-material/DriveFileMoveOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import PaletteOutlinedIcon from '@mui/icons-material/PaletteOutlined';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import StarIcon from '@mui/icons-material/Star';
import StarBorderOutlinedIcon from '@mui/icons-material/StarBorderOutlined';
import type { MediaItem } from '../../data/mockMedia';
import { useDashboard } from '../../context/DashboardContext';
import RenameMediaModal from './RenameMediaModal';
import TrashConfirmModal from './TrashConfirmModal';
import WorkspaceColorPicker from './WorkspaceColorPicker';
import MoveItemsModal, { type MoveDestination } from './MoveItemsModal';
import { FOLDER_COLORS } from '../../constants/folderColors';
import { resolveFolderColor } from '../../utils/folderColorStyle';

import { ROLE_IDS } from '../../constants/userRoles';
import { apiClient } from '../../api/client';
import FolderDeleteFlowModal from '../modals/FolderDeleteFlowModal';
import SuperAdminFolderDeleteFlowModal from '../modals/SuperAdminFolderDeleteFlowModal';

const menuPaperSx = {
  mt: 0.5,
  minWidth: 160,
  borderRadius: '12px',
  border: "1px solid var(--noah-border)",
  background: 'var(--noah-popover-surface)',
  backdropFilter: 'blur(20px)',
  boxShadow: cv.dropdownShadow,
};

const consumeMenuPointerEvent = (event: MouseEvent) => {
  event.stopPropagation();
  event.preventDefault();
}

interface MediaItemActionsMenuProps {
  item: MediaItem;
  buttonSx?: SxProps<Theme>;
}

export default function MediaItemActionsMenu({ item, buttonSx }: MediaItemActionsMenuProps) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const triggerDownload = async (url: string, fallbackName: string) => {
    try {
      const { getAccessToken } = await import('../../auth/authTokenBridge');
      const token = getAccessToken();
      const finalUrl = token ? `${url}${url.includes('?') ? '&' : '?'}token=${token}` : url;
      
      const anchor = document.createElement('a');
      anchor.href = finalUrl;
      anchor.download = fallbackName;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
    } catch (err) {
      console.error('Download error:', err);
      import('react-hot-toast').then(({ default: toast }) => toast.error('Download failed. Please try again.'));
    }
  };

  const {
    renameMedia,
    moveMediaToTrash,
    removeFolderAndItemsFromState,
    moveMediaToDashboardFolder,
    moveMediaToWorkspaceFolder,
    updateMediaFolderColor,
    updateMediaProjectLocation,
    activeWorkspace,
    toggleFavorite,
    favorites,
    mediaItems,
    workspaces,
    activeWorkspaceId,
    trashedIds,
  } = useDashboard();
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [folderDeleteOpen, setFolderDeleteOpen] = useState(false);
  const [superAdminFolderDeleteOpen, setSuperAdminFolderDeleteOpen] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);
  const [colorPickerAnchor, setColorPickerAnchor] = useState<null | HTMLElement>(null);
  const isFolder = item.type === 'folder';
  const isRestoreFolder =
    isFolder &&
    ((item.title && item.title.trim().toLowerCase() === 'restore') ||
     (item.name && item.name.trim().toLowerCase() === 'restore'));

  const isSuperAdmin =
    user?.role === 'Super Admin' ||
    user?.roleId === ROLE_IDS.SUPER_ADMIN ||
    user?.role === 'super_admin';

  const status = parseFileReviewStatus(
    (item.customMetadata as { reviewStatus?: unknown } | undefined)?.reviewStatus ??
      (item as { reviewStatus?: unknown }).reviewStatus,
  );
  const statusColor = getFileReviewStatusColor(status);

  const closeMenu = () => setMenuAnchor(null);

  const openRename = () => {
    closeMenu();
    if (isRestoreFolder) {
      toast.error("The 'Restore' folder is protected and cannot be renamed.");
      return;
    }
    setRenameOpen(true);
  };

  const openDelete = () => {
    closeMenu();
    if (isRestoreFolder) {
      toast.error("The 'Restore' folder is protected and cannot be deleted.");
      return;
    }
    if (isFolder) {
      if (isSuperAdmin) {
        setSuperAdminFolderDeleteOpen(true);
      } else {
        setFolderDeleteOpen(true);
      }
    } else {
      setDeleteOpen(true);
    }
  };

  const openColorPicker = () => {
    setColorPickerAnchor(menuAnchor);
    closeMenu();
  };

  const openMove = () => {
    closeMenu();
    if (isRestoreFolder) {
      toast.error("The 'Restore' folder is protected and cannot be moved.");
      return;
    }
    setMoveOpen(true);
  };

  const closeColorPicker = () => {
    setColorPickerAnchor(null);
  };

  const handleMove = (destination: MoveDestination) => {
    setMoveOpen(false);

    if (isRestoreFolder) {
      toast.error("The 'Restore' folder is protected and cannot be moved.");
      return;
    }
    if (destination.kind === 'project') {
      const performAssignAndMove = async () => {
        // Cross-workspace: physically move the item to the project's parent folder first,
        // then link it to the project. Same-workspace: link only (no physical move).
        if (destination.workspaceId !== activeWorkspaceId && destination.targetFolderId !== undefined) {
          await moveMediaToWorkspaceFolder(
            [item.id],
            destination.workspaceId,
            destination.targetFolderId || null,
          );
        }
        void updateMediaProjectLocation(item.id, { folderId: destination.projectId }, item.type);
      };
      void performAssignAndMove();
      return;
    }

    if (destination.workspaceId === activeWorkspaceId) {
      moveMediaToDashboardFolder([item.id], destination.folderId);
      return;
    }

    moveMediaToWorkspaceFolder([item.id], destination.workspaceId, destination.folderId);
  };

  return (
    <Box
      component="span"
      onClick={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
      sx={{ display: 'inline-flex', flexShrink: 0 }}
    >
      <Tooltip title="More options" arrow placement="top">
        <IconButton
          size="small"
          aria-label={`More options for ${item.title}`}
          onClick={(event) => {
            event.stopPropagation();
            setMenuAnchor(event.currentTarget);
          }}
          onMouseDown={(event) => event.stopPropagation()}
          sx={{
            width: 28,
            height: 28,
            flexShrink: 0,
            color: cv.textMuted,
            '&:hover': {
              color: cv.textPrimary,
              backgroundColor: cv.surfaceHover,
            },
            ...buttonSx,
          }}
        >
          <MoreVertIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={closeMenu}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: { sx: menuPaperSx },
          list: {
            onClick: (event: MouseEvent) => event.stopPropagation(),
            onMouseDown: (event: MouseEvent) => event.stopPropagation(),
          },
        }}
      >
        {!isFolder && !item.isProject && status !== 'New' && (
          <Box
            sx={{
              px: 2,
              py: 1.5,
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
            }}
          >
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: statusColor,
                boxShadow: status === 'Approved' ? `0 0 6px ${statusColor}` : 'none',
              }}
            />
            <Typography
              sx={{
                fontSize: '0.75rem',
                fontWeight: 600,
                color: cv.textSecondary,
                textTransform: 'uppercase',
                letterSpacing: '0.03em',
              }}
            >
              Status: {status}
            </Typography>
          </Box>
        )}
        {!isFolder && !item.isProject && status !== 'New' && <Divider sx={{ my: 0.5, borderColor: 'var(--noah-border)' }} />}

        {isFolder ? (
          <MenuItem
            disabled={!hasPermission(user, PERMISSIONS.EDIT_METADATA_TAGS)}
            onClick={(event) => {
              if (!hasPermission(user, PERMISSIONS.EDIT_METADATA_TAGS)) return;
              consumeMenuPointerEvent(event);
              openColorPicker();
            }}
            onMouseDown={consumeMenuPointerEvent}
            sx={{
              py: 1,
              fontSize: '0.875rem',
              color: !hasPermission(user, PERMISSIONS.EDIT_METADATA_TAGS) ? cv.textMuted : cv.textSecondary,
              opacity: !hasPermission(user, PERMISSIONS.EDIT_METADATA_TAGS) ? 0.6 : 1,
              cursor: !hasPermission(user, PERMISSIONS.EDIT_METADATA_TAGS) ? 'not-allowed' : 'pointer',
              '&:hover': { backgroundColor: !hasPermission(user, PERMISSIONS.EDIT_METADATA_TAGS) ? 'transparent' : cv.surfaceHover },
            }}
          >
            <ListItemIcon sx={{ minWidth: 32 }}>
              <PaletteOutlinedIcon sx={{ fontSize: 18, color: !hasPermission(user, PERMISSIONS.EDIT_METADATA_TAGS) ? cv.textMuted : cv.textSecondary }} />
            </ListItemIcon>
            Change color
          </MenuItem>
        ) : null}
        {!item.isProject ? (
          <MenuItem
            disabled={!hasPermission(user, PERMISSIONS.EDIT_METADATA_TAGS) || isRestoreFolder}
            onClick={(event) => {
              if (!hasPermission(user, PERMISSIONS.EDIT_METADATA_TAGS) || isRestoreFolder) return;
              consumeMenuPointerEvent(event);
              openMove();
            }}
            onMouseDown={consumeMenuPointerEvent}
            sx={{
              py: 1,
              fontSize: '0.875rem',
              color: (!hasPermission(user, PERMISSIONS.EDIT_METADATA_TAGS) || isRestoreFolder) ? cv.textMuted : cv.textSecondary,
              opacity: (!hasPermission(user, PERMISSIONS.EDIT_METADATA_TAGS) || isRestoreFolder) ? 0.6 : 1,
              cursor: (!hasPermission(user, PERMISSIONS.EDIT_METADATA_TAGS) || isRestoreFolder) ? 'not-allowed' : 'pointer',
              '&:hover': { backgroundColor: (!hasPermission(user, PERMISSIONS.EDIT_METADATA_TAGS) || isRestoreFolder) ? 'transparent' : cv.surfaceHover },
            }}
          >
            <ListItemIcon sx={{ minWidth: 32 }}>
              <DriveFileMoveOutlinedIcon sx={{ fontSize: 18, color: (!hasPermission(user, PERMISSIONS.EDIT_METADATA_TAGS) || isRestoreFolder) ? cv.textMuted : cv.textSecondary }} />
            </ListItemIcon>
            Move
          </MenuItem>
        ) : null}
        <MenuItem
          onClick={(event) => {
            consumeMenuPointerEvent(event);
            toggleFavorite(item.id, item.isProject ? 'project' : (isFolder ? 'folder' : 'asset'));
            closeMenu();
          }}
          onMouseDown={consumeMenuPointerEvent}
          sx={{
            py: 1,
            fontSize: '0.875rem',
            color: cv.textSecondary,
            '&:hover': { backgroundColor: cv.surfaceHover },
          }}
        >
          <ListItemIcon sx={{ minWidth: 32 }}>
            {favorites.has(item.id) ? (
              <StarIcon sx={{ fontSize: 18, color: cv.warning }} />
            ) : (
              <StarBorderOutlinedIcon sx={{ fontSize: 18, color: cv.textSecondary }} />
            )}
          </ListItemIcon>
          {favorites.has(item.id) ? 'Remove from favorites' : 'Add to favorites'}
        </MenuItem>
        <MenuItem
          onClick={(event) => {
            consumeMenuPointerEvent(event);
            if (item.parentFolderId) {
              navigate(`/home/folder/${item.parentFolderId}`);
            } else if (item.linkedProjectIds && item.linkedProjectIds.length > 0) {
              navigate(`/home/project/${item.linkedProjectIds[0]}`);
            } else {
              navigate('/home');
            }
            closeMenu();
          }}
          onMouseDown={consumeMenuPointerEvent}
          sx={{
            py: 1,
            fontSize: '0.875rem',
            color: cv.textSecondary,
            '&:hover': { backgroundColor: cv.surfaceHover },
          }}
        >
          <ListItemIcon sx={{ minWidth: 32 }}>
            <FolderOpenOutlinedIcon sx={{ fontSize: 18, color: cv.textSecondary }} />
          </ListItemIcon>
          View in location
        </MenuItem>
        <MenuItem
          disabled={!hasPermission(user, PERMISSIONS.EDIT_METADATA_TAGS) || isRestoreFolder}
          onClick={(event) => {
            if (!hasPermission(user, PERMISSIONS.EDIT_METADATA_TAGS) || isRestoreFolder) return;
            consumeMenuPointerEvent(event);
            openRename();
          }}
          onMouseDown={consumeMenuPointerEvent}
          sx={{
            py: 1,
            fontSize: '0.875rem',
            color: (!hasPermission(user, PERMISSIONS.EDIT_METADATA_TAGS) || isRestoreFolder) ? cv.textMuted : cv.textSecondary,
            opacity: (!hasPermission(user, PERMISSIONS.EDIT_METADATA_TAGS) || isRestoreFolder) ? 0.6 : 1,
            cursor: (!hasPermission(user, PERMISSIONS.EDIT_METADATA_TAGS) || isRestoreFolder) ? 'not-allowed' : 'pointer',
            '&:hover': { backgroundColor: (!hasPermission(user, PERMISSIONS.EDIT_METADATA_TAGS) || isRestoreFolder) ? 'transparent' : cv.surfaceHover },
          }}
        >
          <ListItemIcon sx={{ minWidth: 32 }}>
            <DriveFileRenameOutlineIcon sx={{ fontSize: 18, color: (!hasPermission(user, PERMISSIONS.EDIT_METADATA_TAGS) || isRestoreFolder) ? cv.textMuted : cv.textSecondary }} />
          </ListItemIcon>
          Rename
        </MenuItem>

        {item.type === 'video' ? (
          <>
            {item.compressionStatus !== 'failed' && (
              <MenuItem
                disabled={!user?.permissions?.includes('timeline_annotations')}
                onClick={(event) => {
                  if (!user?.permissions?.includes('timeline_annotations')) return;
                  consumeMenuPointerEvent(event);
                  closeMenu();
                  void triggerDownload(
                    `/api/media/${encodeURIComponent(item.id)}/download`,
                    `${item.title || item.id}.mp4`
                  );
                }}
                onMouseDown={consumeMenuPointerEvent}
                sx={{
                  py: 1,
                  fontSize: '0.875rem',
                  color: !user?.permissions?.includes('timeline_annotations') ? cv.textMuted : cv.textSecondary,
                  opacity: !user?.permissions?.includes('timeline_annotations') ? 0.6 : 1,
                  cursor: !user?.permissions?.includes('timeline_annotations') ? 'not-allowed' : 'pointer',
                  '&:hover': { backgroundColor: !user?.permissions?.includes('timeline_annotations') ? 'transparent' : cv.surfaceHover },
                }}
              >
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <DownloadOutlinedIcon sx={{ fontSize: 18, color: !user?.permissions?.includes('timeline_annotations') ? cv.textMuted : cv.textMuted }} />
                </ListItemIcon>
                Download Proxy File
              </MenuItem>
            )}

            {item.customMetadata?.originalFilePath && (
              <MenuItem
                disabled={!user?.permissions?.includes('timeline_annotations')}
                onClick={(event) => {
                  if (!user?.permissions?.includes('timeline_annotations')) return;
                  consumeMenuPointerEvent(event);
                  closeMenu();
                  void triggerDownload(
                    `/api/media/${encodeURIComponent(item.id)}/download?raw=true`,
                    `${item.title || item.id}_raw`
                  );
                }}
                onMouseDown={consumeMenuPointerEvent}
                sx={{
                  py: 1,
                  fontSize: '0.875rem',
                  color: !user?.permissions?.includes('timeline_annotations') ? cv.textMuted : cv.textSecondary,
                  opacity: !user?.permissions?.includes('timeline_annotations') ? 0.6 : 1,
                  cursor: !user?.permissions?.includes('timeline_annotations') ? 'not-allowed' : 'pointer',
                  '&:hover': { backgroundColor: !user?.permissions?.includes('timeline_annotations') ? 'transparent' : cv.surfaceHover },
                }}
              >
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <DownloadOutlinedIcon sx={{ fontSize: 18, color: !user?.permissions?.includes('timeline_annotations') ? cv.textMuted : cv.textMuted }} />
                </ListItemIcon>
                Download Original Raw File
              </MenuItem>
            )}
          </>
        ) : (
          <MenuItem
            disabled={!user?.permissions?.includes('timeline_annotations')}
            onClick={(event) => {
              if (!user?.permissions?.includes('timeline_annotations')) return;
              consumeMenuPointerEvent(event);
              closeMenu();
              void triggerDownload(
                `/api/media/${encodeURIComponent(item.id)}/download`,
                `${item.title || item.id}`
              );
            }}
            onMouseDown={consumeMenuPointerEvent}
            sx={{
              py: 1,
              fontSize: '0.875rem',
              color: !user?.permissions?.includes('timeline_annotations') ? cv.textMuted : cv.textSecondary,
              opacity: !user?.permissions?.includes('timeline_annotations') ? 0.6 : 1,
              cursor: !user?.permissions?.includes('timeline_annotations') ? 'not-allowed' : 'pointer',
              '&:hover': { backgroundColor: !user?.permissions?.includes('timeline_annotations') ? 'transparent' : cv.surfaceHover },
            }}
          >
            <ListItemIcon sx={{ minWidth: 32 }}>
              <DownloadOutlinedIcon sx={{ fontSize: 18, color: !user?.permissions?.includes('timeline_annotations') ? cv.textMuted : cv.textMuted }} />
            </ListItemIcon>
            Download File
          </MenuItem>
        )}
        {(() => {
          const isDeleteDisabled = isFolder
            ? (!canDeleteFolder(user) || isRestoreFolder)
            : !hasPermission(user, PERMISSIONS.MANAGE_TRASH);
          return (
            <MenuItem
              disabled={isDeleteDisabled}
              onClick={(e) => {
                e.stopPropagation();
                if (isDeleteDisabled) return;
                openDelete();
              }}
              onMouseDown={consumeMenuPointerEvent}
              sx={{
                py: 1,
                fontSize: '0.875rem',
                color: isDeleteDisabled ? cv.textMuted : cv.destructive,
                opacity: isDeleteDisabled ? 0.6 : 1,
                cursor: isDeleteDisabled ? 'not-allowed' : 'pointer',
                '&:hover': {
                  backgroundColor: isDeleteDisabled ? 'transparent' : cv.destructiveHover,
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 32 }}>
                <DeleteOutlinedIcon
                  sx={{
                    fontSize: 18,
                    color: isDeleteDisabled ? cv.textMuted : cv.destructive,
                  }}
                />
              </ListItemIcon>
              Delete
            </MenuItem>
          );
        })()}
      </Menu>

      <WorkspaceColorPicker
        anchorEl={colorPickerAnchor}
        open={Boolean(colorPickerAnchor)}
        title="Folder color"
        colors={FOLDER_COLORS}
        selectedColor={resolveFolderColor(item.folderColor)}
        onClose={closeColorPicker}
        onSelect={(color) => updateMediaFolderColor(item.id, color)}
      />

      <MoveItemsModal
        open={moveOpen}
        itemCount={1}
        excludeItemId={item.id}
        mediaItems={mediaItems}
        workspaces={workspaces}
        activeWorkspaceId={activeWorkspaceId}
        trashedIds={trashedIds}
        onClose={() => setMoveOpen(false)}
        onMove={handleMove}
      />

      <RenameMediaModal
        open={renameOpen}
        currentTitle={item.title}
        onClose={() => setRenameOpen(false)}
        onRename={(newTitle) => renameMedia(item.id, newTitle)}
      />

      <TrashConfirmModal
        open={deleteOpen}
        itemTitle={item.title}
        title="Delete item?"
        confirmLabel="Delete"
        requireNameConfirmation
        description="This item will be removed from your library and moved to trash. You can restore it later from the Trash view."
        onClose={() => setDeleteOpen(false)}
        onConfirm={(reason) => {
          moveMediaToTrash(item.id, reason);
          setDeleteOpen(false);
          if (window.location.pathname.startsWith('/media/')) {
            navigate('/home');
          }
        }}
      />

      <FolderDeleteFlowModal
        open={folderDeleteOpen}
        folderId={item.id}
        folderName={item.title}
        onClose={() => setFolderDeleteOpen(false)}
        onConfirmDelete={async (targetFolderId, isWholeFolder, selectedFileIds, selectedFolderIds) => {
          try {
            await apiClient.post(`/workspaces/folder/delete/${targetFolderId}`, {
              isWholeFolder,
              deleteFileIds: selectedFileIds,
              deleteFolderIds: selectedFolderIds,
            });
            removeFolderAndItemsFromState(targetFolderId, selectedFileIds, selectedFolderIds);
          } catch (err: any) {
            console.error('Failed to submit folder delete request:', err);
          }
        }}
      />

      <SuperAdminFolderDeleteFlowModal
        open={superAdminFolderDeleteOpen}
        folderId={item.id}
        folderName={item.title}
        onClose={() => setSuperAdminFolderDeleteOpen(false)}
        onConfirmPermanentDelete={async (targetFolderId, isWholeFolder, selectedFileIds, selectedFolderIds) => {
          try {
            await apiClient.post(`/workspaces/folder/delete/${targetFolderId}`, {
              isWholeFolder,
              deleteFileIds: selectedFileIds,
              deleteFolderIds: selectedFolderIds,
              isPermanent: true,
            });
            removeFolderAndItemsFromState(targetFolderId, selectedFileIds, selectedFolderIds);
          } catch (err: any) {
            console.error('Failed to execute permanent folder delete:', err);
          }
        }}
      />
    </Box>
  );
}


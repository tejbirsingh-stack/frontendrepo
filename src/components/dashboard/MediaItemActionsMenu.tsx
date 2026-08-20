import { useState, type MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { PERMISSIONS, hasPermission } from '../../constants/permissions';
import { cv } from '../../theme/cssVars';
import {
  Box,
  IconButton,
  ListItemIcon,
  Menu,
  MenuItem,
  Tooltip,
  type SxProps,
  type Theme,
} from '@mui/material';
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

const menuPaperSx = {
  mt: 0.5,
  minWidth: 160,
  borderRadius: '12px',
  border: "1px solid var(--noah-border)",
  background: 'var(--noah-popover-surface)',
  backdropFilter: 'blur(20px)',
  boxShadow: cv.dropdownShadow,
};

function consumeMenuPointerEvent(event: MouseEvent) {
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
  const {
    renameMedia,
    moveMediaToTrash,
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
  const [moveOpen, setMoveOpen] = useState(false);
  const [colorPickerAnchor, setColorPickerAnchor] = useState<null | HTMLElement>(null);
  const isFolder = item.type === 'folder';

  const closeMenu = () => setMenuAnchor(null);

  const openRename = () => {
    closeMenu();
    setRenameOpen(true);
  };

  const openDelete = () => {
    closeMenu();
    setDeleteOpen(true);
  };

  const openColorPicker = () => {
    setColorPickerAnchor(menuAnchor);
    closeMenu();
  };

  const openMove = () => {
    closeMenu();
    setMoveOpen(true);
  };

  const closeColorPicker = () => {
    setColorPickerAnchor(null);
  };

  const handleMove = (destination: MoveDestination) => {
    setMoveOpen(false);
    
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
            disabled={!hasPermission(user, PERMISSIONS.EDIT_METADATA_TAGS)}
            onClick={(event) => {
              if (!hasPermission(user, PERMISSIONS.EDIT_METADATA_TAGS)) return;
              consumeMenuPointerEvent(event);
              openMove();
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
              <DriveFileMoveOutlinedIcon sx={{ fontSize: 18, color: !hasPermission(user, PERMISSIONS.EDIT_METADATA_TAGS) ? cv.textMuted : cv.textSecondary }} />
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
          disabled={!hasPermission(user, PERMISSIONS.EDIT_METADATA_TAGS)}
          onClick={(event) => {
            if (!hasPermission(user, PERMISSIONS.EDIT_METADATA_TAGS)) return;
            consumeMenuPointerEvent(event);
            openRename();
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
            <DriveFileRenameOutlineIcon sx={{ fontSize: 18, color: !hasPermission(user, PERMISSIONS.EDIT_METADATA_TAGS) ? cv.textMuted : cv.textSecondary }} />
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
                  window.open(`/api/media/${encodeURIComponent(item.id)}/download`, '_blank');
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
                  window.open(`/api/media/${encodeURIComponent(item.id)}/download?raw=true`, '_blank');
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
              window.open(`/api/media/${encodeURIComponent(item.id)}/download`, '_blank');
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
        <MenuItem
          disabled={isFolder ? !hasPermission(user, PERMISSIONS.MANAGE_ROOT_FOLDERS) : !hasPermission(user, PERMISSIONS.MANAGE_TRASH)}
          onClick={(e) => {
            e.stopPropagation();
            if (isFolder && !hasPermission(user, PERMISSIONS.MANAGE_ROOT_FOLDERS)) return;
            if (!isFolder && !hasPermission(user, PERMISSIONS.MANAGE_TRASH)) return;
            openDelete();
          }}
          sx={{
            py: 1,
            fontSize: '0.875rem',
            color: (isFolder && !hasPermission(user, PERMISSIONS.MANAGE_ROOT_FOLDERS)) || (!isFolder && !hasPermission(user, PERMISSIONS.MANAGE_TRASH)) ? cv.textMuted : cv.destructive,
            opacity: (isFolder && !hasPermission(user, PERMISSIONS.MANAGE_ROOT_FOLDERS)) || (!isFolder && !hasPermission(user, PERMISSIONS.MANAGE_TRASH)) ? 0.6 : 1,
            cursor: (isFolder && !hasPermission(user, PERMISSIONS.MANAGE_ROOT_FOLDERS)) || (!isFolder && !hasPermission(user, PERMISSIONS.MANAGE_TRASH)) ? 'not-allowed' : 'pointer',
            '&:hover': { backgroundColor: (isFolder && !hasPermission(user, PERMISSIONS.MANAGE_ROOT_FOLDERS)) || (!isFolder && !hasPermission(user, PERMISSIONS.MANAGE_TRASH)) ? 'transparent' : cv.destructiveHover },
          }}
        >
          <ListItemIcon sx={{ minWidth: 32 }}>
            <DeleteOutlinedIcon sx={{ fontSize: 18, color: (isFolder && !hasPermission(user, PERMISSIONS.MANAGE_ROOT_FOLDERS)) || (!isFolder && !hasPermission(user, PERMISSIONS.MANAGE_TRASH)) ? cv.textMuted : cv.destructive }} />
          </ListItemIcon>
          Delete
        </MenuItem>
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
        }}
      />
    </Box>
  );
}

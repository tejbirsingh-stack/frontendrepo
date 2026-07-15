import { useState, type MouseEvent } from 'react';
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
import MoreVertIcon from '@mui/icons-material/MoreVert';
import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import PaletteOutlinedIcon from '@mui/icons-material/PaletteOutlined';
import WorkOutlineOutlinedIcon from '@mui/icons-material/WorkOutlineOutlined';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import type { MediaItem } from '../../data/mockMedia';
import { useDashboard } from '../../context/DashboardContext';
import RenameMediaModal from './RenameMediaModal';
import TrashConfirmModal from './TrashConfirmModal';
import WorkspaceColorPicker from './WorkspaceColorPicker';
import AssignProjectModal from './AssignProjectModal';
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
  const {
    renameMedia,
    moveMediaToTrash,
    updateMediaFolderColor,
    updateMediaProjectLocation,
    activeWorkspace,
  } = useDashboard();
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [assignProjectOpen, setAssignProjectOpen] = useState(false);
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

  const openAssignProject = () => {
    closeMenu();
    setAssignProjectOpen(true);
  };

  const closeColorPicker = () => {
    setColorPickerAnchor(null);
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
            onClick={(event) => {
              consumeMenuPointerEvent(event);
              openColorPicker();
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
              <PaletteOutlinedIcon sx={{ fontSize: 18, color: cv.textMuted }} />
            </ListItemIcon>
            Change color
          </MenuItem>
        ) : null}
        {isFolder ? (
          <MenuItem
            onClick={(event) => {
              consumeMenuPointerEvent(event);
              openAssignProject();
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
              <WorkOutlineOutlinedIcon sx={{ fontSize: 18, color: cv.textMuted }} />
            </ListItemIcon>
            Assign to project
          </MenuItem>
        ) : null}
        <MenuItem
          onClick={(event) => {
            consumeMenuPointerEvent(event);
            openRename();
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
            <DriveFileRenameOutlineIcon sx={{ fontSize: 18, color: cv.textMuted }} />
          </ListItemIcon>
          Rename
        </MenuItem>
        
        {item.type === 'video' ? (
          <>
            <MenuItem
              onClick={(event) => {
                consumeMenuPointerEvent(event);
                window.open(`/api/media/${encodeURIComponent(item.id)}/download`, '_blank');
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
                <DownloadOutlinedIcon sx={{ fontSize: 18, color: cv.textMuted }} />
              </ListItemIcon>
              Download Proxy File
            </MenuItem>

            {item.customMetadata?.originalFilePath && (
              <MenuItem
                onClick={(event) => {
                  consumeMenuPointerEvent(event);
                  window.open(`/api/media/${encodeURIComponent(item.id)}/download?raw=true`, '_blank');
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
                  <DownloadOutlinedIcon sx={{ fontSize: 18, color: cv.textMuted }} />
                </ListItemIcon>
                Download Original Raw File
              </MenuItem>
            )}
          </>
        ) : (
          <MenuItem
            onClick={(event) => {
              consumeMenuPointerEvent(event);
              window.open(`/api/media/${encodeURIComponent(item.id)}/download`, '_blank');
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
              <DownloadOutlinedIcon sx={{ fontSize: 18, color: cv.textMuted }} />
            </ListItemIcon>
            Download File
          </MenuItem>
        )}
        <MenuItem
          onClick={(event) => {
            consumeMenuPointerEvent(event);
            openDelete();
          }}
          onMouseDown={consumeMenuPointerEvent}
          sx={{
            py: 1,
            fontSize: '0.875rem',
            color: cv.destructive,
            '&:hover': { backgroundColor: cv.destructiveHover },
          }}
        >
          <ListItemIcon sx={{ minWidth: 32 }}>
            <DeleteOutlinedIcon sx={{ fontSize: 18, color: cv.destructive }} />
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

      <AssignProjectModal
        open={assignProjectOpen}
        folderTitle={item.title}
        projectFolders={activeWorkspace.projectFolders}
        initialProjectLocation={item.projectLocation}
        onClose={() => setAssignProjectOpen(false)}
        onSave={(projectLocation) => updateMediaProjectLocation(item.id, projectLocation)}
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
        onConfirm={() => {
          moveMediaToTrash(item.id);
          setDeleteOpen(false);
        }}
      />
    </Box>
  );
}

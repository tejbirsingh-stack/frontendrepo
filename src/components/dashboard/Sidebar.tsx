import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { cv } from '../../theme/cssVars';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Collapse,
  Divider,
  IconButton,
  InputAdornment,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material';
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined';
import StarBorderOutlinedIcon from '@mui/icons-material/StarBorderOutlined';
import StarIcon from '@mui/icons-material/Star';
import ControlPointDuplicateOutlinedIcon from '@mui/icons-material/ControlPointDuplicateOutlined';
import ShareOutlinedIcon from '@mui/icons-material/ShareOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import UploadOutlinedIcon from '@mui/icons-material/UploadOutlined';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import WorkspacesOutlinedIcon from '@mui/icons-material/WorkspacesOutlined';
import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined';
import NoahLogo from '../NoahLogo';
import { dropdownMenuPaperSx } from '../../constants/dropdownMenu';
import WorkspaceColorDot from './WorkspaceColorDot';
import WorkspaceColorPicker from './WorkspaceColorPicker';
import { FOLDER_COLORS } from '../../constants/folderColors';
import { resolveFolderColor, folderAccentTint } from '../../utils/folderColorStyle';
import AddSidebarItemModal, { type SidebarItemMode } from './AddSidebarItemModal';
import CreateWorkspaceModal, { type CreateWorkspaceFormData } from './CreateWorkspaceModal';
import RenameMediaModal from './RenameMediaModal';
import TrashConfirmModal from './TrashConfirmModal';
import UploadPanel from './UploadPanel';
import GlobalSearchField from './GlobalSearchField';
import type { MediaItem, MediaType, SidebarFolder } from '../../data/mockMedia';
import { useDashboard } from '../../context/DashboardContext';
import { useGlobalSearchKeyboard } from '../../hooks/useGlobalSearchKeyboard';
import { getMediaDragPayload, hasMediaDragPayload } from '../../utils/mediaDrag';
import type { SidebarBrowseMode, SidebarSelection } from '../../types/sidebarSelection';
import {
  filterMediaLibraryFolderChildrenBySearch,
  filterSidebarChildMediaBySearch,
  getMediaFolderOpenKey,
  getMediaInSidebarChild,
  getMediaLibraryFolderChildren,
  getPersonalRootItems,
  getProjectRootItems,
  getSidebarChildKey,
} from '../../utils/sidebarMediaFilter';
import { getMediaFileName } from '../../utils/mediaFileName';
import { getMediaFolderPath } from '../../utils/mediaNavigation';

import { MULTI_ITEM_TRASH_CONFIRMATION_PHRASE } from '../../constants/trash';
import { DASHBOARD_TOP_BAR_BORDER, DASHBOARD_TOP_BAR_HEIGHT, SIDE_PANEL_WIDTH, SIDEBAR_DESKTOP_BREAKPOINT } from '../../constants/layout';
import TruncatedText from '../TruncatedText';
import { searchFieldInputSx } from '../../utils/searchFieldStyles';

const SIDEBAR_WIDTH = SIDE_PANEL_WIDTH;

const sidebarLogoSx = {
  mb: 0,
  px: 0,
} as const;

interface NavItemProps {
  icon: ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

const TRASH_DROP_TARGET_KEY = 'trash';

type SidebarFolderActionTarget =
  | { type: 'folder'; folderId: string; label: string }
  | { type: 'child'; folderId: string; label: string };

const browseModeOptions: { value: SidebarBrowseMode; label: string }[] = [
  { value: 'files-folders', label: 'Files & Folders' },
  { value: 'projects', label: 'Projects' },
];

function SidebarBrowseModeToggle({
  value,
  onChange,
}: {
  value: SidebarBrowseMode;
  onChange: (value: SidebarBrowseMode) => void;
}) {
  return (
    <Box
      sx={{
        display: 'flex',
        flex: 1,
        minWidth: 0,
        p: 0.35,
        borderRadius: '8px',
        border: `1px solid ${cv.border}`,
        backgroundColor: cv.surfaceMuted,
      }}
    >
      {browseModeOptions.map((option) => {
        const selected = value === option.value;
        return (
          <Box
            key={option.value}
            component="button"
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={selected}
            sx={{
              flex: 1,
              minWidth: 0,
              border: 'none',
              cursor: 'pointer',
              px: 0.75,
              py: 0.5,
              borderRadius: '6px',
              fontSize: '0.6875rem',
              fontWeight: 600,
              fontFamily: 'inherit',
              lineHeight: 1.2,
              color: selected ? cv.textPrimary : cv.textMuted,
              backgroundColor: selected ? cv.purpleSelection : 'transparent',
              transition: 'background-color 0.15s ease, color 0.15s ease',
              '&:hover': {
                color: selected ? cv.textPrimary : cv.textSecondary,
              },
            }}
          >
            {option.label}
          </Box>
        );
      })}
    </Box>
  );
}

const folderActionsButtonSx = {
  p: 0.5,
  opacity: 0,
  transition: 'opacity 0.15s ease',
  color: cv.textMuted,
  '&:hover': { color: cv.textPrimary, backgroundColor: cv.surfaceRaised },
};

function TrashNavItem({
  active,
  itemCount,
  isDropTarget,
  onClick,
  onDragOver,
  onDragLeave,
  onDrop,
}: {
  active?: boolean;
  itemCount?: number;
  isDropTarget: boolean;
  onClick?: () => void;
  onDragOver: (event: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (event: React.DragEvent) => void;
}) {
  return (
    <ListItemButton
      onClick={onClick}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      sx={{
        py: 0.875,
        px: 1.5,
        borderRadius: '10px',
        mx: 1,
        color: cv.destructive,
        backgroundColor: isDropTarget
          ? cv.destructiveHover
          : active
            ? cv.destructiveHover
            : 'transparent',
        border: isDropTarget
          ? `1px dashed ${cv.destructiveBorder}`
          : active
            ? `1px solid ${cv.destructiveBorderSoft}`
            : '1px solid transparent',
        '&:hover': {
          backgroundColor: cv.destructiveHover,
          color: cv.destructive,
        },
        '& .MuiListItemIcon-root': {
          color: 'inherit',
        },
      }}
    >
      <ListItemIcon
        sx={{
          minWidth: 32,
          '& .MuiSvgIcon-root': { fontSize: 20 },
        }}
      >
        <DeleteOutlinedIcon />
      </ListItemIcon>
      <ListItemText
        primary="Trash"
        slotProps={{
          primary: {
            sx: { fontSize: '0.875rem', fontWeight: 500, color: 'inherit' },
          },
        }}
      />
      {itemCount != null && itemCount > 0 && (
        <Typography
          component="span"
          sx={{
            ml: 1,
            minWidth: 20,
            px: 0.75,
            py: 0.125,
            borderRadius: '999px',
            fontSize: '0.6875rem',
            fontWeight: 700,
            textAlign: 'center',
            color: cv.destructive,
            backgroundColor: cv.destructiveSurface,
          }}
        >
          {itemCount}
        </Typography>
      )}
    </ListItemButton>
  );
}

function NavItem({ icon, label, active, onClick }: NavItemProps) {
  return (
    <ListItemButton
      onClick={onClick}
      sx={{
        py: 0.75,
        px: 1.5,
        borderRadius: '10px',
        mx: 1,
        mb: 0.25,
        color: active ? cv.textPrimary : cv.textSecondary,
        backgroundColor: active ? cv.surfaceRaised : 'transparent',
        '&:hover': {
          backgroundColor: active ? cv.surfaceActive : cv.surfaceHover,
        },
      }}
    >
      <ListItemIcon
        sx={{
          minWidth: 32,
          color: 'inherit',
          '& .MuiSvgIcon-root': { fontSize: 20 },
        }}
      >
        {icon}
      </ListItemIcon>
      <ListItemText
        primary={label}
        slotProps={{
          primary: {
            sx: { fontSize: '0.875rem', fontWeight: active ? 500 : 400 },
          },
        }}
      />
    </ListItemButton>
  );
}

interface FolderItemProps {
  folder: SidebarFolder;
  isOpen: boolean;
  onToggle: () => void;
  searchQuery: string;
  browseMode: SidebarBrowseMode;
  workspaceId: string;
  mediaItems: MediaItem[];
  trashedIds: Set<string>;
  openChildFolders: Record<string, boolean>;
  onToggleChildFolder: (folderId: string, childLabel: string) => void;
  openMediaFolders: Record<string, boolean>;
  onToggleMediaFolder: (mediaFolderId: string) => void;
  sidebarSelection: SidebarSelection | null;
  onSelectFolder: (selection: Omit<SidebarSelection, 'browseMode'>) => void;
  onSelectMediaFile: (
    file: MediaItem,
    selection: Omit<SidebarSelection, 'browseMode'>,
  ) => void;
  dropTargetKey: string | null;
  onDragOverTarget: (event: React.DragEvent, targetKey: string) => void;
  onDragLeaveTarget: () => void;
  onDropOnFolder: (event: React.DragEvent, folderId: string, childLabel?: string) => void;
  onOpenColorPicker: (event: React.MouseEvent<HTMLElement>, folderId: string) => void;
  onOpenActionsMenu: (
    event: React.MouseEvent<HTMLElement>,
    target: SidebarFolderActionTarget,
  ) => void;
}

function getSidebarFileIcon(type: MediaType) {
  if (type === 'folder') {
    return <FolderOutlinedIcon sx={{ fontSize: 14 }} />;
  }
  return <InsertDriveFileOutlinedIcon sx={{ fontSize: 14 }} />;
}

interface SidebarMediaFolderRowProps {
  mediaFolder: MediaItem;
  depth: number;
  parentAccentColor: string;
  categoryChildLabel: string;
  sidebarFolderId: string;
  sidebarFolderLabel: string;
  browseMode: SidebarBrowseMode;
  mediaItems: MediaItem[];
  workspaceId: string;
  trashedIds: Set<string>;
  searchQuery: string;
  openMediaFolders: Record<string, boolean>;
  onToggleMediaFolder: (mediaFolderId: string) => void;
  onSelectMediaFile: (
    file: MediaItem,
    selection: Omit<SidebarSelection, 'browseMode'>,
  ) => void;
}

function SidebarMediaFolderRow({
  mediaFolder,
  depth,
  parentAccentColor,
  categoryChildLabel,
  sidebarFolderId,
  sidebarFolderLabel,
  browseMode,
  mediaItems,
  workspaceId,
  trashedIds,
  searchQuery,
  openMediaFolders,
  onToggleMediaFolder,
  onSelectMediaFile,
}: SidebarMediaFolderRowProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const normalizedSearch = searchQuery.trim().toLowerCase();
  const folderAccent = resolveFolderColor(mediaFolder.folderColor) ?? parentAccentColor;
  const openKey = getMediaFolderOpenKey(mediaFolder.id);
  const isOpen = Boolean(openMediaFolders[openKey]);
  const showChildren = isOpen || Boolean(normalizedSearch);
  const isActive = location.pathname === getMediaFolderPath(mediaFolder.id);

  const children = useMemo(
    () =>
      getMediaLibraryFolderChildren(mediaFolder.id, mediaItems, workspaceId, trashedIds),
    [mediaFolder.id, mediaItems, trashedIds, workspaceId],
  );

  const visibleChildren = filterMediaLibraryFolderChildrenBySearch(
    children,
    mediaFolder.title,
    searchQuery,
  );

  const handleClick = () => {
    if (!isOpen) {
      onToggleMediaFolder(mediaFolder.id);
    }
    navigate(getMediaFolderPath(mediaFolder.id));
  };

  const selection = {
    folderId: sidebarFolderId,
    folderLabel: sidebarFolderLabel,
    childLabel: categoryChildLabel,
  };

  return (
    <Box>
      <ListItemButton
        onClick={handleClick}
        sx={{
          py: 0.4,
          pl: 1 + depth * 1.5,
          pr: 1,
          borderRadius: '8px',
          mb: 0.15,
          color: isActive ? cv.textPrimary : cv.textSecondary,
          backgroundColor: isActive ? folderAccentTint(mediaFolder.folderColor) : 'transparent',
          border: isActive ? `1px solid ${folderAccent}66` : '1px solid transparent',
          '&:hover': {
            backgroundColor: isActive ? folderAccentTint(mediaFolder.folderColor) : cv.surfaceHover,
            color: cv.textPrimary,
          },
        }}
      >
        <ListItemIcon sx={{ minWidth: 20, mr: 0.5 }}>
          <IconButton
            size="small"
            aria-label={isOpen ? `Collapse ${mediaFolder.title}` : `Expand ${mediaFolder.title}`}
            onClick={(event) => {
              event.stopPropagation();
              onToggleMediaFolder(mediaFolder.id);
            }}
            sx={{
              p: 0,
              width: 16,
              height: 16,
              color: cv.textMuted,
              '&:hover': { backgroundColor: 'transparent', color: cv.textPrimary },
            }}
          >
            <ChevronRightIcon
              sx={{
                fontSize: 16,
                transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease',
              }}
            />
          </IconButton>
        </ListItemIcon>
        <ListItemIcon sx={{ minWidth: 24 }}>
          <FolderOutlinedIcon sx={{ fontSize: 14, color: folderAccent, opacity: 0.9 }} />
        </ListItemIcon>
        <ListItemText
          disableTypography
          primary={
            <TruncatedText text={mediaFolder.title} sx={{ fontSize: '0.75rem', color: cv.textPrimary }} />
          }
          sx={{ minWidth: 0 }}
        />
      </ListItemButton>

      <Collapse in={showChildren} timeout="auto" unmountOnExit>
        <List disablePadding sx={{ pl: 1.5 }}>
          {visibleChildren.length > 0 ? (
            visibleChildren.map((child) =>
              child.type === 'folder' ? (
                <SidebarMediaFolderRow
                  key={child.id}
                  mediaFolder={child}
                  depth={depth + 1}
                  parentAccentColor={folderAccent}
                  categoryChildLabel={categoryChildLabel}
                  sidebarFolderId={sidebarFolderId}
                  sidebarFolderLabel={sidebarFolderLabel}
                  browseMode={browseMode}
                  mediaItems={mediaItems}
                  workspaceId={workspaceId}
                  trashedIds={trashedIds}
                  searchQuery={searchQuery}
                  openMediaFolders={openMediaFolders}
                  onToggleMediaFolder={onToggleMediaFolder}
                  onSelectMediaFile={onSelectMediaFile}
                />
              ) : (
                <ListItemButton
                  key={child.id}
                  onClick={() => onSelectMediaFile(child, selection)}
                  sx={{
                    py: 0.35,
                    pl: 2.5 + depth * 1.5,
                    pr: 1,
                    borderRadius: '8px',
                    mb: 0.1,
                    color: cv.textMuted,
                    '&:hover': {
                      backgroundColor: cv.surfaceHover,
                      color: cv.textPrimary,
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 24 }}>
                    {getSidebarFileIcon(child.type)}
                  </ListItemIcon>
                  <ListItemText
                    disableTypography
                    primary={
                      <TruncatedText
                        text={getMediaFileName(child)}
                        sx={{ fontSize: '0.75rem' }}
                      />
                    }
                    sx={{ minWidth: 0 }}
                  />
                </ListItemButton>
              ),
            )
          ) : (
            <Typography
              sx={{
                pl: 3 + depth * 1.5,
                py: 0.5,
                fontSize: '0.6875rem',
                color: cv.textMuted,
                fontStyle: 'italic',
              }}
            >
              No files
            </Typography>
          )}
        </List>
      </Collapse>
    </Box>
  );
}

function FolderItem({
  folder,
  isOpen,
  onToggle,
  searchQuery,
  browseMode,
  workspaceId,
  mediaItems,
  trashedIds,
  openChildFolders,
  onToggleChildFolder,
  openMediaFolders,
  onToggleMediaFolder,
  sidebarSelection,
  onSelectFolder,
  onSelectMediaFile,
  dropTargetKey,
  onDragOverTarget,
  onDragLeaveTarget,
  onDropOnFolder,
  onOpenColorPicker,
  onOpenActionsMenu,
}: FolderItemProps) {
  const folderColor = resolveFolderColor(folder.color);
  const selectedBackground = folderAccentTint(folder.color);
  const isProjectRoot = browseMode === 'projects';
  const isPersonalRoot = folder.id === 'personal';

  const projectRoots = useMemo(
    () =>
      isProjectRoot
        ? getProjectRootItems(folder.id, mediaItems, workspaceId, trashedIds)
        : [],
    [folder.id, isProjectRoot, mediaItems, trashedIds, workspaceId],
  );

  const personalRoots = useMemo(
    () =>
      isPersonalRoot ? getPersonalRootItems(mediaItems, workspaceId, trashedIds) : [],
    [isPersonalRoot, mediaItems, trashedIds, workspaceId],
  );

  const hasChildren = isProjectRoot || isPersonalRoot
    ? true
    : Boolean(folder.children?.length);
  const normalizedSearch = searchQuery.trim().toLowerCase();

  const childMediaByLabel = useMemo(() => {
    const map = new Map<string, MediaItem[]>();
    for (const child of folder.children ?? []) {
      map.set(
        child,
        getMediaInSidebarChild(mediaItems, folder, child, browseMode, workspaceId, trashedIds),
      );
    }
    return map;
  }, [browseMode, folder, mediaItems, trashedIds, workspaceId]);

  const filteredChildren = useMemo(() => {
    if (!folder.children) return [];
    if (!normalizedSearch) return folder.children;

    return folder.children.filter((child) => {
      if (child.toLowerCase().includes(normalizedSearch)) return true;
      const childMedia = childMediaByLabel.get(child) ?? [];
      return childMedia.some((item) => {
        if (item.title.toLowerCase().includes(normalizedSearch)) return true;
        if (getMediaFileName(item).toLowerCase().includes(normalizedSearch)) return true;
        if (item.type !== 'folder') return false;
        const nested = getMediaLibraryFolderChildren(
          item.id,
          mediaItems,
          workspaceId,
          trashedIds,
        );
        return nested.some(
          (nestedItem) =>
            nestedItem.title.toLowerCase().includes(normalizedSearch) ||
            getMediaFileName(nestedItem).toLowerCase().includes(normalizedSearch),
        );
      });
    });
  }, [childMediaByLabel, folder.children, mediaItems, normalizedSearch, trashedIds, workspaceId]);

  const matchesSearch =
    !normalizedSearch ||
    folder.label.toLowerCase().includes(normalizedSearch) ||
    filteredChildren.length > 0 ||
    (isProjectRoot &&
      projectRoots.some((item) => item.title.toLowerCase().includes(normalizedSearch))) ||
    (isPersonalRoot &&
      personalRoots.some((item) => item.title.toLowerCase().includes(normalizedSearch)));

  if (!matchesSearch) return null;

  const showChildren = hasChildren && (isOpen || Boolean(normalizedSearch));
  const folderTargetKey = `folder-${folder.id}`;
  const isFolderDropTarget = dropTargetKey === folderTargetKey;
  const isFolderSelected =
    sidebarSelection?.browseMode === browseMode &&
    sidebarSelection.folderId === folder.id &&
    !sidebarSelection.childLabel;

  const handleFolderClick = () => {
    if (hasChildren && !isOpen) {
      onToggle();
    }
    onSelectFolder({
      folderId: folder.id,
      folderLabel: folder.label,
    });
  };

  const handleChildClick = (childLabel: string) => {
    const childKey = getSidebarChildKey(folder.id, childLabel);
    if (!openChildFolders[childKey]) {
      onToggleChildFolder(folder.id, childLabel);
    }
    onSelectFolder({
      folderId: folder.id,
      folderLabel: folder.label,
      childLabel,
    });
  };

  const handleChildFileClick = (file: MediaItem, childLabel: string) => {
    const selection = {
      folderId: folder.id,
      folderLabel: folder.label,
      childLabel,
    };
    onSelectMediaFile(file, selection);
  };

  return (
    <>
      <ListItemButton
        onClick={handleFolderClick}
        onDragOver={(e) => onDragOverTarget(e, folderTargetKey)}
        onDragLeave={onDragLeaveTarget}
        onDrop={(e) => onDropOnFolder(e, folder.id)}
        sx={{
          position: 'relative',
          minWidth: 0,
          py: 0.6,
          pl: 1.5,
          pr: 6.5,
          borderRadius: '10px',
          mx: 1,
          mb: 0.25,
          color: cv.textSecondary,
          backgroundColor: isFolderDropTarget
            ? cv.blueSelectionSurface
            : isFolderSelected
              ? selectedBackground
              : 'transparent',
          border: isFolderDropTarget
            ? `1px dashed ${cv.borderFocus}`
            : isFolderSelected
              ? `1px solid ${folderColor}66`
              : '1px solid transparent',
          '&:hover': {
            backgroundColor: isFolderSelected ? selectedBackground : cv.surfaceHover,
          },
          '&:hover .folder-color-btn': { opacity: 1 },
          '&:hover .folder-actions-btn': { opacity: 1 },
        }}
      >
        <ListItemIcon sx={{ minWidth: 20, mr: 0.5 }}>
          {hasChildren ? (
            <IconButton
              size="small"
              aria-label={isOpen ? `Collapse ${folder.label}` : `Expand ${folder.label}`}
              onClick={(event) => {
                event.stopPropagation();
                onToggle();
              }}
              sx={{
                p: 0,
                width: 16,
                height: 16,
                color: cv.textMuted,
                '&:hover': { backgroundColor: 'transparent', color: cv.textPrimary },
              }}
            >
              <ChevronRightIcon
                sx={{
                  fontSize: 16,
                  transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s ease',
                }}
              />
            </IconButton>
          ) : (
            <Box sx={{ width: 16 }} />
          )}
        </ListItemIcon>
        <ListItemIcon sx={{ minWidth: 28 }}>
          <FolderOutlinedIcon sx={{ fontSize: 18, color: folderColor }} />
        </ListItemIcon>
        <ListItemText
          disableTypography
          primary={
            <TruncatedText
              text={folder.label}
              sx={{ fontSize: '0.8125rem', color: cv.textPrimary }}
            />
          }
          sx={{ minWidth: 0, flex: 1, mr: 5 }}
        />
        <IconButton
          className="folder-actions-btn"
          size="small"
          aria-label={`More options for ${folder.label}`}
          onClick={(event) => {
            event.stopPropagation();
            onOpenActionsMenu(event, {
              type: 'folder',
              folderId: folder.id,
              label: folder.label,
            });
          }}
          sx={{
            ...folderActionsButtonSx,
            position: 'absolute',
            right: 36,
            top: '50%',
            transform: 'translateY(-50%)',
          }}
        >
          <MoreVertIcon sx={{ fontSize: 16 }} />
        </IconButton>
        <IconButton
          className="folder-color-btn"
          size="small"
          aria-label={`Change color for ${folder.label}`}
          onClick={(event) => {
            event.stopPropagation();
            onOpenColorPicker(event, folder.id);
          }}
          sx={{
            position: 'absolute',
            right: 12,
            top: '50%',
            transform: 'translateY(-50%)',
            p: 0.5,
            opacity: 0,
            transition: 'opacity 0.15s ease',
            '&:hover': { backgroundColor: cv.surfaceRaised },
          }}
        >
          <Box
            sx={{
              width: 14,
              height: 14,
              borderRadius: '50%',
              backgroundColor: folderColor,
              border: `1px solid ${cv.borderStrong}`,
            }}
          />
        </IconButton>
      </ListItemButton>

      {hasChildren && (
        <Collapse in={showChildren} timeout="auto" unmountOnExit>
          <List disablePadding sx={{ pl: 3.5, pr: 1 }}>
            {isProjectRoot || isPersonalRoot ? (
              (isProjectRoot ? projectRoots : personalRoots).length > 0 ? (
                (isProjectRoot ? projectRoots : personalRoots).map((item) =>
                  item.type === 'folder' ? (
                    <SidebarMediaFolderRow
                      key={item.id}
                      mediaFolder={item}
                      depth={0}
                      parentAccentColor={folderColor}
                      categoryChildLabel=""
                      sidebarFolderId={folder.id}
                      sidebarFolderLabel={folder.label}
                      browseMode={browseMode}
                      mediaItems={mediaItems}
                      workspaceId={workspaceId}
                      trashedIds={trashedIds}
                      searchQuery={searchQuery}
                      openMediaFolders={openMediaFolders}
                      onToggleMediaFolder={onToggleMediaFolder}
                      onSelectMediaFile={onSelectMediaFile}
                    />
                  ) : (
                    <ListItemButton
                      key={item.id}
                      onClick={() =>
                        onSelectMediaFile(item, {
                          folderId: folder.id,
                          folderLabel: folder.label,
                        })
                      }
                      sx={{
                        py: 0.4,
                        pl: 1.5,
                        pr: 1,
                        borderRadius: '8px',
                        mb: 0.15,
                        color: cv.textMuted,
                        '&:hover': {
                          backgroundColor: cv.surfaceHover,
                          color: cv.textPrimary,
                        },
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 24 }}>
                        {getSidebarFileIcon(item.type)}
                      </ListItemIcon>
                      <ListItemText
                        disableTypography
                        primary={
                          <TruncatedText
                            text={getMediaFileName(item)}
                            sx={{ fontSize: '0.75rem' }}
                          />
                        }
                        sx={{ minWidth: 0 }}
                      />
                    </ListItemButton>
                  ),
                )
              ) : (
                <Typography
                  sx={{
                    pl: 1.5,
                    py: 0.5,
                    fontSize: '0.6875rem',
                    color: cv.textMuted,
                    fontStyle: 'italic',
                  }}
                >
                  No items
                </Typography>
              )
            ) : (
            filteredChildren.map((child) => {
              const childTargetKey = `folder-${folder.id}-${child}`;
              const isChildDropTarget = dropTargetKey === childTargetKey;
              const isChildSelected =
                sidebarSelection?.browseMode === browseMode &&
                sidebarSelection.folderId === folder.id &&
                sidebarSelection.childLabel === child;
              const childKey = getSidebarChildKey(folder.id, child);
              const isChildOpen = Boolean(openChildFolders[childKey]);
              const showChildFiles = isChildOpen || Boolean(normalizedSearch);
              const childMedia = childMediaByLabel.get(child) ?? [];
              const bucketFilesOnly = folder.id === 'all-files' || folder.id === 'archive';
              const visibleChildMedia = filterSidebarChildMediaBySearch(
                bucketFilesOnly ? childMedia.filter((item) => item.type !== 'folder') : childMedia,
                child,
                searchQuery,
              );

              return (
                <Box key={child}>
                  <ListItemButton
                    onClick={() => handleChildClick(child)}
                    onDragOver={(e) => onDragOverTarget(e, childTargetKey)}
                    onDragLeave={onDragLeaveTarget}
                    onDrop={(e) => onDropOnFolder(e, folder.id, child)}
                    sx={{
                      position: 'relative',
                      py: 0.5,
                      pl: 1,
                      pr: 4.5,
                      borderRadius: '8px',
                      mb: 0.25,
                      color: cv.textSecondary,
                      backgroundColor: isChildDropTarget
                        ? cv.blueSelectionSurface
                        : isChildSelected
                          ? selectedBackground
                          : 'transparent',
                      border: isChildDropTarget
                        ? `1px dashed ${cv.borderFocus}`
                        : isChildSelected
                          ? `1px solid ${folderColor}66`
                          : '1px solid transparent',
                      '&:hover': {
                        backgroundColor: isChildSelected ? selectedBackground : cv.surfaceHover,
                        color: cv.textPrimary,
                      },
                      '&:hover .folder-child-actions-btn': { opacity: 1 },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 20, mr: 0.5 }}>
                      <IconButton
                        size="small"
                        aria-label={isChildOpen ? `Collapse ${child}` : `Expand ${child}`}
                        onClick={(event) => {
                          event.stopPropagation();
                          onToggleChildFolder(folder.id, child);
                        }}
                        sx={{
                          p: 0,
                          width: 16,
                          height: 16,
                          color: cv.textMuted,
                          '&:hover': {
                            backgroundColor: 'transparent',
                            color: cv.textPrimary,
                          },
                        }}
                      >
                        <ChevronRightIcon
                          sx={{
                            fontSize: 16,
                            transform: isChildOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                            transition: 'transform 0.2s ease',
                          }}
                        />
                      </IconButton>
                    </ListItemIcon>
                    <ListItemIcon sx={{ minWidth: 28 }}>
                      <FolderOutlinedIcon
                        sx={{ fontSize: 16, color: folderColor, opacity: 0.85 }}
                      />
                    </ListItemIcon>
                    <ListItemText
                      disableTypography
                      primary={
                        <TruncatedText
                          text={child}
                          sx={{
                            fontSize: '0.8125rem',
                            color: cv.textPrimary,
                          }}
                        />
                      }
                      sx={{ minWidth: 0, flex: 1, mr: 3 }}
                    />
                    <IconButton
                      className="folder-child-actions-btn"
                      size="small"
                      aria-label={`More options for ${child}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        onOpenActionsMenu(event, {
                          type: 'child',
                          folderId: folder.id,
                          label: child,
                        });
                      }}
                      sx={{
                        ...folderActionsButtonSx,
                        position: 'absolute',
                        right: 4,
                        top: '50%',
                        transform: 'translateY(-50%)',
                      }}
                    >
                      <MoreVertIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </ListItemButton>

                  <Collapse in={showChildFiles} timeout="auto" unmountOnExit>
                    <List disablePadding sx={{ pl: 3.5, pr: 0.5, pb: 0.25 }}>
                      {visibleChildMedia.length > 0 ? (
                        visibleChildMedia.map((file) => (
                            <ListItemButton
                              key={file.id}
                              onClick={() => handleChildFileClick(file, child)}
                              sx={{
                                py: 0.4,
                                pl: 1.5,
                                pr: 1,
                                borderRadius: '8px',
                                mb: 0.15,
                                color: cv.textMuted,
                                '&:hover': {
                                  backgroundColor: cv.surfaceHover,
                                  color: cv.textPrimary,
                                },
                              }}
                            >
                              <ListItemIcon sx={{ minWidth: 24 }}>
                                {getSidebarFileIcon(file.type)}
                              </ListItemIcon>
                              <ListItemText
                                disableTypography
                                primary={
                                  <TruncatedText
                                    text={getMediaFileName(file)}
                                    sx={{ fontSize: '0.75rem' }}
                                  />
                                }
                                sx={{ minWidth: 0 }}
                              />
                            </ListItemButton>
                        ))
                      ) : (
                        <Typography
                          sx={{
                            pl: 4.5,
                            py: 0.5,
                            fontSize: '0.6875rem',
                            color: cv.textMuted,
                            fontStyle: 'italic',
                          }}
                        >
                          No files
                        </Typography>
                      )}
                    </List>
                  </Collapse>
                </Box>
              );
            })
            )}
          </List>
        </Collapse>
      )}
    </>
  );
}

export interface SidebarProps {
  variant?: 'persistent' | 'drawer';
  onClose?: () => void;
  drawerOpen?: boolean;
}

export default function Sidebar({ variant = 'persistent', onClose, drawerOpen = false }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const isRecentView =
    location.pathname === '/home' || location.pathname === '/home/';
  const isFavoritesView = location.pathname === '/home/favorites';
  const isTagsView = location.pathname === '/home/tags';
  const isTrashView = location.pathname === '/home/trash';

  const navigateAndClose = (path: string) => {
    navigate(path);
    onClose?.();
  };

  const {
    workspaces,
    activeWorkspaceId,
    activeWorkspace,
    setActiveWorkspaceId,
    updateWorkspaceColor,
    createWorkspace,
    mediaItems,
    trashedIds,
    moveMediaToFolderBulk,
    moveMediaToTrashBulk,
    trashedMediaItems,
    addWorkspaceFolder,
    renameWorkspaceFolder,
    deleteWorkspaceFolder,
    renameWorkspaceFolderChild,
    deleteWorkspaceFolderChild,
    addWorkspaceFile,
    updateSidebarFolderColor,
    uploadMediaFiles,
    dropTargetKey,
    setDropTargetKey,
    clearDraggingMedia,
    sidebarSelection,
    setSidebarSelection,
    clearSidebarSelection,
  } = useDashboard();

  const [fileSearch, setFileSearch] = useState('');
  const [browseMode, setBrowseMode] = useState<SidebarBrowseMode>(
    sidebarSelection?.browseMode ?? 'files-folders',
  );
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({});
  const [openChildFolders, setOpenChildFolders] = useState<Record<string, boolean>>({});
  const [openMediaFolders, setOpenMediaFolders] = useState<Record<string, boolean>>({});
  const [workspaceMenuAnchor, setWorkspaceMenuAnchor] = useState<null | HTMLElement>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [colorPickerAnchor, setColorPickerAnchor] = useState<null | HTMLElement>(null);
  const [colorPickerWorkspaceId, setColorPickerWorkspaceId] = useState<string | null>(null);
  const [folderColorPickerAnchor, setFolderColorPickerAnchor] = useState<null | HTMLElement>(null);
  const [folderColorPickerId, setFolderColorPickerId] = useState<string | null>(null);
  const [trashConfirmOpen, setTrashConfirmOpen] = useState(false);
  const [pendingTrashMediaIds, setPendingTrashMediaIds] = useState<string[]>([]);
  const [addMenuAnchor, setAddMenuAnchor] = useState<null | HTMLElement>(null);
  const [addItemModalOpen, setAddItemModalOpen] = useState(false);
  const [addItemMode, setAddItemMode] = useState<SidebarItemMode>('folder');
  const [uploadPanelOpen, setUploadPanelOpen] = useState(false);
  const [folderActionsAnchor, setFolderActionsAnchor] = useState<null | HTMLElement>(null);
  const [folderActionsTarget, setFolderActionsTarget] = useState<SidebarFolderActionTarget | null>(
    null,
  );
  const [renameFolderOpen, setRenameFolderOpen] = useState(false);
  const [deleteFolderOpen, setDeleteFolderOpen] = useState(false);

  useEffect(() => {
    if (sidebarSelection?.browseMode) {
      setBrowseMode(sidebarSelection.browseMode);
    }
  }, [sidebarSelection?.browseMode]);

  useEffect(() => {
    if (!sidebarSelection?.childLabel) return;
    const key = getSidebarChildKey(sidebarSelection.folderId, sidebarSelection.childLabel);
    setOpenChildFolders((prev) => ({ ...prev, [key]: true }));
    setOpenFolders((prev) => ({ ...prev, [sidebarSelection.folderId]: true }));
  }, [sidebarSelection?.browseMode, sidebarSelection?.childLabel, sidebarSelection?.folderId]);

  useEffect(() => {
    const match = location.pathname.match(/^\/home\/folder\/([^/]+)/);
    if (!match) return;

    const folderId = match[1];
    const folderChain: string[] = [];
    let current = mediaItems.find((item) => item.id === folderId && item.type === 'folder');

    while (current) {
      folderChain.unshift(current.id);
      if (!current.parentFolderId) break;
      current = mediaItems.find(
        (item) => item.id === current!.parentFolderId && item.type === 'folder',
      );
    }

    setOpenMediaFolders((prev) => {
      const next = { ...prev };
      folderChain.forEach((id) => {
        next[getMediaFolderOpenKey(id)] = true;
      });
      return next;
    });

    const activeFolder = mediaItems.find((item) => item.id === folderId && item.type === 'folder');
    const placement =
      browseMode === 'projects'
        ? activeFolder?.projectLocation
        : activeFolder?.location;

    if (placement?.folderId) {
      const { folderId: sidebarFolderId, childLabel } = placement;
      setOpenFolders((prev) => ({ ...prev, [sidebarFolderId]: true }));
      if (childLabel) {
        setOpenChildFolders((prev) => ({
          ...prev,
          [getSidebarChildKey(sidebarFolderId, childLabel)]: true,
        }));
      }
    }
  }, [browseMode, location.pathname, mediaItems]);

  const colorPickerWorkspace = workspaces.find((w) => w.id === colorPickerWorkspaceId);
  const folderColorPickerFolder =
    activeWorkspace.folders.find((f) => f.id === folderColorPickerId) ??
    activeWorkspace.projectFolders?.find((f) => f.id === folderColorPickerId);

  const displayedFolders = useMemo(
    () =>
      browseMode === 'projects' ? activeWorkspace.projectFolders : activeWorkspace.folders,
    [activeWorkspace, browseMode],
  );

  const openFolderColorPicker = (
    event: React.MouseEvent<HTMLElement>,
    folderId: string,
  ) => {
    setFolderColorPickerAnchor(event.currentTarget);
    setFolderColorPickerId(folderId);
  };

  const closeFolderColorPicker = () => {
    setFolderColorPickerAnchor(null);
    setFolderColorPickerId(null);
  };

  const toggleFolder = (id: string) => {
    setOpenFolders((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleChildFolder = (folderId: string, childLabel: string) => {
    const key = getSidebarChildKey(folderId, childLabel);
    setOpenChildFolders((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleMediaFolder = (mediaFolderId: string) => {
    const key = getMediaFolderOpenKey(mediaFolderId);
    setOpenMediaFolders((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const openWorkspaceMenu = (event: React.MouseEvent<HTMLElement>) => {
    setWorkspaceMenuAnchor(event.currentTarget);
  };

  const closeWorkspaceMenu = () => {
    setWorkspaceMenuAnchor(null);
  };

  const selectWorkspace = (id: string) => {
    setActiveWorkspaceId(id);
    setOpenFolders({});
    setOpenChildFolders({});
    setOpenMediaFolders({});
    setFileSearch('');
    clearSidebarSelection();
    closeWorkspaceMenu();
  };

  const openColorPicker = (
    event: React.MouseEvent<HTMLElement>,
    workspaceId: string,
  ) => {
    event.stopPropagation();
    setColorPickerWorkspaceId(workspaceId);
    setColorPickerAnchor(event.currentTarget);
  };

  const closeColorPicker = () => {
    setColorPickerAnchor(null);
    setColorPickerWorkspaceId(null);
  };

  const openCreateModal = () => {
    closeWorkspaceMenu();
    setCreateModalOpen(true);
  };

  const handleCreateWorkspace = (data: CreateWorkspaceFormData) => {
    createWorkspace(data);
    setOpenFolders({});
    setFileSearch('');
    clearSidebarSelection();
  };

  const handleBrowseModeChange = (mode: SidebarBrowseMode) => {
    setBrowseMode(mode);
    clearSidebarSelection();
    setOpenFolders({});
    setOpenChildFolders({});
    setOpenMediaFolders({});
  };

  const handleSelectSidebarFolder = (selection: Omit<SidebarSelection, 'browseMode'>) => {
    setSidebarSelection({
      ...selection,
      browseMode,
    });
    if (!isRecentView) {
      navigateAndClose('/home');
    }
  };

  const handleSelectSidebarMediaFile = (
    file: MediaItem,
    selection: Omit<SidebarSelection, 'browseMode'>,
  ) => {
    handleSelectSidebarFolder(selection);
    if (file.type === 'video') {
      navigateAndClose(`/media/${file.id}`);
    }
  };

  const handleDragOverTarget = (event: React.DragEvent, targetKey: string) => {
    if (!hasMediaDragPayload(event)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setDropTargetKey(targetKey);
  };

  const handleDragLeaveTarget = () => {
    setDropTargetKey(null);
  };

  const handleDropOnFolder = (
    event: React.DragEvent,
    folderId: string,
    childLabel?: string,
  ) => {
    event.preventDefault();
    const mediaIds = getMediaDragPayload(event);
    if (mediaIds.length > 0) {
      moveMediaToFolderBulk(mediaIds, folderId, childLabel);
    }
    setDropTargetKey(null);
    clearDraggingMedia();
  };

  const handleDragOverTrash = (event: React.DragEvent) => {
    handleDragOverTarget(event, TRASH_DROP_TARGET_KEY);
  };

  const handleDropOnTrash = (event: React.DragEvent) => {
    event.preventDefault();
    const mediaIds = getMediaDragPayload(event);
    if (mediaIds.length > 0) {
      setPendingTrashMediaIds(mediaIds);
      setTrashConfirmOpen(true);
    }
    setDropTargetKey(null);
    clearDraggingMedia();
  };

  const closeTrashConfirm = () => {
    setTrashConfirmOpen(false);
    setPendingTrashMediaIds([]);
  };

  const handleConfirmTrash = () => {
    if (pendingTrashMediaIds.length > 0) {
      moveMediaToTrashBulk(pendingTrashMediaIds);
    }
    closeTrashConfirm();
  };

  const pendingTrashItemNames = pendingTrashMediaIds
    .map((id) => mediaItems.find((item) => item.id === id)?.title)
    .filter((title): title is string => Boolean(title));

  const isPendingTrashMulti = pendingTrashMediaIds.length > 1;

  const pendingTrashTitle = isPendingTrashMulti
    ? `${pendingTrashMediaIds.length} items`
    : pendingTrashItemNames[0] ?? '1 item';

  const openAddItemMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAddMenuAnchor(event.currentTarget);
  };

  const closeAddItemMenu = () => {
    setAddMenuAnchor(null);
  };

  const openAddItemModal = (mode: SidebarItemMode) => {
    setAddItemMode(mode);
    closeAddItemMenu();
    setAddItemModalOpen(true);
  };

  const handleCreateFolder = (name: string, color: string) => {
    const folderId = addWorkspaceFolder(name, color);
    if (folderId) {
      setOpenFolders((prev) => ({ ...prev, [folderId]: true }));
    }
  };

  const handleCreateFile = (folderId: string, name: string, type: MediaType) => {
    addWorkspaceFile(folderId, name, type);
    setOpenFolders((prev) => ({ ...prev, [folderId]: true }));
  };

  const openFolderActionsMenu = (
    event: React.MouseEvent<HTMLElement>,
    target: SidebarFolderActionTarget,
  ) => {
    setFolderActionsAnchor(event.currentTarget);
    setFolderActionsTarget(target);
  };

  const closeFolderActionsMenu = () => {
    setFolderActionsAnchor(null);
  };

  const clearFolderActionTarget = () => {
    setFolderActionsTarget(null);
  };

  const openRenameFolder = () => {
    closeFolderActionsMenu();
    setRenameFolderOpen(true);
  };

  const openDeleteFolder = () => {
    closeFolderActionsMenu();
    setDeleteFolderOpen(true);
  };

  const handleConfirmRenameFolder = (newTitle: string) => {
    if (!folderActionsTarget) return;

    if (folderActionsTarget.type === 'folder') {
      renameWorkspaceFolder(folderActionsTarget.folderId, newTitle);
    } else {
      renameWorkspaceFolderChild(
        folderActionsTarget.folderId,
        folderActionsTarget.label,
        newTitle,
      );
    }
  };

  const handleConfirmDeleteFolder = () => {
    if (!folderActionsTarget) return;

    if (folderActionsTarget.type === 'folder') {
      deleteWorkspaceFolder(folderActionsTarget.folderId);
      setOpenFolders((prev) => {
        const next = { ...prev };
        delete next[folderActionsTarget.folderId];
        return next;
      });
    } else {
      deleteWorkspaceFolderChild(folderActionsTarget.folderId, folderActionsTarget.label);
    }

    setDeleteFolderOpen(false);
    clearFolderActionTarget();
  };

  const folderDeleteTitle = folderActionsTarget?.label ?? 'Item';
  const isFolderDeleteTarget = folderActionsTarget?.type === 'folder';
  const isDrawer = variant === 'drawer';
  const globalSearchInputRef = useRef<HTMLInputElement>(null);

  useGlobalSearchKeyboard(globalSearchInputRef, isDrawer && drawerOpen);

  return (
    <Box
      component={isDrawer ? 'div' : 'aside'}
      data-app-sidebar
      sx={{
        width: isDrawer ? '100%' : SIDEBAR_WIDTH,
        flexShrink: 0,
        height: isDrawer ? '100%' : '100vh',
        display: isDrawer ? 'flex' : { xs: 'none', [SIDEBAR_DESKTOP_BREAKPOINT]: 'flex' },
        flexDirection: 'column',
        borderRight: isDrawer ? 'none' : "1px solid var(--noah-border)",
        background: cv.sidebarSurface,
        backdropFilter: isDrawer ? 'none' : 'blur(20px)',
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          height: DASHBOARD_TOP_BAR_HEIGHT,
          minHeight: DASHBOARD_TOP_BAR_HEIGHT,
          maxHeight: DASHBOARD_TOP_BAR_HEIGHT,
          boxSizing: 'border-box',
          px: 2,
          borderBottom: DASHBOARD_TOP_BAR_BORDER,
          background: cv.sidebarSurface,
        }}
      >
        {isDrawer ? (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 1,
              width: '100%',
              minWidth: 0,
            }}
          >
            <NoahLogo
              to="/home"
              width={80}
              fitContainer
              align="left"
              animated={false}
              showGlow={false}
              sx={{ ...sidebarLogoSx, flex: 1, minWidth: 0 }}
            />
            <IconButton
              aria-label="Close navigation menu"
              onClick={onClose}
              sx={{
                flexShrink: 0,
                color: cv.textSecondary,
                '&:hover': { color: cv.textPrimary, backgroundColor: cv.surfaceHover },
              }}
            >
              <CloseIcon sx={{ fontSize: 24 }} />
            </IconButton>
          </Box>
        ) : (
          <NoahLogo
            to="/home"
            width={80}
            fitContainer
            align="left"
            animated={false}
            showGlow={false}
            sx={{ ...sidebarLogoSx, width: '100%' }}
          />
        )}
      </Box>

      <Box sx={{ flex: 1, overflowY: 'auto', py: 2, minHeight: 0 }}>
        {isDrawer ? (
          <Box sx={{ px: 2, mb: 2 }}>
            <GlobalSearchField
              inputRef={globalSearchInputRef}
              showShortcutHint={false}
              placeholder="Search for anything"
            />
          </Box>
        ) : null}

        {/* Workspace switcher */}
        <Box
          onClick={openWorkspaceMenu}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            px: 2,
            py: 0.75,
            mx: 1,
            mb: 2,
            borderRadius: '10px',
            cursor: 'pointer',
            '&:hover': { backgroundColor: cv.surfaceHover },
          }}
        >
          <WorkspaceColorDot color={activeWorkspace.color} />
          <TruncatedText
            text={activeWorkspace.name}
            variant="caption"
            sx={{
              flex: 1,
              fontSize: '0.6875rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: cv.textPrimary,
            }}
          />
          <ExpandMoreIcon
            sx={{
              fontSize: 18,
              color: cv.textSecondary,
              transform: workspaceMenuAnchor ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease',
            }}
          />
        </Box>

        <Menu
          anchorEl={workspaceMenuAnchor}
          open={Boolean(workspaceMenuAnchor)}
          onClose={closeWorkspaceMenu}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          transformOrigin={{ vertical: 'top', horizontal: 'left' }}
          slotProps={{
            paper: {
              sx: {
                ...dropdownMenuPaperSx,
                ml: 0.5,
                minWidth: 260,
              },
            },
          }}
        >
          {workspaces.map((workspace) => {
            const isActive = workspace.id === activeWorkspaceId;
            return (
              <MenuItem
                key={workspace.id}
                onClick={() => selectWorkspace(workspace.id)}
                sx={{
                  py: 1,
                  px: 1.5,
                  fontSize: '0.875rem',
                  color: isActive ? cv.textPrimary : cv.textSecondary,
                  '&:hover': { backgroundColor: cv.surfaceHover },
                }}
              >
                <ListItemIcon sx={{ minWidth: 28 }}>
                  {isActive ? (
                    <CheckIcon sx={{ fontSize: 18, color: cv.textPrimary }} />
                  ) : (
                    <Box sx={{ width: 18 }} />
                  )}
                </ListItemIcon>
                <WorkspaceColorDot
                  color={workspace.color}
                  size={10}
                  clickable
                  onClick={(e) => openColorPicker(e, workspace.id)}
                />
                <Box sx={{ ml: 1, minWidth: 0, flex: 1 }}>
                  <TruncatedText
                    text={workspace.name}
                    variant="body2"
                    sx={{
                      fontSize: '0.875rem',
                      fontWeight: isActive ? 500 : 400,
                      color: 'inherit',
                    }}
                  />
                  {workspace.description && (
                    <TruncatedText
                      text={workspace.description}
                      variant="caption"
                      sx={{
                        display: 'block',
                        color: cv.textMuted,
                        fontSize: '0.6875rem',
                        maxWidth: 160,
                      }}
                    />
                  )}
                </Box>
              </MenuItem>
            );
          })}
          <Divider sx={{ my: 0.5, borderColor: cv.border }} />
          <MenuItem
            onClick={openCreateModal}
            sx={{
              py: 1,
              px: 1.5,
              fontSize: '0.875rem',
              color: cv.textSecondary,
              '&:hover': { backgroundColor: cv.surfaceHover },
            }}
          >
            <ListItemIcon sx={{ minWidth: 28 }}>
              <WorkspacesOutlinedIcon sx={{ fontSize: 18, color: cv.textMuted }} />
            </ListItemIcon>
            Create new workspace
          </MenuItem>
        </Menu>

        <WorkspaceColorPicker
          anchorEl={colorPickerAnchor}
          open={Boolean(colorPickerAnchor)}
          selectedColor={colorPickerWorkspace?.color ?? ''}
          onClose={closeColorPicker}
          onSelect={(color) => {
            if (colorPickerWorkspaceId) {
              updateWorkspaceColor(colorPickerWorkspaceId, color);
            }
          }}
        />

        <WorkspaceColorPicker
          anchorEl={folderColorPickerAnchor}
          open={Boolean(folderColorPickerAnchor)}
          title="Folder color"
          colors={FOLDER_COLORS}
          selectedColor={resolveFolderColor(folderColorPickerFolder?.color)}
          onClose={closeFolderColorPicker}
          onSelect={(color) => {
            if (folderColorPickerId) {
              updateSidebarFolderColor(folderColorPickerId, color);
            }
          }}
        />

        <CreateWorkspaceModal
          open={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          onCreate={handleCreateWorkspace}
        />

        {/* Primary navigation */}
        <List disablePadding>
          <NavItem
            icon={<AccessTimeOutlinedIcon />}
            label="Recent"
            active={isRecentView && !sidebarSelection}
            onClick={() => {
              clearSidebarSelection();
              navigateAndClose('/home');
            }}
          />
          <NavItem
            icon={
              isFavoritesView ? (
                <StarIcon sx={{ color: cv.warning }} />
              ) : (
                <StarBorderOutlinedIcon />
              )
            }
            label="Favorites"
            active={isFavoritesView}
            onClick={() => {
              clearSidebarSelection();
              navigateAndClose('/home/favorites');
            }}
          />
          <NavItem
            icon={<ControlPointDuplicateOutlinedIcon />}
            label="Duplicates"
            active={location.pathname === '/home/duplicates'}
            onClick={() => {
              clearSidebarSelection();
              navigateAndClose('/home/duplicates');
            }}
          />
          <NavItem icon={<ShareOutlinedIcon />} label="Shared" />
          <Box
            onDragOver={(event) => {
              if (!event.dataTransfer.types.includes('Files')) return;
              event.preventDefault();
              setUploadPanelOpen(true);
            }}
          >
            <NavItem
              icon={<UploadOutlinedIcon />}
              label="Upload"
              active={uploadPanelOpen}
              onClick={() => setUploadPanelOpen((open) => !open)}
            />
          </Box>
        </List>

        <Collapse in={uploadPanelOpen}>
          <UploadPanel onUpload={uploadMediaFiles} />
        </Collapse>

        <Divider sx={{ my: 2, mx: 2, borderColor: cv.border }} />

        {/* Files & Folders / Projects */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.75,
            px: 2,
            mb: 1.5,
          }}
        >
          <SidebarBrowseModeToggle value={browseMode} onChange={handleBrowseModeChange} />
          <IconButton
            size="small"
            aria-label="Add file or folder"
            onClick={openAddItemMenu}
            disabled={browseMode !== 'files-folders'}
            tabIndex={browseMode === 'files-folders' ? 0 : -1}
            sx={{
              p: 0.25,
              width: 28,
              height: 28,
              flexShrink: 0,
              color: cv.textMuted,
              visibility: browseMode === 'files-folders' ? 'visible' : 'hidden',
              pointerEvents: browseMode === 'files-folders' ? 'auto' : 'none',
              '&:hover': { color: cv.textPrimary, backgroundColor: cv.surfaceHover },
            }}
          >
            <AddIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>

        <Box sx={{ px: 2, mb: 1.5 }}>
          <TextField
            fullWidth
            size="small"
            placeholder={browseMode === 'projects' ? 'Search projects...' : 'Search files...'}
            value={fileSearch}
            onChange={(e) => setFileSearch(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ fontSize: 18, color: cv.textMuted }} />
                  </InputAdornment>
                ),
                sx: {
                  fontSize: '0.8125rem',
                  py: 0.75,
                  borderRadius: '10px',
                  backgroundColor: cv.glassBackground,
                  ...searchFieldInputSx,
                  '& fieldset': { borderColor: cv.border },
                  '&:hover fieldset': { borderColor: cv.surfaceActive },
                  '&.Mui-focused fieldset': {
                    borderColor: cv.borderFocus,
                    borderWidth: 1,
                  },
                },
              },
            }}
          />
        </Box>

        <List disablePadding>
          {displayedFolders.map((folder) => (
            <FolderItem
              key={folder.id}
              folder={folder}
              isOpen={Boolean(openFolders[folder.id])}
              onToggle={() => toggleFolder(folder.id)}
              searchQuery={fileSearch}
              browseMode={browseMode}
              workspaceId={activeWorkspaceId}
              mediaItems={mediaItems}
              trashedIds={trashedIds}
              openChildFolders={openChildFolders}
              onToggleChildFolder={toggleChildFolder}
              openMediaFolders={openMediaFolders}
              onToggleMediaFolder={toggleMediaFolder}
              sidebarSelection={sidebarSelection}
              onSelectFolder={handleSelectSidebarFolder}
              onSelectMediaFile={handleSelectSidebarMediaFile}
              dropTargetKey={dropTargetKey}
              onDragOverTarget={handleDragOverTarget}
              onDragLeaveTarget={handleDragLeaveTarget}
              onDropOnFolder={handleDropOnFolder}
              onOpenColorPicker={openFolderColorPicker}
              onOpenActionsMenu={openFolderActionsMenu}
            />
          ))}
        </List>

        <Divider sx={{ my: 2, mx: 2, borderColor: cv.border }} />

        <Box sx={{ pb: 0.5 }}>
          <NavItem
            icon={<LocalOfferOutlinedIcon />}
            label="Tags Management"
            active={isTagsView}
            onClick={() => navigateAndClose('/home/tags')}
          />
        </Box>
      </Box>

      <Box
        sx={{
          flexShrink: 0,
          pt: 1,
          pb: 2,
          borderTop: "1px solid var(--noah-border)",
          background: cv.sidebarScrim,
        }}
      >
        <TrashNavItem
          active={isTrashView}
          itemCount={trashedMediaItems.length}
          onClick={() => navigateAndClose('/home/trash')}
          isDropTarget={dropTargetKey === TRASH_DROP_TARGET_KEY}
          onDragOver={handleDragOverTrash}
          onDragLeave={handleDragLeaveTarget}
          onDrop={handleDropOnTrash}
        />
      </Box>

      <Menu
        anchorEl={addMenuAnchor}
        open={Boolean(addMenuAnchor)}
        onClose={closeAddItemMenu}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: {
              ...dropdownMenuPaperSx,
              minWidth: 168,
            },
          },
        }}
      >
        <MenuItem
          onClick={() => openAddItemModal('folder')}
          sx={{
            py: 1,
            fontSize: '0.875rem',
            color: cv.textSecondary,
            '&:hover': { backgroundColor: cv.surfaceHover },
          }}
        >
          <ListItemIcon sx={{ minWidth: 32 }}>
            <FolderOutlinedIcon sx={{ fontSize: 18, color: cv.textMuted }} />
          </ListItemIcon>
          New folder
        </MenuItem>
        <MenuItem
          onClick={() => openAddItemModal('file')}
          sx={{
            py: 1,
            fontSize: '0.875rem',
            color: cv.textSecondary,
            '&:hover': { backgroundColor: cv.surfaceHover },
          }}
        >
          <ListItemIcon sx={{ minWidth: 32 }}>
            <InsertDriveFileOutlinedIcon sx={{ fontSize: 18, color: cv.textMuted }} />
          </ListItemIcon>
          New file
        </MenuItem>
      </Menu>

      <AddSidebarItemModal
        open={addItemModalOpen}
        mode={addItemMode}
        folders={activeWorkspace.folders}
        onClose={() => setAddItemModalOpen(false)}
        onCreateFolder={handleCreateFolder}
        onCreateFile={handleCreateFile}
      />

      <TrashConfirmModal
        open={trashConfirmOpen}
        itemTitle={pendingTrashTitle}
        itemNames={isPendingTrashMulti ? pendingTrashItemNames : undefined}
        confirmationPhrase={
          isPendingTrashMulti ? MULTI_ITEM_TRASH_CONFIRMATION_PHRASE : undefined
        }
        title={
          isPendingTrashMulti
            ? `Move ${pendingTrashMediaIds.length} items to trash?`
            : 'Move to trash?'
        }
        requireNameConfirmation
        description={
          isPendingTrashMulti
            ? 'These items will be removed from your library and moved to trash. You can restore them later from the Trash view.'
            : 'This item will be removed from your library and moved to trash. You can restore it later from the Trash view.'
        }
        onClose={closeTrashConfirm}
        onConfirm={handleConfirmTrash}
      />

      <Menu
        anchorEl={folderActionsAnchor}
        open={Boolean(folderActionsAnchor)}
        onClose={closeFolderActionsMenu}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: {
              ...dropdownMenuPaperSx,
              minWidth: 160,
            },
          },
        }}
      >
        <MenuItem
          onClick={openRenameFolder}
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
        <MenuItem
          onClick={openDeleteFolder}
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

      <RenameMediaModal
        open={renameFolderOpen}
        currentTitle={folderActionsTarget?.label ?? ''}
        onClose={() => {
          setRenameFolderOpen(false);
          clearFolderActionTarget();
        }}
        onRename={handleConfirmRenameFolder}
      />

      <TrashConfirmModal
        open={deleteFolderOpen}
        itemTitle={folderDeleteTitle}
        title={isFolderDeleteTarget ? 'Delete folder?' : 'Delete item?'}
        confirmLabel="Delete"
        requireNameConfirmation
        description={
          isFolderDeleteTarget
            ? 'This folder will be removed from the sidebar. Any files inside it will be moved to trash.'
            : 'This item will be removed from the folder and moved to trash if it is linked to a file.'
        }
        onClose={() => {
          setDeleteFolderOpen(false);
          clearFolderActionTarget();
        }}
        onConfirm={handleConfirmDeleteFolder}
      />
    </Box>
  );
}

export { SIDEBAR_WIDTH };

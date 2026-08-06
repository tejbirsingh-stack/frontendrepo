import { useEffect, useMemo, useRef, useState, Fragment } from 'react';
import { cv } from '../theme/cssVars';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  Checkbox,
  Collapse,
  FormControl,
  FormControlLabel,
  IconButton,
  ListItemIcon,
  Menu,
  MenuItem,
  Pagination,
  Select,
  Tab,
  Tabs,
  Tooltip,
  Typography,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import ViewListIcon from '@mui/icons-material/ViewList';
import GridViewIcon from '@mui/icons-material/GridView';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import CloseFullscreenIcon from '@mui/icons-material/CloseFullscreen';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import CreateNewFolderOutlinedIcon from '@mui/icons-material/CreateNewFolderOutlined';
import HelpOutlinedIcon from '@mui/icons-material/HelpOutlined';
import RefreshIcon from '@mui/icons-material/Refresh';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import MediaFilterPanel from '../components/dashboard/MediaFilterPanel';
import MediaItemCard from '../components/dashboard/MediaItemCard';
import MediaListRow from '../components/dashboard/MediaListRow';
import MediaSelectionBar, {
  getDashboardFolderDropTargetKey,
} from '../components/dashboard/MediaSelectionBar';
import MoveItemsModal, { type MoveDestination } from '../components/dashboard/MoveItemsModal';
import NewFolderModal from '../components/dashboard/NewFolderModal';
import NewProjectModal from '../components/dashboard/NewProjectModal';
import TrashConfirmModal from '../components/dashboard/TrashConfirmModal';
import DashboardKeyboardShortcutsDialog from '../components/dashboard/DashboardKeyboardShortcutsDialog';
import HelpMenuDrawer, { getHelpMenuShortcutLabel } from '../components/media/HelpMenuDrawer';
import { useAuth } from '../auth/AuthContext';
import { ROLE_IDS } from '../constants/userRoles';
import { useResolvedKeyboardShortcuts } from '../hooks/useResolvedKeyboardShortcuts';
import { matchesKeyboardShortcut } from '../utils/matchKeyboardShortcut';
import { dropdownMenuPaperSx } from '../constants/dropdownMenu';
import { UPLOAD_ACCEPT, getUploadableFiles } from '../utils/fileMediaType';
import {
  matchesDateRange,
  matchesMediaTypeFilter,
  type DateRangeFilter,
  type MediaTypeFilter,
} from '../constants/mediaFilters';
import { useDashboard } from '../context/DashboardContext';
import type { MediaItem, MediaLocation, MediaType } from '../data/mockMedia';
import { resolveLibraryFolderColor } from '../utils/folderColorStyle';
import { isYearOrMonthFolder } from '../utils/dateFolder';
import type { LibraryView } from '../types/libraryView';
import type { LibraryViewParam } from '../api/library.service';
import { canInviteTeamMembersToFolderSelection, isProjectSelection } from '../utils/folderInviteAccess';
import {
  filterMediaBySidebarSelection,
  getSidebarSelectionTitle,
} from '../utils/sidebarMediaFilter';
import { getMediaFolderBreadcrumbs, getMediaFolderPath } from '../utils/mediaNavigation';
import { formatProjectLocationLabel } from '../utils/mediaProjectLocation';
import { MULTI_ITEM_TRASH_CONFIRMATION_PHRASE } from '../constants/trash';
import { CURRENT_USER } from '../constants/currentUser';
import {
  InviteTeamMemberButton,
} from '../components/common/TeamMemberAvatarStack';
import InviteTeamMemberModal from '../components/common/InviteTeamMemberModal';
import { createWorkspaceTeamMember } from '../data/mockSettingsData';
import type { WorkspaceTeamMember } from '../data/mockSettingsData';
import { fetchOrganizationUsers } from '../api/auth.service';
import { useLibraryInfiniteScroll } from '../hooks/useLibraryInfiniteScroll';
import LibraryScrollSentinel from '../components/dashboard/LibraryScrollSentinel';

type ViewMode = 'grid' | 'list' | 'folder';
type SortField = 'date' | 'name' | 'type' | 'size';
type SortDirection = 'asc' | 'desc';

const sortFieldLabels: Record<SortField, string> = {
  date: 'Date',
  name: 'Name',
  type: 'Type',
  size: 'Size',
};

const currentUserTeamMember: WorkspaceTeamMember = {
  id: 'toolbar-current-user',
  name: CURRENT_USER.name,
  initials: CURRENT_USER.initials,
  email: CURRENT_USER.email,
  avatarUrl: CURRENT_USER.avatarUrl,
  access: 'Full Access',
  memberType: 'Member',
  isCurrentUser: true,
};

const initialToolbarTeamMembers: WorkspaceTeamMember[] = [
  currentUserTeamMember,
  {
    id: 'toolbar-sarah',
    name: 'Sarah',
    initials: 'S',
    email: 'sarah@company.com',
    access: 'Can edit',
    memberType: 'Member',
  },
  {
    id: 'toolbar-manoj',
    name: 'Manoj Reddy',
    initials: 'MR',
    email: 'manoj.reddy@mtxb2b.com',
    access: 'Can view',
    memberType: 'Member',
  },
  {
    id: 'toolbar-richa',
    name: 'Richa Agarwal',
    initials: 'RA',
    email: 'richa.agarwal@mtxb2b.com',
    access: 'Can edit',
    memberType: 'Member',
  },
  {
    id: 'toolbar-james',
    name: 'James Cole',
    initials: 'JC',
    email: 'james.cole@mtxb2b.com',
    access: 'Can view',
    memberType: 'Guest',
  },
];

const typeSortOrder: Record<MediaType, number> = {
  folder: 0,
  video: 1,
  image: 2,
  audio: 3,
  document: 4,
};

const toolbarControlHoverSx = {
  backgroundColor: cv.surfaceHover,
  borderColor: cv.surfaceActive,
};

function getToolbarControlSx(active = false) {
  return {
    height: 36,
    borderRadius: '10px',
    fontSize: '0.8125rem',
    color: active ? cv.textPrimary : cv.textSecondary,
    backgroundColor: active ? cv.insetHighlight : 'transparent',
    '& .MuiSelect-select': {
      py: 0.75,
      display: 'flex',
      alignItems: 'center',
    },
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: active ? cv.borderFocus : cv.border,
    },
    '&:hover': {
      ...toolbarControlHoverSx,
      '& .MuiOutlinedInput-notchedOutline': {
        borderColor: cv.surfaceActive,
      },
    },
    '&.Mui-focused': {
      backgroundColor: active ? cv.insetHighlight : cv.surfaceHover,
      '& .MuiOutlinedInput-notchedOutline': {
        borderColor: cv.borderFocus,
        borderWidth: 1,
      },
    },
    '& .MuiSelect-icon': { color: cv.textMuted, fontSize: 20 },
  };
}

function getToolbarIconButtonSx(active = false) {
  return {
    width: 36,
    height: 36,
    borderRadius: '10px',
    border: `1px solid ${active ? cv.borderFocus : cv.border}`,
    color: active ? cv.textPrimary : cv.textSecondary,
    backgroundColor: active ? cv.insetHighlight : 'transparent',
    '&:hover': {
      color: cv.textPrimary,
      ...toolbarControlHoverSx,
    },
  };
}

const menuPaperSx = dropdownMenuPaperSx;

const toolbarIconSx = {
  color: cv.textMuted,
  borderRadius: '8px',
  p: 0.75,
  '&:hover': { color: cv.textPrimary, backgroundColor: cv.surfaceHover },
};

const activeToolbarSx = {
  ...toolbarIconSx,
  color: cv.textPrimary,
  backgroundColor: cv.insetHighlight,
};

const typeGroupLabels: Record<MediaType, string> = {
  folder: 'Folders',
  video: 'Videos',
  image: 'Images',
  audio: 'Audio',
  document: 'Files',
};

const allTypes: MediaType[] = ['folder', 'video', 'image', 'audio', 'document'];

function ToolbarTooltip({
  title,
  children,
}: {
  title: string;
  children: React.ReactElement;
}) {
  return (
    <Tooltip title={title} arrow>
      {children}
    </Tooltip>
  );
}

interface DashboardPageProps {
  libraryView?: LibraryView;
  folderMedia?: MediaItem;
}

export default function DashboardPage({
  libraryView = 'recent',
  folderMedia,
}: DashboardPageProps) {
  const { user } = useAuth();
  const isFavoritesView = libraryView === 'favorites';
  const isDuplicatesView = libraryView === 'duplicates';
  const isProjectsView = libraryView === 'projects';
  const isSharedView = libraryView === 'shared';
  const isFolderView = Boolean(folderMedia);

  const {
    favoriteMediaItems,
    duplicateMediaItems,
    sharedMediaItems,
    mediaItems,
    libraryItems,
    nextPageToken,
    libraryLoading,
    libraryLoadingMore,
    fetchLibraryFirstPage,
    fetchLibraryNextPage,
    workspaces,
    activeWorkspaceId,
    globalSearchQuery,
    setGlobalSearchQuery,
    favorites,
    toggleFavorite,
    trashedIds,
    draggingMediaIds,
    setDraggingMediaIds,
    clearDraggingMedia,
    dropTargetKey,
    setDropTargetKey,
    selectedMediaIds,
    toggleMediaSelection,
    setMediaSelection,
    clearMediaSelection,
    moveMediaToDashboardFolder,
    moveMediaToWorkspaceFolder,
    moveMediaToTrashBulk,
    updateMediaProjectLocation,
    uploadMediaFiles,
    createRootMediaFolder,
    createProject,
    sidebarSelection,
    activeWorkspace,
  } = useDashboard();

  // Duplicates pagination and tabs state
  const [duplicateTab, setDuplicateTab] = useState<MediaType>('video');
  const [duplicatePage, setDuplicatePage] = useState(1);
  const DUPLICATES_PER_PAGE = 48;

  const { sentinelRef } = useLibraryInfiniteScroll({
    loading: libraryLoadingMore,
    hasMore: Boolean(nextPageToken),
    onLoadMore: fetchLibraryNextPage,
  });

  const handleDuplicateTabChange = (event: React.SyntheticEvent, newValue: MediaType) => {
    setDuplicateTab(newValue);
    setDuplicatePage(1); // Reset page on tab change
  };

  const handleDuplicatePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setDuplicatePage(value);
  };

  const selectionTitle = getSidebarSelectionTitle(sidebarSelection);
  const pageTitle = folderMedia
    ? folderMedia.title
    : isFavoritesView
      ? 'Favorites'
      : isDuplicatesView
        ? 'Duplicates'
        : isProjectsView
          ? 'Projects'
          : isSharedView
            ? 'Shared'
            : selectionTitle ?? 'All media';
  const folderAccent = folderMedia
    ? resolveLibraryFolderColor({
        folderColor: folderMedia.folderColor,
        isProject: folderMedia.isProject,
      })
    : null;

  const folderBreadcrumbs = useMemo(() => {
    if (!folderMedia) return [];
    return getMediaFolderBreadcrumbs(folderMedia, mediaItems);
  }, [folderMedia, mediaItems]);

  const folderProjectLabel = useMemo(() => {
    if (!folderMedia?.projectLocation) return null;
    return formatProjectLocationLabel(
      folderMedia.projectLocation,
      activeWorkspace?.projectFolders || [],
    );
  }, [folderMedia, activeWorkspace?.projectFolders]);

  const contentRef = useRef<HTMLElement>(null);
  const newUploadInputRef = useRef<HTMLInputElement>(null);
  const helpButtonRef = useRef<HTMLButtonElement>(null);
  const [helpMenuOpen, setHelpMenuOpen] = useState(false);
  const [keyboardShortcutsOpen, setKeyboardShortcutsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [moreMenuAnchor, setMoreMenuAnchor] = useState<null | HTMLElement>(null);
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  // Applied filter state — these drive the API call
  const [mediaTypeFilter, setMediaTypeFilter] = useState<MediaTypeFilter>('all');
  const [dateRangeFilter, setDateRangeFilter] = useState<DateRangeFilter>('all');
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [selectedAiTags, setSelectedAiTags] = useState<Set<string>>(new Set());

  // Pending filter state — tracks what the user has selected but not yet submitted
  const [pendingMediaType, setPendingMediaType] = useState<MediaTypeFilter>('all');
  const [pendingDateRange, setPendingDateRange] = useState<DateRangeFilter>('all');
  const [pendingTags, setPendingTags] = useState<Set<string>>(new Set());
  const [pendingAiTags, setPendingAiTags] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [linkNewItemsToProject, setLinkNewItemsToProject] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [newMenuAnchor, setNewMenuAnchor] = useState<null | HTMLElement>(null);
  const [newFolderModalOpen, setNewFolderModalOpen] = useState(false);
  const [newProjectModalOpen, setNewProjectModalOpen] = useState(false);
  const [bulkTrashOpen, setBulkTrashOpen] = useState(false);
  const [bulkMoveOpen, setBulkMoveOpen] = useState(false);
  const [inviteTeamMemberOpen, setInviteTeamMemberOpen] = useState(false);
  const [folderTeamMembers, setFolderTeamMembers] = useState<
    Record<string, WorkspaceTeamMember[]>
  >({});
  const [orgTeamMembers, setOrgTeamMembers] = useState<WorkspaceTeamMember[]>([]);
  const lastSelectedIdRef = useRef<string | null>(null);
  const { getShortcut } = useResolvedKeyboardShortcuts();
  const helpMenuShortcut =
    getShortcut('dashboard-open-help-menu') ?? getHelpMenuShortcutLabel();

  // Hook up the backend API fetching for Infinite Scroll (All Views)
  useEffect(() => {
    if (activeWorkspaceId) {
      let view: LibraryViewParam = 'all';
      if (folderMedia) {
        view = folderMedia.isProject ? 'project' : 'folder';
      } else if (libraryView === 'recent') view = 'all';
      else if (libraryView === 'favorites') view = 'favorites';
      else if (libraryView === 'duplicates') view = 'duplicates';
      else if (libraryView === 'shared') view = 'shared';
      else if (libraryView === 'projects') view = 'projects';
      else if (libraryView === 'folder') view = 'folder';
      else if (libraryView === 'project') view = 'project';

    fetchLibraryFirstPage({
        workspaceId: activeWorkspaceId,
        view,
        folderId: view === 'folder' && folderMedia ? folderMedia.id : undefined,
        projectId: view === 'project' && folderMedia ? folderMedia.id : undefined,
        q: globalSearchQuery,
        mediaType: mediaTypeFilter,
        dateRange: dateRangeFilter,
        tagIds: Array.from(selectedTags),
        aiTags: Array.from(selectedAiTags),
        sortBy,
        sortOrder: sortDirection,
        pageSize: 48,
      });
    }
  }, [
    libraryView,
    activeWorkspaceId,
    folderMedia?.id,
    globalSearchQuery,
    mediaTypeFilter,
    dateRangeFilter,
    selectedTags,
    selectedAiTags,
    sortBy,
    sortDirection,
    fetchLibraryFirstPage
  ]);

  useEffect(() => {
    let mounted = true;
    fetchOrganizationUsers()
      .then((apiUsers) => {
        if (!mounted || !apiUsers || !Array.isArray(apiUsers) || apiUsers.length === 0) return;
        const mapped: WorkspaceTeamMember[] = apiUsers.map((u) => {
          const name = u.name || u.email.split('@')[0];
          const initials = name
            .split(' ')
            .filter(Boolean)
            .map((part) => part[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);

          const isCurrent =
            u.email?.toLowerCase() === CURRENT_USER.email?.toLowerCase() ||
            u.id === CURRENT_USER.id;

          return {
            id: u.id,
            name,
            initials: initials || 'U',
            email: u.email,
            avatarUrl: isCurrent ? CURRENT_USER.avatarUrl : undefined,
            access: (u.role && u.role.toLowerCase().includes('super')) ? 'Full Access' : 'Can edit',
            memberType: 'Member',
            isCurrentUser: isCurrent,
          };
        });

        // Sort current user first, then alphabetically by name
        mapped.sort((a, b) => {
          if (a.isCurrentUser && !b.isCurrentUser) return -1;
          if (!a.isCurrentUser && b.isCurrentUser) return 1;
          return a.name.localeCompare(b.name);
        });

        setOrgTeamMembers(mapped);
      })
      .catch((err) => {
        console.error('Failed to load organization users for avatar stack:', err);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const selectedContainerId = sidebarSelection?.folderId ?? null;

  const canInviteToFolder = useMemo(() => {
    if (user?.roleId === ROLE_IDS.EDITOR || user?.roleId === ROLE_IDS.COLLABORATOR || user?.roleId === ROLE_IDS.VIEWER) return false;
    return canInviteTeamMembersToFolderSelection(
      sidebarSelection,
      activeWorkspace?.folders || [],
      activeWorkspace?.projectFolders || [],
      { isFavoritesView },
    );
  }, [sidebarSelection, activeWorkspace?.folders, activeWorkspace?.projectFolders, isFavoritesView, user?.role]);

  const displayedTeamMembers = useMemo(() => {
    if (!sidebarSelection) {
      return orgTeamMembers;
    }

    if (selectedContainerId && folderTeamMembers[selectedContainerId]?.length) {
      return folderTeamMembers[selectedContainerId];
    }

    if (canInviteToFolder || isProjectSelection(sidebarSelection)) {
      return orgTeamMembers;
    }

    return [];
  }, [sidebarSelection, selectedContainerId, folderTeamMembers, canInviteToFolder, orgTeamMembers]);

  useEffect(() => {
    if (!canInviteToFolder && inviteTeamMemberOpen) {
      setInviteTeamMemberOpen(false);
    }
  }, [canInviteToFolder, inviteTeamMemberOpen]);

  useEffect(() => {
    clearMediaSelection();
    lastSelectedIdRef.current = null;
  }, [activeWorkspaceId, libraryView, sidebarSelection, folderMedia?.id, clearMediaSelection]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (matchesKeyboardShortcut(event, helpMenuShortcut)) {
        event.preventDefault();
        setHelpMenuOpen((open) => !open);
        return;
      }

      if (event.key === 'Escape' && selectedMediaIds.size > 0) {
        clearMediaSelection();
        lastSelectedIdRef.current = null;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [clearMediaSelection, helpMenuShortcut, selectedMediaIds.size]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const hasActiveFilters =
    mediaTypeFilter !== 'all' ||
    dateRangeFilter !== 'all' ||
    selectedTags.size > 0 ||
    selectedAiTags.size > 0;

  const hasNonDefaultSort = sortBy !== 'date' || sortDirection !== 'desc';

  const librarySourceItems = useMemo(() => {
    if (isFavoritesView) return favoriteMediaItems;
    if (isDuplicatesView) return libraryItems;
    if (isSharedView) return libraryItems;
    if (isProjectsView) {
      return mediaItems.filter(
        (item) => item.workspaceId === activeWorkspaceId && item.isProject && !trashedIds.has(item.id)
      );
    }

    if (folderMedia) {
      if (folderMedia.isProject) {
        return mediaItems.filter(
          (item) =>
            item.workspaceId === activeWorkspaceId &&
            (item.linkedProjectIds || []).includes(folderMedia.id) &&
            !trashedIds.has(item.id),
        );
      }
      return mediaItems.filter(
        (item) =>
          item.workspaceId === activeWorkspaceId &&
          item.parentFolderId === folderMedia.id &&
          !trashedIds.has(item.id),
      );
    }

    const workspaceItems = mediaItems.filter(
      (item) =>
        item.workspaceId === activeWorkspaceId && !trashedIds.has(item.id),
    );

    // All media: every project, folder, and file — hide organizational year/month folders.
    if (!sidebarSelection) {
      return workspaceItems;
    }

    return filterMediaBySidebarSelection(workspaceItems, sidebarSelection, mediaItems);
  }, [
    isFavoritesView,
    isDuplicatesView,
    isSharedView,
    favoriteMediaItems,
    duplicateMediaItems,
    sharedMediaItems,
    folderMedia,
    mediaItems,
    activeWorkspaceId,
    trashedIds,
    sidebarSelection,
    isProjectsView,
  ]);

  const displayedItems = useMemo(() => {
    if (isFavoritesView) {
      return libraryItems.filter(item => favorites.has(item.id));
    }
    return libraryItems;
  }, [
    libraryView,
    libraryItems,
    librarySourceItems,
    favoriteMediaItems,
    duplicateMediaItems,
    sharedMediaItems,
    isFavoritesView,
    isDuplicatesView,
    isSharedView,
    mediaItems,
    activeWorkspaceId,
    globalSearchQuery,
    mediaTypeFilter,
    dateRangeFilter,
    selectedTags,
    selectedAiTags,
    sortBy,
    sortDirection,
    trashedIds,
    refreshKey,
    sidebarSelection,
    isProjectsView,
    favorites,
  ]);

  const duplicateClusters = useMemo(() => {
    if (!isDuplicatesView) return [];

    // Group library items (from the API) by title — items sharing the same title are duplicates.
    // The oldest item (earliest createdAt) is treated as the "original".
    const byTitle = new Map<string, typeof libraryItems>();

    libraryItems.forEach(item => {
      const key = item.title?.trim().toLowerCase() || item.id;
      if (!byTitle.has(key)) {
        byTitle.set(key, []);
      }
      byTitle.get(key)!.push(item);
    });

    const result: { originalId: string; originalItem: (typeof libraryItems)[0]; duplicates: typeof libraryItems }[] = [];

    byTitle.forEach((items) => {
      if (items.length < 2) return; // not a duplicate group
      // Sort ascending by createdAt — oldest is the original
      const sorted = [...items].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      const [originalItem, ...duplicates] = sorted;
      result.push({
        originalId: originalItem.id,
        originalItem,
        duplicates,
      });
    });

    return result;
  }, [isDuplicatesView, libraryItems]);

  const groupedItems = useMemo(() => {
    const groups: Record<MediaType | 'project', typeof displayedItems> = {
      project: [],
      folder: [],
      video: [],
      image: [],
      audio: [],
      document: [],
    };
    displayedItems.forEach((item) => {
      const safeType = item.type || 'document';
      if (safeType === 'folder' && item.isProject) {
        if (groups['project']) groups['project'].push(item);
      } else {
        if (groups[safeType]) {
          groups[safeType].push(item);
        } else {
          groups['document'].push(item);
        }
      }
    });
    return groups;
  }, [displayedItems]);

  const handleSortByChange = (event: SelectChangeEvent) => {
    setSortBy(event.target.value as SortField);
  };

  const toggleTag = (tag: string) => {
    setPendingTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  };

  const toggleAiTag = (tag: string) => {
    setPendingAiTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  };

  const openNewMenu = (event: React.MouseEvent<HTMLElement>) => {
    setNewMenuAnchor(event.currentTarget);
  };

  const closeNewMenu = () => {
    setNewMenuAnchor(null);
  };

  const handleNewUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadable = getUploadableFiles(event.target.files ?? []);
    if (uploadable.length > 0) {
      const isProject = folderMedia?.isProject;
      uploadMediaFiles(uploadable, {
        parentFolderId: isProject ? (folderMedia?.parentFolderId ?? null) : (folderMedia?.id ?? null),
        linkedProjectId: isProject && linkNewItemsToProject ? folderMedia?.id : null,
      });
    }
    event.target.value = '';
  };

  const handleCreateFolder = async (
    name: string,
    color: string,
    projectLocation?: MediaLocation | null,
  ) => {
    const isProject = folderMedia?.isProject;
    const parentId = isProject ? (folderMedia?.parentFolderId ?? null) : (folderMedia?.id ?? null);
    const location = isProject && linkNewItemsToProject ? { folderId: folderMedia.id } : projectLocation;
    
    const folderId = await createRootMediaFolder(name, color, parentId, location);
    if (folderId) {
      navigate(`/home/folder/${folderId}`);
    }
  };

  const handleCreateProject = async (name: string, tagIds: string[] = []) => {
    const projectId = await createProject(name, folderMedia?.id ?? null, tagIds);
    if (projectId) {
      navigate(`/home/project/${projectId}`);
    }
  };

  const handleApplyFilters = () => {
    setMediaTypeFilter(pendingMediaType);
    setDateRangeFilter(pendingDateRange);
    setSelectedTags(new Set(pendingTags));
    setSelectedAiTags(new Set(pendingAiTags));
    setFilterPanelOpen(false);
  };

  const clearPanelFilters = () => {
    // Reset both pending and applied together
    setPendingMediaType('all');
    setPendingDateRange('all');
    setPendingTags(new Set());
    setPendingAiTags(new Set());
    setMediaTypeFilter('all');
    setDateRangeFilter('all');
    setSelectedTags(new Set());
    setSelectedAiTags(new Set());
  };

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await contentRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleToggleSelect = (
    itemId: string,
    event?: React.MouseEvent,
  ) => {
    const target = displayedItems.find((item) => item.id === itemId);
    if (target?.isProject) return;

    if (event?.shiftKey && lastSelectedIdRef.current) {
      const selectableItems = displayedItems.filter((item) => !item.isProject);
      const ids = selectableItems.map((item) => item.id);
      const start = ids.indexOf(lastSelectedIdRef.current);
      const end = ids.indexOf(itemId);
      if (start !== -1 && end !== -1) {
        const [from, to] = start < end ? [start, end] : [end, start];
        setMediaSelection(ids.slice(from, to + 1));
        return;
      }
    }

    if (event?.metaKey || event?.ctrlKey) {
      toggleMediaSelection(itemId);
      lastSelectedIdRef.current = itemId;
      return;
    }

    toggleMediaSelection(itemId);
    lastSelectedIdRef.current = itemId;
  };

  const selectableDisplayedItems = useMemo(
    () => displayedItems.filter((item) => !item.isProject),
    [displayedItems],
  );

  useEffect(() => {
    const projectIds = mediaItems
      .filter((item) => item.isProject && selectedMediaIds.has(item.id))
      .map((item) => item.id);
    if (projectIds.length === 0) return;

    setMediaSelection(
      [...selectedMediaIds].filter((id) => !projectIds.includes(id)),
    );
  }, [mediaItems, selectedMediaIds, setMediaSelection]);

  const handleBulkDelete = () => {
    if (selectedMediaIds.size === 0) return;
    setBulkTrashOpen(true);
  };

  const handleBulkMove = () => {
    if (selectedMediaIds.size === 0) return;
    setBulkMoveOpen(true);
  };

  const confirmBulkDelete = () => {
    moveMediaToTrashBulk([...selectedMediaIds]);
    setBulkTrashOpen(false);
    lastSelectedIdRef.current = null;
  };

  const handleBulkMoveDestination = (destination: MoveDestination) => {
    const selectedIds = [...selectedMediaIds];
    if (selectedIds.length === 0) return;

    if (destination.kind === 'project') {
      const performAssignAndMove = async () => {
        // Cross-workspace assignment: physically move items to the project's parent folder first.
        // Same-workspace assignment: link only — no physical move needed.
        if (destination.workspaceId !== activeWorkspaceId) {
          await moveMediaToWorkspaceFolder(selectedIds, destination.workspaceId, destination.targetFolderId || null);
        }

        // Link every selected item to the project
        for (const mediaId of selectedIds) {
          const media = mediaItems.find((item) => item.id === mediaId);
          if (!media || media.isProject) continue; // can't assign a project to a project
          void updateMediaProjectLocation(mediaId, { folderId: destination.projectId }, media.type);
        }
      };
      void performAssignAndMove();

    } else if (destination.workspaceId === activeWorkspaceId) {
      // Moving within the same workspace to a folder
      if (destination.folderId === '__ROOT__') {
        moveMediaToWorkspaceFolder(selectedIds, destination.workspaceId, null);
      } else {
        moveMediaToDashboardFolder(selectedIds, destination.folderId);
      }
    } else {
      // Moving to a different workspace folder
      moveMediaToWorkspaceFolder(selectedIds, destination.workspaceId, destination.folderId === '__ROOT__' ? null : destination.folderId);
    }

    clearMediaSelection();
    lastSelectedIdRef.current = null;
  };

  const handleDropOnFolder = (folderId: string, mediaIds: string[]) => {
    moveMediaToDashboardFolder(mediaIds, folderId);
    clearDraggingMedia();
    setDropTargetKey(null);
  };

  const renderMediaItem = (item: (typeof displayedItems)[0], compact = false) => {
    const sharedProps = {
      key: item.id,
      item,
      isFavorite: favorites.has(item.id),
      isSelected: selectedMediaIds.has(item.id),
      isDragging: draggingMediaIds.has(item.id),
      isDropTarget:
        item.type === 'folder' &&
        dropTargetKey === getDashboardFolderDropTargetKey(item.id),
      selectedMediaIds,
      onToggleFavorite: toggleFavorite,
      onToggleSelect: (id: string) => handleToggleSelect(id),
      onDragStart: setDraggingMediaIds,
      onDragEnd: clearDraggingMedia,
      onDropOnFolder: handleDropOnFolder,
      onFolderDragOver: (folderId: string) =>
        setDropTargetKey(getDashboardFolderDropTargetKey(folderId)),
      onFolderDragLeave: () => setDropTargetKey(null),
    };

    if (compact || viewMode === 'list') {
      return <MediaListRow {...sharedProps} />;
    }
    return <MediaItemCard {...sharedProps} />;
  };

  const bulkTrashItemNames = [...selectedMediaIds]
    .map((id) => displayedItems.find((item) => item.id === id)?.title)
    .filter((title): title is string => Boolean(title));

  const isBulkTrashMulti = selectedMediaIds.size > 1;

  const bulkTrashTitle = isBulkTrashMulti
    ? `${selectedMediaIds.size} items`
    : bulkTrashItemNames[0] ?? '1 item';

  return (
    <Box
      ref={contentRef}
      component="main"
      sx={{
        flex: 1,
        overflowY: 'auto',
        px: { xs: 2, md: 3 },
        py: { xs: 2, md: 3 },
        position: 'relative',
        backgroundColor: isFullscreen ? cv.bg : 'transparent',
      }}
    >
      <Box sx={{ mb: 3 }}>
        {isFolderView ? (
          <Box
            component="nav"
            aria-label="Folder breadcrumb"
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.75,
              mb: 1,
              flexWrap: 'wrap',
            }}
          >
            <Box
              component={RouterLink}
              to="/home"
              sx={{
                fontSize: '0.875rem',
                color: cv.textSecondary,
                textDecoration: 'none',
                '&:hover': { color: cv.textPrimary },
              }}
            >
              All media
            </Box>
            {folderBreadcrumbs.map((crumb, index) => {
              const isLast = index === folderBreadcrumbs.length - 1;
              return (
                <Fragment key={crumb.id}>
                  <Typography sx={{ fontSize: '0.875rem', color: cv.textMuted }} aria-hidden>
                    /
                  </Typography>
                  {isLast ? (
                    <Typography
                      sx={{ fontSize: '0.875rem', color: cv.textPrimary, fontWeight: 500 }}
                      aria-current="page"
                    >
                      {crumb.title}
                    </Typography>
                  ) : (
                    <Box
                      component={RouterLink}
                      to={getMediaFolderPath(crumb.id)}
                      sx={{
                        fontSize: '0.875rem',
                        color: cv.textSecondary,
                        textDecoration: 'none',
                        '&:hover': { color: cv.textPrimary },
                      }}
                    >
                      {crumb.title}
                    </Box>
                  )}
                </Fragment>
              );
            })}
          </Box>
        ) : null}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
            {folderAccent ? (
              <Box
                aria-hidden
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '4px',
                  backgroundColor: folderAccent,
                  flexShrink: 0,
                }}
              />
            ) : null}
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 600, fontSize: { xs: '1.125rem', sm: '1.375rem' } }}>
                {pageTitle}
              </Typography>
              {isFolderView ? (
                <>
                  <Typography sx={{ mt: 0.35, fontSize: '0.875rem', color: cv.textSecondary }}>
                    {librarySourceItems.length}{' '}
                    {librarySourceItems.length === 1 ? 'item' : 'items'}
                  </Typography>
                  {folderProjectLabel ? (
                    <Typography sx={{ mt: 0.25, fontSize: '0.8125rem', color: cv.textMuted }}>
                      Project: {folderProjectLabel}
                    </Typography>
                  ) : null}
                </>
              ) : null}
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
              <ToolbarTooltip title="More options">
                <IconButton
                  size="small"
                  sx={toolbarIconSx}
                  onClick={(e) => setMoreMenuAnchor(e.currentTarget)}
                  aria-label="More options"
                >
                  <MoreHorizIcon sx={{ fontSize: 20 }} />
                </IconButton>
              </ToolbarTooltip>

              <ToolbarTooltip title="Group by type">
                <IconButton
                  size="small"
                  sx={viewMode === 'folder' ? activeToolbarSx : toolbarIconSx}
                  onClick={() => setViewMode('folder')}
                  aria-label="Group by type"
                  aria-pressed={viewMode === 'folder'}
                >
                  <FolderOutlinedIcon sx={{ fontSize: 20 }} />
                </IconButton>
              </ToolbarTooltip>

              <ToolbarTooltip title="List view">
                <IconButton
                  size="small"
                  sx={viewMode === 'list' ? activeToolbarSx : toolbarIconSx}
                  onClick={() => setViewMode('list')}
                  aria-label="List view"
                  aria-pressed={viewMode === 'list'}
                >
                  <ViewListIcon sx={{ fontSize: 20 }} />
                </IconButton>
              </ToolbarTooltip>

              <ToolbarTooltip title="Grid view">
                <IconButton
                  size="small"
                  sx={viewMode === 'grid' ? activeToolbarSx : toolbarIconSx}
                  onClick={() => setViewMode('grid')}
                  aria-label="Grid view"
                  aria-pressed={viewMode === 'grid'}
                >
                  <GridViewIcon sx={{ fontSize: 20 }} />
                </IconButton>
              </ToolbarTooltip>

              <ToolbarTooltip title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}>
                <IconButton
                  size="small"
                  sx={isFullscreen ? activeToolbarSx : toolbarIconSx}
                  onClick={toggleFullscreen}
                  aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                >
                  {isFullscreen ? (
                    <CloseFullscreenIcon sx={{ fontSize: 20 }} />
                  ) : (
                    <OpenInFullIcon sx={{ fontSize: 20 }} />
                  )}
                </IconButton>
              </ToolbarTooltip>
            </Box>

            <Tooltip title="Filter media" arrow>
              <Button
                startIcon={<SearchIcon sx={{ fontSize: 18 }} />}
                size="small"
                onClick={() => setFilterPanelOpen((open) => !open)}
                aria-expanded={filterPanelOpen}
                sx={{
                  color:
                    hasActiveFilters || filterPanelOpen
                      ? cv.textPrimary
                      : cv.textSecondary,
                  borderRadius: '10px',
                  px: 1.5,
                  py: 0.75,
                  fontSize: '0.8125rem',
                  border: `1px solid ${hasActiveFilters || filterPanelOpen ? cv.borderFocus : cv.border
                    }`,
                  backgroundColor:
                    hasActiveFilters || filterPanelOpen
                      ? cv.insetHighlight
                      : 'transparent',
                  '&:hover': {
                    backgroundColor: cv.surfaceHover,
                    borderColor: cv.surfaceActive,
                  },
                }}
              >
                Filter
              </Button>
            </Tooltip>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FormControl size="small" sx={{ minWidth: { xs: 130, sm: 148 } }}>
                <Select
                  value={sortBy}
                  onChange={handleSortByChange}
                  displayEmpty
                  IconComponent={KeyboardArrowDownIcon}
                  renderValue={(value) => `Sort by ${sortFieldLabels[value as SortField]}`}
                  sx={{
                    ...getToolbarControlSx(hasNonDefaultSort),
                    minWidth: { xs: 130, sm: 148 },
                  }}
                  MenuProps={{
                    slotProps: {
                      paper: { sx: { ...menuPaperSx, minWidth: 160 } },
                    },
                  }}
                >
                  {(Object.keys(sortFieldLabels) as SortField[]).map((field) => (
                    <MenuItem
                      key={field}
                      value={field}
                      sx={{ fontSize: '0.875rem', color: cv.textSecondary }}
                    >
                      {sortFieldLabels[field]}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <ToolbarTooltip
                title={sortDirection === 'desc' ? 'Sort descending' : 'Sort ascending'}
              >
                <IconButton
                  size="small"
                  aria-label={sortDirection === 'desc' ? 'Sort descending' : 'Sort ascending'}
                  onClick={() =>
                    setSortDirection((prev) => (prev === 'desc' ? 'asc' : 'desc'))
                  }
                  sx={getToolbarIconButtonSx(hasNonDefaultSort)}
                >
                  {sortDirection === 'desc' ? (
                    <ArrowDownwardIcon sx={{ fontSize: 18 }} />
                  ) : (
                    <ArrowUpwardIcon sx={{ fontSize: 18 }} />
                  )}
                </IconButton>
              </ToolbarTooltip>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', width: { xs: '100%', lg: 'auto' } }}>
            {canInviteToFolder ? (
              <InviteTeamMemberButton onClick={() => setInviteTeamMemberOpen(true)} />
            ) : null}
            <input
              ref={newUploadInputRef}
              type="file"
              multiple
              accept={UPLOAD_ACCEPT}
              hidden
              onChange={handleNewUpload}
            />
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={openNewMenu}
              sx={{
                background: cv.brandGradient,
                boxShadow: cv.brandShadow,
                borderRadius: '10px',
                px: 2,
                py: 0.75,
                fontSize: '0.875rem',
                '&:hover': {
                  background: cv.brandGradientHover,
                },
              }}
            >
              New
            </Button>
          </Box>
        </Box>

        <Menu
          anchorEl={newMenuAnchor}
          open={Boolean(newMenuAnchor)}
          onClose={closeNewMenu}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          slotProps={{
            paper: {
              sx: {
                ...menuPaperSx,
                minWidth: 200,
                boxShadow: cv.dropdownShadow,
              },
            },
          }}
        >
          {folderMedia?.isProject && (
            <MenuItem
              disableRipple
              onClick={(e) => {
                e.stopPropagation();
                setLinkNewItemsToProject((prev) => !prev);
              }}
              sx={{
                py: 1,
                fontSize: '0.875rem',
                color: cv.textSecondary,
                cursor: 'default',
                '&:hover': { backgroundColor: 'transparent' },
                borderBottom: `1px solid ${cv.border}`,
                mb: 1
              }}
            >
              <FormControlLabel
                control={
                  <Checkbox 
                    checked={linkNewItemsToProject} 
                    onChange={(e) => setLinkNewItemsToProject(e.target.checked)}
                    size="small"
                    sx={{ p: 0.5, ml: 1, color: cv.textMuted, '&.Mui-checked': { color: cv.brandBlue } }}
                  />
                }
                label="Link to project"
                sx={{ m: 0, '& .MuiFormControlLabel-label': { fontSize: '0.875rem', ml: 1 } }}
              />
            </MenuItem>
          )}
          <MenuItem
            disabled={user?.roleId === ROLE_IDS.COLLABORATOR || user?.roleId === ROLE_IDS.VIEWER}
            onClick={() => {
              if (user?.roleId === ROLE_IDS.COLLABORATOR || user?.roleId === ROLE_IDS.VIEWER) return;
              closeNewMenu();
              newUploadInputRef.current?.click();
            }}
            sx={{
              py: 1,
              fontSize: '0.875rem',
              color: user?.roleId === ROLE_IDS.COLLABORATOR || user?.roleId === ROLE_IDS.VIEWER ? cv.textMuted : cv.textSecondary,
              opacity: user?.roleId === ROLE_IDS.COLLABORATOR || user?.roleId === ROLE_IDS.VIEWER ? 0.6 : 1,
              cursor: user?.roleId === ROLE_IDS.COLLABORATOR || user?.roleId === ROLE_IDS.VIEWER ? 'not-allowed' : 'pointer',
              '&:hover': { backgroundColor: user?.roleId === ROLE_IDS.COLLABORATOR || user?.roleId === ROLE_IDS.VIEWER ? 'transparent' : cv.surfaceHover },
            }}
          >
            <ListItemIcon sx={{ minWidth: 32 }}>
              <CloudUploadOutlinedIcon sx={{ fontSize: 18, color: user?.roleId === ROLE_IDS.COLLABORATOR || user?.roleId === ROLE_IDS.VIEWER ? cv.textMuted : cv.textSecondary }} />
            </ListItemIcon>
            Upload files
          </MenuItem>
          <MenuItem
            disabled={user?.roleId === ROLE_IDS.EDITOR || user?.roleId === ROLE_IDS.COLLABORATOR || user?.roleId === ROLE_IDS.VIEWER}
            onClick={() => {
              if (user?.roleId === ROLE_IDS.EDITOR || user?.roleId === ROLE_IDS.COLLABORATOR || user?.roleId === ROLE_IDS.VIEWER) return;
              closeNewMenu();
              setNewFolderModalOpen(true);
            }}
            sx={{
              py: 1,
              fontSize: '0.875rem',
              color: user?.roleId === ROLE_IDS.EDITOR || user?.roleId === ROLE_IDS.COLLABORATOR || user?.roleId === ROLE_IDS.VIEWER ? cv.textMuted : cv.textSecondary,
              opacity: user?.roleId === ROLE_IDS.EDITOR || user?.roleId === ROLE_IDS.COLLABORATOR || user?.roleId === ROLE_IDS.VIEWER ? 0.6 : 1,
              cursor: user?.roleId === ROLE_IDS.EDITOR || user?.roleId === ROLE_IDS.COLLABORATOR || user?.roleId === ROLE_IDS.VIEWER ? 'not-allowed' : 'pointer',
              '&:hover': { backgroundColor: user?.roleId === ROLE_IDS.EDITOR || user?.roleId === ROLE_IDS.COLLABORATOR || user?.roleId === ROLE_IDS.VIEWER ? 'transparent' : cv.surfaceHover },
            }}
          >
            <ListItemIcon sx={{ minWidth: 32 }}>
              <CreateNewFolderOutlinedIcon sx={{ fontSize: 18, color: user?.roleId === ROLE_IDS.EDITOR || user?.roleId === ROLE_IDS.COLLABORATOR || user?.roleId === ROLE_IDS.VIEWER ? cv.textMuted : cv.textSecondary }} />
            </ListItemIcon>
            New folder
          </MenuItem>
          {!folderMedia?.isProject && (
            <MenuItem
              disabled={user?.roleId === ROLE_IDS.EDITOR || user?.roleId === ROLE_IDS.COLLABORATOR || user?.roleId === ROLE_IDS.VIEWER}
              onClick={() => {
                if (user?.roleId === ROLE_IDS.EDITOR || user?.roleId === ROLE_IDS.COLLABORATOR || user?.roleId === ROLE_IDS.VIEWER) return;
                closeNewMenu();
                setNewProjectModalOpen(true);
              }}
              sx={{
                py: 1,
                fontSize: '0.875rem',
                color: user?.roleId === ROLE_IDS.EDITOR || user?.roleId === ROLE_IDS.COLLABORATOR || user?.roleId === ROLE_IDS.VIEWER ? cv.textMuted : cv.textSecondary,
                opacity: user?.roleId === ROLE_IDS.EDITOR || user?.roleId === ROLE_IDS.COLLABORATOR || user?.roleId === ROLE_IDS.VIEWER ? 0.6 : 1,
                cursor: user?.roleId === ROLE_IDS.EDITOR || user?.roleId === ROLE_IDS.COLLABORATOR || user?.roleId === ROLE_IDS.VIEWER ? 'not-allowed' : 'pointer',
                '&:hover': { backgroundColor: user?.roleId === ROLE_IDS.EDITOR || user?.roleId === ROLE_IDS.COLLABORATOR || user?.roleId === ROLE_IDS.VIEWER ? 'transparent' : cv.surfaceHover },
              }}
            >
              <ListItemIcon sx={{ minWidth: 32 }}>
                <AddIcon sx={{ fontSize: 18, color: user?.roleId === ROLE_IDS.EDITOR || user?.roleId === ROLE_IDS.COLLABORATOR || user?.roleId === ROLE_IDS.VIEWER ? cv.textMuted : cv.textSecondary }} />
              </ListItemIcon>
              New project
            </MenuItem>
          )}
        </Menu>

        <NewFolderModal
          open={newFolderModalOpen}
          onClose={() => setNewFolderModalOpen(false)}
          onCreate={handleCreateFolder}
          parentFolderTitle={folderMedia?.title}
          defaultProjectLocation={folderMedia?.projectLocation}
          projectFolders={folderMedia?.isProject ? [] : (activeWorkspace?.projectFolders || [])}
        />

        <NewProjectModal
          open={newProjectModalOpen}
          onClose={() => setNewProjectModalOpen(false)}
          onCreate={handleCreateProject}
          parentFolderTitle={folderMedia?.title}
        />

        <Collapse in={filterPanelOpen}>
          <Box sx={{ mt: 2 }}>
            <MediaFilterPanel
              mediaTypeFilter={pendingMediaType}
              dateRangeFilter={pendingDateRange}
              selectedTags={pendingTags}
              selectedAiTags={pendingAiTags}
              onMediaTypeChange={setPendingMediaType}
              onDateRangeChange={setPendingDateRange}
              onToggleTag={toggleTag}
              onToggleAiTag={toggleAiTag}
              onClearAll={clearPanelFilters}
              onApply={handleApplyFilters}
            />
          </Box>
        </Collapse>
      </Box>

      <Menu
        anchorEl={moreMenuAnchor}
        open={Boolean(moreMenuAnchor)}
        onClose={() => setMoreMenuAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{
          paper: {
            sx: {
              mt: 0.5,
              minWidth: 200,
              borderRadius: '12px',
              border: "1px solid var(--noah-border)",
              background: 'var(--noah-popover-surface)',
              backdropFilter: 'blur(20px)',
            },
          },
        }}
      >
        <MenuItem
          onClick={() => {
            setRefreshKey((k) => k + 1);
            setMoreMenuAnchor(null);
          }}
          sx={{ fontSize: '0.875rem', color: cv.textSecondary }}
        >
          <RefreshIcon sx={{ fontSize: 18, mr: 1.5, color: cv.textMuted }} />
          Refresh library
        </MenuItem>
        <MenuItem
          onClick={() => {
            clearPanelFilters();
            setGlobalSearchQuery('');
            setSortBy('date');
            setSortDirection('desc');
            setMoreMenuAnchor(null);
          }}
          sx={{ fontSize: '0.875rem', color: cv.textSecondary }}
        >
          Reset filters
        </MenuItem>
      </Menu>

      <MediaSelectionBar
        selectedCount={selectedMediaIds.size}
        totalCount={selectableDisplayedItems.length}
        onSelectAll={() =>
          setMediaSelection(selectableDisplayedItems.map((item) => item.id))
        }
        onClearSelection={() => {
          clearMediaSelection();
          lastSelectedIdRef.current = null;
        }}
        onMove={handleBulkMove}
        onDelete={handleBulkDelete}
      />

      <MoveItemsModal
        open={bulkMoveOpen}
        itemCount={selectedMediaIds.size}
        sourceItemIds={Array.from(selectedMediaIds)}
        mediaItems={mediaItems}
        workspaces={workspaces}
        activeWorkspaceId={activeWorkspaceId}
        trashedIds={trashedIds}
        onClose={() => setBulkMoveOpen(false)}
        onMove={handleBulkMoveDestination}
      />

      <TrashConfirmModal
        open={bulkTrashOpen}
        itemTitle={bulkTrashTitle}
        itemNames={isBulkTrashMulti ? bulkTrashItemNames : undefined}
        confirmationPhrase={
          isBulkTrashMulti ? MULTI_ITEM_TRASH_CONFIRMATION_PHRASE : undefined
        }
        title={
          isBulkTrashMulti
            ? `Move ${selectedMediaIds.size} items to trash?`
            : 'Move to trash?'
        }
        requireNameConfirmation
        description={
          isBulkTrashMulti
            ? 'These items will be removed from your library and moved to trash. You can restore them later from the Trash view.'
            : 'This item will be removed from your library and moved to trash. You can restore it later from the Trash view.'
        }
        onClose={() => setBulkTrashOpen(false)}
        onConfirm={confirmBulkDelete}
      />

      {displayedItems.length === 0 ? (
        <Box
          sx={{
            py: 8,
            textAlign: 'center',
            color: cv.textMuted,
            borderRadius: '16px',
            border: `1px dashed ${cv.border}`,
          }}
        >
          <Typography variant="body1" sx={{ mb: 0.5 }}>
            {isFolderView
              ? librarySourceItems.length === 0
                ? 'This folder is empty'
                : 'No items match your filters'
              : isFavoritesView
                ? librarySourceItems.length === 0
                  ? 'No favorites yet'
                  : 'No favorites match your filters'
                : isDuplicatesView
                  ? librarySourceItems.length === 0
                    ? 'No duplicates found'
                    : 'No duplicates match your filters'
                  : isProjectsView
                    ? librarySourceItems.length === 0
                      ? 'No projects in this workspace'
                      : 'No projects match your filters'
                    : librarySourceItems.length === 0
                      ? 'No media in this workspace'
                      : 'No items match your filters'}
          </Typography>
          <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
            {isFolderView
              ? librarySourceItems.length === 0
                ? 'Upload files or drag items into this folder to get started.'
                : 'Try adjusting your filter settings.'
              : isFavoritesView
                ? librarySourceItems.length === 0
                  ? 'Star files and folders from All media to see them here.'
                  : 'Try adjusting your filter settings.'
                : isDuplicatesView
                  ? librarySourceItems.length === 0
                    ? 'Upload videos to see if they match existing files in this workspace.'
                    : 'Try adjusting your filter settings.'
                  : isProjectsView
                    ? librarySourceItems.length === 0
                      ? 'Create a new project to get started.'
                      : 'Try adjusting your filter settings.'
                    : librarySourceItems.length === 0
                      ? 'Drag items into folders in the sidebar, or switch workspace to see more.'
                      : 'Try adjusting your filter settings.'}
          </Typography>
        </Box>
      ) : isDuplicatesView ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {duplicateClusters.length === 0 ? (
            <Typography variant="body1" sx={{ color: cv.textSecondary }}>
              No duplicates found.
            </Typography>
          ) : (
            (() => {
              const tabSx = {
                minHeight: 40,
                mb: 3,
                borderBottom: `1px solid ${cv.border}`,
                '& .MuiTab-root': {
                  minHeight: 40,
                  py: 1,
                  px: 0,
                  mr: 3,
                  fontSize: '0.9375rem',
                  fontWeight: 600,
                  color: cv.textSecondary,
                  textTransform: 'none',
                  minWidth: 'auto',
                },
                '& .Mui-selected': {
                  color: `${cv.textPrimary} !important`,
                },
                '& .MuiTabs-indicator': {
                  backgroundColor: cv.brandBlue,
                  height: 3,
                  borderRadius: '3px 3px 0 0',
                },
              };

              const duplicateTypes: MediaType[] = ['video', 'image', 'audio', 'document'];
              
              // Filter clusters by current tab
              const currentTabClusters = duplicateClusters.filter(c => c.originalItem?.type === duplicateTab);
              
              // Calculate pagination
              const totalPages = Math.ceil(currentTabClusters.length / DUPLICATES_PER_PAGE);
              const paginatedClusters = currentTabClusters.slice(
                (duplicatePage - 1) * DUPLICATES_PER_PAGE,
                duplicatePage * DUPLICATES_PER_PAGE
              );

              return (
                <Box>
                  <Tabs value={duplicateTab} onChange={handleDuplicateTabChange} sx={tabSx}>
                    {duplicateTypes.map(type => {
                      const count = duplicateClusters.filter(c => c.originalItem?.type === type).length;
                      return (
                        <Tab 
                          key={type} 
                          value={type} 
                          label={`${typeGroupLabels[type]} (${count})`} 
                        />
                      );
                    })}
                  </Tabs>

                  {currentTabClusters.length === 0 ? (
                    <Box
                      sx={{
                        borderRadius: '12px',
                        border: `1px dashed ${cv.border}`,
                        backgroundColor: cv.surface,
                        px: 2,
                        py: 5,
                        textAlign: 'center',
                      }}
                    >
                      <Typography sx={{ fontSize: '0.875rem', color: cv.textMuted }}>
                        No {typeGroupLabels[duplicateTab].toLowerCase()} duplicates found.
                      </Typography>
                    </Box>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {paginatedClusters.map((cluster) => (
                        <Box key={cluster.originalId}>
                          <Typography
                            variant="subtitle2"
                            sx={{
                              mb: 1.5,
                              fontWeight: 600,
                              color: cv.textSecondary,
                              fontSize: '0.8125rem',
                              textTransform: 'uppercase',
                              letterSpacing: '0.06em',
                            }}
                          >
                            Original: {cluster.originalItem?.title || 'Unknown Asset'} & its Duplicates
                          </Typography>
                          <Box
                            sx={{
                              display: 'grid',
                              gridTemplateColumns: {
                                xs: '1fr',
                                sm: 'repeat(auto-fill, minmax(280px, 1fr))',
                              },
                              gap: { xs: 2, sm: 2.5 },
                            }}
                          >
                            {cluster.originalItem && renderMediaItem(cluster.originalItem)}
                            {cluster.duplicates.map((dup) => renderMediaItem(dup))}
                          </Box>
                        </Box>
                      ))}

                      {totalPages > 1 && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, mb: 4 }}>
                          <Pagination 
                            count={totalPages} 
                            page={duplicatePage} 
                            onChange={handleDuplicatePageChange} 
                            color="primary"
                            size="large"
                          />
                        </Box>
                      )}
                    </Box>
                  )}
                </Box>
              );
            })()
          )}
        </Box>
      ) : viewMode === 'folder' ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {(['project', ...allTypes] as const).map((type) => {
            const items = groupedItems[type as MediaType | 'project'] || [];
            if (items.length === 0) return null;
            return (
              <Box key={type}>
                <Typography
                  variant="subtitle2"
                  sx={{
                    mb: 1.5,
                    fontWeight: 600,
                    color: cv.textSecondary,
                    fontSize: '0.8125rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                  }}
                >
                  {type === 'project' ? 'Projects' : typeGroupLabels[type as MediaType]} ({items.length})
                </Typography>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: {
                      xs: '1fr',
                      sm: 'repeat(auto-fill, minmax(280px, 1fr))',
                    },
                    gap: { xs: 2, sm: 2.5 },
                  }}
                >
                  {items.map((item) => renderMediaItem(item))}
                </Box>
              </Box>
            );
          })}
        </Box>
      ) : viewMode === 'list' ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {displayedItems.map((item) => renderMediaItem(item))}
        </Box>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(auto-fill, minmax(280px, 1fr))',
            },
            gap: { xs: 2, sm: 2.5 },
          }}
        >
          {displayedItems.map((item) => renderMediaItem(item))}
        </Box>
      )}

      {/* Infinite Scroll Sentinel */}
      {displayedItems.length > 0 && !isFavoritesView && !isDuplicatesView && (
        <LibraryScrollSentinel
          ref={sentinelRef}
          loading={libraryLoadingMore}
          hasMore={Boolean(nextPageToken)}
        />
      )}

      <IconButton
        ref={helpButtonRef}
        type="button"
        aria-label="Help"
        aria-haspopup="menu"
        aria-expanded={helpMenuOpen}
        onClick={() => setHelpMenuOpen((open) => !open)}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          width: 44,
          height: 44,
          backgroundColor: helpMenuOpen ? cv.surfaceHover : cv.insetHighlight,
          border: "1px solid var(--noah-border)",
          backdropFilter: 'blur(12px)',
          color: helpMenuOpen ? cv.textPrimary : cv.textSecondary,
          '&:hover': {
            backgroundColor: cv.surfaceHover,
            color: cv.textPrimary,
          },
        }}
      >
        <HelpOutlinedIcon sx={{ fontSize: 22 }} />
      </IconButton>

      <HelpMenuDrawer
        open={helpMenuOpen}
        anchorEl={helpButtonRef.current}
        onClose={() => setHelpMenuOpen(false)}
        onKeyboardShortcuts={() => setKeyboardShortcutsOpen(true)}
      />

      <DashboardKeyboardShortcutsDialog
        open={keyboardShortcutsOpen}
        onClose={() => setKeyboardShortcutsOpen(false)}
      />

      <InviteTeamMemberModal
        open={inviteTeamMemberOpen}
        onClose={() => setInviteTeamMemberOpen(false)}
        description={`Invite teammates to collaborate on ${sidebarSelection?.folderLabel ?? 'this folder'}.`}
        existingEmails={displayedTeamMembers
          .map((member) => member.email)
          .filter((email): email is string => Boolean(email))}
        onInvite={({ emails }) => {
          if (!selectedContainerId || !canInviteToFolder) return false;

          setFolderTeamMembers((current) => ({
            ...current,
            [selectedContainerId]: [
              ...(current[selectedContainerId] ?? initialToolbarTeamMembers),
              ...emails.map((email) => createWorkspaceTeamMember(email)),
            ],
          }));
        }}
      />
    </Box>
  );
}

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { loadFavoriteMediaIds } from '../utils/favoritesStorage';
import {
  normalizeTagName,
  saveManagedTags,
} from '../utils/tagRegistryStorage';
import {
  loadTagScopeColors,
  normalizeHexColor,
  saveTagScopeColors,
} from '../utils/tagScopeColorsStorage';
import type { CreateManagedTagInput, ManagedTag } from '../types/managedTag';
import type { TagScopeColors } from '../types/tagScopeColors';
import { withAncestorTags } from '../utils/tagHierarchy';
import { apiClient } from '../api/client';
import type { TagScope } from '../types/managedTag';
import { initialMediaItems, type MediaItem, type MediaLocation, type MediaType, type SidebarFolder } from '../data/mockMedia';
import { getMediaTypeFromFile } from '../utils/fileMediaType';
import { DEFAULT_FOLDER_COLOR } from '../constants/folderColors';
import { CURRENT_USER } from '../constants/currentUser';
import {
  defaultWorkspaceFolders,
  defaultWorkspaceProjectFolders,
  initialWorkspaces,
  mergeWorkspaceFolderMetadata,
  type Workspace,
} from '../data/workspaces';
import type { CreateWorkspaceFormData } from '../components/dashboard/CreateWorkspaceModal';
import type {
  PendingMediaUpload,
  MediaUploadDetails,
  MediaUploadOptions,
} from '../types/mediaUpload';
import type { SidebarSelection } from '../types/sidebarSelection';
import { extractImageMetadata, extractAudioMetadata } from '../utils/mediaMetadataExtractors';
import {
  uploadMediaFileRequest,
  toggleFavoriteRequest,
  getFavoritesRequest,
  type MediaAssetResponseDto,
} from '../api';
import { type LibraryListParams, getLibraryItems } from '../api/library.service';


interface DashboardContextValue {
  workspaces: Workspace[];
  activeWorkspaceId: string;
  activeWorkspace: Workspace;
  systemTimezone: string;
  setActiveWorkspaceId: (id: string) => void;
  updateWorkspaceColor: (workspaceId: string, color: string) => void;
  createWorkspace: (data: CreateWorkspaceFormData) => void;
  mediaItems: MediaItem[];
  fetchedFavorites: MediaItem[];
  rootMediaItems: MediaItem[];
  favoriteMediaItems: MediaItem[];
  duplicateMediaItems: MediaItem[];
  sharedMediaItems: MediaItem[];
  libraryItems: MediaItem[];
  nextPageToken: string | null;
  libraryLoading: boolean;
  libraryLoadingMore: boolean;
  fetchLibraryFirstPage: (params: LibraryListParams) => Promise<void>;
  fetchLibraryNextPage: () => Promise<void>;
  favorites: Set<string>;
  toggleFavorite: (id: string, type?: 'asset' | 'folder' | 'project') => void;
  moveMediaToFolder: (mediaId: string, folderId: string, childLabel?: string) => void;
  moveMediaToFolderBulk: (mediaIds: string[], folderId: string, childLabel?: string) => void;
  moveMediaToDashboardFolder: (mediaIds: string[], folderId: string) => Promise<void>;
  moveMediaToTrash: (mediaId: string, reason?: string) => void;
  moveMediaToTrashBulk: (mediaIds: string[], reason?: string) => void;
  moveMediaToWorkspaceFolder: (
    mediaIds: string[],
    workspaceId: string,
    folderId: string | null,
  ) => Promise<void>;
  trashedMediaItems: MediaItem[];
  trashedAtById: Record<string, string>;
  restoreFromTrashBulk: (mediaIds: string[]) => void;
  purgeExpiredTrash: () => void;
  selectedMediaIds: Set<string>;
  toggleMediaSelection: (mediaId: string) => void;
  setMediaSelection: (mediaIds: string[]) => void;
  clearMediaSelection: () => void;
  renameMedia: (mediaId: string, newTitle: string) => void;
  updateMediaTags: (mediaId: string, tags: string[]) => void;
  updateMediaReviewStatus: (mediaId: string, reviewStatus: string) => void;
  managedTags: ManagedTag[];
  tagScopeColors: TagScopeColors;
  updateTagScopeColor: (scope: TagScope, color: string) => void;
  createManagedTag: (input: CreateManagedTagInput) => Promise<ManagedTag | null>;
  updateManagedTag: (id: string, updates: { name?: string; parentId?: string | null }) => Promise<boolean>;
  deleteManagedTag: (id: string) => Promise<void>;
  getTagUsageCount: (tagName: string) => number;
  getAssignableTags: (workspaceId: string) => ManagedTag[];
  addWorkspaceFolder: (name: string, color?: string) => Promise<string>;
  renameWorkspaceFolder: (folderId: string, newLabel: string) => Promise<void>;
  deleteWorkspaceFolder: (folderId: string) => void;
  renameWorkspaceFolderChild: (folderId: string, oldLabel: string, newLabel: string) => void;
  deleteWorkspaceFolderChild: (folderId: string, childLabel: string) => void;
  addWorkspaceFile: (folderId: string, name: string, type: MediaType) => void;
  updateSidebarFolderColor: (folderId: string, color: string) => void;
  updateMediaFolderColor: (mediaId: string, color: string) => void;
  uploadMediaFiles: (files: File[], options?: MediaUploadOptions) => number;
  pendingMediaUpload: PendingMediaUpload | null;
  pendingMediaUploadCount: number;
  completeMediaUpload: (
    details: MediaUploadDetails,
    onProgress?: (progress: { loaded: number; total: number }) => void,
  ) => Promise<string | null | undefined | void>;
  cancelMediaUpload: () => void;
  popPendingMediaUpload: () => void;
  /** @deprecated Use pendingMediaUpload */
  pendingVideoUpload: PendingMediaUpload | null;
  /** @deprecated Use pendingMediaUploadCount */
  pendingVideoUploadCount: number;
  /** @deprecated Use completeMediaUpload */
  completeVideoUpload: (
    details: MediaUploadDetails,
    onProgress?: (progress: { loaded: number; total: number }) => void,
  ) => Promise<string | null | undefined | void>;
  /** @deprecated Use cancelMediaUpload */
  cancelVideoUpload: () => void;
  createRootMediaFolder: (
    name: string,
    color?: string,
    parentFolderId?: string | null,
    projectLocation?: MediaLocation | null,
  ) => Promise<string | void>;
  createProject: (
    name: string,
    parentFolderId?: string | null,
    defaultTagIds?: string[],
  ) => Promise<string | void>;
  updateMediaProjectLocation: (mediaId: string, projectLocation: MediaLocation | null, itemType?: string) => void;
  trashedIds: Set<string>;
  draggingMediaId: string | null;
  draggingMediaIds: Set<string>;
  setDraggingMediaIds: (ids: string[]) => void;
  clearDraggingMedia: () => void;
  dropTargetKey: string | null;
  setDropTargetKey: (key: string | null) => void;
  globalSearchQuery: string;
  setGlobalSearchQuery: (query: string) => void;
  sidebarSelection: SidebarSelection | null;
  setSidebarSelection: (selection: SidebarSelection) => void;
  clearSidebarSelection: () => void;
  fetchWorkspaceData: (tagIds?: string[]) => Promise<void>;
  fetchFolderData: (folderId: string) => Promise<string[]>;
  fetchProjectData: (projectId: string) => Promise<void>;
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

// Trash state is now derived from item.status === 'trash' in mediaItems (database-driven, no localStorage)

export function DashboardProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [workspaces, setWorkspaces] = useState<Workspace[]>(initialWorkspaces);
  const [fetchedFavorites, setFetchedFavorites] = useState<MediaItem[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceIdState] = useState(() => {
    return localStorage.getItem('activeWorkspaceId') || initialWorkspaces[0]?.id || '';
  });

  const setActiveWorkspaceId = useCallback((id: string) => {
    localStorage.setItem('activeWorkspaceId', id);
    setActiveWorkspaceIdState(id);
  }, []);

  const [systemTimezone, setSystemTimezone] = useState<string>('Europe/London');
  const [mediaItems, setMediaItems] = useState<MediaItem[]>(initialMediaItems);
  const [sharedMediaItems, setSharedMediaItems] = useState<MediaItem[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(() => loadFavoriteMediaIds());
  const [draggingMediaIds, setDraggingMediaIdsState] = useState<Set<string>>(new Set());
  const [dropTargetKey, setDropTargetKey] = useState<string | null>(null);
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [sidebarSelection, setSidebarSelectionState] = useState<SidebarSelection | null>(null);

  const [libraryItems, setLibraryItems] = useState<MediaItem[]>([]);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [libraryLoadingMore, setLibraryLoadingMore] = useState(false);
  const listParamsRef = useRef<LibraryListParams | null>(null);

  const fetchLibraryFirstPage = useCallback(async (params: LibraryListParams) => {
    listParamsRef.current = { ...params, pageToken: null };
    setLibraryLoading(true);
    setNextPageToken(null);
    try {
      const res = await getLibraryItems(listParamsRef.current);
      setLibraryItems(res.items);
      setNextPageToken(res.nextPageToken);
    } catch (e: any) {
      setLibraryItems([]);
      setNextPageToken(null);
      throw e;
    } finally {
      setLibraryLoading(false);
    }
  }, []);

  const fetchLibraryNextPage = useCallback(async () => {
    if (!listParamsRef.current || !nextPageToken || libraryLoadingMore) return;
    setLibraryLoadingMore(true);
    try {
      const res = await getLibraryItems({
        ...listParamsRef.current,
        pageToken: nextPageToken,
      });
      setLibraryItems((prev) => {
        const seen = new Set(prev.map((i) => i.id));
        return [...prev, ...res.items.filter((i) => !seen.has(i.id))];
      });
      setNextPageToken(res.nextPageToken);
    } catch (e: any) {
      if (e?.response?.data?.code === 'INVALID_PAGE_TOKEN' && listParamsRef.current) {
        await fetchLibraryFirstPage(listParamsRef.current);
      }
    } finally {
      setLibraryLoadingMore(false);
    }
  }, [nextPageToken, libraryLoadingMore, fetchLibraryFirstPage]);


  // Trash is now purely database-driven: derive trashedIds from item.status === 'trash'
  const trashedIds = useMemo(
    () => new Set(mediaItems.filter((item) => item.status === 'trash').map((item) => item.id)),
    [mediaItems],
  );

  // Empty stub kept for interface compatibility (no localStorage tracking)
  const trashedAtById: Record<string, string> = {};
  const prefetchFolderTreesRef = useRef<(folderIds: string[]) => Promise<void>>(async () => {});

  useEffect(() => {
    async function fetchTimezone() {
      try {
        const { apiClient } = await import('../api/client');
        const res = await apiClient.get<any>('/workspaces/timezone');
        const data = res.data || res;
        if (data && data.timezone) {
          setSystemTimezone(data.timezone);
        }
      } catch (err) {
        console.error('Failed to fetch timezone:', err);
      }
    }
    fetchTimezone();
  }, []);

  const fetchWorkspaceData = useCallback(async (tagIds?: string[]) => {
    try {
      const { apiClient } = await import('../api/client');
      const query = tagIds && tagIds.length > 0 ? `?tagIds=${tagIds.join(',')}` : '';
      const response = await apiClient.get<any>(`/workspaces/find-all-data/${activeWorkspaceId}${query}`);

      const resBody = (response as any).data || response;
      const actualData = resBody.data || resBody;
      if (actualData && (Array.isArray(actualData.folders) || Array.isArray(actualData.projects) || Array.isArray(actualData.media))) {
        const { folders, projects, allProjects, media } = actualData;

        if (!tagIds || tagIds.length === 0) {
          const sidebarFolders: SidebarFolder[] = (folders || [])
            .filter((f: any) => !f.parentId)
            .map((f: any) => ({
              id: f.id,
              label: f.name,
              color: f.color || undefined,
              children: []
            }));

          const sidebarProjects: SidebarFolder[] = (allProjects || projects || [])
            .map((p: any) => ({
              id: p.id,
              label: p.name,
            }));

          setWorkspaces((prev) =>
            prev.map(w => w.id === activeWorkspaceId ? {
              ...w,
              folders: sidebarFolders,
              projectFolders: sidebarProjects
            } : w)
          );
        }

        const projectMediaItems: MediaItem[] = (allProjects || projects || []).map((p: any) => ({
          id: p.id,
          title: p.name,
          type: 'folder',
          workspaceId: activeWorkspaceId,
          createdAt: p.createdAt || new Date().toISOString(),
          sizeBytes: 0,
          storageProvider: 'b2',
          uploadedBy: CURRENT_USER.name,
          status: 'active',
          isProject: true,
          parentFolderId: p.ownerType === 'FOLDER' ? p.folderId : undefined,
        }));

        const projectIds = new Set(projectMediaItems.map((item) => item.id));

        const folderMediaItems: MediaItem[] = (folders || [])
          .filter((f: any) => !projectIds.has(f.id))
          .map((f: any) => ({
          id: f.id,
          title: f.name,
          type: 'folder',
          workspaceId: activeWorkspaceId,
          parentFolderId: f.parentId || undefined,
          createdAt: f.createdAt || new Date().toISOString(),
          sizeBytes: 0,
          storageProvider: 'b2',
          uploadedBy: CURRENT_USER.name,
          status: 'active',
          folderColor: f.color,
          linkedProjectIds: f.sources?.map((s: any) => s.projectId) || [],
          projectLocations: f.sources?.map((s: any) => ({ folderId: s.projectId })) || [],
          isProject: Boolean(f.isProject || f.type === 'PROJECT' || f.type === 'project'),
        }));

        const assetMediaItems: MediaItem[] = (media || []).map((a: any) => {
          const imageExtRegex = /\.(jpg|jpeg|png|webp|gif|svg|exr|openexr|dpx|cin|tiff|tif|psd|psb|ai|eps|pcx|jpf|bmp|mpo)$/i;
          const isVideo = a.type === 'video' || /\.(mp4|mov|webm|avi|mkv|flv|wmv|m4v)$/i.test(a.title || a.name || '');
          const isAudio = a.type === 'audio' || /\.(mp3|wav|ogg|aac|m4a|flac|alac)$/i.test(a.title || a.name || '');
          const isImage = a.type === 'image' || imageExtRegex.test(a.title || a.name || '');
          const type: MediaType = isVideo ? 'video' : isAudio ? 'audio' : isImage ? 'image' : (a.type || 'video');

          const rawDuration = a.metadata?.duration ?? a.metadata?.technicalSpecs?.durationSeconds;
          return {
            id: a.id,
            title: a.name || a.title || 'Untitled',
            type,
            workspaceId: activeWorkspaceId,
            parentFolderId: (a.ownerType === 'FOLDER' || a.ownerType === 'PROJECT') ? a.ownerId : undefined,
            createdAt: a.createdAt || a.uploadDate || new Date().toISOString(),
            sizeBytes: Number(a.files?.[0]?.sizeBytes || a.size || 0),
            storageProvider: 'b2',
            uploadedBy: CURRENT_USER.name,
            thumbnail: a.thumbnail || (a.id ? `/api/media/${encodeURIComponent(a.id)}/thumbnail` : undefined),
            videoSrc: a.files?.[0]?.fileUrl || a.url || (a.id ? `/api/media/${encodeURIComponent(a.id)}/stream` : undefined),
            duration: typeof rawDuration === 'number'
              ? `${Math.floor(rawDuration / 60)}:${Math.floor(rawDuration % 60).toString().padStart(2, '0')}`
              : (typeof rawDuration === 'string' ? rawDuration : undefined),
            tags: Array.isArray(a.metadata?.tags) ? (a.metadata.tags as string[]) : [],
            location: null,
            linkedProjectIds: a.sources?.map((s: any) => s.projectId) || [],
            projectLocations: a.sources?.map((s: any) => ({ folderId: s.projectId })) || [],
            compressionStatus: a.transcodingStatus || 'completed',
            customMetadata: a.customMetadata || (a.metadata?.customProperties ? (typeof a.metadata.customProperties === 'string' ? JSON.parse(a.metadata.customProperties) : a.metadata.customProperties) : undefined),
            status: a.status === 'duplicate' ? 'duplicate' : 'active',
          };
        });

        setMediaItems((prev) => {
          const otherWorkspaces = prev.filter(m => m.workspaceId !== activeWorkspaceId);
          return [...otherWorkspaces, ...folderMediaItems, ...projectMediaItems, ...assetMediaItems];
        });

        // Nested files/folders now arrive directly with the workspace endpoint.
        // We no longer need to manually prefetch folder trees!
        // const folderIdsToPrefetch = folderMediaItems.map((folder) => folder.id);
        // void prefetchFolderTreesRef.current(folderIdsToPrefetch);
      }
    } catch (err) {
      console.error('Failed to load workspace data:', err);
    }
  }, [activeWorkspaceId]);

  useEffect(() => {
    const fetchWorkspaces = async () => {
      try {
        const { apiClient } = await import('../api/client');
        const response = await apiClient.get<Workspace[]>('/workspaces/find-all');
        const data = Array.isArray(response) ? response : (response as any).data;

        if (data && Array.isArray(data) && data.length > 0) {
          const sanitizedWorkspaces = data.map((w: any) => ({
            ...w,
            folders: w.folders || [],
            projectFolders: w.projectFolders || [],
          }));
          setWorkspaces(mergeWorkspaceFolderMetadata(sanitizedWorkspaces));
          const savedId = localStorage.getItem('activeWorkspaceId');
          const isValidSavedId = savedId && sanitizedWorkspaces.some((w: any) => w.id === savedId);
          setActiveWorkspaceId(isValidSavedId ? savedId : sanitizedWorkspaces[0].id);
        } else {
          // Empty workspace list — user has no workspaces yet, show nothing instead of mock data
          setWorkspaces([]);
          setActiveWorkspaceId(null);
        }
      } catch (err) {
        console.error('Failed to load workspaces from backend:', err);
        setWorkspaces([]);
        setActiveWorkspaceId(null);
      }
    };

    fetchWorkspaces();
  }, []);

  useEffect(() => {
    fetchWorkspaceData();
  }, [activeWorkspaceId, fetchWorkspaceData]);

  // Listen for upload completion events (from background upload queue or modal)
  useEffect(() => {
    const handleUploadCompleted = () => {
      fetchWorkspaceData();
      if (listParamsRef.current) {
        void fetchLibraryFirstPage(listParamsRef.current);
      }
    };

    window.addEventListener('noah-upload-completed', handleUploadCompleted);
    return () => {
      window.removeEventListener('noah-upload-completed', handleUploadCompleted);
    };
  }, [fetchWorkspaceData, fetchLibraryFirstPage]);

  const fetchFolderData = useCallback(async (folderId: string): Promise<string[]> => {
    try {
      const { apiClient } = await import('../api/client');
      const response = await apiClient.get<any>(`/workspaces/folder/find-all-data/${folderId}`);

      const resBody = (response as any).data || response;
      const actualData = resBody.data || resBody;
      if (actualData && (Array.isArray(actualData.folders) || Array.isArray(actualData.projects) || Array.isArray(actualData.media) || actualData.folderInfo)) {
        const { folders, projects, media, folderInfo } = actualData;

        const currentFolderItem: MediaItem | null = folderInfo ? {
          id: folderInfo.id,
          title: folderInfo.name,
          type: 'folder',
          workspaceId: activeWorkspaceId!,
          parentFolderId: folderInfo.parentId || undefined,
          createdAt: folderInfo.createdAt || new Date().toISOString(),
          sizeBytes: 0,
          storageProvider: 'b2',
          uploadedBy: CURRENT_USER.name,
          status: 'active',
          folderColor: folderInfo.color,
          linkedProjectIds: folderInfo.sources?.map((s: any) => s.projectId) || [],
          projectLocations: folderInfo.sources?.map((s: any) => ({ folderId: s.projectId })) || [],
        } : null;

        const projectMediaItems: MediaItem[] = (projects || []).map((p: any) => ({
          id: p.id,
          title: p.name,
          type: 'folder',
          workspaceId: activeWorkspaceId!,
          parentFolderId: folderId,
          createdAt: p.createdAt || new Date().toISOString(),
          sizeBytes: 0,
          storageProvider: 'b2',
          uploadedBy: CURRENT_USER.name,
          status: 'active',
          isProject: true,
        }));

        const projectIds = new Set(projectMediaItems.map((item) => item.id));

        const folderMediaItems: MediaItem[] = (folders || [])
          .filter((f: any) => !projectIds.has(f.id))
          .map((f: any) => ({
          id: f.id,
          title: f.name,
          type: 'folder',
          workspaceId: activeWorkspaceId!,
          parentFolderId: folderId,
          createdAt: f.createdAt || new Date().toISOString(),
          sizeBytes: 0,
          storageProvider: 'b2',
          uploadedBy: CURRENT_USER.name,
          status: 'active',
          folderColor: f.color,
          linkedProjectIds: f.sources?.map((s: any) => s.projectId) || [],
          projectLocations: f.sources?.map((s: any) => ({ folderId: s.projectId })) || [],
          isProject: Boolean(f.isProject || f.type === 'PROJECT' || f.type === 'project'),
        }));

        const assetMediaItems: MediaItem[] = (media || []).map((a: any) => {
          const imageExtRegex = /\.(jpg|jpeg|png|webp|gif|svg|exr|openexr|dpx|cin|tiff|tif|psd|psb|ai|eps|pcx|jpf|bmp|mpo)$/i;
          const isVideo = a.type === 'video' || /\.(mp4|mov|webm|avi|mkv|flv|wmv|m4v)$/i.test(a.title || '');
          const isAudio = a.type === 'audio' || /\.(mp3|wav|ogg|aac|m4a|flac|alac)$/i.test(a.title || '');
          const isImage = a.type === 'image' || imageExtRegex.test(a.title || '');
          const type: MediaType = isVideo ? 'video' : isAudio ? 'audio' : isImage ? 'image' : (a.type || 'video');

          return {
            id: a.id,
            title: a.title || 'Untitled',
            type,
            workspaceId: activeWorkspaceId!,
            parentFolderId: folderId,
            createdAt: a.createdAt || a.uploadDate || new Date().toISOString(),
            sizeBytes: Number(a.files?.[0]?.sizeBytes || a.size || 0),
            storageProvider: 'b2',
            uploadedBy: CURRENT_USER.name,
            thumbnail: a.thumbnail || (a.id ? `/api/media/${encodeURIComponent(a.id)}/thumbnail` : undefined),
            videoSrc: a.files?.[0]?.fileUrl || a.url || (a.id ? `/api/media/${encodeURIComponent(a.id)}/stream` : undefined),
            duration: typeof a.metadata?.duration === 'string' ? a.metadata.duration : undefined,
            tags: Array.isArray(a.metadata?.tags) ? (a.metadata.tags as string[]) : [],
            location: null,
            linkedProjectIds: a.sources?.map((s: any) => s.projectId) || [],
            projectLocations: a.sources?.map((s: any) => ({ folderId: s.projectId })) || [],
            compressionStatus: a.transcodingStatus || 'completed',
            customMetadata: a.customMetadata || (a.metadata?.customProperties ? (typeof a.metadata.customProperties === 'string' ? JSON.parse(a.metadata.customProperties) : a.metadata.customProperties) : undefined),
            status: a.status === 'duplicate' ? 'duplicate' : 'active',
          };
        });

        setMediaItems((prev) => {
          const newIds = new Set([
            ...folderMediaItems.map(i => i.id),
            ...projectMediaItems.map(i => i.id),
            ...assetMediaItems.map(i => i.id),
            ...(currentFolderItem ? [currentFolderItem.id] : [])
          ]);
          const withoutCurrentFolder = prev.filter(m => m.parentFolderId !== folderId && !newIds.has(m.id));
          return [...withoutCurrentFolder, ...folderMediaItems, ...projectMediaItems, ...assetMediaItems, ...(currentFolderItem ? [currentFolderItem] : [])];
        });

        return folderMediaItems.map((folder) => folder.id);
      }
    } catch (err) {
      console.error('Failed to load folder data:', err);
    }

    return [];
  }, [activeWorkspaceId]);

  const fetchFolderDataRef = useRef(fetchFolderData);
  fetchFolderDataRef.current = fetchFolderData;

  const prefetchFolderTrees = useCallback(async (folderIds: string[]) => {
    const visited = new Set<string>();
    const queue = [...new Set(folderIds.filter(Boolean))];

    // Sequential loads avoid parallel setMediaItems races that can drop siblings.
    while (queue.length > 0) {
      const folderId = queue.shift()!;
      if (visited.has(folderId)) continue;
      visited.add(folderId);
      const childIds = await fetchFolderDataRef.current(folderId);
      for (const childId of childIds) {
        if (!visited.has(childId)) {
          queue.push(childId);
        }
      }
    }
  }, []);

  prefetchFolderTreesRef.current = prefetchFolderTrees;

  const fetchProjectData = useCallback(async (projectId: string) => {
    try {
      const { apiClient } = await import('../api/client');
      const response = await apiClient.get<any>(`/workspaces/project/find-all-data/${projectId}`);

      const resBody = (response as any).data || response;
      const actualData = resBody.data || resBody;
      if (actualData && (Array.isArray(actualData.folders) || Array.isArray(actualData.media))) {
        const { folders, media } = actualData;

        const folderMediaItems: MediaItem[] = (folders || []).map((f: any) => ({
          id: f.id,
          title: f.name,
          type: 'folder',
          workspaceId: activeWorkspaceId!,
          parentFolderId: f.parentId || null,
          linkedProjectIds: [projectId],
          createdAt: f.createdAt || new Date().toISOString(),
          sizeBytes: 0,
          storageProvider: 'b2',
          uploadedBy: CURRENT_USER.name,
          status: 'active',
          folderColor: f.color,
        }));

        const assetMediaItems: MediaItem[] = (media || []).map((a: any) => {
          const imageExtRegex = /\.(jpg|jpeg|png|webp|gif|svg|exr|openexr|dpx|cin|tiff|tif|psd|psb|ai|eps|pcx|jpf|bmp|mpo)$/i;
          const isVideo = a.type === 'video' || /\.(mp4|mov|webm|avi|mkv|flv|wmv|m4v)$/i.test(a.title || '');
          const isAudio = a.type === 'audio' || /\.(mp3|wav|ogg|aac|m4a|flac|alac)$/i.test(a.title || '');
          const isImage = a.type === 'image' || imageExtRegex.test(a.title || '');
          const type: MediaType = isVideo ? 'video' : isAudio ? 'audio' : isImage ? 'image' : (a.type || 'video');

          return {
            id: a.id,
            title: a.title || 'Untitled',
            type,
            workspaceId: activeWorkspaceId!,
            parentFolderId: a.folderId || null,
            linkedProjectIds: [projectId],
            createdAt: a.createdAt || a.uploadDate || new Date().toISOString(),
            sizeBytes: Number(a.files?.[0]?.sizeBytes || a.size || 0),
            storageProvider: 'b2',
            uploadedBy: CURRENT_USER.name,
            thumbnail: a.thumbnail || (a.id ? `/api/media/${encodeURIComponent(a.id)}/thumbnail` : undefined),
            videoSrc: a.files?.[0]?.fileUrl || a.url || (a.id ? `/api/media/${encodeURIComponent(a.id)}/stream` : undefined),
            duration: typeof a.metadata?.duration === 'string' ? a.metadata.duration : undefined,
            tags: Array.isArray(a.metadata?.tags) ? (a.metadata.tags as string[]) : [],
            location: null,
            compressionStatus: a.transcodingStatus || 'completed',
            customMetadata: a.customMetadata || (a.metadata?.customProperties ? (typeof a.metadata.customProperties === 'string' ? JSON.parse(a.metadata.customProperties) : a.metadata.customProperties) : undefined),
            status: a.status === 'duplicate' ? 'duplicate' : 'active',
          };
        });

        setMediaItems((prev) => {
          const newIds = new Set([
            ...folderMediaItems.map(i => i.id),
            ...assetMediaItems.map(i => i.id)
          ]);
          const withoutCurrentProject = prev.filter(m => !(m.linkedProjectIds || []).includes(projectId) && !newIds.has(m.id));
          return [...withoutCurrentProject, ...folderMediaItems, ...assetMediaItems];
        });
      }
    } catch (err) {
      console.error('Failed to load project data:', err);
    }
  }, [activeWorkspaceId]);

  // No-op: purge is handled by the backend cron job now
  const purgeExpiredTrash = useCallback(() => { }, []);
  const [selectedMediaIds, setSelectedMediaIds] = useState<Set<string>>(new Set());
  const [managedTags, setManagedTags] = useState<ManagedTag[]>([]);
  
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const { apiClient } = await import('../api/client');
        const response = await apiClient.get<any>('/tags');
        const data = response.data || response;
        if (Array.isArray(data)) {
          const tags = data.map((t: any) => ({
            id: t.id,
            name: t.name,
            scope: t.scope,
            workspaceId: t.workspaceId,
            color: t.color || '#9333ea', // Fallback color
            parentId: t.parentId,
            parentName: t.parent?.name,
            ancestors: t.ancestors || [],
            createdAt: t.createdAt || new Date().toISOString()
          }));
          setManagedTags(tags);
        }
      } catch (err) {
        console.error('Failed to fetch tags from backend:', err);
        setManagedTags([]);
      }
    };
    fetchTags();
  }, []);

  const [tagScopeColors, setTagScopeColors] = useState<TagScopeColors>(() => loadTagScopeColors());
  const [pendingMediaQueue, setPendingMediaQueue] = useState<PendingMediaUpload[]>([]);
  const pendingMediaQueueRef = useRef(pendingMediaQueue);
  pendingMediaQueueRef.current = pendingMediaQueue;

  const pendingMediaUpload = pendingMediaQueue[0] ?? null;
  const pendingMediaUploadCount = pendingMediaQueue.length;
  const pendingVideoUpload = pendingMediaUpload;
  const pendingVideoUploadCount = pendingMediaUploadCount;

  const draggingMediaId = draggingMediaIds.size === 1 ? [...draggingMediaIds][0] : null;

  const setDraggingMediaIds = useCallback((ids: string[]) => {
    setDraggingMediaIdsState(new Set(ids));
  }, []);

  const clearDraggingMedia = useCallback(() => {
    setDraggingMediaIdsState(new Set());
  }, []);

  const setSidebarSelection = useCallback((selection: SidebarSelection) => {
    setSidebarSelectionState(selection);
  }, []);

  const clearSidebarSelection = useCallback(() => {
    setSidebarSelectionState(null);
  }, []);

  const fallbackWorkspace: Workspace = useMemo(() => ({
    id: 'loading',
    name: 'Loading...',
    description: '',
    color: '#000000',
    folders: [],
    projectFolders: [],
  }), []);

  const activeWorkspace =
    workspaces.find((w) => w.id === activeWorkspaceId) ?? workspaces[0] ?? fallbackWorkspace;

  const rootMediaItems = useMemo(
    () =>
      mediaItems.filter(
        (item) =>
          item.workspaceId === activeWorkspaceId &&
          !item.parentFolderId &&
          item.status !== 'trash',
      ),
    [mediaItems, activeWorkspaceId],
  );

  const duplicateMediaItems = useMemo(
    () =>
      mediaItems.filter(
        (item) => item.workspaceId === activeWorkspaceId && item.status === 'duplicate',
      ),
    [mediaItems, activeWorkspaceId],
  );

  const favoriteMediaItems = useMemo(() => {
    const fromMediaItems = mediaItems.filter(
      (item) =>
        item.workspaceId === activeWorkspaceId &&
        favorites.has(item.id) &&
        item.status !== 'trash',
    );
    const existingIds = new Set(fromMediaItems.map((i) => i.id));
    const extra = fetchedFavorites.filter(
      (item) =>
        item.workspaceId === activeWorkspaceId &&
        !existingIds.has(item.id) &&
        favorites.has(item.id) &&
        item.status !== 'trash',
    );
    return [...fromMediaItems, ...extra];
  }, [mediaItems, fetchedFavorites, activeWorkspaceId, favorites]);

  const trashedMediaItems = useMemo(
    () =>
      mediaItems.filter(
        (item) => item.workspaceId === activeWorkspaceId && item.status === 'trash',
      ),
    [mediaItems, activeWorkspaceId],
  );

  useEffect(() => {
    const fetchFavorites = async () => {
      if (!activeWorkspaceId) return;
      try {
        const res = await getFavoritesRequest(activeWorkspaceId);
        if (Array.isArray(res)) {
          const favIds = new Set<string>();
          const mappedFavs: MediaItem[] = [];

          res.forEach((fav: any) => {
            if (fav.assetId) favIds.add(fav.assetId);
            if (fav.folderId) favIds.add(fav.folderId);
            if (fav.projectId) favIds.add(fav.projectId);

            if (fav.asset) {
              const a = fav.asset;
              const isVideo = a.type === 'video' || /\.(mp4|mov|webm|avi|mkv)$/i.test(a.title || '');
              const isAudio = a.type === 'audio' || /\.(mp3|wav|ogg|aac|m4a)$/i.test(a.title || '');
              const isImage = a.type === 'image' || /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(a.title || '');
              const type = isVideo ? 'video' : isAudio ? 'audio' : isImage ? 'image' : 'video';

              mappedFavs.push({
                id: a.id,
                title: a.title || 'Untitled',
                type: type as any,
                workspaceId: fav.workspaceId || a.workspaceId || a.ownerId,
                parentFolderId: a.folderId,
                createdAt: a.createdAt || a.uploadDate || new Date().toISOString(),
                sizeBytes: Number(a.files?.[0]?.sizeBytes || a.size || 0),
                storageProvider: 'b2',
                uploadedBy: CURRENT_USER.name,
                thumbnail: a.thumbnail || undefined,
                videoSrc: isVideo ? (a.files?.[0]?.fileUrl || a.url) : undefined,
                duration: typeof a.metadata?.duration === 'string' ? a.metadata.duration : undefined,
                tags: Array.isArray(a.metadata?.tags) ? (a.metadata.tags as string[]) : [],
                location: null,
                linkedProjectIds: a.sources?.map((s: any) => s.projectId) || [],
                projectLocations: a.sources?.map((s: any) => ({ folderId: s.projectId })) || [],
                compressionStatus: a.transcodingStatus || 'completed',
                customMetadata: a.customMetadata || (a.metadata?.customProperties ? (typeof a.metadata.customProperties === 'string' ? JSON.parse(a.metadata.customProperties) : a.metadata.customProperties) : undefined),
                status: a.status === 'duplicate' ? 'duplicate' : 'active',
              });
            }

            if (fav.folder) {
              const f = fav.folder;
              mappedFavs.push({
                id: f.id,
                title: f.name,
                type: 'folder',
                workspaceId: fav.workspaceId || f.workspaceId,
                parentFolderId: f.parentId,
                createdAt: f.createdAt || new Date().toISOString(),
                sizeBytes: 0,
                storageProvider: 'b2',
                uploadedBy: CURRENT_USER.name,
                status: 'active',
                folderColor: f.color,
                linkedProjectIds: f.sources?.map((s: any) => s.projectId) || [],
                projectLocations: f.sources?.map((s: any) => ({ folderId: s.projectId })) || [],
              });
            }

            if (fav.project) {
              const p = fav.project;
              mappedFavs.push({
                id: p.id,
                title: p.name,
                type: 'folder',
                workspaceId: fav.workspaceId || p.workspaceId,
                parentFolderId: p.ownerType === 'FOLDER' ? p.folderId : undefined,
                createdAt: p.createdAt || new Date().toISOString(),
                sizeBytes: 0,
                storageProvider: 'b2',
                uploadedBy: CURRENT_USER.name,
                status: 'active',
                isProject: true,
                linkedProjectIds: [],
                projectLocations: [],
              });
            }
          });

          setFavorites(favIds);
          setFetchedFavorites(mappedFavs);
        }
      } catch (err) {
        console.error('Failed to fetch favorites', err);
      }
    };
    fetchFavorites();
  }, [activeWorkspaceId]);

  // Fetch shared media items (assets shared directly with the current user)
  useEffect(() => {
    const fetchSharedItems = async () => {
      try {
        const { getSharedMediaAssetsRequest } = await import('../api/media.service');
        const res = await getSharedMediaAssetsRequest();
        if (Array.isArray(res)) {
          const mappedShared: MediaItem[] = res.map((a: any) => {
            const isVideo = a.type === 'video' || /\.(mp4|mov|webm|avi|mkv)$/i.test(a.name || a.title || '');
            const isAudio = a.type === 'audio' || /\.(mp3|wav|ogg|aac|m4a)$/i.test(a.name || a.title || '');
            const isImage = a.type === 'image' || /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(a.name || a.title || '');
            const type = isVideo ? 'video' : isAudio ? 'audio' : isImage ? 'image' : 'video';

            return {
              id: a.id,
              title: a.name || a.title || 'Untitled',
              type: type as any,
              workspaceId: activeWorkspaceId,
              parentFolderId: undefined,
              createdAt: a.uploadDate || a.createdAt || new Date().toISOString(),
              sizeBytes: Number(a.size || 0),
              storageProvider: 'b2',
              uploadedBy: a.uploadedBy?.name || CURRENT_USER.name,
              thumbnail: a.thumbnail || undefined,
              videoSrc: a.url || undefined,
              duration: typeof a.metadata?.duration === 'number'
                ? `${Math.floor(a.metadata.duration / 60)}:${Math.floor(a.metadata.duration % 60).toString().padStart(2, '0')}`
                : (typeof a.metadata?.duration === 'string' ? a.metadata.duration : undefined),
              tags: Array.isArray(a.tags) ? a.tags : [],
              location: null,
              linkedProjectIds: [],
              projectLocations: [],
              compressionStatus: a.transcodingStatus || 'completed',
              customMetadata: a.customMetadata || (a.metadata?.customProperties ? (typeof a.metadata.customProperties === 'string' ? JSON.parse(a.metadata.customProperties) : a.metadata.customProperties) : undefined),
              status: 'active',
            };
          });
          setSharedMediaItems(mappedShared);
        }
      } catch (err) {
        console.error('Failed to fetch shared media', err);
      }
    };
    fetchSharedItems();
  }, [activeWorkspaceId]);

  useEffect(() => {
    saveManagedTags(managedTags);
  }, [managedTags]);

  useEffect(() => {
    saveTagScopeColors(tagScopeColors);
  }, [tagScopeColors]);

  const toggleMediaSelection = useCallback((mediaId: string) => {
    setSelectedMediaIds((prev) => {
      const next = new Set(prev);
      if (next.has(mediaId)) next.delete(mediaId);
      else next.add(mediaId);
      return next;
    });
  }, []);

  const setMediaSelection = useCallback((mediaIds: string[]) => {
    setSelectedMediaIds(new Set(mediaIds));
  }, []);

  const clearMediaSelection = useCallback(() => {
    setSelectedMediaIds(new Set());
  }, []);

  const removeMediaFromSidebar = useCallback(
    (media: MediaItem) => {
      if (!media.location) return;

      const { folderId, childLabel } = media.location;
      const label = childLabel ?? media.title;

      setWorkspaces((prev) =>
        prev.map((workspace) => {
          if (workspace.id !== media.workspaceId) return workspace;

          return {
            ...workspace,
            folders: workspace.folders.map((folder) => {
              if (folder.id !== folderId) return folder;

              return {
                ...folder,
                children: (folder.children ?? []).filter((child) => child !== label),
              };
            }),
          };
        }),
      );
    },
    [],
  );

  const toggleFavorite = useCallback(async (id: string, type: 'asset' | 'folder' | 'project' = 'asset') => {
    // Optimistic UI update
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

    try {
      await toggleFavoriteRequest({ id, type });
    } catch (err) {
      console.error('Failed to toggle favorite', err);
      // Revert optimistic update
      setFavorites((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    }
  }, []);

  const updateWorkspaceColor = useCallback((workspaceId: string, color: string) => {
    setWorkspaces((prev) =>
      prev.map((w) => (w.id === workspaceId ? { ...w, color } : w)),
    );
  }, []);

  const createWorkspace = useCallback(async (data: CreateWorkspaceFormData) => {
    try {
      const { apiClient } = await import('../api/client');

      const payload = {
        name: data.name,
        description: data.description,
        color: data.color,
        inviteEmails: data.inviteEmails,
        inviteGroupIds: data.inviteGroupIds,
      };

      const response = await apiClient.post<Workspace>('/workspaces/add', payload);
      const newWorkspace = (response as any).data || response;

      const sanitizedWorkspace: Workspace = {
        ...newWorkspace,
        folders: newWorkspace.folders || defaultWorkspaceFolders.map((f) => ({ ...f, id: `${f.id}-${Date.now()}` })),
        projectFolders: newWorkspace.projectFolders || defaultWorkspaceProjectFolders.map((f) => ({ ...f, id: `${f.id}-${Date.now()}` })),
      };

      setWorkspaces((prev) => [...prev, sanitizedWorkspace]);
      setActiveWorkspaceId(sanitizedWorkspace.id);
    } catch (error) {
      console.error('Failed to create workspace:', error);
    }
  }, []);

  const moveMediaToFolder = useCallback(
    (mediaId: string, folderId: string, childLabel?: string) => {
      const media = mediaItems.find((m) => m.id === mediaId);
      if (!media) return;

      setWorkspaces((prev) =>
        prev.map((workspace) => {
          if (workspace.id !== activeWorkspaceId) return workspace;

          return {
            ...workspace,
            folders: workspace.folders.map((folder) => {
              if (folder.id !== folderId) return folder;

              const children = folder.children ?? [];
              const label = childLabel ?? media.title;
              if (children.includes(label)) return folder;

              return {
                ...folder,
                children: [...children, label],
              };
            }),
          };
        }),
      );

      setMediaItems((prev) =>
        prev.map((item) =>
          item.id === mediaId
            ? {
              ...item,
              location: {
                folderId,
                childLabel: childLabel ?? media.title,
              },
            }
            : item,
        ),
      );
    },
    [activeWorkspaceId, mediaItems],
  );

  const moveMediaToFolderBulk = useCallback(
    (mediaIds: string[], folderId: string, childLabel?: string) => {
      const uniqueIds = [...new Set(mediaIds)];
      if (uniqueIds.length === 0) return;

      const folderCountDelta = new Map<string, number>();
      uniqueIds.forEach((mediaId) => {
        const media = mediaItems.find((item) => item.id === mediaId);
        if (media?.parentFolderId) {
          folderCountDelta.set(
            media.parentFolderId,
            (folderCountDelta.get(media.parentFolderId) ?? 0) - 1,
          );
        }
      });

      setWorkspaces((prev) =>
        prev.map((workspace) => {
          if (workspace.id !== activeWorkspaceId) return workspace;

          return {
            ...workspace,
            folders: workspace.folders.map((folder) => {
              if (folder.id !== folderId) return folder;

              const children = folder.children ?? [];
              const labelsToAdd = uniqueIds
                .map((mediaId) => {
                  const media = mediaItems.find((item) => item.id === mediaId);
                  if (!media) return null;
                  return childLabel ?? media.title;
                })
                .filter((label): label is string => Boolean(label))
                .filter((label) => !children.includes(label));

              if (labelsToAdd.length === 0) return folder;

              return {
                ...folder,
                children: [...children, ...labelsToAdd],
              };
            }),
          };
        }),
      );

      setMediaItems((prev) =>
        prev.map((item) => {
          if (uniqueIds.includes(item.id)) {
            return {
              ...item,
              parentFolderId: null,
              location: {
                folderId,
                childLabel: childLabel ?? item.title,
              },
            };
          }

          if (item.type === 'folder' && folderCountDelta.has(item.id)) {
            return {
              ...item,
              itemCount: Math.max(
                0,
                (item.itemCount ?? 0) + (folderCountDelta.get(item.id) ?? 0),
              ),
            };
          }

          return item;
        }),
      );

      setSelectedMediaIds((prev) => {
        const next = new Set(prev);
        uniqueIds.forEach((id) => next.delete(id));
        return next;
      });
    },
    [activeWorkspaceId, mediaItems],
  );

  const moveMediaToDashboardFolder = useCallback(
    async (mediaIds: string[], folderId: string) => {
      const uniqueIds = [...new Set(mediaIds)].filter((id) => id !== folderId);
      if (uniqueIds.length === 0) return;

      const targetFolder = mediaItems.find(
        (item) => item.id === folderId && item.type === 'folder',
      );
      if (!targetFolder) return;

      const folderCountDelta = new Map<string, number>();

      uniqueIds.forEach((mediaId) => {
        const media = mediaItems.find((item) => item.id === mediaId);
        if (!media) return;

        if (media.parentFolderId && media.parentFolderId !== folderId) {
          folderCountDelta.set(
            media.parentFolderId,
            (folderCountDelta.get(media.parentFolderId) ?? 0) - 1,
          );
        }
        if (media.parentFolderId !== folderId) {
          folderCountDelta.set(folderId, (folderCountDelta.get(folderId) ?? 0) + 1);
        }

        removeMediaFromSidebar(media);
      });

      setMediaItems((prev) =>
        prev.map((item) => {
          if (uniqueIds.includes(item.id)) {
            return {
              ...item,
              parentFolderId: folderId,
              location: null,
            };
          }

          if (item.type === 'folder' && folderCountDelta.has(item.id)) {
            return {
              ...item,
              itemCount: Math.max(
                0,
                (item.itemCount ?? 0) + (folderCountDelta.get(item.id) ?? 0),
              ),
            };
          }

          return item;
        }),
      );

      setSelectedMediaIds((prev) => {
        const next = new Set(prev);
        uniqueIds.forEach((id) => next.delete(id));
        return next;
      });

      // API Call
      try {
        const { apiClient } = await import('../api/client');
        await Promise.all(uniqueIds.map(id => {
          const item = mediaItems.find(m => m.id === id);
          if (!item) return Promise.resolve();
          if (item.type === 'folder') {
            return apiClient.put(`/workspaces/folder/${id}/move`, { targetFolderId: folderId });
          } else {
            return apiClient.put(`/media/${id}/move`, { folderId });
          }
        }));
        
        // Refresh sidebar folder structure
        void fetchWorkspaceData();
      } catch (err) {
        console.error('Failed to move media to folder:', err);
      }
    },
    [mediaItems, removeMediaFromSidebar, fetchWorkspaceData],
  );

  const moveMediaToWorkspaceFolder = useCallback(
    async (mediaIds: string[], workspaceId: string, folderId: string | null) => {
      const uniqueIds = [...new Set(mediaIds)].filter((id) => id !== folderId);
      if (uniqueIds.length === 0) return;

      if (folderId && workspaceId === activeWorkspaceId) {
        moveMediaToDashboardFolder(uniqueIds, folderId);
        return;
      }

      const folderCountDelta = new Map<string, number>();

      uniqueIds.forEach((mediaId) => {
        const media = mediaItems.find((item) => item.id === mediaId);
        if (!media) return;

        if (media.parentFolderId && media.parentFolderId !== folderId) {
          folderCountDelta.set(
            media.parentFolderId,
            (folderCountDelta.get(media.parentFolderId) ?? 0) - 1,
          );
        }
        if (folderId && media.parentFolderId !== folderId) {
          folderCountDelta.set(folderId, (folderCountDelta.get(folderId) ?? 0) + 1);
        }

        removeMediaFromSidebar(media);
      });

      setMediaItems((prev) =>
        prev.map((item) => {
          if (uniqueIds.includes(item.id)) {
            return {
              ...item,
              workspaceId,
              parentFolderId: folderId,
              location: null,
            };
          }

          if (item.type === 'folder' && folderCountDelta.has(item.id)) {
            return {
              ...item,
              itemCount: Math.max(
                0,
                (item.itemCount ?? 0) + (folderCountDelta.get(item.id) ?? 0),
              ),
            };
          }

          return item;
        }),
      );

      setSelectedMediaIds((prev) => {
        const next = new Set(prev);
        uniqueIds.forEach((id) => next.delete(id));
        return next;
      });

      // API Call
      try {
        const { apiClient } = await import('../api/client');
        await Promise.all(uniqueIds.map(id => {
          const item = mediaItems.find(m => m.id === id);
          if (!item) return Promise.resolve();
          if (item.type === 'folder') {
            return apiClient.put(`/workspaces/folder/${id}/move`, { targetFolderId: folderId, targetWorkspaceId: workspaceId });
          } else {
            return apiClient.put(`/media/${id}/move`, { folderId, workspaceId });
          }
        }));
        
        // Refresh sidebar folder structure if moving within or affecting the active workspace
        if (workspaceId === activeWorkspaceId || mediaItems.some(m => uniqueIds.includes(m.id) && m.workspaceId === activeWorkspaceId)) {
          void fetchWorkspaceData();
        }
      } catch (err) {
        console.error('Failed to move media to workspace folder:', err);
      }
    },
    [
      activeWorkspaceId,
      mediaItems,
      moveMediaToDashboardFolder,
      removeMediaFromSidebar,
      fetchWorkspaceData,
    ],
  );

  const moveMediaToTrashBulk = useCallback(
    (mediaIds: string[], reason?: string) => {
      const uniqueIds = [...new Set(mediaIds)].filter((id) => !trashedIds.has(id));
      if (uniqueIds.length === 0) return;

      const folderCountDelta = new Map<string, number>();

      uniqueIds.forEach((mediaId) => {
        const media = mediaItems.find((item) => item.id === mediaId);
        if (!media) return;

        if (media.parentFolderId) {
          folderCountDelta.set(
            media.parentFolderId,
            (folderCountDelta.get(media.parentFolderId) ?? 0) - 1,
          );
        }

        removeMediaFromSidebar(media);
      });

      // Send DELETE to backend (with reason)
      uniqueIds.forEach((id) => {
        apiClient.delete(`/media/${id}`, { body: { reason } }).catch(err => console.error('Failed to sync delete with backend', err));
      });

      setFavorites((prev) => {
        const next = new Set(prev);
        let changed = false;
        uniqueIds.forEach((id) => {
          if (next.has(id)) {
            next.delete(id);
            changed = true;
          }
        });
        return changed ? next : prev;
      });

      // Mark items as trash in local state (no localStorage)
      setMediaItems((prev) =>
        prev.map((item) => {
          if (uniqueIds.includes(item.id)) {
            return { ...item, status: 'trash', location: null, parentFolderId: null };
          }

          if (item.type === 'folder' && folderCountDelta.has(item.id)) {
            return {
              ...item,
              itemCount: Math.max(
                0,
                (item.itemCount ?? 0) + (folderCountDelta.get(item.id) ?? 0),
              ),
            };
          }

          return item;
        }),
      );

      setLibraryItems((prev) => prev.filter(item => !uniqueIds.includes(item.id)));

      setSelectedMediaIds((prev) => {
        const next = new Set(prev);
        uniqueIds.forEach((id) => next.delete(id));
        return next;
      });
    },
    [mediaItems, removeMediaFromSidebar, trashedIds],
  );

  const moveMediaToTrash = useCallback(
    (mediaId: string, reason?: string) => {
      moveMediaToTrashBulk([mediaId], reason);
    },
    [moveMediaToTrashBulk],
  );

  const restoreFromTrashBulk = useCallback((mediaIds: string[]) => {
    const uniqueIds = [...new Set(mediaIds)].filter((id) => trashedIds.has(id));
    if (uniqueIds.length === 0) {
      // Even if not in local trashedIds (e.g. rejected from admin panel), still update status
      const allIds = [...new Set(mediaIds)];
      setMediaItems((prev) =>
        prev.map((item) =>
          allIds.includes(item.id) ? { ...item, status: 'active' } : item,
        ),
      );
      return;
    }

    uniqueIds.forEach((id) => {
      apiClient.post(`/media/${id}/restore`).catch(err => console.error('Failed to sync restore with backend', err));
    });

    // Restore to active in local state
    setMediaItems((prev) =>
      prev.map((item) =>
        uniqueIds.includes(item.id) ? { ...item, status: 'active' } : item,
      ),
    );

    setSelectedMediaIds((prev) => {
      const next = new Set(prev);
      uniqueIds.forEach((id) => next.delete(id));
      return next;
    });
  }, [trashedIds]);

  const updateMediaTags = useCallback((mediaId: string, tags: string[]) => {
    setMediaItems((prev) =>
      prev.map((item) => (item.id === mediaId ? { ...item, tags } : item)),
    );
  }, []);

  const updateMediaReviewStatus = useCallback((mediaId: string, reviewStatus: string) => {
    const patch = (item: MediaItem): MediaItem =>
      item.id === mediaId
        ? {
            ...item,
            customMetadata: {
              ...(item.customMetadata || {}),
              reviewStatus,
            },
          }
        : item;

    setMediaItems((prev) => prev.map(patch));
    setLibraryItems((prev) => prev.map(patch));
  }, []);

  const getTagUsageCount = useCallback(
    (tagName: string) => {
      const normalized = normalizeTagName(tagName);
      return mediaItems.filter((item) => item.tags?.includes(normalized)).length;
    },
    [mediaItems],
  );

  const getAssignableTags = useCallback(
    (workspaceId: string) => {
      const assignable = managedTags.filter((tag) => {
        if (tag.scope === 'company' || tag.scope === 'personal') return true;
        return tag.scope === 'project' && tag.workspaceId === workspaceId;
      });
      // Keep parent chain so parentId hierarchy resolves across scopes/workspaces.
      return withAncestorTags(assignable, managedTags);
    },
    [managedTags],
  );

  const isDuplicateManagedTag = useCallback(
    (name: string, scope: ManagedTag['scope'], workspaceId: string | null, excludeId?: string) =>
      managedTags.some(
        (tag) =>
          tag.id !== excludeId &&
          tag.name === name &&
          tag.scope === scope &&
          (tag.scope === 'project' ? tag.workspaceId === workspaceId : true),
      ),
    [managedTags],
  );

  const updateTagScopeColor = useCallback((scope: TagScope, color: string) => {
    setTagScopeColors((prev) => {
      const normalizedColor = normalizeHexColor(color);
      const reservedBy = (['company', 'project', 'personal'] as const).find(
        (entry) =>
          entry !== scope && normalizeHexColor(prev[entry]) === normalizedColor,
      );
      if (reservedBy) return prev;

      return { ...prev, [scope]: normalizedColor };
    });
  }, []);

  const createManagedTag = useCallback(
    async (input: CreateManagedTagInput): Promise<ManagedTag | null> => {
      const name = normalizeTagName(input.name);
      if (!name) return null;

      const workspaceId = input.scope === 'project' ? input.workspaceId : null;
      if (input.scope === 'project' && !workspaceId) return null;

      if (isDuplicateManagedTag(name, input.scope, workspaceId)) return null;

      try {
        const { apiClient } = await import('../api/client');
        const response = await apiClient.post<any>('/tags', {
          name,
          scope: input.scope,
          workspaceId,
          parentId: input.parentId,
          color: tagScopeColors[input.scope],
        });
        const resData = response.data || response;

        const newTag: ManagedTag = {
          id: resData.id,
          name: resData.name,
          scope: resData.scope,
          workspaceId: resData.workspaceId,
          color: resData.color || tagScopeColors[input.scope],
          parentId: resData.parentId,
          parentName: resData.parent?.name,
          ancestors: resData.ancestors || [],
          createdAt: resData.createdAt || new Date().toISOString(),
        };

        setManagedTags((prev) => [...prev, newTag]);
        return newTag;
      } catch (err) {
        console.error('Failed to create tag:', err);
        return null;
      }
    },
    [isDuplicateManagedTag, tagScopeColors],
  );

  const updateManagedTag = useCallback(
    async (id: string, updates: { name?: string; parentId?: string | null }): Promise<boolean> => {
      const existing = managedTags.find((tag) => tag.id === id);
      if (!existing) return false;

      const nextName = updates.name ? normalizeTagName(updates.name) : existing.name;
      if (!nextName) return false;

      if (
        nextName !== existing.name &&
        isDuplicateManagedTag(nextName, existing.scope, existing.workspaceId, id)
      ) {
        return false;
      }

      const previousName = existing.name;

      try {
        const { apiClient } = await import('../api/client');
        
        const payload: any = {};
        if (updates.name) payload.name = nextName;
        if (updates.parentId !== undefined) payload.parentId = updates.parentId;
        
        const response = await apiClient.patch<any>(`/tags/${id}`, payload);
        const resData = response.data || response;

        setManagedTags((prev) =>
          prev.map((tag) =>
            tag.id === id
              ? {
                  ...tag,
                  name: resData.name || nextName,
                  parentId: resData.parentId,
                  parentName: resData.parent?.name,
                  ancestors: resData.ancestors || [],
                }
              : tag,
          ),
        );

        if (previousName !== nextName) {
          setMediaItems((prev) =>
            prev.map((item) => {
              if (!item.tags?.includes(previousName)) return item;

              return {
                ...item,
                tags: item.tags.map((tag) => (tag === previousName ? nextName : tag)),
              };
            }),
          );
        }

        return true;
      } catch (err) {
        console.error('Failed to update tag:', err);
        return false;
      }
    },
    [isDuplicateManagedTag, managedTags],
  );

  const deleteManagedTag = useCallback(
    async (id: string) => {
      const existing = managedTags.find((tag) => tag.id === id);
      if (!existing) return;

      try {
        const { apiClient } = await import('../api/client');
        await apiClient.delete(`/tags/${id}`);

        setManagedTags((prev) => prev.filter((tag) => tag.id !== id));
        setMediaItems((prev) =>
          prev.map((item) => {
            if (!item.tags?.includes(existing.name)) return item;

            return {
              ...item,
              tags: item.tags.filter((tag) => tag !== existing.name),
            };
          }),
        );
      } catch (err) {
        console.error('Failed to delete tag:', err);
      }
    },
    [managedTags],
  );

  const renameMedia = useCallback(
    (mediaId: string, newTitle: string) => {
      const trimmed = newTitle.trim();
      if (!trimmed) return;

      const media = mediaItems.find((m) => m.id === mediaId);
      if (!media) return;

      const oldLabel = media.location?.childLabel ?? media.title;

      setMediaItems((prev) =>
        prev.map((item) => {
          if (item.id !== mediaId) return item;

          return {
            ...item,
            title: trimmed,
            location: item.location
              ? { ...item.location, childLabel: trimmed }
              : null,
          };
        }),
      );

      setLibraryItems((prev) =>
        prev.map((item) => {
          if (item.id !== mediaId) return item;
          return {
            ...item,
            title: trimmed,
            location: item.location
              ? { ...item.location, childLabel: trimmed }
              : null,
          };
        }),
      );

      if (media.location) {
        setWorkspaces((prev) =>
          prev.map((workspace) => {
            if (workspace.id !== media.workspaceId) return workspace;

            return {
              ...workspace,
              folders: workspace.folders.map((folder) => {
                if (folder.id !== media.location?.folderId) return folder;

                return {
                  ...folder,
                  children: (folder.children ?? []).map((child) =>
                    child === oldLabel ? trimmed : child,
                  ),
                };
              }),
            };
          }),
        );
      }
    },
    [mediaItems],
  );

  const addWorkspaceFolder = useCallback(
    async (name: string, color: string = DEFAULT_FOLDER_COLOR) => {
      const trimmed = name.trim();
      if (!trimmed) return '';

      try {
        const { apiClient } = await import('../api/client');
        const response = await apiClient.post<any>(`/workspaces/folder/add/${activeWorkspaceId}`, {
          name: trimmed,
          color,
        });

        const resData = (response as any).data || response;
        const folderId = resData?.id || `folder-${Date.now()}`;

        setWorkspaces((prev) =>
          prev.map((workspace) => {
            if (workspace.id !== activeWorkspaceId) return workspace;

            return {
              ...workspace,
              folders: [
                ...workspace.folders,
                {
                  id: folderId,
                  label: resData?.name || trimmed,
                  children: [],
                  color: resData?.color || color,
                  createdByEmail: CURRENT_USER.email,
                },
              ],
            };
          }),
        );

        const newFolderItem: MediaItem = {
          id: folderId,
          title: resData?.name || trimmed,
          type: 'folder',
          workspaceId: activeWorkspaceId,
          createdAt: new Date().toISOString(),
          sizeBytes: 0,
          storageProvider: 'b2',
          uploadedBy: CURRENT_USER.name,
          status: 'active',
          folderColor: resData?.color || color,
        };

        setMediaItems((prev) => [...prev, newFolderItem]);
        setLibraryItems((prev) => [newFolderItem, ...prev]);

        return folderId;
      } catch (err) {
        console.error('Failed to create workspace folder:', err);
        return '';
      }
    },
    [activeWorkspaceId],
  );

  const renameWorkspaceFolder = useCallback(
    async (folderId: string, newLabel: string) => {
      const trimmed = newLabel.trim();
      if (!trimmed) return;

      try {
        const { apiClient } = await import('../api/client');
        await apiClient.put(`/workspaces/folder/update/${folderId}`, {
          name: trimmed,
        });

        setWorkspaces((prev) =>
          prev.map((workspace) => {
            if (workspace.id !== activeWorkspaceId) return workspace;

            return {
              ...workspace,
              folders: workspace.folders.map((folder) =>
                folder.id === folderId ? { ...folder, label: trimmed } : folder,
              ),
            };
          }),
        );

        setMediaItems((prev) =>
          prev.map((item) =>
            item.id === folderId ? { ...item, title: trimmed } : item
          )
        );

        setLibraryItems((prev) =>
          prev.map((item) =>
            item.id === folderId ? { ...item, title: trimmed } : item
          )
        );
      } catch (err) {
        console.error('Failed to rename folder:', err);
      }
    },
    [activeWorkspaceId],
  );

  const deleteWorkspaceFolder = useCallback(
    (folderId: string) => {
      const mediaIds = mediaItems
        .filter(
          (item) =>
            item.workspaceId === activeWorkspaceId &&
            item.location?.folderId === folderId &&
            item.status !== 'trash',
        )
        .map((item) => item.id);

      if (mediaIds.length > 0) {
        moveMediaToTrashBulk(mediaIds);
      }

      setWorkspaces((prev) =>
        prev.map((workspace) => {
          if (workspace.id !== activeWorkspaceId) return workspace;

          return {
            ...workspace,
            folders: workspace.folders.filter((folder) => folder.id !== folderId),
          };
        }),
      );
    },
    [activeWorkspaceId, mediaItems, moveMediaToTrashBulk, trashedIds],
  );

  const renameWorkspaceFolderChild = useCallback(
    (folderId: string, oldLabel: string, newLabel: string) => {
      const trimmed = newLabel.trim();
      if (!trimmed || trimmed === oldLabel) return;

      setWorkspaces((prev) =>
        prev.map((workspace) => {
          if (workspace.id !== activeWorkspaceId) return workspace;

          return {
            ...workspace,
            folders: workspace.folders.map((folder) => {
              if (folder.id !== folderId) return folder;

              return {
                ...folder,
                children: (folder.children ?? []).map((child) =>
                  child === oldLabel ? trimmed : child,
                ),
              };
            }),
          };
        }),
      );

      setMediaItems((prev) =>
        prev.map((item) => {
          if (
            item.workspaceId !== activeWorkspaceId ||
            item.location?.folderId !== folderId ||
            (item.location?.childLabel ?? item.title) !== oldLabel
          ) {
            return item;
          }

          return {
            ...item,
            title: trimmed,
            location: { ...item.location, childLabel: trimmed },
          };
        }),
      );
    },
    [activeWorkspaceId],
  );

  const deleteWorkspaceFolderChild = useCallback(
    (folderId: string, childLabel: string) => {
      const mediaIds = mediaItems
        .filter(
          (item) =>
            item.workspaceId === activeWorkspaceId &&
            item.location?.folderId === folderId &&
            (item.location?.childLabel ?? item.title) === childLabel &&
            item.status !== 'trash',
        )
        .map((item) => item.id);

      if (mediaIds.length > 0) {
        moveMediaToTrashBulk(mediaIds);
      }

      setWorkspaces((prev) =>
        prev.map((workspace) => {
          if (workspace.id !== activeWorkspaceId) return workspace;

          return {
            ...workspace,
            folders: workspace.folders.map((folder) => {
              if (folder.id !== folderId) return folder;

              return {
                ...folder,
                children: (folder.children ?? []).filter((child) => child !== childLabel),
              };
            }),
          };
        }),
      );
    },
    [activeWorkspaceId, mediaItems, moveMediaToTrashBulk, trashedIds],
  );

  const addWorkspaceFile = useCallback(
    (folderId: string, name: string, type: MediaType) => {
      const trimmed = name.trim();
      if (!trimmed) return;

      setWorkspaces((prev) =>
        prev.map((workspace) => {
          if (workspace.id !== activeWorkspaceId) return workspace;

          return {
            ...workspace,
            folders: workspace.folders.map((folder) => {
              if (folder.id !== folderId) return folder;

              const children = folder.children ?? [];
              if (children.includes(trimmed)) return folder;

              return {
                ...folder,
                children: [...children, trimmed],
              };
            }),
          };
        }),
      );

      const newItem: MediaItem = {
        id: `media-${Date.now()}`,
        title: trimmed,
        type,
        workspaceId: activeWorkspaceId,
        createdAt: new Date().toISOString(),
        sizeBytes: 0,
        storageProvider: 'local',
        location: { folderId, childLabel: trimmed },
      };

      setMediaItems((prev) => [...prev, newItem]);
    },
    [activeWorkspaceId],
  );

  const uploadMediaFiles = useCallback(
    (files: File[], options?: MediaUploadOptions) => {
      const uploadable = files.filter((file) => getMediaTypeFromFile(file) !== null);
      if (uploadable.length === 0) return 0;

      const parentFolderId = options?.parentFolderId ?? null;
      const linkedProjectId = options?.linkedProjectId ?? null;
      const stagedUploads: PendingMediaUpload[] = uploadable.flatMap((file, index) => {
        const type = getMediaTypeFromFile(file);
        if (!type || type === 'folder') return [];

        return [
          {
            id: `pending-media-${Date.now()}-${index}`,
            type,
            file,
            previewSrc: URL.createObjectURL(file),
            defaultTitle: file.name.replace(/\.[^/.]+$/, '') || file.name,
            parentFolderId,
            linkedProjectId,
          },
        ];
      });

      setPendingMediaQueue((prev) => [...prev, ...stagedUploads]);

      return uploadable.length;
    },
    [],
  );

  const cancelMediaUpload = useCallback(() => {
    setPendingMediaQueue((prev) => {
      prev.forEach((upload) => URL.revokeObjectURL(upload.previewSrc));
      return [];
    });
  }, []);

  const popPendingMediaUpload = useCallback(() => {
    setPendingMediaQueue((prev) => {
      if (prev[0]?.previewSrc) {
        URL.revokeObjectURL(prev[0].previewSrc);
      }
      return prev.slice(1);
    });
  }, []);

  const completeMediaUpload = useCallback(
    async (
      details: MediaUploadDetails,
      onProgress?: (progress: { loaded: number; total: number }) => void,
    ) => {
      const current = pendingMediaQueueRef.current[0];
      if (!current) return;

      const trimmedTitle = details.title.trim();
      const trimmedSummary = details.summary?.trim() ?? '';
      if (!trimmedTitle) return;

      if (current.type !== 'audio' && current.type !== 'document' && !details.thumbnail) return;

      const parentFolderId = current.parentFolderId ?? null;
      const linkedProjectId = current.linkedProjectId ?? null;

      let ownerType = 'WORKSPACE';
      let ownerId = activeWorkspaceId!;

      if (parentFolderId) {
        ownerType = 'FOLDER';
        ownerId = parentFolderId;
      }

      let uploadedAssetDto: MediaAssetResponseDto | null = null;
      try {
        let durationSecs: number | undefined;
        if (details.duration) {
          const parts = details.duration.split(':').map(Number);
          if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
            durationSecs = parts[0] * 60 + parts[1];
          } else if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
            durationSecs = parts[0] * 3600 + parts[1] * 60 + parts[2];
          } else if (!isNaN(Number(details.duration))) {
            durationSecs = Number(details.duration);
          }
        }

        let fullTechSpecs: Record<string, any> = {};
        try {
          if (current.type === 'video') {
            fullTechSpecs = {};
          } else if (current.type === 'image') {
            fullTechSpecs = await extractImageMetadata(current.file);
          } else if (current.type === 'audio') {
            fullTechSpecs = await extractAudioMetadata(current.file);
          }
        } catch (err) {
          console.warn('Could not extract media specs:', err);
        }

        uploadedAssetDto = await uploadMediaFileRequest(
          current.file,
          {
            title: trimmedTitle,
            summary: trimmedSummary || undefined,
            durationSeconds: durationSecs,
            ownerType,
            ownerId,
            linkedProjectId: linkedProjectId || undefined,
            folderId: details.folderId || undefined,
            tagIds: details.tagIds,
            technicalSpecs: fullTechSpecs,
            visibility: details.visibility,
          },
          onProgress,
        );
      } catch (error) {
        console.error('Failed to upload media file to Backblaze B2 backend:', error);
      }

      const itemId = uploadedAssetDto?.id || current.id.replace(/^pending-media-/, 'media-');

      const newItem: MediaItem = {
        id: itemId,
        title: trimmedTitle,
        ...(trimmedSummary ? { summary: trimmedSummary } : {}),
        type: current.type,
        workspaceId: activeWorkspaceId,
        createdAt: uploadedAssetDto?.uploadDate || new Date().toISOString(),
        sizeBytes: current.file.size,
        storageProvider: uploadedAssetDto ? 'b2' : 'local',
        uploadedBy: (uploadedAssetDto as any)?.uploadedBy?.name || CURRENT_USER.name,
        originallyCreatedAt: new Date(current.file.lastModified).toISOString(),
        tags: details.tagIds.map(id => managedTags.find(t => t.id === id)?.name || id),
        ...(parentFolderId ? { parentFolderId } : {}),
        linkedProjectIds: linkedProjectId ? [linkedProjectId] : [],
        location: details.folderId
          ? { folderId: details.folderId, childLabel: trimmedTitle }
          : null,
        thumbnail: details.thumbnail || uploadedAssetDto?.thumbnail || (current.type === 'image' ? (uploadedAssetDto?.url || current.previewSrc) : undefined),
        videoSrc: uploadedAssetDto?.url || current.previewSrc,
        url: uploadedAssetDto?.url || current.previewSrc,
        ...(current.type === 'video'
          ? {
            duration: details.duration,
          }
          : {}),
      };

      setMediaItems((items) => {
        if (items.some((item) => item.id === newItem.id)) {
          return items;
        }

        const next = [newItem, ...items];
        if (!parentFolderId) return next;

        return next.map((item) =>
          item.id === parentFolderId && item.type === 'folder'
            ? { ...item, itemCount: (item.itemCount ?? 0) + 1 }
            : item,
        );
      });

      if (!parentFolderId) {
        fetchWorkspaceData();
      } else if (details.folderId) {
        setWorkspaces((workspaces) =>
          workspaces.map((workspace) => {
            if (workspace.id !== activeWorkspaceId) return workspace;

            return {
              ...workspace,
              folders: workspace.folders.map((folder) => {
                if (folder.id !== details.folderId) return folder;

                const children = folder.children ?? [];
                if (children.includes(trimmedTitle)) return folder;

                return {
                  ...folder,
                  children: [...children, trimmedTitle],
                };
              }),
            };
          }),
        );
      }

      // Always update libraryItems so it shows up instantly in the grid, regardless of whether 
      // parentFolderId is set or if we're just navigating to the project.
      setLibraryItems((prev) => {
        if (prev.some((item) => item.id === newItem.id)) return prev;
        return [newItem, ...prev];
      });

      if (current.type === 'image') {
        URL.revokeObjectURL(current.previewSrc);
      }

      setPendingMediaQueue((prev) => prev.slice(1));
      
      return uploadedAssetDto?.folderId;
    },
    [activeWorkspaceId, fetchWorkspaceData],
  );

  const createRootMediaFolder = useCallback(
    async (
      name: string,
      color: string = DEFAULT_FOLDER_COLOR,
      parentFolderId?: string | null,
      projectLocation?: MediaLocation | null,
    ) => {
      const trimmed = name.trim();
      if (!trimmed) return;

      if (!parentFolderId && !projectLocation) {
        const newFolderId = await addWorkspaceFolder(trimmed, color);
        return newFolderId || undefined;
      }
      try {
        const { apiClient } = await import('../api/client');
        const linkedProjectId = projectLocation?.folderId;
        const response = await apiClient.post<any>(`/workspaces/folder/add/${activeWorkspaceId}`, {
          name: trimmed,
          color,
          parentId: parentFolderId || null,
          linkedProjectId: linkedProjectId || undefined,
        });

        const resData = (response as any).data || response;
        const folderId = resData?.id || `folder-${Date.now()}`;

        let resolvedProjectLocation = projectLocation ?? null;
        if (!resolvedProjectLocation && parentFolderId) {
          setMediaItems((prev) => {
            const parent = prev.find(
              (item) => item.id === parentFolderId && item.type === 'folder',
            );
            if (parent?.projectLocation) resolvedProjectLocation = parent.projectLocation;
            return prev; // No-op update just to read state safely, though ideally we'd use a ref
          });
        }

        const newItem: MediaItem = {
          id: folderId,
          title: resData?.name || trimmed,
          type: 'folder',
          workspaceId: activeWorkspaceId,
          createdAt: new Date().toISOString(),
          sizeBytes: 0,
          storageProvider: 'b2',
          uploadedBy: CURRENT_USER.name,
          status: 'active',
          folderColor: resData?.color || color,
          ...(parentFolderId ? { parentFolderId } : {}),
          linkedProjectIds: linkedProjectId ? [linkedProjectId] : [],
          ...(resolvedProjectLocation ? { projectLocation: resolvedProjectLocation } : {}),
        };

        setMediaItems((prev) => {
          const next = [...prev, newItem];
          if (!parentFolderId) return next;
          return next.map((item) =>
            item.id === parentFolderId && item.type === 'folder'
              ? { ...item, itemCount: (item.itemCount ?? 0) + 1 }
              : item,
          );
        });

        setLibraryItems((prev) => [newItem, ...prev]);

        return folderId;
      } catch (err) {
        console.error('Failed to create media folder:', err);
      }
    },
    [activeWorkspaceId, addWorkspaceFolder],
  );

  const createProject = useCallback(
    async (
      name: string,
      parentFolderId?: string | null,
      defaultTagIds?: string[],
    ) => {
      const trimmed = name.trim();
      if (!trimmed) return;

      try {
        const { apiClient } = await import('../api/client');
        const response = await apiClient.post<any>(`/workspaces/project/add/${activeWorkspaceId}`, {
          name: trimmed,
          folderId: parentFolderId || null,
          ...(defaultTagIds && defaultTagIds.length > 0 ? { defaultTagIds } : {}),
        });

        const resData = (response as any).data || response;
        const projectId = resData?.id || `project-${Date.now()}`;
        const resolvedFolderId = (response as any).folderId || parentFolderId;

        const newItem: MediaItem = {
          id: projectId,
          title: resData?.name || trimmed,
          type: 'folder',
          workspaceId: activeWorkspaceId,
          createdAt: new Date().toISOString(),
          sizeBytes: 0,
          storageProvider: 'b2',
          uploadedBy: CURRENT_USER.name,
          status: 'active',
          isProject: true,
          ...(resolvedFolderId ? { parentFolderId: resolvedFolderId } : {}),
        };

        setMediaItems((prev) => {
          const next = [...prev, newItem];
          if (!resolvedFolderId) return next;

          return next.map((item) =>
            item.id === resolvedFolderId && item.type === 'folder'
              ? { ...item, itemCount: (item.itemCount ?? 0) + 1 }
              : item,
          );
        });

        setLibraryItems((prev) => [newItem, ...prev]);

        setWorkspaces((prev) =>
          prev.map((workspace) => {
            if (workspace.id !== activeWorkspaceId) return workspace;
            return {
              ...workspace,
              projectFolders: [
                ...(workspace.projectFolders || []),
                { id: projectId, label: resData?.name || trimmed },
              ],
            };
          }),
        );

        if (!parentFolderId && (response as any).folderId) {
          fetchWorkspaceData().then(() => {
            navigate(`/home/folder/${(response as any).folderId}`);
          });
        }

        return projectId;
      } catch (err) {
        console.error('Failed to create project:', err);
      }
    },
    [activeWorkspaceId],
  );

  const updateMediaProjectLocation = useCallback(
    async (mediaId: string, projectLocation: MediaLocation | null, itemType?: string) => {
      if (projectLocation && itemType) {
        const isFolder = itemType === 'folder';
        const sourceableType = isFolder ? 'FOLDER' : 'ASSET';

        try {
          const { apiClient } = await import('../api/client');
          await apiClient.post(`/workspaces/project/link-source/${projectLocation.folderId}`, {
            sourceableType,
            assetId: !isFolder ? mediaId : undefined,
            folderId: isFolder ? mediaId : undefined
          });
        } catch (err) {
          console.error('Failed to link source to project:', err);
        }
      }

      setMediaItems((prev) =>
        prev.map((item) => {
          if (item.id !== mediaId) return item;
          if (!projectLocation) return item;

          const newLinkedProjectIds = [projectLocation.folderId];
          const newProjectLocations = [projectLocation];

          return { ...item, linkedProjectIds: newLinkedProjectIds, projectLocations: newProjectLocations };
        }),
      );
    },
    [],
  );

  const updateSidebarFolderColor = useCallback(
    (folderId: string, color: string) => {
      const applyColor = (folder: SidebarFolder) =>
        folder.id === folderId ? { ...folder, color } : folder;

      setWorkspaces((prev) =>
        prev.map((workspace) => {
          if (workspace.id !== activeWorkspaceId) return workspace;

          return {
            ...workspace,
            folders: workspace.folders.map(applyColor),
            projectFolders: workspace.projectFolders.map(applyColor),
          };
        }),
      );
    },
    [activeWorkspaceId],
  );

  const updateMediaFolderColor = useCallback((mediaId: string, color: string) => {
    setMediaItems((prev) =>
      prev.map((item) =>
        item.id === mediaId && item.type === 'folder' ? { ...item, folderColor: color } : item,
      ),
    );
    setLibraryItems((prev) =>
      prev.map((item) =>
        item.id === mediaId && item.type === 'folder' ? { ...item, folderColor: color } : item,
      ),
    );
  }, []);

  const cancelVideoUpload = cancelMediaUpload;
  const completeVideoUpload = completeMediaUpload;

  const value = useMemo(
    () => ({
      workspaces,
      activeWorkspaceId,
      activeWorkspace,
      systemTimezone,
      setActiveWorkspaceId,
      updateWorkspaceColor,
      createWorkspace,
      mediaItems,
      rootMediaItems,
      fetchedFavorites,
      favoriteMediaItems,
      duplicateMediaItems,
      sharedMediaItems,
      favorites,
      toggleFavorite,
      moveMediaToFolder,
      moveMediaToFolderBulk,
      moveMediaToDashboardFolder,
      moveMediaToWorkspaceFolder,
      moveMediaToTrash,
      moveMediaToTrashBulk,
      trashedMediaItems,
      trashedAtById,
      restoreFromTrashBulk,
      purgeExpiredTrash,
      selectedMediaIds,
      toggleMediaSelection,
      setMediaSelection,
      clearMediaSelection,
      renameMedia,
      updateMediaTags,
      updateMediaReviewStatus,
      managedTags,
      tagScopeColors,
      updateTagScopeColor,
      createManagedTag,
      updateManagedTag,
      deleteManagedTag,
      getTagUsageCount,
      getAssignableTags,
      addWorkspaceFolder,
      renameWorkspaceFolder,
      deleteWorkspaceFolder,
      renameWorkspaceFolderChild,
      deleteWorkspaceFolderChild,
      addWorkspaceFile,
      updateSidebarFolderColor,
      updateMediaFolderColor,
      uploadMediaFiles,
      pendingMediaUpload,
      pendingMediaUploadCount,
      completeMediaUpload,
      cancelMediaUpload,
      popPendingMediaUpload,
      pendingVideoUpload,
      pendingVideoUploadCount,
      completeVideoUpload,
      cancelVideoUpload,
      createRootMediaFolder,
      createProject,
      updateMediaProjectLocation,
      trashedIds,
      draggingMediaId,
      draggingMediaIds,
      setDraggingMediaIds,
      clearDraggingMedia,
      dropTargetKey,
      setDropTargetKey,
      globalSearchQuery,
      setGlobalSearchQuery,
      sidebarSelection,
      setSidebarSelection,
      clearSidebarSelection,
      fetchWorkspaceData,
      fetchFolderData,
      fetchProjectData,
      libraryItems,
      nextPageToken,
      libraryLoading,
      libraryLoadingMore,
      fetchLibraryFirstPage,
      fetchLibraryNextPage,
    }),
    [
      workspaces,
      activeWorkspaceId,
      activeWorkspace,
      updateWorkspaceColor,
      createWorkspace,
      mediaItems,
      rootMediaItems,
      fetchedFavorites,
      favoriteMediaItems,
      duplicateMediaItems,
      sharedMediaItems,
      libraryItems,
      nextPageToken,
      libraryLoading,
      libraryLoadingMore,
      fetchLibraryFirstPage,
      fetchLibraryNextPage,
      favorites,
      toggleFavorite,
      moveMediaToFolder,
      moveMediaToFolderBulk,
      moveMediaToDashboardFolder,
      moveMediaToWorkspaceFolder,
      moveMediaToTrash,
      moveMediaToTrashBulk,
      trashedMediaItems,
      trashedAtById,
      restoreFromTrashBulk,
      purgeExpiredTrash,
      selectedMediaIds,
      toggleMediaSelection,
      setMediaSelection,
      clearMediaSelection,
      renameMedia,
      updateMediaTags,
      updateMediaReviewStatus,
      managedTags,
      tagScopeColors,
      updateTagScopeColor,
      createManagedTag,
      updateManagedTag,
      deleteManagedTag,
      getTagUsageCount,
      getAssignableTags,
      addWorkspaceFolder,
      renameWorkspaceFolder,
      deleteWorkspaceFolder,
      renameWorkspaceFolderChild,
      deleteWorkspaceFolderChild,
      addWorkspaceFile,
      updateSidebarFolderColor,
      updateMediaFolderColor,
      uploadMediaFiles,
      pendingMediaUpload,
      pendingMediaUploadCount,
      completeMediaUpload,
      cancelMediaUpload,
      pendingVideoUpload,
      pendingVideoUploadCount,
      completeVideoUpload,
      cancelVideoUpload,
      createRootMediaFolder,
      createProject,
      updateMediaProjectLocation,
      trashedIds,
      draggingMediaId,
      draggingMediaIds,
      setDraggingMediaIds,
      clearDraggingMedia,
      dropTargetKey,
      globalSearchQuery,
      sidebarSelection,
      setSidebarSelection,
      clearSidebarSelection,
      fetchWorkspaceData,
      fetchFolderData,
      fetchProjectData,
    ],
  );

  return (
    <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within DashboardProvider');
  }
  return context;
}

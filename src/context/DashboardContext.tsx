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
import { loadFavoriteMediaIds, saveFavoriteMediaIds } from '../utils/favoritesStorage';
import { loadTrashedMedia, saveTrashedMedia, type TrashedMediaRecord } from '../utils/trashStorage';
import { getExpiredTrashIds, isTrashExpired } from '../utils/trashRetention';
import {
  loadManagedTags,
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
import {
  uploadMediaFileRequest,
  getMediaAssetsRequest,
  type MediaAssetResponseDto,
} from '../api';

interface DashboardContextValue {
  workspaces: Workspace[];
  activeWorkspaceId: string;
  activeWorkspace: Workspace;
  setActiveWorkspaceId: (id: string) => void;
  updateWorkspaceColor: (workspaceId: string, color: string) => void;
  createWorkspace: (data: CreateWorkspaceFormData) => void;
  mediaItems: MediaItem[];
  rootMediaItems: MediaItem[];
  favoriteMediaItems: MediaItem[];
  favorites: Set<string>;
  toggleFavorite: (id: string) => void;
  moveMediaToFolder: (mediaId: string, folderId: string, childLabel?: string) => void;
  moveMediaToFolderBulk: (mediaIds: string[], folderId: string, childLabel?: string) => void;
  moveMediaToDashboardFolder: (mediaIds: string[], folderId: string) => void;
  moveMediaToTrash: (mediaId: string) => void;
  moveMediaToTrashBulk: (mediaIds: string[]) => void;
  trashedMediaItems: MediaItem[];
  trashedAtById: TrashedMediaRecord;
  restoreFromTrashBulk: (mediaIds: string[]) => void;
  purgeExpiredTrash: () => void;
  selectedMediaIds: Set<string>;
  toggleMediaSelection: (mediaId: string) => void;
  setMediaSelection: (mediaIds: string[]) => void;
  clearMediaSelection: () => void;
  renameMedia: (mediaId: string, newTitle: string) => void;
  updateMediaTags: (mediaId: string, tags: string[]) => void;
  managedTags: ManagedTag[];
  tagScopeColors: TagScopeColors;
  updateTagScopeColor: (scope: TagScope, color: string) => void;
  createManagedTag: (input: CreateManagedTagInput) => ManagedTag | null;
  updateManagedTag: (id: string, updates: { name?: string }) => boolean;
  deleteManagedTag: (id: string) => void;
  getTagUsageCount: (tagName: string) => number;
  getAssignableTags: (workspaceId: string) => ManagedTag[];
  addWorkspaceFolder: (name: string, color?: string) => string;
  renameWorkspaceFolder: (folderId: string, newLabel: string) => void;
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
  ) => Promise<void>;
  cancelMediaUpload: () => void;
  /** @deprecated Use pendingMediaUpload */
  pendingVideoUpload: PendingMediaUpload | null;
  /** @deprecated Use pendingMediaUploadCount */
  pendingVideoUploadCount: number;
  /** @deprecated Use completeMediaUpload */
  completeVideoUpload: (
    details: MediaUploadDetails,
    onProgress?: (progress: { loaded: number; total: number }) => void,
  ) => Promise<void>;
  /** @deprecated Use cancelMediaUpload */
  cancelVideoUpload: () => void;
  createRootMediaFolder: (
    name: string,
    color?: string,
    parentFolderId?: string | null,
    projectLocation?: MediaLocation | null,
  ) => void;
  updateMediaProjectLocation: (mediaId: string, projectLocation: MediaLocation | null) => void;
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
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

function getInitialTrashState(): { trashedAtById: TrashedMediaRecord; expiredIds: string[] } {
  const trashedAtById = loadTrashedMedia();
  const expiredIds = getExpiredTrashIds(trashedAtById);
  expiredIds.forEach((id) => {
    delete trashedAtById[id];
  });
  if (expiredIds.length > 0) {
    saveTrashedMedia(trashedAtById);
  }
  return { trashedAtById, expiredIds };
}

const initialTrashState = getInitialTrashState();

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>(initialWorkspaces);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState(initialWorkspaces[0].id);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>(() =>
    initialMediaItems.filter((item) => !initialTrashState.expiredIds.includes(item.id)),
  );
  const [favorites, setFavorites] = useState<Set<string>>(() => loadFavoriteMediaIds());
  const [draggingMediaIds, setDraggingMediaIdsState] = useState<Set<string>>(new Set());
  const [dropTargetKey, setDropTargetKey] = useState<string | null>(null);
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [sidebarSelection, setSidebarSelectionState] = useState<SidebarSelection | null>(null);
  const [trashedAtById, setTrashedAtById] = useState<TrashedMediaRecord>(
    () => initialTrashState.trashedAtById,
  );

  const trashedIds = useMemo(() => new Set(Object.keys(trashedAtById)), [trashedAtById]);

  useEffect(() => {
    setWorkspaces((current) => mergeWorkspaceFolderMetadata(current));
  }, []);

  useEffect(() => {
    getMediaAssetsRequest()
      .then((assets) => {
        if (assets && assets.length > 0) {
          setMediaItems((prev) => {
            const existingIds = new Set(prev.map((item) => item.id));
            const newItems: MediaItem[] = assets
              .filter((a) => !existingIds.has(a.id))
              .map((a) => {
                const isVideo = a.type === 'video' || /\.(mp4|mov|webm|avi|mkv)$/i.test(a.name);
                const isAudio = a.type === 'audio' || /\.(mp3|wav|ogg|aac|m4a)$/i.test(a.name);
                const isImage = a.type === 'image' || /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(a.name);
                const type: MediaType = isVideo ? 'video' : isAudio ? 'audio' : isImage ? 'image' : 'video';

                return {
                  id: a.id,
                  title: a.name,
                  type,
                  workspaceId: activeWorkspaceId,
                  createdAt: a.uploadDate || new Date().toISOString(),
                  sizeBytes: a.size || 0,
                  storageProvider: 'b2',
                  uploadedBy: CURRENT_USER.name,
                  thumbnail: a.thumbnail || undefined,
                  videoSrc: isVideo ? a.url : undefined,
                  duration: typeof a.metadata?.duration === 'string' ? a.metadata.duration : undefined,
                  tags: Array.isArray(a.metadata?.tags) ? (a.metadata.tags as string[]) : [],
                  location: null,
                };
              });
            return [...prev, ...newItems];
          });
        }
      })
      .catch((err) => {
        console.error('Failed to load media assets from backend:', err);
      });
  }, [activeWorkspaceId]);

  useEffect(() => {
    saveTrashedMedia(trashedAtById);
  }, [trashedAtById]);

  const purgeExpiredTrash = useCallback(() => {
    setTrashedAtById((prev) => {
      const expiredIds = getExpiredTrashIds(prev);
      if (expiredIds.length === 0) return prev;

      setMediaItems((items) => items.filter((item) => !expiredIds.includes(item.id)));

      const next = { ...prev };
      expiredIds.forEach((id) => {
        delete next[id];
      });
      return next;
    });
  }, []);

  useEffect(() => {
    purgeExpiredTrash();
  }, [purgeExpiredTrash]);
  const [selectedMediaIds, setSelectedMediaIds] = useState<Set<string>>(new Set());
  const [managedTags, setManagedTags] = useState<ManagedTag[]>(() => loadManagedTags());
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

  const activeWorkspace =
    workspaces.find((w) => w.id === activeWorkspaceId) ?? workspaces[0];

  const rootMediaItems = useMemo(
    () =>
      mediaItems.filter(
        (item) =>
          item.workspaceId === activeWorkspaceId &&
          !item.parentFolderId &&
          !trashedIds.has(item.id),
      ),
    [mediaItems, activeWorkspaceId, trashedIds],
  );

  const favoriteMediaItems = useMemo(
    () =>
      mediaItems.filter(
        (item) =>
          item.workspaceId === activeWorkspaceId &&
          favorites.has(item.id) &&
          !trashedIds.has(item.id),
      ),
    [mediaItems, activeWorkspaceId, favorites, trashedIds],
  );

  const trashedMediaItems = useMemo(
    () =>
      mediaItems.filter((item) => {
        const deletedAt = trashedAtById[item.id];
        return (
          item.workspaceId === activeWorkspaceId &&
          deletedAt &&
          !isTrashExpired(deletedAt)
        );
      }),
    [mediaItems, activeWorkspaceId, trashedAtById],
  );

  useEffect(() => {
    saveFavoriteMediaIds(favorites);
  }, [favorites]);

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

  const toggleFavorite = useCallback((id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const updateWorkspaceColor = useCallback((workspaceId: string, color: string) => {
    setWorkspaces((prev) =>
      prev.map((w) => (w.id === workspaceId ? { ...w, color } : w)),
    );
  }, []);

  const createWorkspace = useCallback((data: CreateWorkspaceFormData) => {
    const newWorkspace: Workspace = {
      id: `workspace-${Date.now()}`,
      name: data.name,
      description: data.description,
      color: data.color,
      folders: defaultWorkspaceFolders.map((folder) => ({
        ...folder,
        id: `${folder.id}-${Date.now()}`,
      })),
      projectFolders: defaultWorkspaceProjectFolders.map((folder) => ({
        ...folder,
        id: `${folder.id}-${Date.now()}`,
      })),
    };
    setWorkspaces((prev) => [...prev, newWorkspace]);
    setActiveWorkspaceId(newWorkspace.id);
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
    (mediaIds: string[], folderId: string) => {
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
    },
    [mediaItems, removeMediaFromSidebar],
  );

  const moveMediaToTrashBulk = useCallback(
    (mediaIds: string[]) => {
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

      const deletedAt = new Date().toISOString();
      setTrashedAtById((prev) => {
        const next = { ...prev };
        uniqueIds.forEach((id) => {
          next[id] = deletedAt;
        });
        return next;
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

      setMediaItems((prev) =>
        prev.map((item) => {
          if (uniqueIds.includes(item.id)) {
            return { ...item, location: null, parentFolderId: null };
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
    [mediaItems, removeMediaFromSidebar, trashedIds],
  );

  const moveMediaToTrash = useCallback(
    (mediaId: string) => {
      moveMediaToTrashBulk([mediaId]);
    },
    [moveMediaToTrashBulk],
  );

  const restoreFromTrashBulk = useCallback((mediaIds: string[]) => {
    const uniqueIds = [...new Set(mediaIds)].filter((id) => trashedAtById[id]);
    if (uniqueIds.length === 0) return;

    setTrashedAtById((prev) => {
      const next = { ...prev };
      uniqueIds.forEach((id) => {
        delete next[id];
      });
      return next;
    });

    setSelectedMediaIds((prev) => {
      const next = new Set(prev);
      uniqueIds.forEach((id) => next.delete(id));
      return next;
    });
  }, [trashedAtById]);

  const updateMediaTags = useCallback((mediaId: string, tags: string[]) => {
    setMediaItems((prev) =>
      prev.map((item) => (item.id === mediaId ? { ...item, tags } : item)),
    );
  }, []);

  const getTagUsageCount = useCallback(
    (tagName: string) => {
      const normalized = normalizeTagName(tagName);
      return mediaItems.filter((item) => item.tags?.includes(normalized)).length;
    },
    [mediaItems],
  );

  const getAssignableTags = useCallback(
    (workspaceId: string) =>
      managedTags.filter((tag) => {
        if (tag.scope === 'company' || tag.scope === 'personal') return true;
        return tag.scope === 'project' && tag.workspaceId === workspaceId;
      }),
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
    (input: CreateManagedTagInput): ManagedTag | null => {
      const name = normalizeTagName(input.name);
      if (!name) return null;

      const workspaceId = input.scope === 'project' ? input.workspaceId : null;
      if (input.scope === 'project' && !workspaceId) return null;

      if (isDuplicateManagedTag(name, input.scope, workspaceId)) return null;

      const newTag: ManagedTag = {
        id: `tag-${Date.now()}`,
        name,
        scope: input.scope,
        workspaceId,
        color: tagScopeColors[input.scope],
        createdAt: new Date().toISOString(),
      };

      setManagedTags((prev) => [...prev, newTag]);
      return newTag;
    },
    [isDuplicateManagedTag, tagScopeColors],
  );

  const updateManagedTag = useCallback(
    (id: string, updates: { name?: string }) => {
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

      setManagedTags((prev) =>
        prev.map((tag) =>
          tag.id === id
            ? {
                ...tag,
                name: nextName,
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
    },
    [isDuplicateManagedTag, managedTags],
  );

  const deleteManagedTag = useCallback(
    (id: string) => {
      const existing = managedTags.find((tag) => tag.id === id);
      if (!existing) return;

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
    (name: string, color: string = DEFAULT_FOLDER_COLOR) => {
      const trimmed = name.trim();
      if (!trimmed) return '';

      const folderId = `folder-${Date.now()}`;

      setWorkspaces((prev) =>
        prev.map((workspace) => {
          if (workspace.id !== activeWorkspaceId) return workspace;

          return {
            ...workspace,
            folders: [
              ...workspace.folders,
              {
                id: folderId,
                label: trimmed,
                children: [],
                color,
                createdByEmail: CURRENT_USER.email,
              },
            ],
          };
        }),
      );

      return folderId;
    },
    [activeWorkspaceId],
  );

  const renameWorkspaceFolder = useCallback(
    (folderId: string, newLabel: string) => {
      const trimmed = newLabel.trim();
      if (!trimmed) return;

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
            !trashedIds.has(item.id),
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
            !trashedIds.has(item.id),
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

  const cancelVideoUpload = cancelMediaUpload;

  const completeMediaUpload = useCallback(
    async (
      details: MediaUploadDetails,
      onProgress?: (progress: { loaded: number; total: number }) => void,
    ) => {
      const current = pendingMediaQueueRef.current[0];
      if (!current) return;

      const trimmedTitle = details.title.trim();
      const trimmedSummary = details.summary?.trim() ?? '';
      if (!trimmedTitle || details.tags.length === 0) return;

      if (current.type !== 'audio' && !details.thumbnail) return;

      const parentFolderId = current.parentFolderId ?? null;

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
        uploadedAssetDto = await uploadMediaFileRequest(
          current.file,
          { durationSeconds: durationSecs },
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
        uploadedBy: CURRENT_USER.name,
        originallyCreatedAt: new Date(current.file.lastModified).toISOString(),
        tags: details.tags,
        ...(parentFolderId ? { parentFolderId } : {}),
        location: details.folderId
          ? { folderId: details.folderId, childLabel: trimmedTitle }
          : null,
        ...(current.type === 'video'
          ? {
              thumbnail: details.thumbnail || uploadedAssetDto?.thumbnail || undefined,
              videoSrc: uploadedAssetDto?.url || current.previewSrc,
              duration: details.duration,
            }
          : {}),
        ...(current.type === 'image' ? { thumbnail: details.thumbnail || uploadedAssetDto?.thumbnail || undefined } : {}),
        ...(current.type === 'audio' && details.duration ? { duration: details.duration } : {}),
      };

      setMediaItems((items) => {
        if (items.some((item) => item.id === newItem.id)) {
          return items;
        }

        const next = [...items, newItem];
        if (!parentFolderId) return next;

        return next.map((item) =>
          item.id === parentFolderId && item.type === 'folder'
            ? { ...item, itemCount: (item.itemCount ?? 0) + 1 }
            : item,
        );
      });

      if (details.folderId) {
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

      if (current.type === 'image') {
        URL.revokeObjectURL(current.previewSrc);
      }

      setPendingMediaQueue((prev) => prev.slice(1));
    },
    [activeWorkspaceId],
  );

  const completeVideoUpload = completeMediaUpload;

  const createRootMediaFolder = useCallback(
    (
      name: string,
      color: string = DEFAULT_FOLDER_COLOR,
      parentFolderId?: string | null,
      projectLocation?: MediaLocation | null,
    ) => {
      const trimmed = name.trim();
      if (!trimmed) return;

      setMediaItems((prev) => {
        let resolvedProjectLocation = projectLocation ?? null;
        if (!resolvedProjectLocation && parentFolderId) {
          const parent = prev.find(
            (item) => item.id === parentFolderId && item.type === 'folder',
          );
          resolvedProjectLocation = parent?.projectLocation ?? null;
        }

        const newItem: MediaItem = {
          id: `media-${Date.now()}`,
          title: trimmed,
          type: 'folder',
          workspaceId: activeWorkspaceId,
          createdAt: new Date().toISOString(),
          sizeBytes: 0,
          storageProvider: 'local',
          itemCount: 0,
          location: null,
          folderColor: color,
          ...(parentFolderId ? { parentFolderId } : {}),
          ...(resolvedProjectLocation ? { projectLocation: resolvedProjectLocation } : {}),
        };

        const next = [...prev, newItem];
        if (!parentFolderId) return next;

        return next.map((item) =>
          item.id === parentFolderId && item.type === 'folder'
            ? { ...item, itemCount: (item.itemCount ?? 0) + 1 }
            : item,
        );
      });
    },
    [activeWorkspaceId],
  );

  const updateMediaProjectLocation = useCallback(
    (mediaId: string, projectLocation: MediaLocation | null) => {
      setMediaItems((prev) =>
        prev.map((item) =>
          item.id === mediaId && item.type === 'folder'
            ? { ...item, projectLocation }
            : item,
        ),
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
  }, []);

  const value = useMemo(
    () => ({
      workspaces,
      activeWorkspaceId,
      activeWorkspace,
      setActiveWorkspaceId,
      updateWorkspaceColor,
      createWorkspace,
      mediaItems,
      rootMediaItems,
      favoriteMediaItems,
      favorites,
      toggleFavorite,
      moveMediaToFolder,
      moveMediaToFolderBulk,
      moveMediaToDashboardFolder,
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
    }),
    [
      workspaces,
      activeWorkspaceId,
      activeWorkspace,
      updateWorkspaceColor,
      createWorkspace,
      mediaItems,
      rootMediaItems,
      favoriteMediaItems,
      favorites,
      toggleFavorite,
      moveMediaToFolder,
      moveMediaToFolderBulk,
      moveMediaToDashboardFolder,
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

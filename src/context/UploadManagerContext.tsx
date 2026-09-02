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
import {
  clearAllStoredUploads,
  getStoredUploads,
  removeUploadFromStorage,
  saveUploadToStorage,
  type StoredUploadItem,
} from '../services/uploadQueueStorage';
import { uploadMediaFileRequest } from '../api';
import type { AiAnalyzeFeature } from '../api/ai.service';
import { extractAudioMetadata, extractImageMetadata } from '../utils/mediaMetadataExtractors';
import toast from 'react-hot-toast';
import { getUsageSummary } from '../api/usage.service';

export interface UploadQueueItem extends StoredUploadItem {
  progressPercent: number;
}

export interface EnqueueUploadOptions {
  ownerType?: string;
  ownerId?: string;
  linkedProjectId?: string;
  parentFolderId?: string | null;
  title?: string;
  summary?: string;
  thumbnail?: string;
  folderId?: string;
  tagIds?: string[];
  visibility?: 'public' | 'private' | string;
  durationSeconds?: number;
  aiFeatures?: AiAnalyzeFeature[];
}

interface UploadManagerContextValue {
  queue: UploadQueueItem[];
  isUploading: boolean;
  activeItem: UploadQueueItem | null;
  totalFiles: number;
  completedCount: number;
  batchLoadedBytes: number;
  batchTotalBytes: number;
  overallProgressPercent: number;
  isWidgetVisible: boolean;
  isMinimized: boolean;
  enqueueFiles: (files: File[], options?: EnqueueUploadOptions) => Promise<void>;
  setIsMinimized: (minimized: boolean | ((prev: boolean) => boolean)) => void;
  dismissWidget: () => void;
  clearCompleted: () => void;
}

const UploadManagerContext = createContext<UploadManagerContextValue | null>(null);

export function UploadManagerProvider({ children }: { children: ReactNode }) {
  const [queue, setQueue] = useState<UploadQueueItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isWidgetVisible, setIsWidgetVisible] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const processingRef = useRef(false);
  const queueRef = useRef<UploadQueueItem[]>([]);
  queueRef.current = queue;

  // Sync stored uploads from IndexedDB on initial mount (resumes after refresh)
  useEffect(() => {
    let mounted = true;

    async function restoreQueueFromStorage() {
      try {
        const stored = await getStoredUploads();
        if (!mounted || stored.length === 0) return;

        const restoredItems: UploadQueueItem[] = stored.map((item) => ({
          ...item,
          status: item.status === 'uploading' ? 'pending' : item.status,
          progressPercent: item.status === 'completed' ? 100 : 0,
        }));

        setQueue(restoredItems);
        setIsWidgetVisible(true);
      } catch (err) {
        console.warn('[UploadManager] Failed to restore upload queue on load:', err);
      }
    }

    void restoreQueueFromStorage();

    return () => {
      mounted = false;
    };
  }, []);

  // Process queue sequentially
  const processQueue = useCallback(async () => {
    if (processingRef.current) return;
    processingRef.current = true;
    setIsUploading(true);

    try {
      while (true) {
        const currentQueue = queueRef.current;
        const pendingItemIndex = currentQueue.findIndex((item) => item.status === 'pending');

        if (pendingItemIndex === -1) {
          break;
        }

        const currentItem = currentQueue[pendingItemIndex];
        const itemId = currentItem.id;

        // Update status to uploading in state and IndexedDB
        setQueue((prev) =>
          prev.map((item) =>
            item.id === itemId ? { ...item, status: 'uploading', loadedBytes: 0, progressPercent: 0 } : item,
          ),
        );

        await saveUploadToStorage({
          ...currentItem,
          status: 'uploading',
          loadedBytes: 0,
        });

        try {
          // Extract metadata for images or audio if available
          let fullTechSpecs: Record<string, any> = {};
          const mime = currentItem.type || '';
          if (mime.startsWith('image/')) {
            try {
              fullTechSpecs = await extractImageMetadata(currentItem.file);
            } catch (exifErr) {
              console.warn('[UploadManager] Could not extract image EXIF:', exifErr);
            }
          } else if (mime.startsWith('audio/')) {
            try {
              fullTechSpecs = await extractAudioMetadata(currentItem.file);
            } catch (audioErr) {
              console.warn('[UploadManager] Could not extract audio specs:', audioErr);
            }
          }

          // Perform actual upload with byte-level progress reporting
          await uploadMediaFileRequest(currentItem.file, {
            title: currentItem.title || currentItem.name.replace(/\.[^/.]+$/, ''),
            summary: currentItem.summary,
            thumbnail: currentItem.thumbnail,
            tagIds: currentItem.tagIds,
            visibility: currentItem.visibility as any,
            durationSeconds: currentItem.durationSeconds,
            technicalSpecs: fullTechSpecs,
            ownerType: currentItem.ownerType || 'WORKSPACE',
            ownerId: currentItem.ownerId,
            linkedProjectId: currentItem.linkedProjectId,
            folderId: currentItem.folderId || currentItem.parentFolderId || undefined,
            aiFeatures: currentItem.aiFeatures,
            onProgress: ({ loaded, total }) => {
              const filePercent = total > 0 ? Math.min(100, Math.round((loaded / total) * 100)) : 0;
              setQueue((prev) =>
                prev.map((item) =>
                  item.id === itemId
                    ? { ...item, loadedBytes: loaded, progressPercent: filePercent }
                    : item,
                ),
              );
            },
          });

          // Mark completed
          setQueue((prev) =>
            prev.map((item) =>
              item.id === itemId
                ? { ...item, status: 'completed', loadedBytes: item.size, progressPercent: 100 }
                : item,
            ),
          );

          // Dispatch event so DashboardContext and active views reload media items instantly
          window.dispatchEvent(new CustomEvent('noah-upload-completed', { detail: { itemId } }));

          // Remove completed from IndexedDB so it won't re-upload on refresh
          await removeUploadFromStorage(itemId);
        } catch (err: any) {
          console.error('[UploadManager] Upload failed for file:', currentItem.name, err);
          const errorMsg = err?.response?.data?.message || err?.message || 'Upload failed';
          toast.error(errorMsg);

          setQueue((prev) =>
            prev.map((item) =>
              item.id === itemId
                ? { ...item, status: 'failed', errorMessage: errorMsg }
                : item,
            ),
          );

          await saveUploadToStorage({
            ...currentItem,
            status: 'failed',
            errorMessage: errorMsg,
          });
        }
      }
    } finally {
      processingRef.current = false;
      setIsUploading(false);
    }
  }, []);

  // Trigger processQueue whenever pending items exist
  useEffect(() => {
    const hasPending = queue.some((item) => item.status === 'pending');
    if (hasPending && !processingRef.current) {
      void processQueue();
    }
  }, [queue, processQueue]);

  const enqueueFiles = useCallback(
    async (files: File[], options?: EnqueueUploadOptions) => {
      if (!files || files.length === 0) return;

      try {
        const summary = await getUsageSummary();
        if (summary.storageWarningLevel === 'exceeded' || summary.storageUsedBytes >= summary.storageQuotaBytes) {
          toast.error('Storage limit reached — Uploads are blocked until you free space or upgrade your plan.');
          return;
        }
      } catch (err) {
        /* proceed if summary fetch fails */
      }

      const newItems: UploadQueueItem[] = files.map((file, idx) => ({
        id: `upload-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 7)}`,
        file,
        name: options?.title || file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
        status: 'pending',
        loadedBytes: 0,
        progressPercent: 0,
        title: options?.title,
        summary: options?.summary,
        thumbnail: options?.thumbnail,
        folderId: options?.folderId,
        tagIds: options?.tagIds,
        visibility: options?.visibility,
        durationSeconds: options?.durationSeconds,
        ownerType: options?.ownerType,
        ownerId: options?.ownerId,
        linkedProjectId: options?.linkedProjectId,
        parentFolderId: options?.parentFolderId,
        aiFeatures: options?.aiFeatures,
        createdAt: Date.now() + idx,
      }));

      // Save to IndexedDB first
      for (const item of newItems) {
        await saveUploadToStorage(item);
      }

      setQueue((prev) => [...prev, ...newItems]);
      setIsWidgetVisible(true);
      setIsMinimized(false);
    },
    [],
  );

  const dismissWidget = useCallback(() => {
    setIsWidgetVisible(false);
    setQueue([]);
    void clearAllStoredUploads();
  }, []);

  const clearCompleted = useCallback(() => {
    setQueue((prev) => prev.filter((item) => item.status !== 'completed' && item.status !== 'failed'));
    void clearAllStoredUploads();
  }, []);

  // Compute calculated values
  const totalFiles = queue.length;
  const completedCount = queue.filter((item) => item.status === 'completed').length;
  const activeItem = queue.find((item) => item.status === 'uploading') || null;

  const batchTotalBytes = useMemo(
    () => queue.reduce((acc, item) => acc + (item.size || 0), 0),
    [queue],
  );

  const batchLoadedBytes = useMemo(
    () =>
      queue.reduce((acc, item) => {
        if (item.status === 'completed') return acc + item.size;
        if (item.status === 'uploading') return acc + (item.loadedBytes || 0);
        return acc;
      }, 0),
    [queue],
  );

  const overallProgressPercent = useMemo(() => {
    if (totalFiles === 0) return 0;
    if (completedCount === totalFiles) return 100;
    if (batchTotalBytes > 0) {
      return Math.min(99, Math.round((batchLoadedBytes / batchTotalBytes) * 100));
    }
    return Math.min(99, Math.round((completedCount / totalFiles) * 100));
  }, [batchLoadedBytes, batchTotalBytes, completedCount, totalFiles]);

  const value = useMemo(
    () => ({
      queue,
      isUploading,
      activeItem,
      totalFiles,
      completedCount,
      batchLoadedBytes,
      batchTotalBytes,
      overallProgressPercent,
      isWidgetVisible,
      isMinimized,
      enqueueFiles,
      setIsMinimized,
      dismissWidget,
      clearCompleted,
    }),
    [
      queue,
      isUploading,
      activeItem,
      totalFiles,
      completedCount,
      batchLoadedBytes,
      batchTotalBytes,
      overallProgressPercent,
      isWidgetVisible,
      isMinimized,
      enqueueFiles,
      dismissWidget,
      clearCompleted,
    ],
  );

  return <UploadManagerContext.Provider value={value}>{children}</UploadManagerContext.Provider>;
}

export function useUploadManager() {
  const context = useContext(UploadManagerContext);
  if (!context) {
    throw new Error('useUploadManager must be used within an UploadManagerProvider');
  }
  return context;
}

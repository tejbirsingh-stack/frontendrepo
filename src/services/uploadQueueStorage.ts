/**
 * Persistent Upload Queue Storage using browser IndexedDB.
 * Retains file blobs and metadata so uploads can continue/resume across page refreshes.
 */

export interface StoredUploadItem {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  status: 'pending' | 'uploading' | 'completed' | 'failed';
  loadedBytes: number;
  title?: string;
  summary?: string;
  thumbnail?: string;
  folderId?: string;
  tagIds?: string[];
  visibility?: 'public' | 'private' | string;
  durationSeconds?: number;
  ownerType?: string;
  ownerId?: string;
  linkedProjectId?: string;
  parentFolderId?: string | null;
  errorMessage?: string;
  createdAt: number;
}

const DB_NAME = 'noah_upload_db';
const DB_VERSION = 1;
const STORE_NAME = 'upload_queue';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this environment.'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Failed to open IndexedDB'));
  });
}

export async function saveUploadToStorage(item: StoredUploadItem): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(item);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[uploadQueueStorage] Failed to save upload item to IndexedDB:', err);
  }
}

export async function getStoredUploads(): Promise<StoredUploadItem[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => {
        const results: StoredUploadItem[] = req.result || [];
        results.sort((a, b) => a.createdAt - b.createdAt);
        resolve(results);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[uploadQueueStorage] Failed to fetch stored uploads from IndexedDB:', err);
    return [];
  }
}

export async function removeUploadFromStorage(id: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[uploadQueueStorage] Failed to remove upload item from IndexedDB:', err);
  }
}

export async function clearAllStoredUploads(): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[uploadQueueStorage] Failed to clear IndexedDB upload queue:', err);
  }
}

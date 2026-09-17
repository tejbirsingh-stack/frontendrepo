/** IndexedDB helpers for persisting File objects across the Stripe redirect during signup. */

const DB_NAME = 'noah_signup';
const STORE_NAME = 'pending_files';
const FILE_KEY = 'signup_files';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE_NAME);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/** Persist an array of File objects to IndexedDB. Overwrites any existing entry. */
export async function saveFilesToIDB(files: File[]): Promise<void> {
  if (!files || files.length === 0) return;
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(files, FILE_KEY);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

/** Retrieve previously stored File objects. Returns an empty array if none found. */
export async function loadFilesFromIDB(): Promise<File[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).get(FILE_KEY);
    req.onsuccess = () => { db.close(); resolve((req.result as File[]) || []); };
    req.onerror = () => { db.close(); reject(req.error); };
  });
}

/** Remove the stored files entry after a successful signup. */
export async function clearFilesFromIDB(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(FILE_KEY);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

const STORAGE_KEY = 'noah-media-trash';

export type TrashedMediaRecord = Record<string, string>;

export function loadTrashedMedia(): TrashedMediaRecord {
  if (typeof window === 'undefined') return {};

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};

    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};

    const record: TrashedMediaRecord = {};
    Object.entries(parsed).forEach(([id, deletedAt]) => {
      if (typeof id === 'string' && typeof deletedAt === 'string' && deletedAt.length > 0) {
        record[id] = deletedAt;
      }
    });
    return record;
  } catch {
    return {};
  }
}

export function saveTrashedMedia(record: TrashedMediaRecord) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
}

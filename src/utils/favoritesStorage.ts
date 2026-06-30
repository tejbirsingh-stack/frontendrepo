const STORAGE_KEY = 'noah-media-favorites';

export function loadFavoriteMediaIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();

    return new Set(parsed.filter((id): id is string => typeof id === 'string' && id.length > 0));
  } catch {
    return new Set();
  }
}

export function saveFavoriteMediaIds(favoriteIds: Set<string>) {
  if (typeof window === 'undefined') return;

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...favoriteIds]));
}

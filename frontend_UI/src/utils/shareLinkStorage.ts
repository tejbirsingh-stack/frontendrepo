import type { ShareLink, ShareVisibility } from '../types/shareLink';

const STORAGE_PREFIX = 'noah-share-links:';

export function generateShareToken(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID().replace(/-/g, '').slice(0, 9);
  }
  return Math.random().toString(36).slice(2, 11);
}

export function buildShareLinkUrl(token: string): string {
  return `https://f.io/${token}`;
}

export function loadShareLinks(mediaId: string): ShareLink[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(`${STORAGE_PREFIX}${mediaId}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ShareLink[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveShareLinks(mediaId: string, links: ShareLink[]): void {
  try {
    window.localStorage.setItem(`${STORAGE_PREFIX}${mediaId}`, JSON.stringify(links));
  } catch {
    // Ignore storage errors.
  }
}

export function addShareLink(mediaId: string, link: ShareLink): ShareLink[] {
  const existing = loadShareLinks(mediaId);
  const next = [link, ...existing];
  saveShareLinks(mediaId, next);
  return next;
}

export function removeShareLink(mediaId: string, linkId: string): ShareLink[] {
  const next = loadShareLinks(mediaId).filter((link) => link.id !== linkId);
  saveShareLinks(mediaId, next);
  return next;
}

export function updateShareLink(
  mediaId: string,
  linkId: string,
  patch: Partial<Pick<ShareLink, 'name' | 'url' | 'visibility'>>,
): ShareLink[] {
  const next = loadShareLinks(mediaId).map((link) =>
    link.id === linkId ? { ...link, ...patch } : link,
  );
  saveShareLinks(mediaId, next);
  return next;
}

export function createShareLinkForMedia(
  mediaId: string,
  name: string,
  visibility: ShareVisibility = 'public',
): ShareLink {
  const token = generateShareToken();
  return {
    id: token,
    mediaId,
    name,
    url: buildShareLinkUrl(token),
    visibility,
    createdAt: Date.now(),
  };
}

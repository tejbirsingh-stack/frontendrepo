import type { ShareLink } from '../types/shareLink';
import { getShareLinksApi, createShareLinkApi, deleteShareLinkApi } from '../api/share.service';

export function buildShareLinkUrl(token: string): string {
  const appBase = window.location.origin;
  return `${appBase}/s/${token}`;
}

export async function fetchShareLinks(mediaId: string): Promise<ShareLink[]> {
  if (!mediaId) return [];
  try {
    const res = await getShareLinksApi(mediaId);
    if (!res || !res.data) return [];
    return res.data.map((item) => ({
      id: item.id,
      mediaId: item.assetId,
      name: item.token ? `share-${item.token.slice(0, 6)}` : 'Share Link',
      url: item.url || buildShareLinkUrl(item.token),
      visibility: 'public',
      createdAt: new Date(item.createdAt).getTime(),
      expiresAt: item.expiresAt,
      permissions: item.permissions,
      hasPassword: item.hasPassword,
      recipients: item.recipients,
    }));
  } catch (error) {
    console.error('Failed to fetch share links:', error);
    return [];
  }
}

export async function createShareLinkAsync(
  mediaId: string,
  options?: {
    email?: string;
    password?: string;
    expiresInDays?: number;
    expiresAt?: string;
    permissions?: { view: boolean; comment: boolean; download: boolean; downloadProxy: boolean };
  }
): Promise<ShareLink | null> {
  try {
    const res = await createShareLinkApi(mediaId, {
      mode: options?.email ? 'email' : 'link',
      email: options?.email,
      password: options?.password,
      expiresInDays: options?.expiresInDays,
      expiresAt: options?.expiresAt,
      permissions: options?.permissions,
    });
    if (!res || !res.shareLink) return null;
    const item = res.shareLink;
    return {
      id: item.id,
      mediaId: item.assetId,
      name: item.token ? `share-${item.token.slice(0, 6)}` : 'Share Link',
      url: item.url || buildShareLinkUrl(item.token),
      visibility: 'public',
      createdAt: new Date().getTime(),
      expiresAt: item.expiresAt,
      permissions: item.permissions,
      hasPassword: item.hasPassword,
    };
  } catch (error) {
    console.error('Failed to create share link:', error);
    return null;
  }
}

export async function revokeShareLinkAsync(linkId: string): Promise<boolean> {
  try {
    const res = await deleteShareLinkApi(linkId);
    return Boolean(res?.success);
  } catch {
    return false;
  }
}

// Synchronous legacy fallback helpers for backward compatibility
export function loadShareLinks(mediaId: string): ShareLink[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(`noah-share-links:${mediaId}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ShareLink[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveShareLinks(mediaId: string, links: ShareLink[]): void {
  try {
    window.localStorage.setItem(`noah-share-links:${mediaId}`, JSON.stringify(links));
  } catch {
    // Ignore
  }
}

export function generateShareToken(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID().replace(/-/g, '').slice(0, 9);
  }
  return Math.random().toString(36).slice(2, 11);
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
  visibility: any = 'public',
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


import type { ShareLink } from '../types/shareLink';
import { getShareLinksApi, createShareLinkApi, deleteShareLinkApi } from '../api/share.service';

import { env } from '../config/env';

export function buildShareLinkUrl(token: string, visibility: string = 'public'): string {
  const appBase = window.location.origin;
  return `${appBase}/s/${token}`;
}

export async function fetchShareLinks(mediaId: string): Promise<ShareLink[]> {
  try {
    const res = await getShareLinksApi(mediaId);
    // apiRequest automatically unwraps payload.data, so res is the array itself
    const data = Array.isArray(res) ? res : (res as any)?.data;
    if (!data || !Array.isArray(data)) return [];
    
    return data.map((item: any) => ({
      id: item.id,
      mediaId: item.assetId,
      name: item.name || (item.token ? `share-${item.token.slice(0, 6)}` : 'Share Link'),
      url: buildShareLinkUrl(item.token, item.visibility),
      visibility: (item.visibility as 'public' | 'private') || 'public',
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
    name?: string;
    visibility?: any;
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
      name: options?.name,
      visibility: options?.visibility,
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
      name: item.name || (item.token ? `share-${item.token.slice(0, 6)}` : 'Share Link'),
      url: buildShareLinkUrl(item.token, item.visibility || options?.visibility),
      visibility: (item.visibility as 'public' | 'private') || 'public',
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

export async function updateShareLinkAsync(
  linkId: string,
  patch: Partial<{ name: string; visibility: string; permissions: Record<string, any> }>
): Promise<boolean> {
  try {
    const { updateShareLinkApi } = await import('../api/share.service');
    const res = await updateShareLinkApi(linkId, patch);
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
    url: buildShareLinkUrl(token, 'private'),
    visibility,
    createdAt: Date.now(),
  };
}


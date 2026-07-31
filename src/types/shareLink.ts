export type ShareVisibility = 'public' | 'private';

export interface ShareLink {
  id: string;
  mediaId: string;
  name: string;
  url: string;
  visibility: ShareVisibility;
  createdAt: number;
  expiresAt?: string;
  permissions?: { view: boolean; comment: boolean; download: boolean; downloadProxy: boolean };
  hasPassword?: boolean;
  recipients?: Array<{ id: string; email: string; accessCount: number; lastAccessedAt?: string; sentAt: string }>;
}

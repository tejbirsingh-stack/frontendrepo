export type ShareVisibility = 'public' | 'private';

export interface ShareLink {
  id: string;
  mediaId: string;
  name: string;
  url: string;
  visibility: ShareVisibility;
  createdAt: number;
}

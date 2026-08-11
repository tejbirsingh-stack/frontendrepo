import { apiClient } from './client';
import type { MediaItem } from '../data/mockMedia';

export type LibraryViewParam =
  | 'all' | 'favorites' | 'duplicates' | 'shared'
  | 'projects' | 'folder' | 'project';

export interface LibraryListParams {
  workspaceId?: string;
  view: LibraryViewParam;
  folderId?: string;
  projectId?: string;
  pageSize?: number;
  pageToken?: string | null;
  q?: string;
  mediaType?: string;
  dateRange?: string;
  dateFrom?: string;
  dateTo?: string;
  tagIds?: string[];
  aiTags?: string[];
  /** File review status filter; `all` or a FileReviewStatus value */
  reviewStatus?: string;
  sortBy?: 'date' | 'name' | 'size' | 'type';
  sortOrder?: 'asc' | 'desc';
}

export interface LibraryListResponse {
  items: MediaItem[];
  nextPageToken: string | null;
  pageSize: number;
  total?: number;
}

export async function getLibraryItems(
  params: LibraryListParams,
): Promise<LibraryListResponse> {
  const { tagIds, aiTags, pageToken, ...rest } = params;
  
  // Format array params as comma-separated strings for query
  const queryParams: Record<string, any> = {
    ...rest,
    pageSize: rest.pageSize ?? 48,
    pageToken: pageToken || undefined,
  };

  if (tagIds && tagIds.length > 0) {
    queryParams.tagIds = tagIds.join(',');
  }
  
  if (aiTags && aiTags.length > 0) {
    queryParams.aiTags = aiTags.join(',');
  }

  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(queryParams)) {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  }

  const data = await apiClient.get<LibraryListResponse>(`/library/items?${searchParams.toString()}`);
  
  return data;
}

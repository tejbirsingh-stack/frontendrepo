import { apiClient } from './client';

export interface ToggleFavoriteDto {
  type: 'asset' | 'folder' | 'project';
  id: string;
}

export const toggleFavoriteRequest = async (data: ToggleFavoriteDto) => {
  return await apiClient.post('/favorites/toggle', data);
};

export const getFavoritesRequest = async (workspaceId?: string) => {
  const url = workspaceId ? `/favorites?workspaceId=${workspaceId}` : '/favorites';
  return await apiClient.get<any[]>(url);
};

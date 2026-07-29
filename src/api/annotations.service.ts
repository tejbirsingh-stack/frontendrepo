import { apiClient } from './client';

export interface BackendAnnotation {
  id: string;
  parentId: string | null;
  type: string;
  data: any;
  videoTimestamp: number | null;
  resolved: boolean;
  createdAt: string;
  updatedAt: string;
}

export async function getMediaAnnotationsRequest(mediaId: string): Promise<{ success: boolean; annotations: BackendAnnotation[] }> {
  return apiClient.get<{ success: boolean; annotations: BackendAnnotation[] }>(`/annotations/media/${mediaId}`);
}

export async function saveMediaAnnotationRequest(
  mediaId: string,
  payload: { id?: string; type: string; data: any; videoTimestamp?: number | null; parentId?: string | null }
): Promise<{ success: boolean; annotations: BackendAnnotation }> {
  return apiClient.post<{ success: boolean; annotations: BackendAnnotation }>(`/annotations/media/${mediaId}`, payload);
}

export async function updateMediaAnnotationRequest(
  annotationId: string,
  payload: { data?: any; videoTimestamp?: number | null; resolved?: boolean }
): Promise<{ success: boolean; annotations: BackendAnnotation }> {
  return apiClient.put<{ success: boolean; annotations: BackendAnnotation }>(`/annotations/${annotationId}`, payload);
}

export async function deleteMediaAnnotationRequest(
  annotationId: string
): Promise<{ success: boolean; message: string }> {
  return apiClient.delete<{ success: boolean; message: string }>(`/annotations/${annotationId}`);
}

export interface BackendAnnotationGroup {
  id: string;
  name: string;
  createdAt: number;
  memberIds: string[];
}

export async function getAnnotationGroupsRequest(mediaId: string): Promise<BackendAnnotationGroup[]> {
  return apiClient.get<BackendAnnotationGroup[]>(`/annotations/media/${mediaId}/groups`);
}

export async function createAnnotationGroupRequest(
  mediaId: string,
  name: string,
  memberIds: string[]
): Promise<BackendAnnotationGroup> {
  return apiClient.post<BackendAnnotationGroup>(`/annotations/media/${mediaId}/groups`, { name, memberIds });
}

export async function deleteAnnotationGroupRequest(
  mediaId: string,
  groupId: string
): Promise<{ success: boolean }> {
  return apiClient.delete<{ success: boolean }>(`/annotations/media/${mediaId}/groups/${groupId}`);
}

export async function updateAnnotationGroupRequest(
  mediaId: string,
  groupId: string,
  name: string,
  memberIds: string[]
): Promise<BackendAnnotationGroup> {
  return apiClient.put<BackendAnnotationGroup>(`/annotations/media/${mediaId}/groups/${groupId}`, { name, memberIds });
}

import { apiClient as client } from './client';

export interface UserGroup {
  id: string;
  name: string;
  description: string;
  orgId: string;
  createdById: string | null;
  createdAt: string;
  updatedAt: string;
  members: UserGroupMember[];
  createdBy?: { name: string };
}

export interface UserGroupMember {
  groupId: string;
  userId: string;
  addedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export const fetchUserGroups = async (): Promise<UserGroup[]> => {
  const data = await client.get<UserGroup[]>('/user-groups');
  return data;
};

export const createUserGroup = async (data: { name: string; description: string; memberIds: string[] }): Promise<UserGroup> => {
  const response = await client.post<UserGroup>('/user-groups', data);
  return response;
};

export const updateUserGroup = async (id: string, data: { name: string; description: string; memberIds: string[] }): Promise<UserGroup> => {
  const response = await client.put<UserGroup>(`/user-groups/${id}`, data);
  return response;
};

export const deleteUserGroup = async (id: string): Promise<void> => {
  await client.delete(`/user-groups/${id}`);
};

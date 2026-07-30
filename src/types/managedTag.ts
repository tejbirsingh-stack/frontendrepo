export type TagScope = 'personal' | 'company' | 'project';

export interface ManagedTag {
  id: string;
  name: string;
  scope: TagScope;
  workspaceId: string | null;
  color: string;
  parentId: string | null;
  parentName?: string | null;
  ancestors?: Array<{ id: string; name: string; color: string; scope: string }>;
  createdAt: string;
}

export interface CreateManagedTagInput {
  name: string;
  scope: TagScope;
  workspaceId: string | null;
  parentId?: string | null;
  /** @deprecated Ignored — color is derived from tag category settings. */
  color?: string;
}

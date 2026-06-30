export type TagScope = 'personal' | 'company' | 'project';

export interface ManagedTag {
  id: string;
  name: string;
  scope: TagScope;
  workspaceId: string | null;
  color: string;
  createdAt: string;
}

export interface CreateManagedTagInput {
  name: string;
  scope: TagScope;
  workspaceId: string | null;
  /** @deprecated Ignored — color is derived from tag category settings. */
  color?: string;
}

export interface MediaCollaborator {
  id: string;
  name: string;
  email?: string;
  initials: string;
  avatarUrl?: string;
  avatarColor?: string;
  isCurrentUser?: boolean;
  role?: string;
  hasOverride?: boolean;
  groupId?: string;
}

export const USER_ROLES = [
  'Super Admin',
  'Admin',
  'Editor',
  'Collaborator',
  'Viewer',
] as const;

export type UserRole = (typeof USER_ROLES)[number];

/** Highest privilege first. */
export const USER_ROLE_HIERARCHY: UserRole[] = [...USER_ROLES];

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  'Super Admin': 'Super Admin',
  Admin: 'Admin',
  Editor: 'Editor',
  Collaborator: 'Collaborator',
  Viewer: 'Viewer',
};

export const USER_ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  'Super Admin': 'Full account control, billing, workspaces, and security.',
  Admin: 'Manage users, projects, branding, and share settings.',
  Editor: 'Create, edit, and organize media within assigned projects.',
  Collaborator: 'Comment, review, and contribute to shared projects.',
  Viewer: 'View-only access to shared media and review links.',
};

export function isUserRole(value: string): value is UserRole {
  return USER_ROLES.includes(value as UserRole);
}

export function compareUserRoleRank(a: UserRole, b: UserRole): number {
  return USER_ROLE_HIERARCHY.indexOf(a) - USER_ROLE_HIERARCHY.indexOf(b);
}

export function hasMinimumRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return compareUserRoleRank(userRole, requiredRole) <= 0;
}

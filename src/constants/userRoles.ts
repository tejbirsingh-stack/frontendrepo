export const USER_ROLES = [
  'Super Admin',
  'Admin',
  'Editor',
  'Collaborator',
  'Viewer',
] as const;

export const ROLE_IDS = {
  SYSTEM_ADMIN: '350c047a-60a1-4a84-8bdb-79748e9a906e',
  ADMIN: '88a6b2a1-b2f6-40d5-8b04-4abf7eb45401',
  EDITOR: '93cd195e-dd2a-45b7-965d-cab2d1423784',
  SUPER_ADMIN: '996cc56f-8823-4b6f-bcb9-76b2c1f2dd15',
  VIEWER: 'c3c36ad8-dc0a-464b-998b-a0847087fcd0',
  COLLABORATOR: 'ffeec394-0e40-49e1-aed3-61962118d73e',
} as const;

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

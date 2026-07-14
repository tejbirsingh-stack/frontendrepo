import type { UserRole } from './userRoles';

export const CURRENT_USER = {
  id: 'u1',
  name: 'Aviral Kataria',
  initials: 'AK',
  email: 'aviral.kataria@mtxb2b.com',
  role: 'Super Admin' as UserRole,
  accountName: "Aviral's Account",
  accountInitials: 'AK',
  avatarUrl: '/aviral-kataria.png',
};

export function isCurrentUserIdentity(name?: string, email?: string, isCurrentUser?: boolean) {
  if (isCurrentUser) return true;
  if (name === CURRENT_USER.name) return true;
  if (email?.trim().toLowerCase() === CURRENT_USER.email.toLowerCase()) return true;
  return false;
}

export function withCurrentUserProfile<
  T extends {
    name: string;
    email?: string;
    avatarUrl?: string;
    initials?: string;
    isCurrentUser?: boolean;
  },
>(person: T): T {
  if (!isCurrentUserIdentity(person.name, person.email, person.isCurrentUser)) {
    return person;
  }

  return {
    ...person,
    name: CURRENT_USER.name,
    avatarUrl: CURRENT_USER.avatarUrl,
    initials: CURRENT_USER.initials,
    isCurrentUser: true,
  };
}

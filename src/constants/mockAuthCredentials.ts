import type { UserRole } from './userRoles';

export interface MockAuthAccount {
  email: string;
  password: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    initials: string;
    avatarUrl?: string;
    accountName: string;
    accountInitials: string;
  };
}

const REGISTERED_ACCOUNTS_KEY = 'noah.auth.registered-users';

/** Local development credentials used when VITE_API_BASE_URL is not configured. */
export const MOCK_AUTH_ACCOUNTS: MockAuthAccount[] = [
  {
    email: 'aviral.kataria@mtxb2b.com',
    password: 'Noah@2026!',
    user: {
      id: 'user-aviral-kataria',
      name: 'Aviral Kataria',
      email: 'aviral.kataria@mtxb2b.com',
      role: 'Super Admin',
      initials: 'AK',
      avatarUrl: '/aviral-kataria.png',
      accountName: "Aviral's Account",
      accountInitials: 'AK',
    },
  },
];

function readRegisteredAccounts(): MockAuthAccount[] {
  try {
    const raw = localStorage.getItem(REGISTERED_ACCOUNTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as MockAuthAccount[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeRegisteredAccounts(accounts: MockAuthAccount[]): void {
  localStorage.setItem(REGISTERED_ACCOUNTS_KEY, JSON.stringify(accounts));
}

export function getAllMockAuthAccounts(): MockAuthAccount[] {
  return [...MOCK_AUTH_ACCOUNTS, ...readRegisteredAccounts()];
}

export function findMockAuthAccount(email: string, password: string): MockAuthAccount | null {
  const normalizedEmail = email.trim().toLowerCase();
  return (
    getAllMockAuthAccounts().find(
      (account) =>
        account.email.toLowerCase() === normalizedEmail && account.password === password,
    ) ?? null
  );
}

export function mockAuthEmailExists(email: string): boolean {
  const normalizedEmail = email.trim().toLowerCase();
  return getAllMockAuthAccounts().some(
    (account) => account.email.toLowerCase() === normalizedEmail,
  );
}

export function registerMockAuthAccount(account: MockAuthAccount): void {
  if (mockAuthEmailExists(account.email)) {
    throw new Error('An account with this email already exists.');
  }

  const registered = readRegisteredAccounts();
  writeRegisteredAccounts([...registered, account]);
}

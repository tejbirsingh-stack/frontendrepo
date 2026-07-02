import type { AuthSessionUser } from './types';

const SESSION_TOKEN_KEY = 'noah_session_token';
const SESSION_USER_KEY = 'noah_session_user';
const REMEMBER_ME_KEY = 'noah.auth.remember';

export function persistSession(
  token: string,
  user: AuthSessionUser,
  rememberMe: boolean,
): void {
  sessionStorage.removeItem(SESSION_TOKEN_KEY);
  localStorage.removeItem(SESSION_TOKEN_KEY);
  sessionStorage.removeItem(SESSION_USER_KEY);
  localStorage.removeItem(SESSION_USER_KEY);

  const storage = rememberMe ? localStorage : sessionStorage;
  storage.setItem(SESSION_TOKEN_KEY, token);
  storage.setItem(SESSION_USER_KEY, JSON.stringify(user));

  if (rememberMe) {
    localStorage.setItem(REMEMBER_ME_KEY, '1');
  } else {
    localStorage.removeItem(REMEMBER_ME_KEY);
  }
}

export function readPersistedSessionToken(): string | null {
  return sessionStorage.getItem(SESSION_TOKEN_KEY) ?? localStorage.getItem(SESSION_TOKEN_KEY);
}

export function readPersistedSessionUser(): AuthSessionUser | null {
  const raw =
    sessionStorage.getItem(SESSION_USER_KEY) ?? localStorage.getItem(SESSION_USER_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AuthSessionUser;
  } catch {
    return null;
  }
}

export function clearPersistedSession(): void {
  sessionStorage.removeItem(SESSION_TOKEN_KEY);
  localStorage.removeItem(SESSION_TOKEN_KEY);
  sessionStorage.removeItem(SESSION_USER_KEY);
  localStorage.removeItem(SESSION_USER_KEY);
  localStorage.removeItem(REMEMBER_ME_KEY);
}

export function isRememberMeEnabled(): boolean {
  return localStorage.getItem(REMEMBER_ME_KEY) === '1';
}

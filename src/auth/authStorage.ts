import type { AuthSessionUser } from './types';

const SESSION_TOKEN_KEY = 'noah_session_token';
const SESSION_USER_KEY = 'noah_session_user';


export function persistSession(token: string, user?: AuthSessionUser | null, _rememberMe?: boolean): void {
  localStorage.setItem(SESSION_TOKEN_KEY, token);
  if (user) {
    localStorage.setItem(SESSION_USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(SESSION_USER_KEY);
  }
}

export function readPersistedSessionToken(): string | null {
  return localStorage.getItem(SESSION_TOKEN_KEY);
}

export function readPersistedSessionUser(): AuthSessionUser | null {
  const raw = localStorage.getItem(SESSION_USER_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AuthSessionUser;
  } catch {
    return null;
  }
}

export function clearPersistedSession(): void {
  localStorage.removeItem(SESSION_TOKEN_KEY);
  localStorage.removeItem(SESSION_USER_KEY);
}


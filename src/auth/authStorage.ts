import type { AuthSessionUser } from './types';

const SESSION_TOKEN_KEY = 'noah_session_token';
const SESSION_USER_KEY = 'noah_session_user';


export function persistSession(token: string, _user?: AuthSessionUser | null, _rememberMe?: boolean): void {
  localStorage.setItem(SESSION_TOKEN_KEY, token);
  localStorage.removeItem(SESSION_USER_KEY);
  localStorage.removeItem('response');
}

export function readPersistedSessionToken(): string | null {
  return localStorage.getItem(SESSION_TOKEN_KEY);
}

export function readPersistedSessionUser(): AuthSessionUser | null {
  localStorage.removeItem(SESSION_USER_KEY);
  return null;
}

export function clearPersistedSession(): void {
  localStorage.removeItem(SESSION_TOKEN_KEY);
  localStorage.removeItem(SESSION_USER_KEY);
  localStorage.removeItem('response');
}

export function persistSignupSessionToken(token: string): void {
  localStorage.setItem(SESSION_TOKEN_KEY, token);
  localStorage.removeItem(SESSION_USER_KEY);
  localStorage.removeItem('response');
}


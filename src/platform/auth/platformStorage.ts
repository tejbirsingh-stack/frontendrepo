const PLATFORM_TOKEN_KEY = 'noah_platform_token';
const PLATFORM_ADMIN_KEY = 'noah_platform_admin';

export type PlatformAdmin = {
  id: string;
  email: string;
  name?: string | null;
  status: string;
};

export function persistPlatformSession(token: string, admin: PlatformAdmin): void {
  localStorage.setItem(PLATFORM_TOKEN_KEY, token);
  localStorage.setItem(PLATFORM_ADMIN_KEY, JSON.stringify(admin));
}

export function readPlatformToken(): string | null {
  return localStorage.getItem(PLATFORM_TOKEN_KEY);
}

export function readPlatformAdmin(): PlatformAdmin | null {
  const raw = localStorage.getItem(PLATFORM_ADMIN_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PlatformAdmin;
  } catch {
    return null;
  }
}

export function clearPlatformSession(): void {
  localStorage.removeItem(PLATFORM_TOKEN_KEY);
  localStorage.removeItem(PLATFORM_ADMIN_KEY);
}

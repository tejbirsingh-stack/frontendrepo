import { env } from '../../config/env';
import { clearPlatformSession, readPlatformToken } from '../auth/platformStorage';

function resolveUrl(path: string): string {
  const base = (env.apiBaseUrl || '/api').replace(/\/$/, '');
  let normalized = path.startsWith('/') ? path : `/${path}`;
  if (base.endsWith('/api') && normalized.startsWith('/api/')) {
    normalized = normalized.slice(4);
  }
  return `${base}${normalized}`;
}

export class PlatformApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function platformRequest<T>(
  path: string,
  options: RequestInit & { skipAuth?: boolean } = {},
): Promise<T> {
  const { skipAuth, headers, ...rest } = options;
  const requestHeaders = new Headers(headers);
  requestHeaders.set('Accept', 'application/json');
  if (rest.body && !requestHeaders.has('Content-Type')) {
    requestHeaders.set('Content-Type', 'application/json');
  }

  if (!skipAuth) {
    const token = readPlatformToken();
    if (token) requestHeaders.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(resolveUrl(path), {
    ...rest,
    headers: requestHeaders,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401) clearPlatformSession();
    throw new PlatformApiError(
      (data as { message?: string })?.message || 'Platform request failed',
      response.status,
    );
  }
  return data as T;
}

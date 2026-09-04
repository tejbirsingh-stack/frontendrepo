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
  data: any;
  requiresMfa?: boolean;
  mfaType?: string;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
    if (data && typeof data === 'object' && data.requiresMfa) {
      this.requiresMfa = true;
      this.mfaType = data.mfaType;
    }
  }
}

export async function platformRequest<T>(
  path: string,
  options: RequestInit & { skipAuth?: boolean } = {},
): Promise<T> {
  const { skipAuth, headers, ...rest } = options;
  const requestHeaders = new Headers(headers);
  requestHeaders.set('Accept', 'application/json');
  if (
    rest.body &&
    !(typeof FormData !== 'undefined' && rest.body instanceof FormData) &&
    !requestHeaders.has('Content-Type')
  ) {
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
    if (response.status === 401 && !data?.requiresMfa) clearPlatformSession();
    throw new PlatformApiError(
      (data as { message?: string })?.message || 'Platform request failed',
      response.status,
      data,
    );
  }
  return data as T;
}

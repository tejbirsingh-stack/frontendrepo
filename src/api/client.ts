import { getAccessToken, setAccessToken, handleUnauthorized } from '../auth/authTokenBridge';
import { env } from '../config/env';
import { ApiError, type ApiRequestOptions, type ApiResponse } from './types';

function resolveUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  const base = (env.apiBaseUrl || '/api').replace(/\/$/, '');
  let normalizedPath = path.startsWith('/') ? path : `/${path}`;
  if (base.endsWith('/api') && normalizedPath.startsWith('/api/')) {
    normalizedPath = normalizedPath.slice(4);
  }
  return `${base}${normalizedPath}`;
}

function mapStatusToCode(status: number): ApiError['code'] {
  if (status === 401) return 'UNAUTHORIZED';
  if (status === 403) return 'FORBIDDEN';
  if (status === 404) return 'NOT_FOUND';
  if (status === 400 || status === 422) return 'VALIDATION_ERROR';
  return 'UNKNOWN';
}


let isRefreshing = false;
let failedQueue: Array<{ resolve: (value?: unknown) => void; reject: (reason?: any) => void }> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

async function parseResponseBody(response: Response): Promise<unknown> {

  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    return response.json();
  }
  const text = await response.text();
  return text.length > 0 ? text : null;
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { body, skipAuth = false, timeoutMs = env.apiTimeoutMs, headers, ...rest } = options;
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  const requestHeaders = new Headers(headers);
  requestHeaders.set('Accept', 'application/json');

  if (body !== undefined) {
    requestHeaders.set('Content-Type', 'application/json');
  }

  if (!skipAuth) {
    const token = getAccessToken();
    if (token) {
      requestHeaders.set('Authorization', `Bearer ${token}`);
    }
  }


  try {
    let response = await fetch(resolveUrl(path), {
      ...rest,
      headers: requestHeaders,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
      credentials: 'include',
    });

    let payload = await parseResponseBody(response);

    if (response.status === 401 && !path.includes('/auth/login') && !path.includes('/auth/refresh') && !path.includes('/auth/logout')) {
      if (isRefreshing) {
        try {
          const token = await new Promise<string | null>((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          });
          if (token) {
            requestHeaders.set('Authorization', `Bearer ${token}`);
            response = await fetch(resolveUrl(path), {
              ...rest,
              headers: requestHeaders,
              body: body === undefined ? undefined : JSON.stringify(body),
              signal: controller.signal,
              credentials: 'include',
            });
            payload = await parseResponseBody(response);
          }
        } catch (err) {
          throw new ApiError('Request failed during token refresh', 401, 'UNAUTHORIZED');
        }
      } else {
        isRefreshing = true;
        try {
          // Attempt to refresh the token
          const refreshRes = await fetch(resolveUrl('/auth/refresh'), {
            method: 'POST',
            headers: { 'Accept': 'application/json' },
            credentials: 'include',
          });
          const refreshPayload: any = await parseResponseBody(refreshRes);

          if (refreshRes.ok && refreshPayload?.success && refreshPayload?.accessToken) {
            const newToken = refreshPayload.accessToken;
            setAccessToken(newToken);
            processQueue(null, newToken);

            requestHeaders.set('Authorization', `Bearer ${newToken}`);
            response = await fetch(resolveUrl(path), {
              ...rest,
              headers: requestHeaders,
              body: body === undefined ? undefined : JSON.stringify(body),
              signal: controller.signal,
              credentials: 'include',
            });
            payload = await parseResponseBody(response);
          } else {
            throw new Error('Refresh failed');
          }
        } catch (refreshErr) {
          processQueue(refreshErr as Error, null);
          handleUnauthorized();
          throw new ApiError('Unauthorized', 401, 'UNAUTHORIZED');
        } finally {
          isRefreshing = false;
        }
      }
    }

    if (!response.ok) {

      const code = mapStatusToCode(response.status);
      if (
        (response.status === 401 && !path.includes('/auth/logout')) ||
        (response.status === 403 && path.includes('/auth/me')) ||
        (response.status === 404 && path.includes('/auth/me'))
      ) {
        handleUnauthorized();
      }
      const message =
        typeof payload === 'object' &&
        payload !== null &&
        'message' in payload &&
        typeof (payload as { message: unknown }).message === 'string'
          ? (payload as { message: string }).message
          : `Request failed with status ${response.status}`;

      throw new ApiError(message, response.status, code, payload);
    }

    if (payload && typeof payload === 'object' && 'data' in payload) {
      return (payload as ApiResponse<T>).data;
    }

    return payload as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError('Request timed out', 0, 'TIMEOUT');
    }
    throw new ApiError(
      error instanceof Error ? error.message : 'Network request failed',
      0,
      'NETWORK_ERROR',
    );
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export const apiClient = {
  get: <T>(path: string, options?: Omit<ApiRequestOptions, 'method' | 'body'>) =>
    apiRequest<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: Omit<ApiRequestOptions, 'method' | 'body'>) =>
    apiRequest<T>(path, { ...options, method: 'POST', body }),
  put: <T>(path: string, body?: unknown, options?: Omit<ApiRequestOptions, 'method' | 'body'>) =>
    apiRequest<T>(path, { ...options, method: 'PUT', body }),
  patch: <T>(path: string, body?: unknown, options?: Omit<ApiRequestOptions, 'method' | 'body'>) =>
    apiRequest<T>(path, { ...options, method: 'PATCH', body }),
  delete: <T>(path: string, options?: Omit<ApiRequestOptions, 'method'>) =>
    apiRequest<T>(path, { ...options, method: 'DELETE' }),
};

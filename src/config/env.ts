function readEnv(key: keyof ImportMetaEnv, fallback = ''): string {
  const value = import.meta.env[key];
  return typeof value === 'string' && value.length > 0 ? value : fallback;
}

function readPositiveInt(value: string, fallback: number): number {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function normalizeApiBaseUrl(url: string): string {
  if (!url) return '';
  const trimmed = url.replace(/\/$/, '');
  // If VITE_API_BASE_URL is set to a domain like https://qa.noahcloud.ai without /api, automatically append /api
  if (trimmed && !trimmed.endsWith('/api')) {
    return `${trimmed}/api`;
  }
  return trimmed;
}

export const env = {
  apiBaseUrl: normalizeApiBaseUrl(readEnv('VITE_API_BASE_URL')),
  appOrigin: readEnv('VITE_APP_ORIGIN', typeof window !== 'undefined' ? window.location.origin : ''),
  apiTimeoutMs: readPositiveInt(readEnv('VITE_API_TIMEOUT_MS'), 30_000),
  isApiConfigured: Boolean(readEnv('VITE_API_BASE_URL')),
} as const;

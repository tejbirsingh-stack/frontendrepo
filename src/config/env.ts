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
  // If set to a domain like https://qa.noahcloud.ai without /api, automatically append /api
  if (trimmed && !trimmed.endsWith('/api')) {
    return `${trimmed}/api`;
  }
  return trimmed;
}

/** Prefer VITE_API_BASE_URL; fall back to VITE_API_URL (used in .env.example). */
const configuredApiUrl = readEnv('VITE_API_BASE_URL') || readEnv('VITE_API_URL');

export const env = {
  // Empty URL → relative /api so Vite can proxy to the local backend
  apiBaseUrl: normalizeApiBaseUrl(configuredApiUrl) || '/api',
  appOrigin: readEnv('VITE_APP_ORIGIN', typeof window !== 'undefined' ? window.location.origin : ''),
  apiTimeoutMs: readPositiveInt(readEnv('VITE_API_TIMEOUT_MS'), 30_000),
  // Empty means proxy to local backend, not mock auth
  isApiConfigured: true,
  aiEnabled: readEnv('VITE_AI_ENABLED', 'true') !== 'false',
} as const;

function readEnv(key: keyof ImportMetaEnv, fallback = ''): string {
  const value = import.meta.env[key];
  return typeof value === 'string' && value.length > 0 ? value : fallback;
}

function readPositiveInt(value: string, fallback: number): number {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export const env = {
  apiBaseUrl: readEnv('VITE_API_BASE_URL'),
  appOrigin: readEnv('VITE_APP_ORIGIN', typeof window !== 'undefined' ? window.location.origin : ''),
  apiTimeoutMs: readPositiveInt(readEnv('VITE_API_TIMEOUT_MS'), 30_000),
  isApiConfigured: Boolean(readEnv('VITE_API_BASE_URL')),
} as const;

/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_API_URL: string;
  readonly VITE_APP_ORIGIN: string;
  readonly VITE_API_TIMEOUT_MS: string;
  readonly VITE_GOOGLE_CLIENT_ID: string;
  readonly VITE_MICROSOFT_CLIENT_ID: string;
  readonly VITE_AI_ENABLED: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

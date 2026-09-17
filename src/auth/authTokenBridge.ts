type TokenGetter = () => string | null;
type TokenSetter = (token: string) => void;
type UnauthorizedHandler = () => void;

let tokenGetter: TokenGetter | null = null;
let tokenSetter: TokenSetter | null = null;
let unauthorizedHandler: UnauthorizedHandler | null = null;

export function registerAuthTokenBridge(
  getToken: TokenGetter,
  setToken: TokenSetter,
  onUnauthorized: UnauthorizedHandler,
): void {
  tokenGetter = getToken;
  tokenSetter = setToken;
  unauthorizedHandler = onUnauthorized;
}

export function clearAuthTokenBridge(): void {
  tokenGetter = null;
  unauthorizedHandler = null;
}

export function getAccessToken(): string | null {
  const fromGetter = tokenGetter?.();
  if (fromGetter) return fromGetter;

  return (
    localStorage.getItem('accessToken') ||
    localStorage.getItem('token') ||
    localStorage.getItem('noah_session_token') ||
    null
  );
}

export function setAccessToken(token: string): void {
  tokenSetter?.(token);
}

export function handleUnauthorized(): void {
  unauthorizedHandler?.();
}

export function appendAuthTokenToUrl(url?: string): string | undefined {
  if (!url) return url;
  if (!url.startsWith('/api/') && !url.includes('/api/media/')) return url;
  if (url.includes('token=') || url.includes('streamToken=') || url.includes('t=')) return url;
  const token = getAccessToken();
  if (!token) return url;
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}token=${encodeURIComponent(token)}`;
}

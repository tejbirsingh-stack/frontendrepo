type TokenGetter = () => string | null;
type UnauthorizedHandler = () => void;

let tokenGetter: TokenGetter | null = null;
let unauthorizedHandler: UnauthorizedHandler | null = null;

export function registerAuthTokenBridge(
  getToken: TokenGetter,
  onUnauthorized: UnauthorizedHandler,
): void {
  tokenGetter = getToken;
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

export function handleUnauthorized(): void {
  unauthorizedHandler?.();
}

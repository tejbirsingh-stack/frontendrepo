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
  return tokenGetter?.() ?? null;
}

export function handleUnauthorized(): void {
  unauthorizedHandler?.();
}

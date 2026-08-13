/** App (workspace) sign-in. `/` is the public marketing landing page. */
export const LOGIN_PATH = '/login';
export const APP_HOME_PATH = '/home';

const AUTH_SCREEN_PREFIXES = [
  LOGIN_PATH,
  '/signup',
  '/mfaAuth',
  '/reset-password',
  '/verify-email',
];

/**
 * After a successful sign-in, send the user into the app — never back to the
 * marketing landing page or another auth screen.
 */
export function getPostAuthRedirect(from?: unknown): string {
  if (typeof from !== 'string' || !from.startsWith('/') || from.startsWith('//')) {
    return APP_HOME_PATH;
  }

  const pathOnly = from.split('?')[0].split('#')[0];
  if (pathOnly === '/' || AUTH_SCREEN_PREFIXES.some((prefix) => pathOnly === prefix || pathOnly.startsWith(`${prefix}/`))) {
    return APP_HOME_PATH;
  }

  if (pathOnly.startsWith('/platform')) {
    return APP_HOME_PATH;
  }

  return from;
}

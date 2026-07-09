import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  extractUserFromTokenOrResponse,
  fetchCurrentUserRequest,
  loginUser,
  loginWithGoogle,
  mapAuthUserDtoToSessionUser,
  signUpRequest,
} from '../api/auth.service';
import {
  clearAuthTokenBridge,
  registerAuthTokenBridge,
} from './authTokenBridge';
import {
  clearPersistedSession,
  persistSession,
  readPersistedSessionToken,
  readPersistedSessionUser,
} from './authStorage';
import { waitForMinimumSkeletonTime } from './authInitTiming';
import type {
  AuthContextValue,
  AuthSessionUser,
  LoginCredentials,
  SignUpCredentials,
} from './types';

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthSessionUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const accessTokenRef = useRef<string | null>(null);

  const setSession = useCallback((nextToken: string | null, nextUser: AuthSessionUser | null) => {
    accessTokenRef.current = nextToken;
    setAccessToken(nextToken);
    setUser(nextUser);
  }, []);

  const clearSession = useCallback(() => {
    accessTokenRef.current = null;
    setAccessToken(null);
    setUser(null);
    clearPersistedSession();
  }, []);

  const logout = useCallback(async () => {
    clearSession();
  }, [clearSession]);

  useEffect(() => {
    registerAuthTokenBridge(
      () => accessTokenRef.current,
      () => {
        void logout();
      },
    );

    return () => {
      clearAuthTokenBridge();
    };
  }, [logout]);


  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      const startedAt = Date.now();
      const persistedToken = readPersistedSessionToken();
      if (!persistedToken) {
        await waitForMinimumSkeletonTime(startedAt);
        if (!cancelled) setIsInitializing(false);
        return;
      }

      accessTokenRef.current = persistedToken;
      setAccessToken(persistedToken);
      registerAuthTokenBridge(
        () => accessTokenRef.current,
        () => {
          void logout();
        },
      );

      try {
        const currentUser = await fetchCurrentUserRequest();
        if (!cancelled && currentUser) {
          const sessionUser = mapAuthUserDtoToSessionUser(currentUser);
          setUser(sessionUser);
          persistSession(persistedToken, sessionUser);
        }
      } catch {
        if (!cancelled) {
          clearSession();
        }
      } finally {
        await waitForMinimumSkeletonTime(startedAt);
        if (!cancelled) {
          setIsInitializing(false);
        }
      }
    }

    void restoreSession();

    return () => {
      cancelled = true;
    };
  }, [clearSession]);

  const login = useCallback(
    async ({ email, password, rememberMe = false, mfaCode }: LoginCredentials) => {
      const response: any = await loginUser({ email, password, ...(mfaCode ? { mfaCode } : {}) });
      if (response?.requiresMfa || response?.data?.requiresMfa || response?.status === 'MFA_REQUIRED') {
        const error: any = new Error('MFA verification required');
        error.requiresMfa = true;
        error.response = { data: { requiresMfa: true } };
        throw error;
      }
      const token = response.accessToken || response.token;
      if (!token) throw new Error('No access token returned from login');
      const userDto = extractUserFromTokenOrResponse(response);
      const sessionUser = mapAuthUserDtoToSessionUser(userDto);
      setSession(token, sessionUser);
      persistSession(token, sessionUser, rememberMe);
    },
    [setSession],
  );

  const signup = useCallback(
    async ({ name, email, password, rememberMe = false }: SignUpCredentials) => {
      const response = await signUpRequest({ name, email, password });
      const token = response.accessToken || response.token;
      if (!token) throw new Error('No access token returned from signup');
      const userDto = extractUserFromTokenOrResponse(response);
      const sessionUser = mapAuthUserDtoToSessionUser(userDto);
      setSession(token, sessionUser);
      persistSession(token, sessionUser, rememberMe);
    },
    [setSession],
  );

  const loginGoogle = useCallback(
    async (idToken: string, rememberMe = false) => {
      const response = await loginWithGoogle(idToken);
      const token = response.accessToken || response.token;
      if (!token) throw new Error('No access token returned from Google login');
      const userDto = extractUserFromTokenOrResponse(response);
      const sessionUser = mapAuthUserDtoToSessionUser(userDto);
      setSession(token, sessionUser);
      persistSession(token, sessionUser, rememberMe);
    },
    [setSession],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      accessToken,
      isAuthenticated: Boolean(accessToken && user),
      isInitializing,
      login,
      signup,
      logout,
      loginGoogle,
      clearSession,
    }),
    [accessToken, isInitializing, login, logout, signup, user, loginGoogle, clearSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

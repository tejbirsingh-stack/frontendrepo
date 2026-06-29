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
  fetchCurrentUserRequest,
  loginRequest,
  logoutRequest,
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
    await logoutRequest();
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

      const persistedUser = readPersistedSessionUser();
      if (persistedUser) {
        if (!cancelled) {
          setUser(persistedUser);
        }
        await waitForMinimumSkeletonTime(startedAt);
        if (!cancelled) setIsInitializing(false);
        return;
      }

      try {
        const currentUser = await fetchCurrentUserRequest();
        if (!cancelled) {
          setUser(mapAuthUserDtoToSessionUser(currentUser));
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
    async ({ email, password, rememberMe = false }: LoginCredentials) => {
      const response = await loginRequest({ email, password });
      const sessionUser = mapAuthUserDtoToSessionUser(response.user);
      setSession(response.accessToken, sessionUser);
      persistSession(response.accessToken, sessionUser, rememberMe);
    },
    [setSession],
  );

  const signup = useCallback(
    async ({ name, email, password, rememberMe = false }: SignUpCredentials) => {
      const response = await signUpRequest({ name, email, password });
      const sessionUser = mapAuthUserDtoToSessionUser(response.user);
      setSession(response.accessToken, sessionUser);
      persistSession(response.accessToken, sessionUser, rememberMe);
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
    }),
    [accessToken, isInitializing, login, logout, signup, user],
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

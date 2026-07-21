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
  loginUser,
  loginWithGoogle,
  loginWithMicrosoft,
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
  persistSignupSessionToken,
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

      const persistedUser = readPersistedSessionUser();
      if (persistedUser) {
        setUser(persistedUser);
      }

      try {
        const currentUser = await fetchCurrentUserRequest();
        if (!cancelled && currentUser) {
          const sessionUser = mapAuthUserDtoToSessionUser(currentUser);
          setUser(sessionUser);
          persistSession(persistedToken, sessionUser);
        }
      } catch (error: any) {
        if (!cancelled && (error?.status === 404 || error?.status === 401 || error?.code === 'UNAUTHORIZED' || error?.code === 'NOT_FOUND' || !persistedUser)) {
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

      // 1. Set token into ref so the API Client immediately sends Authorization: Bearer <token>
      accessTokenRef.current = token;

      // 2. Fetch User + Role directly from the Database via API (/auth/me) instead of token payload/response
      const currentUserDto = await fetchCurrentUserRequest();
      const sessionUser = mapAuthUserDtoToSessionUser(currentUserDto);

      setSession(token, sessionUser);
      persistSession(token, sessionUser, rememberMe);
    },
    [setSession],
  );

  const signup = useCallback(
    async ({ name, email, password }: SignUpCredentials) => {
      const response = await signUpRequest({ name, email, password });
      const token = response.accessToken || response.token;
      if (!token) throw new Error('No access token returned from signup');

      accessTokenRef.current = token;
      const currentUserDto = await fetchCurrentUserRequest();
      const sessionUser = mapAuthUserDtoToSessionUser(currentUserDto);

      setSession(token, sessionUser);
      persistSignupSessionToken(token);
    },
    [setSession],
  );

  const loginGoogle = useCallback(
    async (idToken: string, rememberMe = false, options?: { mode?: 'login' | 'signup'; isSignUp?: boolean }) => {
      const response = await loginWithGoogle(idToken, options);
      const token = response.accessToken || response.token;
      if (!token) throw new Error('No access token returned from Google login');

      accessTokenRef.current = token;
      const currentUserDto = await fetchCurrentUserRequest();
      const sessionUser = mapAuthUserDtoToSessionUser(currentUserDto);

      setSession(token, sessionUser);
      if (options?.mode === 'signup' || options?.isSignUp) {
        persistSignupSessionToken(token);
      } else {
        persistSession(token, sessionUser, rememberMe);
      }
    },
    [setSession],
  );

  const loginMicrosoft = useCallback(
    async (idToken: string, rememberMe = false, options?: { mode?: 'login' | 'signup'; isSignUp?: boolean }) => {
      const response = await loginWithMicrosoft(idToken, options);
      const token = response.accessToken || response.token;
      if (!token) throw new Error('No access token returned from Microsoft login');

      accessTokenRef.current = token;
      const currentUserDto = await fetchCurrentUserRequest();
      const sessionUser = mapAuthUserDtoToSessionUser(currentUserDto);

      setSession(token, sessionUser);
      if (options?.mode === 'signup' || options?.isSignUp) {
        persistSignupSessionToken(token);
      } else {
        persistSession(token, sessionUser, rememberMe);
      }
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
      loginMicrosoft,
    }),
    [accessToken, isInitializing, login, logout, signup, user, loginGoogle, loginMicrosoft, clearSession],
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

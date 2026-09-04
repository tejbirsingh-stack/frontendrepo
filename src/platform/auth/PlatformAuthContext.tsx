import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { platformLogin, platformLogout, platformMe, updatePlatformProfile } from '../api/platformApi';
import {
  clearPlatformSession,
  persistPlatformSession,
  readPlatformAdmin,
  readPlatformToken,
  type PlatformAdmin,
} from './platformStorage';

type PlatformAuthContextValue = {
  admin: PlatformAdmin | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  login: (email: string, password: string, mfaCode?: string) => Promise<{ requiresMfa?: boolean; message?: string } | void>;
  logout: () => Promise<void>;
  updateProfile: (data: { name?: string; email?: string; currentPassword?: string; newPassword?: string }) => Promise<void>;
};

const PlatformAuthContext = createContext<PlatformAuthContextValue | null>(null);

export function PlatformAuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<PlatformAdmin | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const token = readPlatformToken();
    const cached = readPlatformAdmin();
    if (!token) {
      setIsInitializing(false);
      return;
    }
    if (cached) setAdmin(cached);
    platformMe()
      .then((res) => {
        setAdmin(res.admin);
        persistPlatformSession(token, res.admin);
      })
      .catch(() => {
        clearPlatformSession();
        setAdmin(null);
      })
      .finally(() => setIsInitializing(false));
  }, []);

  const login = useCallback(async (email: string, password: string, mfaCode?: string) => {
    const res = await platformLogin(email, password, mfaCode);
    if (res?.requiresMfa) {
      return { requiresMfa: true, message: res.message };
    }
    if (res?.accessToken && res?.admin) {
      persistPlatformSession(res.accessToken, res.admin);
      setAdmin(res.admin);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await platformLogout();
    } catch {
      /* ignore */
    }
    clearPlatformSession();
    setAdmin(null);
  }, []);

  const updateProfile = useCallback(async (data: { name?: string; email?: string; currentPassword?: string; newPassword?: string }) => {
    const res = await updatePlatformProfile(data);
    if (res?.admin) {
      const token = readPlatformToken() || '';
      persistPlatformSession(token, res.admin);
      setAdmin(res.admin);
    }
  }, []);

  const value = useMemo(
    () => ({
      admin,
      isAuthenticated: Boolean(admin),
      isInitializing,
      login,
      logout,
      updateProfile,
    }),
    [admin, isInitializing, login, logout, updateProfile],
  );

  return <PlatformAuthContext.Provider value={value}>{children}</PlatformAuthContext.Provider>;
}

export function usePlatformAuth() {
  const ctx = useContext(PlatformAuthContext);
  if (!ctx) throw new Error('usePlatformAuth must be used within PlatformAuthProvider');
  return ctx;
}

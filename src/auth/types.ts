import type { UserRole } from '../constants/userRoles';

export interface AuthSessionUser {
  id: string;
  name: string;
  email: string;
  role: UserRole | string;
  initials: string;
  avatarUrl?: string;
  accountName?: string;
  accountInitials?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
  mfaCode?: string;
}

export interface SignUpCredentials {
  name: string;
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthContextValue {
  user: AuthSessionUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  signup: (credentials: SignUpCredentials) => Promise<void>;
  logout: () => Promise<void>;
  loginGoogle: (idToken: string, rememberMe?: boolean) => Promise<void>;
  clearSession: () => void;
}

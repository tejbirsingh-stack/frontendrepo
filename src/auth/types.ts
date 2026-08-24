import type { UserRole } from '../constants/userRoles';

export interface AuthSessionUser {
  id: string;
  name: string;
  email: string;
  role: UserRole | string;
  roleId?: string;
  roleRelation?: {
    id: string;
    name: string;
  };
  organization?: {
    id?: string;
    name?: string;
    slug?: string;
    planType?: string;
    planExpiresAt?: string | Date;
    maxUsers?: number;
    maxWorkspaces?: number;
    maxProjects?: number;
    storageQuotaBytes?: string | number;
    storageUsedBytes?: string | number;
    aiEnabled?: boolean;
    features?: any;
    isFreeTrialUsed?: boolean;
    metadata?: Record<string, any>;
  };
  planType?: string;
  timezone?: string;
  orgId?: string;
  allowedProjectIds?: string[];
  permissions?: string[];
  initials: string;
  avatarUrl?: string;
  accountName?: string;
  accountInitials?: string;
  shareLinkActivityEnabled?: boolean;
  preferences?: Record<string, any>;
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
  orgBranding?: any;
  login: (credentials: LoginCredentials) => Promise<void>;
  signup: (credentials: SignUpCredentials) => Promise<void>;
  logout: () => Promise<void>;
  loginGoogle: (idToken: string, rememberMe?: boolean, options?: { mode?: 'login' | 'signup'; isSignUp?: boolean }) => Promise<void>;
  clearSession: () => void;
  loginMicrosoft: (idToken: string, rememberMe?: boolean, options?: { mode?: 'login' | 'signup'; isSignUp?: boolean }) => Promise<void>;
  setSession: (token: string | null, user: AuthSessionUser | null) => void;
  refreshUser: () => Promise<void>;
  refreshBranding?: () => Promise<void>;
}

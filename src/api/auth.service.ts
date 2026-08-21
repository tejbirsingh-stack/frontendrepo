import { CURRENT_USER } from '../constants/currentUser';
import { PERMISSIONS } from '../constants/permissions';
import {
  findMockAuthAccount,
  mockAuthEmailExists,
  registerMockAuthAccount,
  type MockAuthAccount,
} from '../constants/mockAuthCredentials';
import { env } from '../config/env';
import { sanitizeEmailInput, sanitizeTextInput } from '../utils/sanitize';
import { getNameInitials, validatePassword } from '../utils/authValidation';
import { apiClient } from './client';
import { getAccessToken } from '../auth/authTokenBridge';
import type {
  AuthUserDto,
  LoginRequestDto,
  LoginResponseDto,
  OrganizationUserItem,
  RegisterData,
  RegisterRoleDto,
  RoleItem,
  SignUpRequestDto,
} from './types';

import axios from "axios";

const API_BASE_URL = env.apiBaseUrl || '/api';

export interface CompleteSignupPayload {
  email: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  password?: string;
  workspaceName: string;
  companyWebsite?: string;
  mobileNumber?: string;
  teamSize?: string;
  firstFocus?: string;
  planId?: string;
  billingCycle?: string;
  hubspotUtk?: string;
}

export const checkEmailRequest = async (email: string) => {
  const response = await axios.post(`${API_BASE_URL}/auth/check-email`, { email });
  return response.data;
};

export const sendSignupOtpRequest = async (email: string) => {
  const response = await axios.post(`${API_BASE_URL}/auth/send-signup-otp`, { email });
  return response.data;
};

export const verifySignupOtpRequest = async (email: string, code: string) => {
  const response = await axios.post(`${API_BASE_URL}/auth/verify-signup-otp`, { email, code });
  return response.data;
};

export const completeSignupRequest = async (payload: CompleteSignupPayload) => {
  const response = await axios.post(`${API_BASE_URL}/auth/complete-signup`, payload);
  return response.data;
};

export const registerUser = async (data: RegisterData) => {
  const response = await axios.post(
    `${API_BASE_URL}/auth/register`,
    data
  );
  return response.data;
};


export const loginUser = async (data: LoginRequestDto) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/auth/login`,
      data
    );
    return response.data;
  } catch (error: any) {
    // If backend returned 400 for MFA Required, return the response data instead of crashing
    if (error.response?.data?.requiresMfa) {
      return error.response.data;
    }
    throw error;
  }
};


export const verifyEmailRequest = async (token: string) => {
  const response = await axios.post(
    `${API_BASE_URL}/auth/verify-email`,
    { token }
  );
  return response.data;
};


export const loginWithGoogle = async (idToken: string, options?: { mode?: 'login' | 'signup'; isSignUp?: boolean }) => {
  const response = await axios.post(
    `${API_BASE_URL}/auth/login-google`,
    { idToken, ...(options || {}) }
  );

  return response.data;
};

export const loginWithMicrosoft = async (idToken: string, options?: { mode?: 'login' | 'signup'; isSignUp?: boolean }) => {
  const response = await axios.post(
    `${API_BASE_URL}/auth/login-microsoft`,
    { idToken, ...(options || {}) }
  );
  return response.data;
};

export const registerRole = async (data: RegisterRoleDto) => {
  const token = getAccessToken();
  const response = await axios.post(
    `${API_BASE_URL}/auth/registerrole`,
    data,
    token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
  );
  return response.data;
};


export const fetchRoles = async (): Promise<RoleItem[]> => {
  const token = getAccessToken();
  const response = await axios.get(
    `${API_BASE_URL}/auth/roles`,
    token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
  );
  return response.data?.roles || response.data || [];
};




export const fetchOrganizationUsers = async (): Promise<OrganizationUserItem[]> => {
  const token = getAccessToken();
  const response = await axios.get(
    `${API_BASE_URL}/auth/users`,
    token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
  );
  return response.data?.users || response.data || [];
};

export const updateOrganizationUser = async (userId: string, data: { email?: string; roleId?: string }) => {
  const token = getAccessToken();
  const response = await axios.put(
    `${API_BASE_URL}/users/${userId}`,
    data,
    token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
  );
  return response.data?.user || response.data;
};

export const resetPasswordRequest = async (data: { token: string; password?: string; confirmPassword?: string; newPassword?: string; name?: string }) => {
  const response = await axios.post(
    `${API_BASE_URL}/auth/reset-password`,
    data
  );
  return response.data;
};

export const forgotPasswordRequest = async (email: string) => {
  const response = await axios.post(
    `${API_BASE_URL}/auth/forgot-password`,
    { email }
  );
  return response.data;
};

export const validateResetTokenRequest = async (token: string) => {
  const response = await axios.get(
    `${API_BASE_URL}/auth/validate-reset-token`,
    { params: { token } }
  );
  return response.data;
};




export const logoutUser = async (userId: string) => {
  const token = getAccessToken();
  const response = await axios.post(
    `${API_BASE_URL}/auth/logout`,
    { userId },
    token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
  );
  return response.data;
};

export const logoutAllSessions = async () => {
  const token = getAccessToken();
  const response = await axios.post(
    `${API_BASE_URL}/auth/logout-all`,
    {},
    token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
  );
  return response.data;
};




export async function fetchCurrentUserRequest(): Promise<AuthUserDto> {
  const response = await apiClient.get<any>('/auth/me');
  return response?.user || response?.data || response;
}




export function mapCurrentUserToDto(): AuthUserDto {
  return {
    id: 'current-user',
    name: CURRENT_USER.name,
    email: CURRENT_USER.email,
    role: CURRENT_USER.role,
    initials: CURRENT_USER.initials,
    avatarUrl: CURRENT_USER.avatarUrl,
    accountName: CURRENT_USER.accountName,
    accountInitials: CURRENT_USER.accountInitials,
  };
}

async function mockLogin(credentials: LoginRequestDto): Promise<LoginResponseDto> {
  const email = sanitizeEmailInput(credentials.email);
  const password = credentials.password.trim();

  if (!email || !password) {
    throw new Error('Email and password are required.');
  }

  const account = findMockAuthAccount(email, password);
  if (!account) {
    throw new Error('Invalid email or password.');
  }

  await new Promise((resolve) => window.setTimeout(resolve, 120));

  return {
    accessToken: `mock.${crypto.randomUUID()}`,
    user: account.user,
  };
}

export async function loginRequest(credentials: LoginRequestDto): Promise<LoginResponseDto> {
  const payload: Record<string, unknown> = {
    email: sanitizeEmailInput(credentials.email),
    password: credentials.password,
  };
  if (credentials.mfaCode) {
    payload.mfaCode = credentials.mfaCode;
  }

  if (!env.isApiConfigured) {
    return mockLogin(payload as unknown as LoginRequestDto);
  }

  return apiClient.post<LoginResponseDto>('/auth/login', payload, { skipAuth: true });
}

async function mockSignUp(payload: SignUpRequestDto): Promise<LoginResponseDto> {
  const name = sanitizeTextInput(payload.name, 120);
  const email = sanitizeEmailInput(payload.email);
  const password = payload.password.trim();

  if (!name || name.length < 2) {
    throw new Error('Please enter your full name.');
  }
  if (!email) {
    throw new Error('Please enter a valid email address.');
  }

  const passwordError = validatePassword(password);
  if (passwordError) {
    throw new Error(passwordError);
  }

  if (mockAuthEmailExists(email)) {
    throw new Error('An account with this email already exists.');
  }

  const account: MockAuthAccount = {
    email,
    password,
    user: {
      id: `user-${crypto.randomUUID()}`,
      name,
      email,
      role: 'Collaborator',
      initials: getNameInitials(name),
      accountName: `${name.split(' ')[0]}'s Account`,
      accountInitials: getNameInitials(name),
    },
  };

  registerMockAuthAccount(account);

  await new Promise((resolve) => window.setTimeout(resolve, 150));

  return {
    accessToken: `mock.${crypto.randomUUID()}`,
    user: account.user,
  };
}

export async function signUpRequest(payload: SignUpRequestDto): Promise<LoginResponseDto> {
  const normalized = {
    name: sanitizeTextInput(payload.name, 120),
    email: sanitizeEmailInput(payload.email),
    password: payload.password,
  };

  if (!env.isApiConfigured) {
    return mockSignUp(normalized);
  }

  return apiClient.post<LoginResponseDto>('/auth/signup', normalized, { skipAuth: true });
}

export async function logoutRequest(): Promise<void> {
  if (!env.isApiConfigured) {
    return;
  }

  try {
    await apiClient.post<void>('/auth/logout');
  } catch {
    // Local session cleanup still runs when the logout endpoint is unavailable.
  }
}


import { ROLE_IDS } from '../constants/userRoles';

export function mapAuthUserDtoToSessionUser(input: any) {
  const user = input?.user || input || {};
  const rawRole = (user.roleRelation && user.roleRelation.name) || user.role || 'User';
  const formattedRole = rawRole
    ? rawRole.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())
    : 'User';

  const name = user.name || user.email?.split('@')[0] || 'User';

  // Fallback map to ensure roleId is always populated even if backend omits it
  const roleNameMap: Record<string, string> = {
    'Super Admin': ROLE_IDS.SUPER_ADMIN,
    'Admin': ROLE_IDS.ADMIN,
    'Editor': ROLE_IDS.EDITOR,
    'Collaborator': ROLE_IDS.COLLABORATOR,
    'Viewer': ROLE_IDS.VIEWER,
  };
  const fallbackRoleId = roleNameMap[formattedRole] || '';

  const rawPlanType =
    user.organization?.planType || user.planType || user.workspace?.planType || 'free';

  let permissions = user.permissions || [];
  if (
    (formattedRole === 'Super Admin' || formattedRole === 'SuperAdmin' || formattedRole === 'System Admin') &&
    permissions.length === 0
  ) {
    permissions = Object.values(PERMISSIONS);
  }

  return {
    id: user.id || 'user-id',
    name: name,
    email: user.email || '',
    timezone: user.timezone || 'UTC',
    role: formattedRole,
    roleId: user.roleId || user.role_id || user.roleRelation?.id || fallbackRoleId,
    roleRelation: user.roleRelation,
    organization: user.organization,
    planType: rawPlanType,
    orgId: user.orgId || user.organization?.id,
    allowedProjectIds: user.allowedProjectIds || [],
    permissions: permissions,
    initials: user.initials || getNameInitials(name),
    avatarUrl: user.avatarUrl,
    accountName: user.accountName || (user.organization && user.organization.name) || `${name}'s Account`,
    accountInitials: user.accountInitials || getNameInitials((user.organization && user.organization.name) || name),
    shareLinkActivityEnabled: user.shareLinkActivityEnabled ?? true,
  };
}

export function extractUserFromTokenOrResponse(response: LoginResponseDto): AuthUserDto {
  if (response.user) {
    const userObj = response.user as any;
    const dynamicRole = userObj.roleRelation?.name || userObj.role || 'Member';
    userObj.role = dynamicRole;
    return userObj;
  }
  const token = response.accessToken || response.token;
  if (!token) {
    throw new Error('No access token received from login');
  }
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const decoded = JSON.parse(jsonPayload);
    const rawRole = (decoded.roleRelation && decoded.roleRelation.name) || decoded.role || 'Member';
    const formattedRole = rawRole.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
    const name = decoded.name || decoded.email?.split('@')[0] || 'User';

    const roleNameMap: Record<string, string> = {
      'Super Admin': ROLE_IDS.SUPER_ADMIN,
      'Admin': ROLE_IDS.ADMIN,
      'Editor': ROLE_IDS.EDITOR,
      'Collaborator': ROLE_IDS.COLLABORATOR,
      'Viewer': ROLE_IDS.VIEWER,
    };
    const fallbackRoleId = roleNameMap[formattedRole] || '';

    return {
      id: decoded.id || 'user-id',
      name: name,
      email: decoded.email || '',
      timezone: decoded.timezone || 'UTC',
      role: formattedRole,
      roleId: decoded.roleId || decoded.role_id || decoded.roleRelation?.id || fallbackRoleId,
      roleRelation: decoded.roleRelation,
      permissions: decoded.permissions,
      initials: getNameInitials(name),
      avatarUrl: decoded.avatarUrl,
      accountName: decoded.organization?.name || decoded.accountName || `${name}'s Account`,
      accountInitials: getNameInitials(decoded.organization?.name || name),
      shareLinkActivityEnabled: decoded.shareLinkActivityEnabled ?? true,
    };
  } catch (err) {
    console.error('Failed to decode JWT token payload:', err);
    throw new Error('Failed to parse user information from login token');
  }
}


export const bulkUpdateOrganizationUsersRequest = async (userIds: string[], action: 'active' | 'inactive' | 'delete') => {
  const token = getAccessToken();
  const response = await axios.post(
    `${API_BASE_URL}/users/bulk`,
    { userIds, action },
    token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
  );
  return response.data;
};

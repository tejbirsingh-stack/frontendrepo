import { CURRENT_USER } from '../constants/currentUser';
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
  RegisterData,
  RegisterRoleDto,
  RoleItem,
  SignUpRequestDto,
} from './types';

import axios from "axios";

const API_BASE_URL = env.apiBaseUrl || '/api';

export const registerUser = async (data: RegisterData) => {
  const response = await axios.post(
    `${API_BASE_URL}/auth/register`,
    data
  );
  return response.data;
};


export const loginUser = async (data: LoginRequestDto) => {
  const response = await axios.post(
    `${API_BASE_URL}/auth/login`,
    data
  );

  return response.data;
};


export const loginWithGoogle = async (idToken: string) => {
  const response = await axios.post(
    `${API_BASE_URL}/auth/loging-google`,
    { idToken }
  );

  return response.data;
};

export const loginWithMicrosoft = async (idToken : string) => {
  const response = await axios.post(
    `${API_BASE_URL}/auth/login-microsoft`,
    { idToken }
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


export const resetPasswordRequest = async (data: { token: string; password?: string; newPassword?: string; name?: string }) => {
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




function mapCurrentUserToDto(): AuthUserDto {
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

export async function fetchCurrentUserRequest(): Promise<AuthUserDto> {
  if (!env.isApiConfigured) {
    return mapCurrentUserToDto();
  }

  return apiClient.get<AuthUserDto>('/auth/me');
}

export function mapAuthUserDtoToSessionUser(user: AuthUserDto) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    initials: user.initials,
    avatarUrl: user.avatarUrl,
    accountName: user.accountName,
    accountInitials: user.accountInitials,
  };
}

export function extractUserFromTokenOrResponse(response: LoginResponseDto): AuthUserDto {
  if (response.user) {
    return response.user;
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
    const name = decoded.name || decoded.email?.split('@')[0] || 'User';
    return {
      id: decoded.id || 'user-id',
      name: name,
      email: decoded.email || '',
      role: decoded.role || 'user',
      initials: getNameInitials(name),
      avatarUrl: decoded.avatarUrl,
      accountName: decoded.organization?.name || decoded.accountName || `${name}'s Account`,
      accountInitials: getNameInitials(decoded.organization?.name || name),
    };
  } catch (err) {
    console.error('Failed to decode JWT token payload:', err);
    throw new Error('Failed to parse user information from login token');
  }
}

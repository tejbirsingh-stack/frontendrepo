export type ApiErrorCode =
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'UNKNOWN';

export class ApiError extends Error {
  readonly status: number;
  readonly code: ApiErrorCode;
  readonly details?: unknown;

  constructor(message: string, status: number, code: ApiErrorCode, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export interface ApiResponse<T> {
  data: T;
}


export interface RegisterData {
  name: string;
  email: string;
  password: string;
  orgId?: string;
  orgName?: string;
  phone?: string;
  jobTitle?: string;
  hubspotUtk?: string;
}

export interface AuthUserDto {
  id: string;
  name: string;
  email: string;
  role: string;
  roleId?: string;
  roleRelation?: {
    id: string;
    name: string;
  };
  initials: string;
  avatarUrl?: string;
  accountName?: string;
  accountInitials?: string;
}

export interface LoginRequestDto {
  email: string;
  password: string;
  mfaCode?: string;
}

export interface SignUpRequestDto {
  name: string;
  email: string;
  password: string;
}

export interface RegisterRoleDto {
  email: string;
  roleId: string;
  orgId?: string;
}

export interface RoleItem {
  id: string;
  name: string;
}

export interface LoginResponseDto {
  accessToken?: string;
  token?: string;
  user?: AuthUserDto;
}

export interface ApiRequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  skipAuth?: boolean;
  timeoutMs?: number;
}


export interface OrganizationUserItem {
  id: string;
  name: string | null;
  email: string;
  role: string;
  roleId?: string;
  roleRelation?: {
    id: string;
    name: string;
  };
  status: string;
  lastLoginAt?: string | null;
  lastActiveAt?: string | null;
  createdAt: string;
  updatedAt?: string;
  jobTitle?: string | null;
  phone?: string | null;
  organization?: {
    id: string;
    name: string;
    slug: string;
  };
}
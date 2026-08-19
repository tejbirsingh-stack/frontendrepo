import type { AuthSessionUser } from '../auth/types';
import { ROLE_IDS } from './userRoles';

export const PERMISSIONS = {
  VIEW_SEARCH_MEDIA: 'view_search_media',
  DOWNLOAD_STREAM_MEDIA: 'download_stream_media',
  UPLOAD_MEDIA: 'upload_media',
  DELETE_MEDIA: 'delete_media',
  MANAGE_TRASH: 'manage_trash',
  EDIT_METADATA_TAGS: 'edit_metadata_tags',
  TIMELINE_ANNOTATIONS: 'timeline_annotations',
  ANNOTATION_PRIVACY: 'annotation_privacy',
  CREATE_SHARE_LINKS: 'create_share_links',
  MANAGE_USERS_PERMISSIONS: 'manage_users_permissions',
  CONFIGURE_SSO_MFA: 'configure_sso_mfa',
  VIEW_AUDIT_ANALYTICS: 'view_audit_analytics',
  MANAGE_ROOT_FOLDERS: 'manage_root_folders',
  MANAGE_SUBSCRIPTION_BILLING: 'manage_subscription_billing',
  PROVISION_ENTERPRISE_ORG: 'provision_enterprise_org',
  MANAGE_INFRASTRUCTURE: 'manage_infrastructure',
} as const;

export type PermissionSlug = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export function hasPermission(
  user: Partial<AuthSessionUser> | null | undefined,
  slug: PermissionSlug | string,
): boolean {
  if (!user) return false;
  if (
    user.role === 'Super Admin' ||
    user.roleId === ROLE_IDS.SUPER_ADMIN ||
    user.role === 'super_admin'
  ) {
    return true;
  }
  if (!user.permissions) return false;
  return user.permissions.includes(slug);
}

export function hasAnyPermission(
  user: Partial<AuthSessionUser> | null | undefined,
  slugs: (PermissionSlug | string)[],
): boolean {
  return slugs.some((slug) => hasPermission(user, slug));
}

/**
 * Returns true if the user role is Super Admin or Admin.
 * Folder deletion is strictly restricted to Super Admin and Admin roles.
 */
export function canDeleteFolder(
  user: Partial<AuthSessionUser> | null | undefined,
): boolean {
  if (!user) return false;
  const roleName = (user.role || user.roleRelation?.name || '').trim().toLowerCase();
  const roleId = user.roleId;

  const isSuperAdmin =
    roleName === 'super admin' ||
    roleName === 'superadmin' ||
    roleName === 'super_admin' ||
    roleId === ROLE_IDS.SUPER_ADMIN;

  const isAdmin =
    roleName === 'admin' ||
    roleId === ROLE_IDS.ADMIN;

  return isSuperAdmin || isAdmin;
}

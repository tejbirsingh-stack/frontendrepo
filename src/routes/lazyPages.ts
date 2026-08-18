import { lazy, type ComponentType } from 'react';
import { ROUTE_SKELETON_MIN_MS } from '../constants/loading';

function lazyPage<T extends ComponentType<object>>(factory: () => Promise<{ default: T }>) {
  return lazy(async () => {
    const delayMs = import.meta.env.DEV ? ROUTE_SKELETON_MIN_MS : 0;
    const [module] = await Promise.all([
      factory(),
      delayMs > 0
        ? new Promise<void>((resolve) => {
            window.setTimeout(resolve, delayMs);
          })
        : Promise.resolve(),
    ]);
    return module;
  });
}

export const MarketingLandingPage = lazyPage(() => import('../pages/MarketingLandingPage'));
export const LoginPage = lazyPage(() => import('../pages/LoginPage'));
export const SignUpPage = lazyPage(() => import('../pages/SignUpPage'));
export const DashboardPage = lazyPage(() => import('../pages/DashboardPage'));
export const FolderPage = lazyPage(() => import('../pages/FolderPage'));
export const ProjectPage = lazyPage(() => import('../pages/ProjectPage'));
export const TagsManagementPage = lazyPage(() => import('../pages/TagsManagementPage'));
export const UserActivitiesPage = lazyPage(() => import('../pages/UserActivitiesPage'));
export const TrashPage = lazyPage(() => import('../pages/TrashPage'));
export const SettingsSectionPage = lazyPage(() => import('../pages/settings/SettingsSectionPage'));
export const VideoPlayerPage = lazyPage(() => import('../pages/VideoPlayerPage'));
export const NotFoundPage = lazyPage(() => import('../pages/NotFoundPage'));
export const MfaAuthPage = lazyPage(() => import('../pages/MfaAuthPage'));
export const ForgotPasswordPage = lazyPage(() => import('../pages/ForgotPasswordPage'));
export const ResetPasswordPage = lazyPage(() => import('../pages/ResetPasswordPage'));
export const VerifyEmailPage = lazyPage(() => import('../pages/VerifyEmailPage'));
export const DeletionRequestsPage = lazyPage(() => import('../pages/DeletionRequestsPage'));
export const ShareGuestPage = lazyPage(() => import('../pages/ShareGuestPage'));
export const PlatformApp = lazyPage(() => import('../platform/PlatformApp'));

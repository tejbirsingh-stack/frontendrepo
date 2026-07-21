import { useMemo } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import KeyboardShortcutsSettings from '../../components/settings/KeyboardShortcutsSettings';
import BillingSettingsSection from '../../components/settings/BillingSettingsSection';
import UserAdminSettingsSection from '../../components/settings/UserAdminSettingsSection';
import { SettingsTableContainer } from '../../components/settings/SettingsContentLayout';
import {
  BrandingSettingsSection,
  CompanySettingsSection,
  FieldsAdminSettingsSection,
  PersonalSettingsSection,
  PrivacySettingsSection,
  PlanSettingsSection,
  ProjectsAdminSettingsSection,
  SecurityAdminSettingsSection,
  ShareSettingsSection,
  UsageSettingsSection,
  WorkspacesAdminSettingsSection,
} from '../../components/settings/settingsPageSections';
import { DEFAULT_SETTINGS_PATH, SETTINGS_BASE_PATH } from '../../constants/settingsNav';

import { useAuth } from '../../auth/AuthContext';


export default function SettingsSectionPage() {
  const location = useLocation();
  const { user } = useAuth();

  const sectionKey = useMemo(() => {
    return location.pathname.replace('/home/settings/', '').replace(/\/$/, '');
  }, [location.pathname]);

  const hasManageSubscription = user?.permissions?.includes('manage_subscription_billing');
  const hasManageUsers = user?.permissions?.includes('manage_users_permissions');
  const hasViewAudit = user?.permissions?.includes('view_audit_analytics');
  const hasManageRootFolders = user?.permissions?.includes('manage_root_folders');

  if (['accounts/billing', 'accounts/plan', 'profile/company', 'admin/security'].includes(sectionKey) && !hasManageSubscription) {
    return <Navigate to="/home" replace />;
  }

  if (['admin/user', 'accounts/branding'].includes(sectionKey) && !hasManageUsers) {
    return <Navigate to="/home" replace />;
  }

  if (sectionKey === 'accounts/usage' && !hasViewAudit) {
    return <Navigate to="/home" replace />;
  }

  if (['admin/projects', 'admin/workspaces', 'admin/fields', 'share/settings'].includes(sectionKey) && !hasManageRootFolders) {
    return <Navigate to="/home" replace />;
  }

  switch (sectionKey) {
    case 'profile/personal':
      return <PersonalSettingsSection />;
    case 'profile/privacy':
      return <PrivacySettingsSection />;
    case 'profile/company':
      return <CompanySettingsSection />;
    case 'accounts/usage':
      return <UsageSettingsSection />;
    case 'accounts/plan':
      return <PlanSettingsSection />;
    case 'accounts/billing':
      return (
        <SettingsTableContainer>
          <BillingSettingsSection />
        </SettingsTableContainer>
      );
    case 'accounts/branding':
      return <BrandingSettingsSection />;
    case 'admin/user':
      return <UserAdminSettingsSection />;
    case 'admin/projects':
      return <ProjectsAdminSettingsSection />;
    case 'admin/workspaces':
      return <WorkspacesAdminSettingsSection />;
    case 'admin/fields':
      return <FieldsAdminSettingsSection />;
    case 'admin/security':
      return <SecurityAdminSettingsSection />;
    case 'admin/keyboard-shortcuts':
      return (
        <SettingsTableContainer>
          <KeyboardShortcutsSettings />
        </SettingsTableContainer>
      );
    case 'billing/details':
      return <Navigate to={`${SETTINGS_BASE_PATH}/accounts/billing`} replace />;
    case 'share/settings':
      return <ShareSettingsSection />;
    default:
      return <Navigate to={DEFAULT_SETTINGS_PATH} replace />;
  }
}

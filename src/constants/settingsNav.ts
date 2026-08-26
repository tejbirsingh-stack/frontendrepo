export interface SettingsNavItem {
  id: string;
  label: string;
  path: string;
}

export interface SettingsNavGroup {
  id: string;
  label: string;
  items: SettingsNavItem[];
}

export const SETTINGS_BASE_PATH = '/home/settings';

export const SETTINGS_NAV_GROUPS: SettingsNavGroup[] = [
  {
    id: 'profile',
    label: 'Profile',
    items: [
      { id: 'personal', label: 'Personal', path: 'profile/personal' },
      { id: 'privacy', label: 'Privacy', path: 'profile/privacy' },
      { id: 'company', label: 'Company', path: 'profile/company' },
    ],
  },
  {
    id: 'accounts',
    label: 'Accounts',
    items: [
      { id: 'usage', label: 'Usage', path: 'accounts/usage' },
      { id: 'plan', label: 'Plan', path: 'accounts/plan' },
      { id: 'billing', label: 'Billing', path: 'accounts/billing' },
      { id: 'branding', label: 'Branding', path: 'accounts/branding' },
    ],
  },
  {
    id: 'admin',
    label: 'Admin',
    items: [
      { id: 'user', label: 'User', path: 'admin/user' },
      { id: 'projects', label: 'Projects', path: 'admin/projects' },
      { id: 'workspaces', label: 'Workspaces', path: 'admin/workspaces' },
      { id: 'security', label: 'Security', path: 'admin/security' },
      { id: 'keyboard-shortcuts', label: 'Keyboard Shortcuts', path: 'admin/keyboard-shortcuts' },
    ],
  },
  {
    id: 'share',
    label: 'Share Management',
    items: [{ id: 'settings', label: 'Share Settings', path: 'share/settings' }],
  },
];

export const DEFAULT_SETTINGS_PATH = `${SETTINGS_BASE_PATH}/profile/personal`;

export function getSettingsSectionMeta(pathSuffix: string) {
  for (const group of SETTINGS_NAV_GROUPS) {
    const item = group.items.find((entry) => entry.path === pathSuffix);
    if (item) {
      return {
        groupLabel: group.label,
        sectionLabel: item.label,
        path: `${SETTINGS_BASE_PATH}/${item.path}`,
      };
    }
  }

  return null;
}

export function listAllSettingsPaths(): string[] {
  return SETTINGS_NAV_GROUPS.flatMap((group) =>
    group.items.map((item) => `${SETTINGS_BASE_PATH}/${item.path}`),
  );
}

import { getHelpMenuShortcutLabel } from '../components/media/HelpMenuDrawer';

export function getModKeyLabel(): string {
  const isMac =
    typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.platform);
  return isMac ? '⌘' : 'Ctrl';
}

export interface DashboardShortcutDefinition {
  id: string;
  label: string;
  shortcut: string;
  locked?: boolean;
}

export function getDashboardShortcutDefinitions(): DashboardShortcutDefinition[] {
  const mod = getModKeyLabel();

  return [
    { id: 'dashboard-focus-search', label: 'Focus search', shortcut: '/' },
    { id: 'dashboard-focus-search-mod', label: 'Focus search', shortcut: `${mod} S` },
    { id: 'dashboard-clear-search', label: 'Clear search', shortcut: 'Esc' },
    { id: 'dashboard-clear-selection', label: 'Clear selection', shortcut: 'Esc', locked: true },
    {
      id: 'dashboard-select-multiple',
      label: 'Select multiple items',
      shortcut: `${mod} Click`,
      locked: true,
    },
    { id: 'dashboard-select-range', label: 'Select a range', shortcut: '⇧ Click', locked: true },
    { id: 'dashboard-open-help-menu', label: 'Open help menu', shortcut: getHelpMenuShortcutLabel() },
  ];
}

export function getDashboardShortcutRows(): { label: string; shortcut: string }[] {
  return getDashboardShortcutDefinitions().map(({ label, shortcut }) => ({ label, shortcut }));
}

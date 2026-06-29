import {
  KEYBOARD_SHORTCUTS_STORAGE_KEY,
  type KeyboardShortcutOverrides,
} from '../constants/appKeyboardShortcuts';

const LEGACY_SHORTCUT_ID_MAP: Record<string, string> = {
  'dashboard-0': 'dashboard-focus-search',
  'dashboard-1': 'dashboard-focus-search-mod',
  'dashboard-2': 'dashboard-clear-search',
  'dashboard-3': 'dashboard-clear-selection',
  'dashboard-4': 'dashboard-select-multiple',
  'dashboard-5': 'dashboard-select-range',
  'dashboard-6': 'dashboard-open-help-menu',
  'dashboard-open-shortcuts-dialog': 'dashboard-open-help-menu',
};

function migrateLegacyOverrides(
  overrides: KeyboardShortcutOverrides,
): KeyboardShortcutOverrides {
  const next: KeyboardShortcutOverrides = {};

  Object.entries(overrides).forEach(([id, value]) => {
    const resolvedId = LEGACY_SHORTCUT_ID_MAP[id] ?? id;
    next[resolvedId] = {
      ...next[resolvedId],
      ...value,
    };
  });

  return next;
}

export function readKeyboardShortcutOverrides(): KeyboardShortcutOverrides {
  if (typeof window === 'undefined') return {};

  try {
    const raw = window.localStorage.getItem(KEYBOARD_SHORTCUTS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as KeyboardShortcutOverrides;
    if (!parsed || typeof parsed !== 'object') return {};
    return migrateLegacyOverrides(parsed);
  } catch {
    return {};
  }
}

export function writeKeyboardShortcutOverrides(overrides: KeyboardShortcutOverrides) {
  window.localStorage.setItem(KEYBOARD_SHORTCUTS_STORAGE_KEY, JSON.stringify(overrides));
  window.dispatchEvent(new CustomEvent('noah-keyboard-shortcuts-updated'));
}

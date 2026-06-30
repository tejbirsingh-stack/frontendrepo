import type { KeyboardShortcutCategory } from '../constants/appKeyboardShortcuts';
import { flattenKeyboardShortcuts } from '../constants/appKeyboardShortcuts';
import { isKeyboardShortcutLabel, normalizeShortcutLabel } from './matchKeyboardShortcut';

export const LOCKED_KEYBOARD_SHORTCUT_IDS = new Set([
  'dashboard-clear-selection',
  'dashboard-select-multiple',
  'dashboard-select-range',
  'comment-post',
  'comment-newline',
  'comment-cancel',
  'comment-dismiss-marker',
  'global-close-overlay',
  'global-profile-menu',
  'timeline-pinch-zoom',
  'media-open-shortcuts',
]);

const FORBIDDEN_SHORTCUTS_BY_ID: Record<string, string[]> = {
  'dashboard-focus-search': ['Esc'],
  'dashboard-focus-search-mod': ['Esc'],
};

const FORBIDDEN_SHORTCUT_MESSAGES: Record<string, string> = {
  Esc: 'Esc is reserved for clearing search, canceling edits, and closing overlays.',
};

export function isShortcutEditable(id: string, shortcutLabel?: string): boolean {
  if (LOCKED_KEYBOARD_SHORTCUT_IDS.has(id)) return false;
  if (shortcutLabel && !isKeyboardShortcutLabel(shortcutLabel)) return false;
  return true;
}

export interface ShortcutValidationResult {
  valid: boolean;
  message?: string;
}

export function validateShortcutRebind(
  id: string,
  shortcut: string,
  catalog: KeyboardShortcutCategory[],
): ShortcutValidationResult {
  if (LOCKED_KEYBOARD_SHORTCUT_IDS.has(id)) {
    return {
      valid: false,
      message: 'This system shortcut cannot be changed.',
    };
  }

  if (!isKeyboardShortcutLabel(shortcut)) {
    return {
      valid: false,
      message: 'Choose a keyboard shortcut. Mouse and gesture bindings cannot be reassigned here.',
    };
  }

  const normalizedShortcut = normalizeShortcutLabel(shortcut);
  const forbiddenShortcuts = FORBIDDEN_SHORTCUTS_BY_ID[id] ?? [];

  for (const forbidden of forbiddenShortcuts) {
    if (normalizeShortcutLabel(forbidden) === normalizedShortcut) {
      return {
        valid: false,
        message:
          FORBIDDEN_SHORTCUT_MESSAGES[forbidden] ??
          `This action cannot use the ${forbidden} shortcut.`,
      };
    }
  }

  const allShortcuts = flattenKeyboardShortcuts(catalog);
  const conflict = allShortcuts.find(
    (entry) =>
      entry.id !== id &&
      isShortcutEditable(entry.id, entry.shortcut) &&
      normalizeShortcutLabel(entry.shortcut) === normalizedShortcut,
  );

  if (conflict) {
    return {
      valid: false,
      message: `This shortcut is already assigned to “${conflict.label}”.`,
    };
  }

  return { valid: true };
}

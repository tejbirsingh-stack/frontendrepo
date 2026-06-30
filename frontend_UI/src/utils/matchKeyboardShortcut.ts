import { formatKeyboardEventAsShortcut } from './formatKeyboardShortcut';

const NON_KEYBOARD_SHORTCUT_PATTERN = /click|pinch|scroll|→|menu\s*→/i;

export function normalizeShortcutLabel(label: string): string {
  return label
    .trim()
    .replace(/([⌘⌃⌥⇧])(?=[^\s])/g, '$1 ')
    .replace(/\s*\+\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

export function isKeyboardShortcutLabel(label: string): boolean {
  return Boolean(label.trim()) && !NON_KEYBOARD_SHORTCUT_PATTERN.test(label);
}

export function matchesKeyboardShortcut(
  event: KeyboardEvent,
  shortcutLabel: string,
): boolean {
  if (!isKeyboardShortcutLabel(shortcutLabel)) return false;

  const formatted = formatKeyboardEventAsShortcut(event);
  if (!formatted) return false;

  const normalizedEvent = normalizeShortcutLabel(formatted);
  const normalizedShortcut = normalizeShortcutLabel(shortcutLabel);

  if (normalizedEvent === normalizedShortcut) return true;

  // Keep zoom-in usable when rebound to "+" but user presses "=".
  if (
    normalizedShortcut === '+' &&
    (event.key === '=' || event.key === '+') &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.altKey &&
    !event.shiftKey
  ) {
    return true;
  }

  return false;
}

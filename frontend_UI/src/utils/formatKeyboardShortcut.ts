export function isMacPlatform(): boolean {
  return typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.platform);
}

const SPECIAL_KEY_LABELS: Record<string, string> = {
  ' ': 'Space',
  ArrowUp: '↑',
  ArrowDown: '↓',
  ArrowLeft: '←',
  ArrowRight: '→',
  Enter: 'Enter',
  Escape: 'Esc',
  Backspace: 'Backspace',
  Delete: 'Delete',
  Tab: 'Tab',
  Home: 'Home',
  End: 'End',
  PageUp: 'Page Up',
  PageDown: 'Page Down',
};

export function formatKeyLabel(key: string): string {
  if (SPECIAL_KEY_LABELS[key]) return SPECIAL_KEY_LABELS[key];
  if (key.length === 1) return key.toUpperCase();
  return key;
}

const MODIFIER_ONLY_KEYS = new Set(['Meta', 'Control', 'Alt', 'Shift', 'OS']);

/** Returns null when only a modifier key was pressed (combo still in progress). */
export function formatKeyboardEventAsShortcut(event: KeyboardEvent): string | null {
  if (MODIFIER_ONLY_KEYS.has(event.key)) {
    return null;
  }

  const isMac = isMacPlatform();
  const parts: string[] = [];

  if (isMac) {
    if (event.metaKey) parts.push('⌘');
    if (event.ctrlKey) parts.push('⌃');
    if (event.altKey) parts.push('⌥');
    if (event.shiftKey) parts.push('⇧');
    parts.push(formatKeyLabel(event.key));
    return parts.join(' ');
  }

  if (event.ctrlKey) parts.push('Ctrl');
  if (event.altKey) parts.push('Alt');
  if (event.shiftKey) parts.push('Shift');
  if (event.metaKey) parts.push('Win');
  parts.push(formatKeyLabel(event.key));
  return parts.join(' + ');
}

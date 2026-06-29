import {
  buildDefaultKeyboardShortcutCatalog,
  flattenKeyboardShortcuts,
  mergeKeyboardShortcutCatalog,
  type KeyboardShortcutCategory,
} from '../constants/appKeyboardShortcuts';
import { readKeyboardShortcutOverrides } from './keyboardShortcutStorage';

export function readResolvedKeyboardShortcutCatalog(): KeyboardShortcutCategory[] {
  return mergeKeyboardShortcutCatalog(
    buildDefaultKeyboardShortcutCatalog(),
    readKeyboardShortcutOverrides(),
  );
}

export function getResolvedShortcut(
  id: string,
  catalog = readResolvedKeyboardShortcutCatalog(),
): string | undefined {
  return flattenKeyboardShortcuts(catalog).find((entry) => entry.id === id)?.shortcut;
}

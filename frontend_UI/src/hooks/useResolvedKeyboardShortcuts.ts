import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  buildDefaultKeyboardShortcutCatalog,
  flattenKeyboardShortcuts,
  KEYBOARD_SHORTCUTS_STORAGE_KEY,
  mergeKeyboardShortcutCatalog,
  type KeyboardShortcutCategory,
} from '../constants/appKeyboardShortcuts';
import { readKeyboardShortcutOverrides } from '../utils/keyboardShortcutStorage';

export function useResolvedKeyboardShortcuts() {
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const handleUpdate = () => setRevision((current) => current + 1);

    window.addEventListener('noah-keyboard-shortcuts-updated', handleUpdate);
    window.addEventListener('storage', (event) => {
      if (event.key === KEYBOARD_SHORTCUTS_STORAGE_KEY) {
        handleUpdate();
      }
    });

    return () => {
      window.removeEventListener('noah-keyboard-shortcuts-updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const catalog = useMemo(
    () =>
      mergeKeyboardShortcutCatalog(
        buildDefaultKeyboardShortcutCatalog(),
        readKeyboardShortcutOverrides(),
      ),
    [revision],
  );

  const getShortcut = useCallback(
    (id: string) => flattenKeyboardShortcuts(catalog).find((entry) => entry.id === id)?.shortcut,
    [catalog],
  );

  return { catalog, getShortcut, revision };
}

export type { KeyboardShortcutCategory };

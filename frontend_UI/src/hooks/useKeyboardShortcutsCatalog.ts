import { useCallback, useMemo, useState } from 'react';
import {
  buildDefaultKeyboardShortcutCatalog,
  mergeKeyboardShortcutCatalog,
  type KeyboardShortcutCategory,
  type KeyboardShortcutOverrides,
} from '../constants/appKeyboardShortcuts';
import {
  readKeyboardShortcutOverrides,
  writeKeyboardShortcutOverrides,
} from '../utils/keyboardShortcutStorage';

export function useKeyboardShortcutsCatalog() {
  const defaultCatalog = useMemo(() => buildDefaultKeyboardShortcutCatalog(), []);
  const [overrides, setOverrides] = useState<KeyboardShortcutOverrides>(() =>
    readKeyboardShortcutOverrides(),
  );

  const catalog = useMemo(
    () => mergeKeyboardShortcutCatalog(defaultCatalog, overrides),
    [defaultCatalog, overrides],
  );

  const hasOverrides = Object.keys(overrides).length > 0;

  const updateShortcut = useCallback(
    (id: string, patch: { label?: string; shortcut?: string }) => {
      setOverrides((current) => {
        const next = {
          ...current,
          [id]: {
            ...current[id],
            ...patch,
          },
        };
        writeKeyboardShortcutOverrides(next);
        return next;
      });
    },
    [],
  );

  const resetShortcut = useCallback((id: string) => {
    setOverrides((current) => {
      const next = { ...current };
      delete next[id];
      writeKeyboardShortcutOverrides(next);
      return next;
    });
  }, []);

  const resetAll = useCallback(() => {
    setOverrides({});
    writeKeyboardShortcutOverrides({});
  }, []);

  const restoreDefaults = useCallback(() => {
    resetAll();
  }, [resetAll]);

  return {
    catalog,
    defaultCatalog,
    overrides,
    hasOverrides,
    updateShortcut,
    resetShortcut,
    resetAll,
    restoreDefaults,
  };
}

export type { KeyboardShortcutCategory };

import { useEffect, type RefObject } from 'react';
import { GLOBAL_SEARCH_CLEAR_EVENT } from '../components/dashboard/GlobalSearchField';
import { useResolvedKeyboardShortcuts } from './useResolvedKeyboardShortcuts';
import { matchesKeyboardShortcut } from '../utils/matchKeyboardShortcut';
import { getModKeyLabel } from '../constants/dashboardShortcuts';

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable;
}

export function useGlobalSearchKeyboard(
  searchInputRef: RefObject<HTMLInputElement | null>,
  enabled = true,
) {
  const { getShortcut } = useResolvedKeyboardShortcuts();

  const focusSearchShortcut = getShortcut('dashboard-focus-search') ?? '/';
  const focusSearchModShortcut =
    getShortcut('dashboard-focus-search-mod') ?? `${getModKeyLabel()} S`;
  const clearSearchShortcut = getShortcut('dashboard-clear-search') ?? 'Esc';

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (matchesKeyboardShortcut(event, focusSearchModShortcut)) {
        event.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
        return;
      }

      if (
        matchesKeyboardShortcut(event, focusSearchShortcut) &&
        !isEditableTarget(event.target)
      ) {
        event.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      if (
        matchesKeyboardShortcut(event, clearSearchShortcut) &&
        document.activeElement === searchInputRef.current &&
        searchInputRef.current?.value
      ) {
        event.preventDefault();
        window.dispatchEvent(new CustomEvent(GLOBAL_SEARCH_CLEAR_EVENT));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    clearSearchShortcut,
    enabled,
    focusSearchModShortcut,
    focusSearchShortcut,
    searchInputRef,
  ]);
}

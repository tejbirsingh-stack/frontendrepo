import type { CustomStamp, CustomStampId } from '../types/customStamps';

const STORAGE_KEY = 'noah-custom-stamp';

export const USER_CUSTOM_STAMP_ID = 'custom-user' as CustomStampId;

function isValidCustomStamp(value: unknown): value is CustomStamp {
  if (!value || typeof value !== 'object') return false;
  const stamp = value as Partial<CustomStamp>;
  return (
    typeof stamp.id === 'string' &&
    stamp.id.startsWith('custom-') &&
    typeof stamp.emoji === 'string' &&
    stamp.emoji.length > 0
  );
}

export function loadCustomStamp(): CustomStamp | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as unknown;
    const loaded = isValidCustomStamp(parsed)
      ? parsed
      : Array.isArray(parsed)
        ? parsed.find(isValidCustomStamp) ?? null
        : null;

    if (!loaded) return null;

    return {
      ...loaded,
      id: USER_CUSTOM_STAMP_ID,
    };

    return null;
  } catch {
    return null;
  }
}

export function saveCustomStamp(stamp: CustomStamp | null) {
  if (typeof window === 'undefined') return;

  if (stamp) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stamp));
  } else {
    window.localStorage.removeItem(STORAGE_KEY);
  }
}

export function createOrUpdateCustomStamp(emoji: string): CustomStamp {
  return {
    id: USER_CUSTOM_STAMP_ID,
    emoji,
    label: emoji,
  };
}

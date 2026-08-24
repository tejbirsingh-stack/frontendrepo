export interface CookieConsentPreferences {
  essential: boolean;   // Always true
  functional: boolean;  // User preferences (theme, layout)
  analytics: boolean;   // Usage tracking
  marketing: boolean;   // Ad pixels
  updatedAt?: string;
}

const STORAGE_KEY = 'noah_cookie_consent';

export const DEFAULT_CONSENT: CookieConsentPreferences = {
  essential: true,
  functional: true,
  analytics: false,
  marketing: false,
};

function getCookieValue(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

export function getStoredCookieConsent(): CookieConsentPreferences {
  try {
    // Check LocalStorage first, fallback to Cookie
    const raw = localStorage.getItem(STORAGE_KEY) || getCookieValue(STORAGE_KEY);
    if (!raw) return DEFAULT_CONSENT;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_CONSENT,
      ...parsed,
      essential: true, // Always force essential to true
    };
  } catch {
    return DEFAULT_CONSENT;
  }
}

export function saveCookieConsent(
  prefs: Omit<CookieConsentPreferences, 'essential' | 'updatedAt'>
): CookieConsentPreferences {
  const fullConsent: CookieConsentPreferences = {
    ...prefs,
    essential: true,
    updatedAt: new Date().toISOString(),
  };

  const jsonString = JSON.stringify(fullConsent);

  // 1. Save to LocalStorage
  try {
    localStorage.setItem(STORAGE_KEY, jsonString);
  } catch (err) {
    console.error('Failed to save cookie consent to localStorage:', err);
  }

  // 2. Set actual browser Cookie (1 year expiration) so it displays in DevTools -> Cookies
  try {
    const encodedValue = encodeURIComponent(jsonString);
    document.cookie = `${STORAGE_KEY}=${encodedValue}; path=/; max-age=31536000; SameSite=Lax`;
  } catch (err) {
    console.error('Failed to set browser cookie:', err);
  }

  return fullConsent;
}

export function acceptAllCookies(): CookieConsentPreferences {
  return saveCookieConsent({
    functional: true,
    analytics: true,
    marketing: true,
  });
}

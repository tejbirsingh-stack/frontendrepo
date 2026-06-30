const CONTROL_CHARS = /[\u0000-\u001F\u007F]/g;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Strip control characters and trim user-provided text. */
export function sanitizeTextInput(value: string, maxLength = 10_000): string {
  return value.replace(CONTROL_CHARS, '').trim().slice(0, maxLength);
}

/** Normalize and validate email-shaped input before auth/API use. */
export function sanitizeEmailInput(value: string): string {
  const normalized = sanitizeTextInput(value, 320).toLowerCase();
  return EMAIL_PATTERN.test(normalized) ? normalized : '';
}

/** Escape HTML entities when rendering untrusted strings outside React text nodes. */
export function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

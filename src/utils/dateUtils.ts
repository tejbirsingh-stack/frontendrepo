/**
 * Extracts a valid IANA timezone identifier from the user's dropdown format.
 * Example: "(UTC+09:00) Asia / Tokyo" -> "Asia/Tokyo"
 */
export function parseTimezone(tzString?: string): string | undefined {
  if (!tzString) return undefined;
  if (tzString.includes(') ')) {
    return tzString.split(') ')[1].replace(' / ', '/');
  }
  return tzString;
}

/**
 * Validates a timezone string. If invalid, falls back to undefined (local).
 */
export function getValidTimezone(tzString?: string): string | undefined {
  const parsed = parseTimezone(tzString);
  if (!parsed) return undefined;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: parsed }).format(new Date());
    return parsed;
  } catch (e) {
    return undefined; // Invalid timezone, fallback to local
  }
}

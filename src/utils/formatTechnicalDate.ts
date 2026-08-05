import { getValidTimezone } from './dateUtils';

/** e.g. May 26 2024 */
export function formatTechnicalDate(value?: string, tzString?: string): string {
  if (!value) return '—';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: getValidTimezone(tzString)
  })
    .format(date)
    .replace(',', '');
}

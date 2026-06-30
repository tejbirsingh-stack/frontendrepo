/** e.g. May 26 2024 */
export function formatTechnicalDate(value?: string): string {
  if (!value) return '—';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
    .format(date)
    .replace(',', '');
}

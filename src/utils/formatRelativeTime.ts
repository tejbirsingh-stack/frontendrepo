import { getValidTimezone } from './dateUtils';

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;

export function formatRelativeTime(timestamp: number, now = Date.now(), tzString?: string): string {
  const diff = Math.max(0, now - timestamp);

  if (diff < MINUTE) return 'just now';
  if (diff < HOUR) {
    const minutes = Math.floor(diff / MINUTE);
    return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  }
  if (diff < DAY) {
    const hours = Math.floor(diff / HOUR);
    return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  }
  if (diff < WEEK) {
    const days = Math.floor(diff / DAY);
    return `${days} day${days === 1 ? '' : 's'} ago`;
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: getValidTimezone(tzString)
  }).format(new Date(timestamp));
}

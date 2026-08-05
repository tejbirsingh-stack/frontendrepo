import { useAuth } from '../auth/AuthContext';
import { getValidTimezone } from '../utils/dateUtils';
import { formatTechnicalDate } from '../utils/formatTechnicalDate';
import { formatRelativeTime } from '../utils/formatRelativeTime';

export function useLocalizedDate() {
  const { user } = useAuth();
  const tz = user?.timezone;
  const timeZone = getValidTimezone(tz);

  return {
    formatDate: (dateString: string | number | Date, options?: Intl.DateTimeFormatOptions) => {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleDateString('en-US', { timeZone, ...options });
    },
    formatTime: (dateString: string | number | Date, options?: Intl.DateTimeFormatOptions) => {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleTimeString('en-US', { timeZone, ...options });
    },
    formatDateTime: (dateString: string | number | Date, dateOptions?: Intl.DateTimeFormatOptions, timeOptions?: Intl.DateTimeFormatOptions) => {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return '';
      const datePart = d.toLocaleDateString('en-US', { timeZone, ...dateOptions });
      const timePart = d.toLocaleTimeString('en-US', { timeZone, ...timeOptions });
      return `${datePart} ${timePart}`;
    },
    formatTechnical: (dateString?: string) => formatTechnicalDate(dateString, tz),
    formatRelative: (timestamp: number, now = Date.now()) => formatRelativeTime(timestamp, now, tz),
    timeZone // Expose the parsed valid IANA timezone string
  };
}

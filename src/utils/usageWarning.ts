import { cv } from '../theme/cssVars';
import type { UsageSummaryResponse, UsageWarningLevel } from '../types/usage';

export function progressBarColor(level: UsageWarningLevel): string {
  if (level === 'exceeded') return cv.errorText;
  if (level === 'warning') return cv.warning;
  return cv.brandGradient;
}

export function warningCopy(summary: UsageSummaryResponse): { title: string; body: string } | null {
  if (summary.warningLevel === 'ok') return null;

  if (summary.storageWarningLevel === 'exceeded') {
    return {
      title: 'Storage limit reached',
      body: 'Uploads are blocked until you free space or upgrade your plan.',
    };
  }
  if (summary.seatsWarningLevel === 'exceeded') {
    return {
      title: 'Member seats full',
      body: `All ${summary.membersTotal} seats are in use. Upgrade your plan to invite more members.`,
    };
  }
  if (summary.storageWarningLevel === 'warning') {
    return {
      title: 'Approaching storage limit',
      body: `You have used ${Math.round(summary.storageUsedPercent)}% of your storage. Consider upgrading soon.`,
    };
  }
  return {
    title: 'Approaching seat limit',
    body: `${summary.membersUsed} of ${summary.membersTotal} seats used. Adding more members may require a plan upgrade.`,
  };
}

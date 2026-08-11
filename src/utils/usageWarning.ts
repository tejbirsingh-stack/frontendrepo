import { cv } from '../theme/cssVars';
import type { UsageSummaryResponse, UsageWarningLevel } from '../types/usage';

export function progressBarColor(level: UsageWarningLevel): string {
  if (level === 'exceeded') return cv.errorText;
  if (level === 'warning') return cv.warning;
  return cv.brandGradient;
}

export interface BannerItem {
  id: string;
  title: string;
  body: string;
  severity: 'error' | 'warning';
}

export function warningBanners(summary: UsageSummaryResponse): BannerItem[] {
  const banners: BannerItem[] = [];

  // 1. Storage warnings/limits
  if (summary.storageWarningLevel === 'exceeded') {
    banners.push({
      id: 'storage-exceeded',
      title: 'Storage limit reached',
      body: 'Uploads are blocked until you free space or upgrade your plan.',
      severity: 'error',
    });
  } else if (summary.storageWarningLevel === 'warning') {
    banners.push({
      id: 'storage-warning',
      title: 'Approaching storage limit',
      body: `You have used ${Math.round(summary.storageUsedPercent)}% of your storage. Consider upgrading soon.`,
      severity: 'warning',
    });
  }

  // 2. Member seats warnings/limits
  if (summary.seatsWarningLevel === 'exceeded') {
    banners.push({
      id: 'seats-exceeded',
      title: 'Member seats full',
      body: `All ${summary.membersTotal} seats are in use. Upgrade your plan to invite more members.`,
      severity: 'error',
    });
  } else if (summary.seatsWarningLevel === 'warning') {
    const seatsPct = Math.round(summary.seatsUsedPercent ?? ((summary.membersUsed / Math.max(summary.membersTotal, 1)) * 100));
    banners.push({
      id: 'seats-warning',
      title: 'Approaching member seat limit',
      body: `${summary.membersUsed} of ${summary.membersTotal} seats used (${seatsPct}%). Adding more members will require a plan upgrade.`,
      severity: 'warning',
    });
  }

  return banners;
}

export function warningCopy(summary: UsageSummaryResponse): { title: string; body: string } | null {
  const banners = warningBanners(summary);
  return banners[0] ? { title: banners[0].title, body: banners[0].body } : null;
}

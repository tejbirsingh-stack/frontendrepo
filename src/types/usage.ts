export type UsageWarningLevel = 'ok' | 'warning' | 'exceeded';

export interface StorageBreakdownItem {
  id: string;
  label: string;
  valueLabel: string;
  valueBytes: number;
  color: string;
}

export interface StorageSystemItem {
  id: string;
  provider: 'BACKBLAZE_B2' | string;
  name: string;
  usedBytes: number;
  usedLabel: string;
}

export interface UsageSummaryResponse {
  membersUsed: number;
  membersTotal: number;
  membersActive: number;
  membersPending: number;
  seatsWarningLevel: UsageWarningLevel;
  storageUsedBytes: number;
  storageQuotaBytes: number;
  storageUsedLabel: string;
  storageCapLabel: string;
  storageUsedPercent: number;
  storageWarningLevel: UsageWarningLevel;
  warningLevel: UsageWarningLevel;
  storageBreakdown: StorageBreakdownItem[];
  storageSystems: StorageSystemItem[];
  transfers: {
    bandwidthBytesMonthToDate: number;
    bandwidthLabel: string;
  };
  b2Transactions?: {
    classA: number;
    classB: number;
  };
  projectsCount: number;
  workspacesCount: number;
  seatGuardrailMax: number;
}

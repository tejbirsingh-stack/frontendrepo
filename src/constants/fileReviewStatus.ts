export const FILE_REVIEW_STATUSES = [
  'New',
  'In-Progress',
  'Request for Review',
  'Under Review',
  'Approved',
  'Rejected',
] as const;

export type FileReviewStatus = (typeof FILE_REVIEW_STATUSES)[number];

export const DEFAULT_FILE_REVIEW_STATUS: FileReviewStatus = 'New';

/** Accent color for the status pill trigger (matches product states). */
export function getFileReviewStatusColor(status: FileReviewStatus): string {
  switch (status) {
    case 'Approved':
      return 'var(--noah-brand-teal)';
    case 'Rejected':
      return 'var(--noah-destructive)';
    case 'Request for Review':
    case 'Under Review':
      return 'var(--noah-warning)';
    case 'In-Progress':
      return 'var(--noah-brand-blue)';
    case 'New':
    default:
      return 'var(--noah-text-primary)';
  }
}

export function parseFileReviewStatus(value: unknown): FileReviewStatus {
  if (typeof value === 'string' && (FILE_REVIEW_STATUSES as readonly string[]).includes(value)) {
    return value as FileReviewStatus;
  }
  return DEFAULT_FILE_REVIEW_STATUS;
}

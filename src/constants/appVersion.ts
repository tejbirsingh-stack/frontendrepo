export const APP_VERSION = {
  major: 6,
  minor: 23,
  patch: 0,
  label: 'Dist build',
  date: '07/24/2026',
} as const;

export function getAppVersionLabel(): string {
  const { major, minor, patch, label, date } = APP_VERSION;
  return `Version - ${major}.${minor}.${patch} - ${label} - ${date}`;
}

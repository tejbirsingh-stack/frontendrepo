export const APP_VERSION = {
  major: 5,
  minor: 1,
  patch: 0,
  label: 'Auth',
  date: '06/10/2026',
} as const;

export function getAppVersionLabel(): string {
  const { major, minor, patch, label, date } = APP_VERSION;
  return `Version - ${major}.${minor}.${patch} - ${label} - ${date}`;
}

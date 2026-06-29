/**
 * Resolved color values for MUI `createTheme` palette only.
 * MUI computes contrast ratios at runtime and cannot use CSS custom properties.
 * Keep in sync with `src/styles/_palette.scss`.
 */
export type ThemeMode = 'light' | 'dark';

const shared = {
  borderFocus: '#d28cff',
  borderInputHover: 'rgba(210, 140, 255, 0.45)',
  brandBlue: '#8e44ad',
  brandBlueLight: '#d28cff',
  brandBlueDark: '#703688',
  brandPurple: '#8e44ad',
  brandPurpleLight: '#d28cff',
  brandPurpleDark: '#703688',
  destructive: '#f87171',
  destructiveHover: 'rgba(239, 68, 68, 0.12)',
  destructiveBorder: '#ef4444',
  textOnCta: '#ffffff',
} as const;

export const muiPaletteDark = {
  ...shared,
  bg: '#121212',
  surface: '#1c1c1c',
  surfaceSubtle: 'rgba(45, 49, 66, 0.35)',
  border: 'rgba(74, 78, 105, 0.45)',
  textPrimary: '#f0f0f5',
  textSecondary: '#9aa3b8',
  textMuted: 'rgba(240, 240, 245, 0.55)',
  drawerSurface: 'rgba(28, 28, 28, 0.96)',
} as const;

export const muiPaletteLight = {
  ...shared,
  bg: '#f4f5f9',
  surface: '#ffffff',
  surfaceSubtle: 'rgba(45, 49, 66, 0.05)',
  border: 'rgba(74, 78, 105, 0.22)',
  borderInputHover: 'rgba(142, 68, 173, 0.38)',
  textPrimary: '#121212',
  textSecondary: '#5c6078',
  textMuted: 'rgba(31, 42, 68, 0.62)',
  drawerSurface: 'rgba(255, 255, 255, 0.96)',
} as const;

export type MuiPaletteTokens = typeof muiPaletteDark | typeof muiPaletteLight;

export function getMuiPalette(mode: ThemeMode): MuiPaletteTokens {
  return mode === 'light' ? muiPaletteLight : muiPaletteDark;
}

/** @deprecated Use getMuiPalette(mode) */
export const muiPalette = muiPaletteDark;

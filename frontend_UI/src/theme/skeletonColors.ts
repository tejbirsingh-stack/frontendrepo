import { getMuiPalette, type ThemeMode } from './muiPalette';

/** Resolved hex/rgba colors for react-loading-skeleton (CSS vars are too faint). */
export function getSkeletonThemeColors(mode: ThemeMode) {
  const palette = getMuiPalette(mode);

  if (mode === 'dark') {
    return {
      baseColor: palette.surfaceSubtle,
      highlightColor: palette.border,
    };
  }

  return {
    baseColor: '#dce0e8',
    highlightColor: palette.border,
  };
}

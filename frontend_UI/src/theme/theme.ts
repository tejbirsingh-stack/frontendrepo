import type { Theme } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';
import { cv } from './cssVars';
import { getMuiPalette, type ThemeMode } from './muiPalette';

export type { ThemeMode };

export const colors = {
  background: cv.bg,
  surface: cv.surface,
  surfaceHover: cv.surfaceHover,
  border: cv.border,
  borderFocus: cv.borderFocus,
  active: cv.textPrimary,
  textPrimary: cv.textPrimary,
  textSecondary: cv.textSecondary,
  textMuted: cv.textMuted,
  blue: cv.brandBlue,
  purple: cv.brandPurple,
  destructive: cv.destructive,
  destructiveHover: cv.destructiveHover,
  destructiveBorder: cv.destructiveBorder,
  brandGradient: cv.brandGradient,
} as const;

export type AppColors = typeof colors;

export function createAppTheme(mode: ThemeMode = 'dark'): Theme {
  const palette = getMuiPalette(mode);

  return createTheme({
    palette: {
      mode,
      primary: {
        main: palette.brandBlue,
        light: palette.brandBlueLight,
        dark: palette.brandBlueDark,
      },
      secondary: {
        main: palette.brandPurple,
        light: palette.brandPurpleLight,
        dark: palette.brandPurpleDark,
      },
      background: {
        default: palette.bg,
        paper: palette.surface,
      },
      text: {
        primary: palette.textPrimary,
        secondary: palette.textSecondary,
      },
      divider: palette.border,
    },
    typography: {
      fontFamily:
        '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
      h1: {
        fontWeight: 600,
        letterSpacing: '-0.02em',
      },
      h2: {
        fontWeight: 600,
        letterSpacing: '-0.02em',
      },
      h3: {
        fontWeight: 600,
        letterSpacing: '-0.01em',
      },
      body1: {
        letterSpacing: '-0.01em',
      },
      button: {
        textTransform: 'none',
        fontWeight: 500,
        letterSpacing: '-0.01em',
      },
    },
    shape: {
      borderRadius: 16,
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: cv.bg,
            color: cv.textPrimary,
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: '12px',
            padding: '12px 24px',
            fontSize: '0.9375rem',
          },
          contained: {
            color: palette.textOnCta,
            fontWeight: 600,
            '&:hover': {
              color: palette.textOnCta,
            },
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: '12px',
              backgroundColor: cv.surfaceSubtle,
              transition: 'all 0.25s ease',
              '& fieldset': {
                borderColor: cv.border,
              },
              '&:hover fieldset': {
                borderColor: cv.borderInputHover,
              },
              '&.Mui-focused fieldset': {
                borderColor: cv.borderFocus,
                borderWidth: 1,
              },
            },
            '& .MuiInputLabel-root.Mui-focused': {
              color: cv.textPrimary,
            },
          },
        },
      },
      MuiAvatar: {
        styleOverrides: {
          root: {
            color: cv.textPrimary,
            fontWeight: 700,
          },
        },
      },
      MuiCheckbox: {
        styleOverrides: {
          root: {
            color: cv.textMuted,
            '&.Mui-checked': {
              color: cv.brandBlue,
            },
          },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            padding: '6px 10px',
            borderRadius: '8px',
            backgroundColor: cv.tooltipSurface,
            color: cv.tooltipText,
            border: `1px solid ${cv.border}`,
            boxShadow: cv.tooltipShadow,
            fontSize: '0.8125rem',
            fontWeight: 500,
            letterSpacing: '-0.01em',
            maxWidth: 280,
          },
          arrow: {
            color: cv.tooltipSurface,
            '&::before': {
              border: `1px solid ${cv.border}`,
            },
          },
        },
      },
    },
  });
}

export const theme = createAppTheme();

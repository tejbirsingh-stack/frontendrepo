import { cv } from '../theme/cssVars';

/** Ensures MUI inputs use CSS-var text colors (not resolved light-theme palette). */
export const searchFieldInputSx = {
  color: cv.textPrimary,
  '& input::placeholder': {
    color: cv.textMuted,
    opacity: 1,
  },
} as const;

import { Box, Typography, type SxProps, type Theme } from '@mui/material';
import { cv } from '../../theme/cssVars';
import type { ReactNode, Ref } from 'react';

interface LabeledToolbarButtonProps {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  ariaLabel?: string;
  ariaPressed?: boolean;
  ariaExpanded?: boolean;
  ariaHaspopup?: boolean | 'menu' | 'dialog';
  buttonRef?: Ref<HTMLButtonElement>;
  children: ReactNode;
  sx?: SxProps<Theme>;
}

export default function LabeledToolbarButton({
  label,
  active = false,
  disabled = false,
  onClick,
  ariaLabel,
  ariaPressed,
  ariaExpanded,
  ariaHaspopup,
  buttonRef,
  children,
  sx,
}: LabeledToolbarButtonProps) {
  return (
    <Box
      component="button"
      ref={buttonRef}
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={ariaLabel ?? label}
      aria-pressed={ariaPressed}
      aria-expanded={ariaExpanded}
      aria-haspopup={ariaHaspopup}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        gap: 0.35,
        minWidth: 52,
        maxWidth: 64,
        px: 0.35,
        py: 0.35,
        border: 'none',
        background: 'transparent',
        cursor: disabled ? 'not-allowed' : 'pointer',
        flexShrink: 0,
        opacity: disabled ? 0.45 : 1,
        ...sx,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 36,
          height: 36,
          borderRadius: '10px',
          color: active ? cv.textPrimary : cv.textSecondary,
          background: active
            ? cv.stampGradient
            : 'transparent',
          border: active ? `1px solid ${cv.purpleSelectionBorder}` : '1px solid transparent',
          transition: 'all 0.2s ease',
          '&:hover': disabled
            ? undefined
            : {
                backgroundColor: active ? undefined : cv.surfaceHover,
                color: cv.textPrimary,
              },
        }}
      >
        {children}
      </Box>
      <Typography
        component="span"
        sx={{
          fontSize: '0.625rem',
          fontWeight: 500,
          lineHeight: 1.2,
          textAlign: 'center',
          color: active ? cv.textPrimary : cv.textMuted,
          maxWidth: '100%',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </Typography>
    </Box>
  );
}

export const mergedMobileIslandSx = {
  display: 'inline-flex',
  alignItems: 'stretch',
  gap: 0.25,
  px: 0.75,
  py: 0.5,
  borderRadius: '999px',
  border: '1px solid var(--noah-border)',
  background: 'var(--noah-toolbar-surface)',
  backdropFilter: 'blur(24px) saturate(160%)',
  WebkitBackdropFilter: 'blur(24px) saturate(160%)',
  boxShadow: cv.toolbarShadow,
  flexShrink: 0,
} as const;

export const mobileIslandScrollSx = {
  width: '100%',
  overflowX: 'auto',
  overflowY: 'hidden',
  WebkitOverflowScrolling: 'touch',
  scrollbarWidth: 'none',
  msOverflowStyle: 'none',
  '&::-webkit-scrollbar': { display: 'none' },
} as const;

export const toolbarHorizontalScrollSx = {
  maxWidth: '100%',
  minWidth: 0,
  overflowX: 'auto',
  overflowY: 'hidden',
  WebkitOverflowScrolling: 'touch',
  scrollbarWidth: 'thin',
  scrollbarColor: `${cv.whiteBorderDashed} transparent`,
  '&::-webkit-scrollbar': {
    height: 6,
  },
  '&::-webkit-scrollbar-thumb': {
    backgroundColor: cv.whiteBorderDashed,
    borderRadius: 999,
  },
  '&::-webkit-scrollbar-track': {
    backgroundColor: 'transparent',
  },
} as const;

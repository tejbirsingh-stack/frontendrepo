import type { SxProps, Theme } from '@mui/material';
import { cv } from '../theme/cssVars';

export type BadgeSize = 'sm' | 'md';

const badgeSizes = {
  sm: { px: 1.25, py: 0.3, fontSize: '0.625rem', gap: 0.5, iconSize: 12, deleteSize: 22 },
  md: { px: 1.5, py: 0.45, fontSize: '0.6875rem', gap: 0.625, iconSize: 14, deleteSize: 24 },
} as const;

export function getBadgeSizeTokens(size: BadgeSize = 'sm') {
  return badgeSizes[size];
}

export function filledBadgeStyles(size: BadgeSize = 'sm'): SxProps<Theme> {
  const tokens = badgeSizes[size];

  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.gap,
    flexShrink: 0,
    px: tokens.px,
    py: tokens.py,
    borderRadius: '999px',
    background: cv.badgeFilledGradient,
    border: `1px solid ${cv.badgeFilledBorder}`,
    boxShadow: cv.planBadgeGlow,
    userSelect: 'none',
    verticalAlign: 'middle',
    maxWidth: '100%',
    pointerEvents: 'none',
  };
}

export function outlinedBadgeStyles(size: BadgeSize = 'md'): SxProps<Theme> {
  const tokens = badgeSizes[size];

  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: tokens.gap,
    flexShrink: 0,
    px: tokens.px,
    py: tokens.py,
    borderRadius: '999px',
    backgroundColor: cv.badgeOutlinedBg,
    border: `1px solid ${cv.badgeOutlinedBorder}`,
    color: cv.badgeOutlinedText,
    maxWidth: '100%',
    verticalAlign: 'middle',
  };
}

export function badgeLabelStyles(
  variant: 'filled' | 'outlined',
  size: BadgeSize = 'sm',
): SxProps<Theme> {
  const tokens = badgeSizes[size];

  return {
    fontSize: tokens.fontSize,
    fontWeight: 700,
    letterSpacing: variant === 'filled' ? '0.08em' : '0.02em',
    textTransform: variant === 'filled' ? 'uppercase' : 'none',
    color: variant === 'filled' ? cv.badgeFilledText : 'inherit',
    lineHeight: 1.2,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  };
}

export function badgeIconStyles(size: BadgeSize = 'md'): SxProps<Theme> {
  const tokens = badgeSizes[size];

  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    fontSize: tokens.iconSize,
    color: 'inherit',
    lineHeight: 0,
  };
}

export function badgeDeleteButtonStyles(size: BadgeSize = 'md'): SxProps<Theme> {
  const tokens = badgeSizes[size];

  return {
    width: tokens.deleteSize,
    height: tokens.deleteSize,
    ml: 0.25,
    p: 0,
    color: 'inherit',
    opacity: 0.85,
    '&:hover': {
      opacity: 1,
      backgroundColor: cv.purpleSurfaceHover,
    },
  };
}

/** Deletable tag chips on light/dark surfaces — uses badge contrast tokens. */
export function tagChipStyles(): SxProps<Theme> {
  return {
    height: 28,
    borderRadius: '999px',
    fontWeight: 600,
    backgroundColor: cv.badgeOutlinedBg,
    color: cv.badgeOutlinedText,
    border: `1px solid ${cv.badgeOutlinedBorder}`,
    '& .MuiChip-label': { px: 1.25 },
    '& .MuiChip-deleteIcon': {
      color: cv.badgeOutlinedText,
      opacity: 0.72,
      '&:hover': { color: cv.badgeOutlinedText, opacity: 1 },
    },
  };
}

/** Filter / picker tag chips with selected state. */
export function filterTagChipStyles(selected: boolean): SxProps<Theme> {
  return {
    height: 30,
    borderRadius: '999px',
    fontSize: '0.8125rem',
    fontWeight: 600,
    cursor: 'pointer',
    backgroundColor: selected ? cv.purpleSelection : cv.badgeOutlinedBg,
    color: cv.badgeOutlinedText,
    border: `1px solid ${selected ? cv.badgeOutlinedBorder : cv.purpleChipBorder}`,
    '&:hover': {
      backgroundColor: selected ? cv.purpleSelectionStrong : cv.purpleSelectionHover,
    },
    '& .MuiChip-label': { px: 1.25 },
  };
}

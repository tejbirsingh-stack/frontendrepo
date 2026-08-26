import { cv } from '../../theme/cssVars';

/** Shared look for platform data tables: styled header row, zebra body, hover highlight. */
export const platformTableSx = {
  borderCollapse: 'separate',
  borderSpacing: 0,
  '& thead th': {
    background: cv.surfaceMuted,
    borderBottom: `1px solid ${cv.borderStrong}`,
    borderTop: `1px solid ${cv.border}`,
    color: cv.textMuted,
    fontSize: '0.6875rem',
    fontWeight: 700,
    letterSpacing: '0.07em',
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
    py: 1.25,
    lineHeight: 1.4,
  },
  '& thead th:first-of-type': {
    borderLeft: `1px solid ${cv.border}`,
    borderTopLeftRadius: '6px',
  },
  '& thead th:last-of-type': {
    borderRight: `1px solid ${cv.border}`,
    borderTopRightRadius: '6px',
  },
  '& thead th[aria-sort]': {
    background: cv.purpleSurface,
    color: cv.textPrimary,
  },
  '& tbody td': {
    borderBottom: `1px solid ${cv.dividerSubtle}`,
    color: cv.textSecondary,
    fontSize: '0.8125rem',
    py: 1.25,
  },
  '& tbody tr:nth-of-type(even) td': {
    background: cv.surfaceSubtle,
  },
  '& tbody tr:last-of-type td': {
    borderBottom: 'none',
  },
  '& tbody tr td': {
    transition: 'background 0.15s ease',
  },
  '& tbody tr:hover td': {
    background: cv.surfaceHover,
  },
} as const;

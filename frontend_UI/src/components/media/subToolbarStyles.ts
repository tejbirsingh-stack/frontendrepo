import { cv } from '../../theme/cssVars';

export const subToolbarIslandBaseSx = {
  display: 'flex',
  alignItems: 'center',
  borderRadius: '999px',
  border: '1px solid var(--noah-border)',
  background: 'var(--noah-subtoolbar-surface)',
  backdropFilter: 'blur(24px) saturate(160%)',
  WebkitBackdropFilter: 'blur(24px) saturate(160%)',
  boxShadow: cv.toolbarShadow,
} as const;

export const subToolbarHorizontalScrollSx = {
  minWidth: 0,
  overflowX: 'auto',
  overflowY: 'hidden',
  WebkitOverflowScrolling: 'touch',
  scrollbarWidth: 'none',
  msOverflowStyle: 'none',
  '&::-webkit-scrollbar': { display: 'none' },
  flexWrap: 'nowrap',
} as const;

export function subToolbarIslandResponsiveSx(
  desktopMaxWidth: number,
  options?: { overlay?: boolean },
) {
  const overlay = options?.overlay ?? false;

  return {
    gap: 0.5,
    px: 1.25,
    py: 0.75,
    width: overlay ? 'max-content' : { xs: '100%', md: 'auto' },
    maxWidth: overlay ? '100%' : { xs: '100%', md: `min(96vw, ${desktopMaxWidth}px)` },
    ...subToolbarHorizontalScrollSx,
  } as const;
}

export const mobileSubToolbarOverlaySlotSx = {
  position: 'absolute',
  left: 8,
  right: 8,
  bottom: '100%',
  mb: 1,
  zIndex: 20,
  display: 'flex',
  justifyContent: 'flex-start',
  overflow: 'hidden',
  pointerEvents: 'none',
  '& > *': {
    pointerEvents: 'auto',
    maxWidth: '100%',
    minWidth: 0,
  },
} as const;

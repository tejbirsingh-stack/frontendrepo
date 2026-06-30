/** Max height for overlay panels (comments, text popups) within the viewport */
export const OVERLAY_PANEL_MAX_HEIGHT = 'min(480px, calc(100dvh - 180px))';

/** Max height for scrollable text/content areas inside overlay panels */
export const OVERLAY_CONTENT_MAX_HEIGHT = 'min(320px, calc(100dvh - 280px))';

export const overlayScrollContainerSx = {
  overflowY: 'auto',
  overflowX: 'hidden',
  overscrollBehavior: 'contain',
  WebkitOverflowScrolling: 'touch',
} as const;

export const overlayMultilineFieldSx = {
  '& .MuiInputBase-input': {
    boxSizing: 'border-box',
  },
  '& textarea': {
    display: 'block',
    width: '100%',
    maxHeight: `${OVERLAY_CONTENT_MAX_HEIGHT} !important`,
    overflowY: 'auto !important',
    resize: 'none',
  },
} as const;

/** Max height for a single history entry body before internal scroll */
export const HISTORY_ENTRY_BODY_MAX_HEIGHT = 120;

export const historyEntryBodyScrollSx = {
  maxHeight: HISTORY_ENTRY_BODY_MAX_HEIGHT,
  ...overlayScrollContainerSx,
} as const;

export const longFormTextSx = {
  wordBreak: 'break-word',
  overflowWrap: 'anywhere',
  whiteSpace: 'pre-wrap',
} as const;

/** Keep tall text popups inside the video frame by anchoring growth away from edges */
export function getTextPopupTransform(yPercent: number): string {
  if (yPercent <= 30) {
    return 'translate(-50%, 0)';
  }
  if (yPercent >= 70) {
    return 'translate(-50%, -100%)';
  }
  return 'translate(-50%, -50%)';
}

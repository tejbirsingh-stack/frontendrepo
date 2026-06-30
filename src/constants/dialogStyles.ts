import type { DialogProps } from '@mui/material';
import { cv } from '../theme/cssVars';
import { DIALOG_Z_INDEX, NESTED_DIALOG_Z_INDEX } from './dropdownMenu';

export const noahDialogPaperSx = {
  borderRadius: '20px',
  border: `1px solid ${cv.border}`,
  background: cv.dialogSurfaceStrong,
  backgroundColor: cv.dialogSurface,
  backdropFilter: 'blur(40px) saturate(180%)',
  boxShadow: cv.dialogShadow,
  overflow: 'visible',
};

export const noahDialogBackdropSx = {
  backgroundColor: cv.backdropScrimStrong,
  backdropFilter: 'blur(4px)',
};

export function noahDialogSlotProps(
  paperSx?: Record<string, unknown>,
): DialogProps['slotProps'] {
  return {
    paper: {
      sx: {
        ...noahDialogPaperSx,
        ...paperSx,
      },
    },
    backdrop: {
      sx: noahDialogBackdropSx,
    },
    root: {
      sx: { zIndex: DIALOG_Z_INDEX },
    },
  };
}

export function noahNestedDialogSlotProps(
  paperSx?: Record<string, unknown>,
): DialogProps['slotProps'] {
  return {
    ...noahDialogSlotProps(paperSx),
    root: {
      sx: { zIndex: NESTED_DIALOG_Z_INDEX },
    },
  };
}

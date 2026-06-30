import { cv } from '../theme/cssVars';
export const DIALOG_Z_INDEX = 1400;
export const DIALOG_MENU_Z_INDEX = 1500;
export const TOAST_Z_INDEX = 1600;
export const NESTED_DIALOG_Z_INDEX = DIALOG_Z_INDEX + 2;

export const dropdownMenuPaperSx = {
  mt: 0.5,
  borderRadius: '12px',
  border: '1px solid var(--noah-border)',
  backgroundColor: cv.elevatedSurface,
  backgroundImage: 'none',
  boxShadow: cv.dropdownShadow,
};

export const dropdownMenuProps = {
  slotProps: {
    paper: {
      sx: dropdownMenuPaperSx,
      elevation: 0,
    },
  },
};

/** Use inside dialogs — menu must render above modal z-index (1400). */
export const dropdownMenuInDialogProps = {
  disableScrollLock: true,
  sx: { zIndex: DIALOG_MENU_Z_INDEX },
  slotProps: {
    root: {
      sx: { zIndex: DIALOG_MENU_Z_INDEX },
    },
    paper: {
      sx: dropdownMenuPaperSx,
      elevation: 0,
    },
  },
};

export const textFieldSelectInDialogSlotProps = {
  select: {
    MenuProps: dropdownMenuInDialogProps,
  },
} as const;

export const selectInDialogMenuProps = dropdownMenuInDialogProps;

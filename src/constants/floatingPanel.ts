export const FLOATING_PANEL_Z_INDEX = 1500;
export const FLOATING_PANEL_OVERLAY_Z_INDEX = 1600;

export const floatingPanelMenuSlotProps = {
  root: { sx: { zIndex: FLOATING_PANEL_OVERLAY_Z_INDEX } },
} as const;

export const floatingPanelPopoverSlotProps = {
  root: { sx: { zIndex: FLOATING_PANEL_OVERLAY_Z_INDEX } },
} as const;

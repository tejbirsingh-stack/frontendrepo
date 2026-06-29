export const SIDE_PANEL_WIDTH = 260;
export const NOTIFICATION_DRAWER_WIDTH = SIDE_PANEL_WIDTH * 2;
/** Dashboard header + sidebar logo bar share this height so their bottom borders align. */
export const DASHBOARD_TOP_BAR_HEIGHT = 64;
/** Shared bottom border for the dashboard header and sidebar logo bar. */
export const DASHBOARD_TOP_BAR_BORDER = '1px solid var(--noah-border)';
/** Shared Noah logo width in compact headers (landing + video annotation, mobile/tablet). */
export const HEADER_LOGO_WIDTH = 72;
/** Annotation footer island sizing (mobile vs desktop). */
export const ANNOTATION_TOOL_BUTTON_SIZE = { xs: 36, lg: 48 } as const;
export const ANNOTATION_TOOL_ICON_SIZE = { xs: 18, lg: 24 } as const;
export const WORKSPACE_CONTROL_SIZE = { xs: 32, lg: 36 } as const;
export const WORKSPACE_CONTROL_ICON_SIZE = { xs: 16, lg: 18 } as const;
/** Sidebar is persistent at this MUI breakpoint and above (lg = 1200px). Below: hamburger drawer. */
export const SIDEBAR_DESKTOP_BREAKPOINT = 'lg' as const;

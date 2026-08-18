import { useEffect, useRef, useState } from 'react';
import { Box, IconButton, type SxProps, type Theme } from '@mui/material';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { cv } from '../../theme/cssVars';
import HelpMenuDrawer, { getHelpMenuShortcutLabel } from './HelpMenuDrawer';
import ShortcutTooltip from './ShortcutTooltip';
import { useResolvedKeyboardShortcuts } from '../../hooks/useResolvedKeyboardShortcuts';
import { matchesKeyboardShortcut } from '../../utils/matchKeyboardShortcut';

export type MediaRailPanel = 'history' | 'details' | 'ai';

export const MEDIA_SIDE_RAIL_WIDTH = 52;

const BUTTON_SIZE = 40;
const ICON_SIZE = 21;

const railButtonSx = (active: boolean): SxProps<Theme> => ({
  width: BUTTON_SIZE,
  height: BUTTON_SIZE,
  borderRadius: '12px',
  color: active ? cv.textPrimary : cv.textSecondary,
  backgroundColor: active ? cv.purpleSelectionHover : 'transparent',
  boxShadow: active ? `inset 0 0 0 1px ${cv.purpleSelectionStrong}` : 'none',
  transition: 'background-color 0.15s ease, color 0.15s ease',
  '&:hover': {
    color: cv.textPrimary,
    backgroundColor: active ? cv.purpleSelectionMedium : cv.surfaceHover,
  },
});

interface MediaSideRailProps {
  activePanel: MediaRailPanel | null;
  onPanelSelect: (panel: MediaRailPanel) => void;
  onKeyboardShortcuts: () => void;
  /** Hides the annotation panel button when the viewer has no comment access. */
  showAnnotations?: boolean;
}

export default function MediaSideRail({
  activePanel,
  onPanelSelect,
  onKeyboardShortcuts,
  showAnnotations = true,
}: MediaSideRailProps) {
  const helpButtonRef = useRef<HTMLButtonElement>(null);
  const [helpMenuOpen, setHelpMenuOpen] = useState(false);
  const { getShortcut } = useResolvedKeyboardShortcuts();

  const helpShortcut = getShortcut('media-open-help') ?? getHelpMenuShortcutLabel();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (matchesKeyboardShortcut(event, helpShortcut)) {
        event.preventDefault();
        setHelpMenuOpen((open) => !open);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [helpShortcut]);

  const panelButtons: {
    panel: MediaRailPanel;
    label: string;
    icon: typeof ForumOutlinedIcon;
  }[] = [
    ...(showAnnotations
      ? [{ panel: 'history' as const, label: 'Annotations', icon: ForumOutlinedIcon }]
      : []),
    { panel: 'details', label: 'Details', icon: InfoOutlinedIcon },
    { panel: 'ai', label: 'AI insights', icon: AutoAwesomeOutlinedIcon },
  ];

  return (
    <Box
      component="nav"
      role="toolbar"
      aria-orientation="vertical"
      aria-label="Media panels"
      sx={{
        flexShrink: 0,
        width: MEDIA_SIDE_RAIL_WIDTH,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 0.75,
        py: 1,
        borderRadius: '16px',
        border: '1px solid var(--noah-border)',
        background: 'var(--noah-toolbar-surface)',
        backdropFilter: 'blur(24px) saturate(160%)',
        WebkitBackdropFilter: 'blur(24px) saturate(160%)',
        boxShadow: cv.islandShadow,
      }}
    >
      {panelButtons.map(({ panel, label, icon: Icon }) => {
        const isActive = activePanel === panel;

        return (
          <ShortcutTooltip key={panel} label={label} placement="left">
            <IconButton
              type="button"
              aria-label={label}
              aria-pressed={isActive}
              onClick={() => onPanelSelect(panel)}
              sx={railButtonSx(isActive)}
            >
              <Icon sx={{ fontSize: ICON_SIZE }} />
            </IconButton>
          </ShortcutTooltip>
        );
      })}

      <Box sx={{ flex: 1, minHeight: 8 }} />

      <ShortcutTooltip label="Help" shortcut={helpShortcut} placement="left">
        <IconButton
          ref={helpButtonRef}
          type="button"
          aria-label="Help"
          aria-haspopup="menu"
          aria-expanded={helpMenuOpen}
          onClick={() => setHelpMenuOpen((open) => !open)}
          sx={railButtonSx(helpMenuOpen)}
        >
          <HelpOutlineOutlinedIcon sx={{ fontSize: ICON_SIZE }} />
        </IconButton>
      </ShortcutTooltip>

      <HelpMenuDrawer
        open={helpMenuOpen}
        anchorEl={helpButtonRef.current}
        onClose={() => setHelpMenuOpen(false)}
        onKeyboardShortcuts={onKeyboardShortcuts}
      />
    </Box>
  );
}

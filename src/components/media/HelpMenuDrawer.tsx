import { useEffect } from 'react';
import { cv } from '../../theme/cssVars';
import { Box, Divider, Popover, Typography } from '@mui/material';
import { getAppVersionLabel } from '../../constants/appVersion';

export function getHelpMenuShortcutLabel(): string {
  const isMac =
    typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.platform);
  return isMac ? '⌘⇧?' : 'Ctrl+Shift+?';
}

const menuSurfaceSx = {
  width: 248,
  py: 0.75,
  borderRadius: '12px',
  border: "1px solid var(--noah-border)",
  background: 'var(--noah-popover-surface)',
  backdropFilter: 'blur(24px) saturate(160%)',
  WebkitBackdropFilter: 'blur(24px) saturate(160%)',
  boxShadow: cv.popoverShadow,
};

const menuItemSx = {
  display: 'flex',
  alignItems: 'center',
  gap: 1,
  width: '100%',
  px: 2,
  py: 1.05,
  border: 'none',
  background: 'transparent',
  color: cv.textPrimary,
  cursor: 'pointer',
  textAlign: 'left' as const,
  '&:hover': {
    backgroundColor: cv.surfaceHover,
  },
};

const shortcutBadgeSx = {
  minWidth: 22,
  height: 22,
  px: 0.5,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '6px',
  backgroundColor: cv.surfaceRaised,
  color: cv.textSecondary,
  fontSize: '0.75rem',
  fontWeight: 600,
  lineHeight: 1,
};

const HELP_CENTER_URL = import.meta.env.VITE_HELP_CENTER_URL || 'https://docs.noah.app';
const SUPPORT_FORUM_URL = import.meta.env.VITE_SUPPORT_FORUM_URL || 'https://forum.noah.app';
const SUPPORT_EMAIL = 'support@noah.app';

const HELP_MENU_SECTIONS: string[][] = [
  ['Help Center', 'Support Forum', 'References'],
  ['Submit feedback', 'Contact support'],
  ['Change keyboard layout...'],
];

interface HelpMenuDrawerProps {
  open: boolean;
  anchorEl: HTMLElement | null;
  onClose: () => void;
  onKeyboardShortcuts: () => void;
}

function ShortcutBadges() {
  const isMac =
    typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.platform);

  const badges = isMac ? ['⌘', '⇧', '?'] : ['Ctrl', 'Shift', '?'];

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 'auto', flexShrink: 0 }}>
      {badges.map((badge) => (
        <Box key={badge} component="kbd" sx={shortcutBadgeSx}>
          {badge}
        </Box>
      ))}
    </Box>
  );
}

export default function HelpMenuDrawer({
  open,
  anchorEl,
  onClose,
  onKeyboardShortcuts,
}: HelpMenuDrawerProps) {
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  const handleItemClick = (label: string) => {
    onClose();
    if (label === 'Help Center') {
      window.open(HELP_CENTER_URL, '_blank', 'noopener,noreferrer');
    } else if (label === 'Support Forum') {
      window.open(SUPPORT_FORUM_URL, '_blank', 'noopener,noreferrer');
    } else if (label === 'References') {
      window.open(`${HELP_CENTER_URL}/references`, '_blank', 'noopener,noreferrer');
    } else if (label === 'Submit feedback') {
      window.open(`mailto:${SUPPORT_EMAIL}?subject=Feedback`, '_blank');
    } else if (label === 'Contact support') {
      window.open(`mailto:${SUPPORT_EMAIL}?subject=Support Request`, '_blank');
    } else if (label === 'Change keyboard layout...') {
      onKeyboardShortcuts();
    }
  };

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      transformOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      slotProps={{
        paper: { sx: menuSurfaceSx, elevation: 0 },
      }}
    >
      <Box role="menu" aria-label="Help menu">
        {HELP_MENU_SECTIONS[0].map((label) => (
          <Box
            key={label}
            component="button"
            type="button"
            role="menuitem"
            onClick={() => handleItemClick(label)}
            sx={menuItemSx}
          >
            <Typography sx={{ fontSize: '0.9375rem', fontWeight: 400 }}>{label}</Typography>
          </Box>
        ))}

        <Divider sx={{ my: 0.75, borderColor: cv.border }} />

        {HELP_MENU_SECTIONS[1].map((label) => (
          <Box
            key={label}
            component="button"
            type="button"
            role="menuitem"
            onClick={() => handleItemClick(label)}
            sx={menuItemSx}
          >
            <Typography sx={{ fontSize: '0.9375rem', fontWeight: 400 }}>{label}</Typography>
          </Box>
        ))}

        <Divider sx={{ my: 0.75, borderColor: cv.border }} />

        <Box
          component="button"
          type="button"
          role="menuitem"
          onClick={() => {
            onClose();
            onKeyboardShortcuts();
          }}
          sx={menuItemSx}
        >
          <Typography sx={{ fontSize: '0.9375rem', fontWeight: 400 }}>Keyboard shortcuts</Typography>
          <ShortcutBadges />
        </Box>

        <Divider sx={{ my: 0.75, borderColor: cv.border }} />

        {HELP_MENU_SECTIONS[2].map((label) => (
          <Box
            key={label}
            component="button"
            type="button"
            role="menuitem"
            onClick={() => handleItemClick(label)}
            sx={menuItemSx}
          >
            <Typography sx={{ fontSize: '0.9375rem', fontWeight: 400 }}>{label}</Typography>
          </Box>
        ))}

        <Box sx={{ px: 2, pt: 0.75, pb: 1 }}>
          <Typography
            sx={{
              fontSize: '0.6875rem',
              fontWeight: 400,
              lineHeight: 1.4,
              color: cv.textMuted,
            }}
          >
            {getAppVersionLabel()}
          </Typography>
        </Box>
      </Box>
    </Popover>
  );
}

import { useEffect, type MouseEvent, type ReactNode } from 'react';
import { cv } from '../../theme/cssVars';
import { Link as RouterLink } from 'react-router-dom';
import { Avatar, Box, Divider, Popover, Tooltip, Typography } from '@mui/material';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import KeyboardOutlinedIcon from '@mui/icons-material/KeyboardOutlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import PaymentOutlinedIcon from '@mui/icons-material/PaymentOutlined';
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import { useAuth } from '../../auth/AuthContext';
import {
  DEFAULT_SETTINGS_PATH,
  SETTINGS_BASE_PATH,
} from '../../constants/settingsNav';
import { useThemePreference } from '../../context/ThemePreferenceContext';
import type { ThemeMode } from '../../theme/theme';

const menuSurfaceSx = {
  width: 300,
  borderRadius: '12px',
  border: "1px solid var(--noah-border)",
  background: 'var(--noah-drawer-surface)',
  backdropFilter: 'blur(24px) saturate(160%)',
  WebkitBackdropFilter: 'blur(24px) saturate(160%)',
  boxShadow: cv.popoverShadow,
  overflow: 'hidden',
};

const menuItemSx = {
  display: 'flex',
  alignItems: 'center',
  gap: 1.25,
  width: '100%',
  px: 2,
  py: 1.1,
  border: 'none',
  background: 'transparent',
  color: cv.textPrimary,
  cursor: 'pointer',
  textAlign: 'left' as const,
  '&:hover': {
    backgroundColor: cv.surfaceHover,
  },
};

const BILLING_PATH = `${SETTINGS_BASE_PATH}/accounts/billing`;
const KEYBOARD_SHORTCUTS_PATH = `${SETTINGS_BASE_PATH}/admin/keyboard-shortcuts`;

interface ProfileMenuDropdownProps {
  open: boolean;
  anchorEl: HTMLElement | null;
  onClose: () => void;
  onLogout: () => void;
  onMyProfile?: () => void;
  onBillsPayments?: () => void;
  onSettings?: () => void;
  onKeyboardShortcuts?: () => void;
}

function MenuRow({
  icon,
  label,
  to,
  onClick,
  destructive = false,
  disabled = false,
  tooltipTitle,
}: {
  icon?: ReactNode;
  label: string;
  to?: string;
  onClick?: (event: MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => void;
  destructive?: boolean;
  disabled?: boolean;
  tooltipTitle?: string;
}) {
  const labelColor = disabled ? cv.textMuted : destructive ? cv.destructive : cv.textPrimary;
  const iconColor = disabled ? cv.textMuted : destructive ? cv.destructive : cv.textSecondary;

  const handleClick = (event: MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => {
    if (disabled) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    event.stopPropagation();
    onClick?.(event);
  };

  const content = (
    <Box
      component={to && !disabled ? RouterLink : 'button'}
      {...(to && !disabled ? { to } : { type: 'button' as const })}
      role="menuitem"
      disabled={disabled}
      onClick={handleClick}
      sx={{
        ...menuItemSx,
        textDecoration: 'none',
        color: labelColor,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        '&:hover': {
          backgroundColor: disabled ? 'transparent' : destructive ? cv.destructiveHover : cv.surfaceHover,
        },
        '& .MuiSvgIcon-root': {
          color: iconColor,
        },
      }}
    >
      {icon ? (
        <Box
          sx={{
            width: 20,
            height: 20,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {icon}
        </Box>
      ) : null}
      <Typography sx={{ flex: 1, fontSize: '0.9375rem', fontWeight: 400, color: 'inherit' }}>
        {label}
      </Typography>
    </Box>
  );

  if (tooltipTitle && disabled) {
    return (
      <Tooltip title={tooltipTitle} placement="right" arrow>
        <Box sx={{ display: 'block' }}>{content}</Box>
      </Tooltip>
    );
  }

  return content;
}

function ThemeAppearanceToggle() {
  const { mode, setMode } = useThemePreference();

  const options: { value: ThemeMode; label: string; icon: typeof LightModeOutlinedIcon }[] = [
    { value: 'light', label: 'Light', icon: LightModeOutlinedIcon },
    { value: 'dark', label: 'Dark', icon: DarkModeOutlinedIcon },
  ];

  return (
    <Box sx={{ px: 2, py: 1.25 }}>
      <Typography
        sx={{
          px: 0.5,
          mb: 0.75,
          fontSize: '0.75rem',
          fontWeight: 600,
          letterSpacing: '0.02em',
          textTransform: 'uppercase',
          color: cv.textMuted,
        }}
      >
        Appearance
      </Typography>
      <Box
        role="group"
        aria-label="Color theme"
        sx={{
          display: 'flex',
          gap: 0.5,
          p: 0.5,
          borderRadius: '10px',
          backgroundColor: cv.surfaceMuted,
          border: `1px solid ${cv.border}`,
        }}
      >
        {options.map(({ value, label, icon: Icon }) => {
          const selected = mode === value;

          return (
            <Box
              key={value}
              component="button"
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={(event) => {
                event.stopPropagation();
                setMode(value);
              }}
              sx={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 0.75,
                py: 0.85,
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: selected ? 600 : 500,
                color: selected ? cv.textPrimary : cv.textSecondary,
                backgroundColor: selected ? cv.surfaceStrong : 'transparent',
                boxShadow: selected ? cv.cardHoverShadow : 'none',
                transition: 'background-color 0.15s ease, color 0.15s ease, box-shadow 0.15s ease',
                '&:hover': {
                  backgroundColor: selected ? cv.surfaceStrong : cv.surfaceHover,
                  color: cv.textPrimary,
                },
                '&:focus-visible': {
                  outline: `2px solid ${cv.borderFocus}`,
                  outlineOffset: 2,
                },
              }}
            >
              <Icon sx={{ fontSize: 18 }} aria-hidden="true" />
              {label}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

export default function ProfileMenuDropdown({
  open,
  anchorEl,
  onClose,
  onLogout,
  onMyProfile,
  onBillsPayments,
  onSettings,
  onKeyboardShortcuts,
}: ProfileMenuDropdownProps) {
  const { user } = useAuth();
  const displayName = user?.name || 'User';
  const displayEmail = user?.email || '';
  const displayInitials = user?.initials || 'U';
  const displayAvatar = user?.avatarUrl;
  const displayAccountName = user?.accountName || `${displayName}'s Account`;
  const displayAccountInitials = user?.accountInitials || 'U';

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

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      disableRestoreFocus
      slotProps={{
        paper: {
          sx: menuSurfaceSx,
          elevation: 0,
          onClick: (event: MouseEvent<HTMLDivElement>) => event.stopPropagation(),
        },
      }}
    >
      <Box role="menu" aria-label="Profile menu">
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            px: 2,
            pt: 2.5,
            pb: 2,
            textAlign: 'center',
          }}
        >
          <Avatar
            src={displayAvatar}
            alt={displayName}
            sx={{
              width: 72,
              height: 72,
              mb: 1.5,
              fontSize: '1.5rem',
              fontWeight: 700,
              letterSpacing: '0.02em',
              background: cv.brandGradient,
              color: cv.textPrimary,
            }}
          >
            {displayInitials}
          </Avatar>
          <Typography
            sx={{
              fontSize: '1.125rem',
              fontWeight: 600,
              color: cv.textPrimary,
              lineHeight: 1.3,
            }}
          >
            {displayName}
          </Typography>
          <Typography
            sx={{
              mt: 0.5,
              fontSize: '0.875rem',
              color: cv.textSecondary,
              lineHeight: 1.4,
              wordBreak: 'break-word',
            }}
          >
            {displayEmail}
          </Typography>
        </Box>

        <Divider sx={{ borderColor: cv.border }} />

        <Box sx={{ px: 1.5, py: 1.25 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.25,
              px: 1.25,
              py: 1,
              borderRadius: '10px',
              backgroundColor: cv.surface,
              border: "1px solid var(--noah-border)",
            }}
          >
            <Avatar
              alt=""
              sx={{
                width: 28,
                height: 28,
                borderRadius: '8px',
                fontSize: '0.75rem',
                fontWeight: 700,
                flexShrink: 0,
                background: cv.brandGradient,
                color: cv.textPrimary,
              }}
            >
              {displayAccountInitials}
            </Avatar>
            <Typography sx={{ fontSize: '0.9375rem', fontWeight: 500, color: cv.textPrimary }}>
              {displayAccountName}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ borderColor: cv.border }} />

        <Box sx={{ py: 0.5 }}>
          <MenuRow
            icon={<PersonOutlinedIcon sx={{ fontSize: 20 }} />}
            label="My Profile"
            to={DEFAULT_SETTINGS_PATH}
            onClick={() => {
              onClose();
              onMyProfile?.();
            }}
          />
          <MenuRow
            icon={<PaymentOutlinedIcon sx={{ fontSize: 20 }} />}
            label="Bills & Payments"
            to={BILLING_PATH}
            disabled={user?.role === 'Admin' || user?.role === 'Editor'}
            tooltipTitle="Manage by the Super Admin only"
            onClick={() => {
              onClose();
              onBillsPayments?.();
            }}
          />
          <MenuRow
            icon={<SettingsOutlinedIcon sx={{ fontSize: 20 }} />}
            label="Settings"
            to={SETTINGS_BASE_PATH}
            onClick={() => {
              onClose();
              onSettings?.();
            }}
          />
          <MenuRow
            icon={<KeyboardOutlinedIcon sx={{ fontSize: 20 }} />}
            label="Keyboard Shortcuts"
            to={KEYBOARD_SHORTCUTS_PATH}
            onClick={() => {
              onClose();
              onKeyboardShortcuts?.();
            }}
          />
        </Box>

        <Divider sx={{ borderColor: cv.border }} />

        <ThemeAppearanceToggle />

        <Divider sx={{ borderColor: cv.border }} />

        <Box sx={{ py: 0.5 }}>
          <MenuRow
            icon={<LogoutOutlinedIcon sx={{ fontSize: 20 }} />}
            label="Log out"
            destructive
            onClick={() => {
              onClose();
              onLogout();
            }}
          />
        </Box>
      </Box>
    </Popover>
  );
}

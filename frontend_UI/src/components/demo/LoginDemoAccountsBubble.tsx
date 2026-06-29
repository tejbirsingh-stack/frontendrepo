/**
 * Demo-only login helper. Safe to delete entirely when mock auth picker is no longer needed.
 *
 * Removal checklist:
 * 1. Delete this file (and `src/components/demo/` if empty)
 * 2. Remove the import + `<LoginDemoAccountsBubble />` block from `LoginPage.tsx`
 */
import { useEffect, useRef, useState } from 'react';
import { Avatar, Box, IconButton, Popover, Typography } from '@mui/material';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import { MOCK_AUTH_ACCOUNTS } from '../../constants/mockAuthCredentials';
import { env } from '../../config/env';
import { cv } from '../../theme/cssVars';

const menuSurfaceSx = {
  width: 280,
  py: 0.75,
  borderRadius: '12px',
  border: '1px solid var(--noah-border)',
  background: 'var(--noah-popover-surface)',
  backdropFilter: 'blur(24px) saturate(160%)',
  WebkitBackdropFilter: 'blur(24px) saturate(160%)',
  boxShadow: cv.popoverShadow,
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

export interface LoginDemoAccountsBubbleProps {
  onFillCredentials: (credentials: { email: string; password: string }) => void;
}

export default function LoginDemoAccountsBubble({
  onFillCredentials,
}: LoginDemoAccountsBubbleProps) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  if (env.isApiConfigured) {
    return null;
  }

  return (
    <>
      <IconButton
        ref={triggerRef}
        type="button"
        aria-label="Demo accounts"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 2,
          width: 44,
          height: 44,
          backgroundColor: open ? cv.surfaceHover : cv.insetHighlight,
          border: '1px solid var(--noah-border)',
          backdropFilter: 'blur(12px)',
          color: open ? cv.textPrimary : cv.textSecondary,
          '&:hover': {
            backgroundColor: cv.surfaceHover,
            color: cv.textPrimary,
          },
        }}
      >
        <PersonOutlineOutlinedIcon sx={{ fontSize: 22 }} />
      </IconButton>

      <Popover
        open={open}
        anchorEl={triggerRef.current}
        onClose={() => setOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        slotProps={{
          paper: { sx: menuSurfaceSx, elevation: 0 },
        }}
      >
        <Box role="menu" aria-label="Demo accounts">
          <Box sx={{ px: 2, pt: 0.75, pb: 0.5 }}>
            <Typography
              sx={{
                fontSize: '0.6875rem',
                fontWeight: 600,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: cv.textMuted,
              }}
            >
              Demo accounts
            </Typography>
          </Box>

          {MOCK_AUTH_ACCOUNTS.map((account) => (
            <Box
              key={account.email}
              component="button"
              type="button"
              role="menuitem"
              onClick={() => {
                onFillCredentials({
                  email: account.email,
                  password: account.password,
                });
                setOpen(false);
              }}
              sx={menuItemSx}
            >
              <Avatar
                src={account.user.avatarUrl}
                alt=""
                sx={{
                  width: 32,
                  height: 32,
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  bgcolor: cv.brandBlue,
                }}
              >
                {account.user.initials}
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontSize: '0.9375rem', fontWeight: 500, lineHeight: 1.3 }}>
                  {account.user.name}
                </Typography>
                <Typography sx={{ fontSize: '0.8125rem', color: cv.textSecondary, lineHeight: 1.3 }}>
                  {account.user.role}
                </Typography>
              </Box>
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
              Tap an account to auto-fill credentials.
            </Typography>
          </Box>
        </Box>
      </Popover>
    </>
  );
}

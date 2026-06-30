import { useState } from 'react';
import { cv } from '../../theme/cssVars';
import { useNavigate } from 'react-router-dom';
import { Box, IconButton, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import NoahLogo from '../NoahLogo';
import LogoutConfirmModal from '../dashboard/LogoutConfirmModal';
import SettingsNav from './SettingsNav';
import { useAuth } from '../../auth/AuthContext';
import { SIDE_PANEL_WIDTH, SIDEBAR_DESKTOP_BREAKPOINT, DASHBOARD_TOP_BAR_BORDER, DASHBOARD_TOP_BAR_HEIGHT } from '../../constants/layout';

const settingsSidebarLogoSx = {
  mb: 0,
  px: 0,
} as const;

interface SettingsSidebarProps {
  variant?: 'persistent' | 'drawer';
  onClose?: () => void;
}

export default function SettingsSidebar({
  variant = 'persistent',
  onClose,
}: SettingsSidebarProps) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const isDrawer = variant === 'drawer';

  const handleLogoutConfirm = async () => {
    setLogoutModalOpen(false);
    onClose?.();
    await logout();
    navigate('/', { replace: true });
  };

  return (
    <>
      <Box
        component={isDrawer ? 'div' : 'aside'}
        aria-label="Settings navigation"
        data-app-sidebar
        sx={{
          width: isDrawer ? '100%' : SIDE_PANEL_WIDTH,
          flexShrink: 0,
          height: isDrawer ? '100%' : '100vh',
          display: isDrawer ? 'flex' : { xs: 'none', [SIDEBAR_DESKTOP_BREAKPOINT]: 'flex' },
          flexDirection: 'column',
          borderRight: isDrawer ? 'none' : '1px solid var(--noah-border)',
          background: cv.sidebarSurface,
          backdropFilter: isDrawer ? 'none' : 'blur(20px)',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            height: DASHBOARD_TOP_BAR_HEIGHT,
            minHeight: DASHBOARD_TOP_BAR_HEIGHT,
            maxHeight: DASHBOARD_TOP_BAR_HEIGHT,
            boxSizing: 'border-box',
            px: 2,
            borderBottom: DASHBOARD_TOP_BAR_BORDER,
            background: cv.sidebarSurface,
          }}
        >
          {isDrawer ? (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 1,
                width: '100%',
                minWidth: 0,
              }}
            >
              <NoahLogo
                to="/home"
                width={80}
                fitContainer
                align="left"
                animated={false}
                showGlow={false}
                sx={{ ...settingsSidebarLogoSx, flex: 1, minWidth: 0 }}
              />
              <IconButton
                aria-label="Close settings menu"
                onClick={onClose}
                sx={{
                  flexShrink: 0,
                  color: cv.textSecondary,
                  '&:hover': { color: cv.textPrimary, backgroundColor: cv.surfaceHover },
                }}
              >
                <CloseIcon sx={{ fontSize: 24 }} />
              </IconButton>
            </Box>
          ) : (
            <NoahLogo
              to="/home"
              width={80}
              fitContainer
              align="left"
              animated={false}
              showGlow={false}
              sx={{ ...settingsSidebarLogoSx, width: '100%' }}
            />
          )}
        </Box>

        <Box sx={{ flex: 1, overflowY: 'auto', py: 2 }}>
          <SettingsNav onNavigate={onClose} />
        </Box>

        <Box
          sx={{
            flexShrink: 0,
            pt: 1,
            pb: 2,
            borderTop: '1px solid var(--noah-border)',
            background: cv.sidebarScrim,
          }}
        >
          <ListItemButton
            onClick={() => setLogoutModalOpen(true)}
            sx={{
              py: 0.875,
              px: 1.5,
              borderRadius: '10px',
              mx: 1,
              color: cv.destructive,
              backgroundColor: 'transparent',
              border: '1px solid transparent',
              '&:hover': {
                backgroundColor: cv.destructiveHover,
              },
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: 32,
                color: 'inherit',
                '& .MuiSvgIcon-root': { fontSize: 20 },
              }}
            >
              <LogoutOutlinedIcon />
            </ListItemIcon>
            <ListItemText
              primary="Log out"
              slotProps={{
                primary: {
                  sx: { fontSize: '0.875rem', fontWeight: 500, color: 'inherit' },
                },
              }}
            />
          </ListItemButton>
        </Box>
      </Box>

      <LogoutConfirmModal
        open={logoutModalOpen}
        onClose={() => setLogoutModalOpen(false)}
        onConfirm={handleLogoutConfirm}
      />
    </>
  );
}

import { List, ListItemButton, ListItemIcon, ListItemText, Typography, Box } from '@mui/material';
import { cv } from '../../theme/cssVars';
import { useLocation, useNavigate } from 'react-router-dom';
import { SETTINGS_BASE_PATH, SETTINGS_NAV_GROUPS } from '../../constants/settingsNav';
import { getSettingsNavIcon } from './settingsNavIcons';
import { useAuth } from '../../auth/AuthContext';

export default function SettingsNav({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <List
      component="nav"
      aria-label="Settings navigation"
      sx={{
        width: '100%',
        p: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}
    >
      {SETTINGS_NAV_GROUPS.map((group) => (
        <List key={group.id} disablePadding sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
          <Typography
            sx={{
              px: 1.5,
              py: 0.5,
              fontSize: '0.6875rem',
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: cv.textMuted,
            }}
          >
            {group.label}
          </Typography>

          {group.items.map((item) => {
            const href = `${SETTINGS_BASE_PATH}/${item.path}`;
            const active = location.pathname === href;
            const hasManageSubscription = user?.permissions?.includes('manage_subscription_billing');
            
            const isBillingDisabled = item.id === 'billing' && !hasManageSubscription;
            const isPlanDisabled = item.id === 'plan' && !hasManageSubscription;
            const isCompanyDisabled = item.id === 'company' && !hasManageSubscription; // Admin is blocked from overarching infrastructure
            const isSecurityDisabled = item.id === 'security' && !hasManageSubscription;
            const isUserDisabled = item.id === 'user' && !user?.permissions?.includes('manage_users_permissions');
            const isUsageDisabled = item.id === 'usage' && !user?.permissions?.includes('view_audit_analytics');
            const isProjectsWorkspacesDisabled = ['projects', 'workspaces', 'fields', 'settings'].includes(item.id) && !user?.permissions?.includes('manage_root_folders');
            const isBrandingDisabled = item.id === 'branding' && !user?.permissions?.includes('manage_users_permissions');

            const isDisabled = isBillingDisabled || isPlanDisabled || isCompanyDisabled || isSecurityDisabled || isUserDisabled || isUsageDisabled || isProjectsWorkspacesDisabled || isBrandingDisabled;

            const buttonContent = (
              <ListItemButton
                selected={active && !isDisabled}
                disabled={isDisabled}
                onClick={(e) => {
                  if (isDisabled) {
                    e.preventDefault();
                    e.stopPropagation();
                    return;
                  }
                  navigate(href);
                  onNavigate?.();
                }}
                sx={{
                  py: 0.75,
                  px: 1.5,
                  mx: 1,
                  mb: 0.25,
                  borderRadius: '10px',
                  color: isDisabled ? cv.textMuted : active ? cv.textPrimary : cv.textSecondary,
                  backgroundColor: active && !isDisabled ? cv.surfaceRaised : 'transparent',
                  cursor: isDisabled ? 'not-allowed' : 'pointer',
                  opacity: isDisabled ? 0.6 : 1,
                  '&.Mui-selected': {
                    backgroundColor: cv.surfaceRaised,
                    '&:hover': {
                      backgroundColor: cv.surfaceActive,
                    },
                  },
                  '&:hover': {
                    backgroundColor: isDisabled ? 'transparent' : active ? cv.surfaceActive : cv.surfaceHover,
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 32,
                    color: isDisabled ? cv.textMuted : 'inherit',
                    '& .MuiSvgIcon-root': { fontSize: 20 },
                  }}
                >
                  {getSettingsNavIcon(item.id)}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  slotProps={{
                    primary: {
                      sx: {
                        fontSize: '0.875rem',
                        fontWeight: active && !isDisabled ? 500 : 400,
                      },
                    },
                  }}
                />
              </ListItemButton>
            );

            if (isDisabled) {
              return (
                <Box key={item.id} sx={{ display: 'block' }}>{buttonContent}</Box>
              );
            }

            return <Box key={item.id} sx={{ display: 'contents' }}>{buttonContent}</Box>;
          })}
        </List>
      ))}
    </List>
  );
}

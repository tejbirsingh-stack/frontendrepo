import { List, ListItemButton, ListItemIcon, ListItemText, Typography } from '@mui/material';
import { cv } from '../../theme/cssVars';
import { useLocation, useNavigate } from 'react-router-dom';
import { SETTINGS_BASE_PATH, SETTINGS_NAV_GROUPS } from '../../constants/settingsNav';
import { getSettingsNavIcon } from './settingsNavIcons';

export default function SettingsNav({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();

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

            return (
              <ListItemButton
                key={item.id}
                selected={active}
                onClick={() => {
                  navigate(href);
                  onNavigate?.();
                }}
                sx={{
                  py: 0.75,
                  px: 1.5,
                  mx: 1,
                  mb: 0.25,
                  borderRadius: '10px',
                  color: active ? cv.textPrimary : cv.textSecondary,
                  backgroundColor: active ? cv.surfaceRaised : 'transparent',
                  '&.Mui-selected': {
                    backgroundColor: cv.surfaceRaised,
                    '&:hover': {
                      backgroundColor: cv.surfaceActive,
                    },
                  },
                  '&:hover': {
                    backgroundColor: active ? cv.surfaceActive : cv.surfaceHover,
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
                  {getSettingsNavIcon(item.id)}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  slotProps={{
                    primary: {
                      sx: {
                        fontSize: '0.875rem',
                        fontWeight: active ? 500 : 400,
                      },
                    },
                  }}
                />
              </ListItemButton>
            );
          })}
        </List>
      ))}
    </List>
  );
}

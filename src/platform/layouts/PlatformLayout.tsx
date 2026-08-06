import { useMemo, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Avatar,
  Box,
  Divider,
  List,
  ListItemButton,
  ListItemText,
  ListSubheader,
  Menu,
  MenuItem,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import NoahLogo from '../../components/NoahLogo';
import { DASHBOARD_TOP_BAR_HEIGHT } from '../../constants/layout';
import { cv } from '../../theme/cssVars';
import { usePlatformAuth } from '../auth/PlatformAuthContext';

const SIDEBAR_WIDTH = 240;
const HEADER_HEIGHT = DASHBOARD_TOP_BAR_HEIGHT;

type NavItem = { to: string; label: string; end?: boolean };
type NavSection = { title: string; items: NavItem[] };

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Overview',
    items: [{ to: '/platform', label: 'Dashboard', end: true }],
  },
  {
    title: 'Commercial',
    items: [
      { to: '/platform/organizations', label: 'Organizations' },
      { to: '/platform/plans', label: 'Plans' },
      { to: '/platform/billing', label: 'Billing' },
      { to: '/platform/usage', label: 'Usage' },
    ],
  },
  {
    title: 'Operations',
    items: [
      { to: '/platform/moderation', label: 'Moderation' },
      { to: '/platform/media', label: 'Media matrix' },
      { to: '/platform/activity', label: 'Activity' },
      { to: '/platform/reporting', label: 'Reporting' },
    ],
  },
  {
    title: 'Website',
    items: [{ to: '/platform/landing', label: 'Landing page' }],
  },
];

function getInitials(name?: string | null, email?: string | null): string {
  const source = (name || email || 'PA').trim();
  const parts = source.split(/[\s@.]+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

export default function PlatformLayout() {
  const { admin, logout } = usePlatformAuth();
  const navigate = useNavigate();
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const menuOpen = Boolean(menuAnchor);

  const displayName = admin?.name?.trim() || 'Platform Admin';
  const displayEmail = admin?.email || '';
  const initials = useMemo(
    () => getInitials(admin?.name, admin?.email),
    [admin?.name, admin?.email],
  );

  const handleLogout = async () => {
    setMenuAnchor(null);
    await logout();
    navigate('/platform/login');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        background: cv.bg,
        color: cv.textPrimary,
      }}
    >
      <Box
        component="aside"
        sx={{
          width: SIDEBAR_WIDTH,
          flexShrink: 0,
          borderRight: `1px solid ${cv.border}`,
          background: cv.sidebarSurface,
          display: 'flex',
          flexDirection: 'column',
          position: 'sticky',
          top: 0,
          height: '100vh',
          overflow: 'auto',
        }}
      >
        <Box
          sx={{
            height: HEADER_HEIGHT,
            minHeight: HEADER_HEIGHT,
            px: 2,
            display: 'flex',
            alignItems: 'center',
            borderBottom: `1px solid ${cv.border}`,
            flexShrink: 0,
            overflow: 'hidden',
          }}
        >
          <NoahLogo
            to="/platform"
            width={120}
            fitContainer
            animated={false}
            showGlow={false}
            align="left"
            ariaLabel="NOAH Platform Console"
            sx={{ mb: 0, width: '100%', maxWidth: '100%' }}
          />
        </Box>

        <Box sx={{ px: 2, pt: 2, pb: 1 }}>
          <Typography
            sx={{
              fontSize: '0.7rem',
              color: cv.brandOrchid,
              fontWeight: 700,
              letterSpacing: '0.08em',
            }}
          >
            PLATFORM ADMIN
          </Typography>
        </Box>

        <Box sx={{ flex: 1, px: 1.25, pb: 2, pt: 0, overflow: 'auto' }}>
          {NAV_SECTIONS.map((section) => (
            <List
              key={section.title}
              dense
              disablePadding
              subheader={
                <ListSubheader
                  disableSticky
                  sx={{
                    px: 1.25,
                    py: 0.75,
                    mt: section.title === 'Overview' ? 0 : 0.75,
                    lineHeight: 1.2,
                    background: 'transparent',
                    color: cv.textMuted,
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                  }}
                >
                  {section.title}
                </ListSubheader>
              }
              sx={{ mb: 0.5 }}
            >
              {section.items.map((item) => (
                <ListItemButton
                  key={item.to}
                  component={NavLink}
                  to={item.to}
                  end={item.end}
                  sx={{
                    borderRadius: 1.5,
                    mb: 0.25,
                    '&.active': {
                      background: cv.purpleSurface,
                      color: cv.textPrimary,
                    },
                  }}
                >
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 500 }}
                  />
                </ListItemButton>
              ))}
            </List>
          ))}
        </Box>
      </Box>

      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <Box
          component="header"
          sx={{
            height: HEADER_HEIGHT,
            flexShrink: 0,
            px: { xs: 2, md: 3 },
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
            borderBottom: `1px solid ${cv.border}`,
            background: cv.headerBackground,
            zIndex: 2,
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontWeight: 700, fontSize: '1rem', lineHeight: 1.2 }}>
              NOAH Platform Console
            </Typography>
            <Typography sx={{ fontSize: '0.75rem', color: cv.textMuted, mt: 0.25 }}>
              Operator tools across all organizations
            </Typography>
          </Box>

          <Box
            component="button"
            type="button"
            onClick={(e) => setMenuAnchor(e.currentTarget)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-label="Open profile menu"
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              border: `1px solid ${cv.border}`,
              background: cv.surface,
              borderRadius: '999px',
              py: 0.5,
              pl: 0.5,
              pr: 1.25,
              cursor: 'pointer',
              color: cv.textPrimary,
              '&:hover': {
                background: cv.surfaceHover,
                borderColor: cv.borderStrong,
              },
            }}
          >
            <Avatar
              sx={{
                width: 32,
                height: 32,
                fontSize: '0.8125rem',
                fontWeight: 700,
                background: cv.brandGradient,
                color: cv.textOnCta,
              }}
            >
              {initials}
            </Avatar>
            <Box sx={{ textAlign: 'left', display: { xs: 'none', sm: 'block' }, minWidth: 0 }}>
              <Typography
                sx={{
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  lineHeight: 1.2,
                  maxWidth: 160,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {displayName}
              </Typography>
              <Typography
                sx={{
                  fontSize: '0.7rem',
                  color: cv.textMuted,
                  lineHeight: 1.2,
                  maxWidth: 160,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {displayEmail}
              </Typography>
            </Box>
            <ExpandMoreIcon sx={{ fontSize: 18, color: cv.textMuted }} />
          </Box>

          <Menu
            anchorEl={menuAnchor}
            open={menuOpen}
            onClose={() => setMenuAnchor(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            slotProps={{
              paper: {
                sx: {
                  mt: 1,
                  minWidth: 240,
                  borderRadius: '12px',
                  border: `1px solid ${cv.border}`,
                  background: cv.drawerSurface,
                  boxShadow: cv.popoverShadow,
                },
              },
            }}
          >
            <Box sx={{ px: 2, py: 1.5 }}>
              <Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }}>{displayName}</Typography>
              <Typography sx={{ fontSize: '0.75rem', color: cv.textMuted }}>{displayEmail}</Typography>
            </Box>
            <Divider sx={{ borderColor: cv.border }} />
            <MenuItem
              onClick={() => void handleLogout()}
              sx={{
                gap: 1.25,
                py: 1.25,
                color: cv.destructive,
                '&:hover': { backgroundColor: cv.destructiveSurface },
              }}
            >
              <LogoutOutlinedIcon sx={{ fontSize: 18 }} />
              Sign out
            </MenuItem>
          </Menu>
        </Box>

        <Box
          component="main"
          sx={{
            flex: 1,
            minHeight: 0,
            overflow: 'auto',
            p: { xs: 2, md: 3 },
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}

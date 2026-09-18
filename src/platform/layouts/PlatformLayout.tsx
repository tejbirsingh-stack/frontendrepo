import { useMemo, useState, type ReactNode } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Avatar,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Menu,
  MenuItem,
  TextField,
  IconButton,
  InputAdornment,
  Tooltip,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import VpnKeyOutlinedIcon from '@mui/icons-material/VpnKeyOutlined';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import SpaceDashboardOutlinedIcon from '@mui/icons-material/SpaceDashboardOutlined';
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import WorkspacesOutlinedIcon from '@mui/icons-material/WorkspacesOutlined';
import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined';
import SecurityOutlinedIcon from '@mui/icons-material/SecurityOutlined';
import LanguageOutlinedIcon from '@mui/icons-material/LanguageOutlined';
import FolderCopyOutlinedIcon from '@mui/icons-material/FolderCopyOutlined';
import NotificationImportantOutlinedIcon from '@mui/icons-material/NotificationImportantOutlined';
import { toast } from 'react-hot-toast';
import NoahLogo from '../../components/NoahLogo';
import DashboardNotificationPopup from '../../components/dashboard/DashboardNotificationPopup';
import { DASHBOARD_TOP_BAR_HEIGHT } from '../../constants/layout';
import { noahDialogSlotProps } from '../../constants/dialogStyles';
import { cv } from '../../theme/cssVars';
import { platformChangePassword } from '../api/platformApi';
import { usePlatformAuth } from '../auth/PlatformAuthContext';

const SIDEBAR_WIDTH = 264;
const HEADER_HEIGHT = DASHBOARD_TOP_BAR_HEIGHT;

/** Platform sidebar stays dark in both themes (matches Global Admin light-mode mock). */
const SIDEBAR = {
  bg: cv.sidebarSurface,
  border: 'rgba(255, 255, 255, 0.08)',
  text: 'rgba(248, 250, 252, 0.78)',
  textMuted: 'rgba(248, 250, 252, 0.45)',
  textActive: '#ffffff',
  hover: 'rgba(255, 255, 255, 0.06)',
  active: 'rgba(142, 68, 173, 0.92)',
  activeSoft: 'rgba(210, 140, 255, 0.16)',
} as const;

type NavItem = { to: string; label: string; end?: boolean; icon: ReactNode; hint?: string };
type NavSection = { title: string; items: NavItem[] };

const iconSx = { fontSize: 18 } as const;

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Overview',
    items: [
      {
        to: '/platform',
        label: 'Dashboard',
        end: true,
        icon: <SpaceDashboardOutlinedIcon sx={iconSx} />,
        hint: 'Platform command center',
      },
    ],
  },
  {
    title: 'Tenant admin',
    items: [
      {
        to: '/platform/organizations',
        label: 'Organizations',
        icon: <BusinessOutlinedIcon sx={iconSx} />,
        hint: 'Manage tenant organizations',
      },
      {
        to: '/platform/users',
        label: 'Users & roles',
        icon: <PeopleAltOutlinedIcon sx={iconSx} />,
        hint: 'People directory and roles',
      },
      {
        to: '/platform/workspaces',
        label: 'Workspaces',
        icon: <WorkspacesOutlinedIcon sx={iconSx} />,
        hint: 'Workspaces and projects',
      },
    ],
  },
  {
    title: 'Commercial',
    items: [
      {
        to: '/platform/plans',
        label: 'Plans',
        icon: <LocalOfferOutlinedIcon sx={iconSx} />,
        hint: 'Plan catalog',
      },
      {
        to: '/platform/billing',
        label: 'Billing',
        icon: <ReceiptLongOutlinedIcon sx={iconSx} />,
        hint: 'Subscriptions and MRR',
      },
      {
        to: '/platform/usage',
        label: 'Usage',
        icon: <BarChartOutlinedIcon sx={iconSx} />,
        hint: 'Seats, storage, and quotas',
      },
    ],
  },
  {
    title: 'Operations',
    items: [
      {
        to: '/platform/security',
        label: 'Security',
        icon: <SecurityOutlinedIcon sx={iconSx} />,
        hint: 'SSO, session timeout, and content security',
      },
      {
        to: '/platform/activity',
        label: 'Activity',
        icon: <HistoryOutlinedIcon sx={iconSx} />,
        hint: 'Audit trail',
      },
      {
        to: '/platform/reporting',
        label: 'Reporting',
        icon: <AssessmentOutlinedIcon sx={iconSx} />,
        hint: 'Filters and CSV exports',
      },
    ],
  },
  {
    title: 'Website',
    items: [
      {
        to: '/platform/landing',
        label: 'Landing page',
        icon: <LanguageOutlinedIcon sx={iconSx} />,
        hint: 'Public marketing CMS',
      },
      {
        to: '/platform/default-content',
        label: 'Default content',
        icon: <FolderCopyOutlinedIcon sx={iconSx} />,
        hint: 'Starter files for new users',
      },
      {
        to: '/platform/notification-popup',
        label: 'Notification popup',
        icon: <NotificationImportantOutlinedIcon sx={iconSx} />,
        hint: 'Dashboard welcome message',
      },
    ],
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
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

  const openPasswordDialog = () => {
    setMenuAnchor(null);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setPasswordDialogOpen(true);
  };

  const closePasswordDialog = () => {
    if (isSavingPassword) return;
    setPasswordDialogOpen(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  };

  const handleChangePassword = async () => {
    setPasswordError('');
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('All password fields are required');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirm password must match');
      return;
    }

    setIsSavingPassword(true);
    try {
      const res = await platformChangePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });
      toast.success(res.message || 'Password changed successfully');
      setPasswordDialogOpen(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to change password';
      setPasswordError(msg);
      toast.error(msg);
    } finally {
      setIsSavingPassword(false);
    }
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
          borderRight: `1px solid ${SIDEBAR.border}`,
          background: SIDEBAR.bg,
          display: 'flex',
          flexDirection: 'column',
          position: 'sticky',
          top: 0,
          height: '100vh',
          overflow: 'hidden',
          color: SIDEBAR.text,
        }}
      >
        <Box
          sx={{
            height: HEADER_HEIGHT,
            minHeight: HEADER_HEIGHT,
            px: 2.25,
            display: 'flex',
            alignItems: 'center',
            borderBottom: `1px solid ${SIDEBAR.border}`,
            flexShrink: 0,
            overflow: 'hidden',
            background: 'transparent',
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
            disableCustomBranding
            sx={{
              mb: 0,
              width: '100%',
              maxWidth: '100%',
              // Sidebar is always dark — keep logo readable in light app theme
              '& img': {
                mixBlendMode: 'normal',
                filter: 'brightness(1.05)',
              },
            }}
          />
        </Box>

        <Box sx={{ flex: 1, px: 1.5, pb: 2, pt: 1.5, overflow: 'auto' }}>
          {NAV_SECTIONS.map((section) => (
            <List
              key={section.title}
              dense
              disablePadding
              subheader={
                <ListSubheader
                  disableSticky
                  sx={{
                    px: 1.5,
                    py: 1,
                    mt: section.title === 'Overview' ? 0 : 1,
                    lineHeight: 1.2,
                    background: 'transparent',
                    color: SIDEBAR.textMuted,
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                  }}
                >
                  {section.title}
                </ListSubheader>
              }
              sx={{ mb: 0.25 }}
            >
              {section.items.map((item) => (
                <Tooltip
                  key={item.to}
                  title={item.hint || item.label}
                  placement="right"
                  enterDelay={500}
                  arrow
                >
                  <ListItemButton
                    component={NavLink}
                    to={item.to}
                    end={item.end}
                    sx={{
                      borderRadius: '8px',
                      mb: 0.35,
                      px: 1.25,
                      py: 0.85,
                      gap: 0.5,
                      position: 'relative',
                      color: SIDEBAR.text,
                      transition: 'background 0.15s ease, color 0.15s ease',
                      '&:hover': {
                        background: SIDEBAR.hover,
                        color: SIDEBAR.textActive,
                      },
                      '&.active': {
                        background: SIDEBAR.active,
                        color: SIDEBAR.textActive,
                        boxShadow: `0 0 0 1px ${SIDEBAR.activeSoft}`,
                        '& .MuiListItemIcon-root': {
                          color: SIDEBAR.textActive,
                          opacity: 1,
                        },
                      },
                      '&:focus-visible': {
                        outline: `2px solid ${cv.brandOrchid}`,
                        outlineOffset: 1,
                      },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 34,
                        color: 'inherit',
                        opacity: 0.9,
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.label}
                      primaryTypographyProps={{
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        letterSpacing: '-0.01em',
                      }}
                    />
                  </ListItemButton>
                </Tooltip>
              ))}
            </List>
          ))}
        </Box>

        <Box
          sx={{
            px: 2,
            py: 1.75,
            borderTop: `1px solid ${SIDEBAR.border}`,
            flexShrink: 0,
          }}
        >
          <Typography sx={{ fontSize: '0.65rem', color: SIDEBAR.textMuted, letterSpacing: '0.04em' }}>
            NOAH Cloud · Global Admin
          </Typography>
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
            backdropFilter: 'blur(12px)',
            zIndex: 2,
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography
              sx={{
                fontSize: '0.8125rem',
                color: cv.textMuted,
                lineHeight: 1.35,
                letterSpacing: '-0.01em',
              }}
            >
              <Box component="span" sx={{ color: cv.textSecondary, fontWeight: 600 }}>
                NOAH Global Admin
              </Box>
              {' / '}
              Organizations · users · workspaces · billing · operations
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
              height: 40,
              boxSizing: 'border-box',
              border: `1px solid ${cv.border}`,
              background: cv.surface,
              borderRadius: '6px',
              py: 0,
              pl: 0.5,
              pr: 1.25,
              cursor: 'pointer',
              color: cv.textPrimary,
              transition: 'background 0.15s ease, border-color 0.15s ease',
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
                  borderRadius: '6px',
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
              onClick={openPasswordDialog}
              sx={{
                gap: 1.25,
                py: 1.25,
                color: cv.textPrimary,
                '&:hover': { backgroundColor: cv.surfaceHover },
              }}
            >
              <VpnKeyOutlinedIcon sx={{ fontSize: 18 }} />
              Change password
            </MenuItem>
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
            background: `
              radial-gradient(ellipse 80% 50% at 100% -20%, rgba(210, 140, 255, 0.07), transparent 55%),
              radial-gradient(ellipse 60% 40% at 0% 0%, rgba(22, 160, 133, 0.04), transparent 50%),
              ${cv.bg}
            `,
          }}
        >
          <Outlet />
        </Box>
      </Box>

      <Dialog
        open={passwordDialogOpen}
        onClose={closePasswordDialog}
        fullWidth
        maxWidth="xs"
        slotProps={noahDialogSlotProps({ overflow: 'hidden' })}
      >
        <DialogTitle sx={{ fontWeight: 600, color: cv.textPrimary }}>
          Change password
        </DialogTitle>
        <DialogContent sx={{ pt: '8px !important' }}>
          {passwordError ? (
            <Typography sx={{ color: cv.destructive, mb: 2 }} role="alert">
              {passwordError}
            </Typography>
          ) : null}
          <Box sx={{ display: 'grid', gap: 2 }}>
            <TextField
              label="Current password"
              type={showCurrentPassword ? 'text' : 'password'}
              size="small"
              fullWidth
              autoFocus
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label={showCurrentPassword ? 'Hide current password' : 'Show current password'}
                        onClick={() => setShowCurrentPassword((prev) => !prev)}
                        edge="end"
                        sx={{ color: cv.textMuted }}
                      >
                        {showCurrentPassword ? <Visibility fontSize="small" /> : <VisibilityOff fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
            <TextField
              label="New password"
              type={showNewPassword ? 'text' : 'password'}
              size="small"
              fullWidth
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              helperText="At least 8 characters, with uppercase, lowercase, and a number"
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
                        onClick={() => setShowNewPassword((prev) => !prev)}
                        edge="end"
                        sx={{ color: cv.textMuted }}
                      >
                        {showNewPassword ? <Visibility fontSize="small" /> : <VisibilityOff fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
            <TextField
              label="Confirm new password"
              type={showConfirmPassword ? 'text' : 'password'}
              size="small"
              fullWidth
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void handleChangePassword();
              }}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                        edge="end"
                        sx={{ color: cv.textMuted }}
                      >
                        {showConfirmPassword ? <Visibility fontSize="small" /> : <VisibilityOff fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, pt: 1, gap: 1 }}>
          <Button
            onClick={closePasswordDialog}
            disabled={isSavingPassword}
            sx={{ textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => void handleChangePassword()}
            disabled={isSavingPassword}
            sx={{ textTransform: 'none', minWidth: 90 }}
          >
            {isSavingPassword ? <CircularProgress size={20} color="inherit" /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      <DashboardNotificationPopup autoOpen={false} />
    </Box>
  );
}

import { useMemo, useState, type ReactNode } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Alert,
  Avatar,
  Box,
  Button,
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
  Snackbar,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
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
import NoahLogo from '../../components/NoahLogo';
import DashboardNotificationPopup from '../../components/dashboard/DashboardNotificationPopup';
import { DASHBOARD_TOP_BAR_HEIGHT } from '../../constants/layout';
import { cv } from '../../theme/cssVars';
import { usePlatformAuth } from '../auth/PlatformAuthContext';

const SIDEBAR_WIDTH = 264;
const HEADER_HEIGHT = DASHBOARD_TOP_BAR_HEIGHT;

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
  const { admin, logout, updateProfile } = usePlatformAuth();
  const navigate = useNavigate();
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const menuOpen = Boolean(menuAnchor);

  // Edit profile dialog state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [toastOpen, setToastOpen] = useState(false);

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

  const handleOpenEditModal = () => {
    setMenuAnchor(null);
    setEditName(admin?.name || '');
    setEditEmail(admin?.email || '');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setEditModalOpen(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword) {
      if (!currentPassword) {
        setError('Current password is required to set a new password.');
        return;
      }
      if (newPassword.length < 8) {
        setError('New password must be at least 8 characters long.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setError('New passwords do not match.');
        return;
      }
    }

    setSaving(true);
    try {
      await updateProfile({
        name: editName.trim(),
        email: editEmail.trim(),
        ...(newPassword ? { currentPassword, newPassword } : {}),
      });
      setEditModalOpen(false);
      setToastMessage('Platform Admin profile updated successfully!');
      setToastOpen(true);
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setSaving(false);
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
          borderRight: `1px solid ${cv.border}`,
          background: `linear-gradient(180deg, ${cv.sidebarSurface} 0%, ${cv.bg} 100%)`,
          display: 'flex',
          flexDirection: 'column',
          position: 'sticky',
          top: 0,
          height: '100vh',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            height: HEADER_HEIGHT,
            minHeight: HEADER_HEIGHT,
            px: 2.25,
            display: 'flex',
            alignItems: 'center',
            borderBottom: `1px solid ${cv.border}`,
            flexShrink: 0,
            overflow: 'hidden',
            background: cv.headerBackground,
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
            sx={{ mb: 0, width: '100%', maxWidth: '100%' }}
          />
        </Box>

        <Box sx={{ px: 2.25, pt: 2, pb: 1.5 }}>
          <Box
            sx={{
              px: 1.25,
              py: 1.1,
              borderRadius: '6px',
              border: `1px solid ${cv.purpleChipBorder}`,
              background: cv.purpleSurface,
            }}
          >
            <Typography
              sx={{
                fontSize: '0.65rem',
                color: cv.brandOrchid,
                fontWeight: 700,
                letterSpacing: '0.1em',
              }}
            >
              PLATFORM ADMIN
            </Typography>
            <Typography sx={{ fontSize: '0.7rem', color: cv.textMuted, mt: 0.35, lineHeight: 1.35 }}>
              Global console for Super Admin & Admin
            </Typography>
          </Box>
        </Box>

        <Box sx={{ flex: 1, px: 1.5, pb: 2, pt: 0, overflow: 'auto' }}>
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
                    color: cv.textMuted,
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
                      borderRadius: '6px',
                      mb: 0.35,
                      px: 1.25,
                      py: 0.85,
                      gap: 0.5,
                      position: 'relative',
                      color: cv.textSecondary,
                      transition: 'background 0.15s ease, color 0.15s ease',
                      '&:hover': {
                        background: cv.surfaceHover,
                        color: cv.textPrimary,
                      },
                      '&.active': {
                        background: cv.purpleSelection,
                        color: cv.textPrimary,
                        boxShadow: `inset 3px 0 0 ${cv.brandOrchid}`,
                        '& .MuiListItemIcon-root': {
                          color: cv.brandOrchid,
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
            borderTop: `1px solid ${cv.border}`,
            flexShrink: 0,
          }}
        >
          <Typography sx={{ fontSize: '0.65rem', color: cv.textMuted, letterSpacing: '0.04em' }}>
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
            <Typography sx={{ fontWeight: 700, fontSize: '1rem', lineHeight: 1.2, letterSpacing: '-0.02em' }}>
              NOAH Global Admin
            </Typography>
            <Typography sx={{ fontSize: '0.75rem', color: cv.textMuted, mt: 0.25 }}>
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
              onClick={handleOpenEditModal}
              sx={{
                gap: 1.25,
                py: 1.25,
                color: cv.textPrimary,
                '&:hover': { backgroundColor: cv.surfaceHover },
              }}
            >
              <EditOutlinedIcon sx={{ fontSize: 18, color: cv.brandOrchid }} />
              Edit Profile & Password
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

      {/* --- Edit Profile & Password Dialog --- */}
      <Dialog
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        maxWidth="xs"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              background: cv.drawerSurface,
              border: `1px solid ${cv.border}`,
              borderRadius: '8px',
              color: cv.textPrimary,
            },
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
          Edit Platform Admin Profile
        </DialogTitle>
        <Box component="form" onSubmit={(e) => void handleSaveProfile(e)}>
          <DialogContent dividers sx={{ borderColor: cv.border, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography sx={{ fontSize: '0.8125rem', color: cv.textSecondary }}>
              Update your account details or set a new password below.
            </Typography>

            <TextField
              fullWidth
              size="small"
              label="Full Name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />

            <TextField
              fullWidth
              size="small"
              label="Email Address"
              type="email"
              value={editEmail}
              onChange={(e) => setEditEmail(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />

            <Divider sx={{ borderColor: cv.border, my: 0.5 }}>
              <Typography sx={{ fontSize: '0.75rem', color: cv.textMuted, fontWeight: 600, uppercase: true }}>
                Change Password (Optional)
              </Typography>
            </Divider>

            <TextField
              fullWidth
              size="small"
              label="Current Password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />

            <TextField
              fullWidth
              size="small"
              label="New Password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />

            <TextField
              fullWidth
              size="small"
              label="Confirm New Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />

            {error ? (
              <Typography sx={{ color: cv.destructive, fontSize: '0.8125rem' }}>
                {error}
              </Typography>
            ) : null}
          </DialogContent>

          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setEditModalOpen(false)} sx={{ color: cv.textSecondary, textTransform: 'none' }}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={saving}
              sx={{
                background: cv.brandGradient,
                textTransform: 'none',
                fontWeight: 600,
              }}
            >
              {saving ? 'Saving...' : 'Save Profile'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* Toast Notification */}
      <Snackbar
        open={toastOpen}
        autoHideDuration={4000}
        onClose={() => setToastOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity="success" onClose={() => setToastOpen(false)} sx={{ width: '100%' }}>
          {toastMessage}
        </Alert>
      </Snackbar>

      <DashboardNotificationPopup autoOpen={false} />
    </Box>
  );
}

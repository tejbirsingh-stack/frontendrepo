import { useRef, useState } from 'react';
import { cv } from '../../theme/cssVars';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Avatar,
  Badge,
  Box,
  IconButton,
  Tooltip,
  Typography,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import GlobalSearchField from './GlobalSearchField';
import LogoutConfirmModal from './LogoutConfirmModal';
import NotificationDrawer from './NotificationDrawer';
import ProfileMenuDropdown from './ProfileMenuDropdown';
import PlanBadge from './PlanBadge';
import NoahLogo from '../NoahLogo';
import { HEADER_LOGO_WIDTH, DASHBOARD_TOP_BAR_HEIGHT, DASHBOARD_TOP_BAR_BORDER } from '../../constants/layout';
import { CURRENT_USER } from '../../constants/currentUser';
import {
  notifications as initialNotifications,
  type Notification,
} from '../../data/mockNotifications';
import { useGlobalSearchKeyboard } from '../../hooks/useGlobalSearchKeyboard';
import { useAuth } from '../../auth/AuthContext';

export default function Header({
  onMenuClick,
  showMenuButton = false,
}: {
  onMenuClick?: () => void;
  showMenuButton?: boolean;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { clearSession, user } = useAuth();
  const displayName = user?.name ? user.name.split(' ')[0] : CURRENT_USER.name.split(' ')[0];
  const rawRole = user?.role || CURRENT_USER.role;
  const displayRole = rawRole.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  const displayInitials = user?.initials || CURRENT_USER.initials;
  const displayAvatar = user?.avatarUrl || CURRENT_USER.avatarUrl;
  const isSettingsRoute = location.pathname.startsWith('/home/settings');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const profileButtonRef = useRef<HTMLDivElement>(null);
  const [profileMenuAnchor, setProfileMenuAnchor] = useState<HTMLElement | null>(null);
  const profileMenuOpen = Boolean(profileMenuAnchor);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationItems, setNotificationItems] = useState<Notification[]>(() =>
    initialNotifications.map((notification) => ({ ...notification })),
  );
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);

  useGlobalSearchKeyboard(searchInputRef, !showMenuButton);

  const unreadNotificationCount = notificationItems.filter(
    (notification) => notification.unread,
  ).length;

  const handleLogoutRequest = () => {
    setLogoutModalOpen(true);
  };

  const handleLogoutConfirm = () => {
    setLogoutModalOpen(false);
    clearSession();
    navigate('/', { replace: true });
  };


  return (
    <Box
      component="header"
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: 1100,
        display: 'flex',
        alignItems: 'center',
        gap: { xs: 1, sm: 2 },
        px: { xs: 2, sm: 3 },
        height: DASHBOARD_TOP_BAR_HEIGHT,
        minHeight: DASHBOARD_TOP_BAR_HEIGHT,
        maxHeight: DASHBOARD_TOP_BAR_HEIGHT,
        boxSizing: 'border-box',
        borderBottom: DASHBOARD_TOP_BAR_BORDER,
        background: 'var(--noah-header-background)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      }}
    >
      {showMenuButton && (
        <IconButton
          edge="start"
          aria-label="Open navigation menu"
          onClick={onMenuClick}
          sx={{
            flexShrink: 0,
            color: cv.textSecondary,
            '&:hover': { color: cv.textPrimary, backgroundColor: cv.surfaceHover },
          }}
        >
          <MenuIcon sx={{ fontSize: 24 }} />
        </IconButton>
      )}

      {showMenuButton ? (
        <NoahLogo
          to="/home"
          width={HEADER_LOGO_WIDTH}
          align="left"
          animated={false}
          showGlow={false}
          sx={{ mb: 0, px: 0, flexShrink: 0 }}
        />
      ) : (
        <GlobalSearchField inputRef={searchInputRef} sx={{ maxWidth: 560 }} />
      )}

      <Box sx={{ flex: 1 }} />

      {isSettingsRoute ? (
        <Box
          component="button"
          type="button"
          aria-label="Back to dashboard"
          onClick={() => navigate('/home')}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.75,
            flexShrink: 0,
            px: 1,
            py: 0.5,
            border: 'none',
            borderRadius: '12px',
            cursor: 'pointer',
            background: 'transparent',
            color: cv.textSecondary,
            fontFamily: 'inherit',
            '&:hover': {
              color: cv.textPrimary,
              backgroundColor: cv.surfaceHover,
            },
          }}
        >
          <HomeOutlinedIcon sx={{ fontSize: 22 }} aria-hidden="true" />
          <Typography
            component="span"
            sx={{
              fontSize: '0.875rem',
              fontWeight: 600,
              lineHeight: 1.3,
              color: 'inherit',
              whiteSpace: 'nowrap',
            }}
          >
            Dashboard
          </Typography>
        </Box>
      ) : null}

      <Tooltip
        title={
          unreadNotificationCount > 0
            ? `Notifications (${unreadNotificationCount} unread)`
            : 'Notifications'
        }
        arrow
        placement="bottom"
      >
        <Badge
          badgeContent={unreadNotificationCount}
          color="error"
          overlap="circular"
          invisible={unreadNotificationCount === 0}
          sx={{
            '& .MuiBadge-badge': {
              minWidth: 18,
              height: 18,
              fontSize: '0.6875rem',
              fontWeight: 700,
              border: '2px solid var(--noah-header-background)',
            },
          }}
        >
          <IconButton
            size="small"
            aria-label={
              unreadNotificationCount > 0
                ? `Open notifications, ${unreadNotificationCount} unread`
                : 'Open notifications'
            }
            onClick={() => setNotificationsOpen(true)}
            sx={{
              color: unreadNotificationCount > 0 ? cv.textPrimary : cv.textSecondary,
              '&:hover': { color: cv.textPrimary, backgroundColor: cv.surfaceHover },
            }}
          >
            <NotificationsNoneIcon sx={{ fontSize: 22 }} />
          </IconButton>
        </Badge>
      </Tooltip>

      <Box sx={{ display: { xs: 'none', sm: 'flex' }, flexShrink: 0 }}>
        <PlanBadge label="Premium" />
      </Box>

      <Box
        ref={profileButtonRef}
        role="button"
        tabIndex={0}
        aria-haspopup="menu"
        aria-expanded={profileMenuOpen}
        aria-label="Open profile menu"
        onClick={(event) => {
          setProfileMenuAnchor((current) =>
            current ? null : event.currentTarget,
          );
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            setProfileMenuAnchor((current) =>
              current ? null : profileButtonRef.current,
            );
          }
        }}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          px: 1,
          py: 0.5,
          borderRadius: '12px',
          cursor: 'pointer',
          backgroundColor: profileMenuOpen ? cv.surfaceHover : 'transparent',
          '&:hover': { backgroundColor: cv.surfaceHover },
        }}
      >
        <Avatar
          src={displayAvatar}
          alt={user?.name || CURRENT_USER.name}
          sx={{
            width: 36,
            height: 36,
            fontSize: '0.875rem',
            background: cv.brandGradient,
            flexShrink: 0,
          }}
        >
          {displayInitials}
        </Avatar>
        <Box sx={{ display: { xs: 'none', sm: 'block' }, minWidth: 0 }}>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 600,
              fontSize: '0.875rem',
              lineHeight: 1.3,
              color: cv.textPrimary,
            }}
          >
            {displayName}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: cv.textSecondary,
              fontSize: '0.75rem',
              lineHeight: 1.3,
              display: 'block',
            }}
          >
            {displayRole}
          </Typography>
        </Box>
        <ExpandMoreIcon
          sx={{
            fontSize: 18,
            color: cv.textSecondary,
            transform: profileMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
            display: { xs: 'none', sm: 'block' },
          }}
        />
      </Box>

      <ProfileMenuDropdown
        open={profileMenuOpen}
        anchorEl={profileMenuAnchor}
        onClose={() => setProfileMenuAnchor(null)}
        onLogout={handleLogoutRequest}
      />

      <LogoutConfirmModal
        open={logoutModalOpen}
        onClose={() => setLogoutModalOpen(false)}
        onConfirm={handleLogoutConfirm}
      />

      <NotificationDrawer
        open={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        items={notificationItems}
        onItemsChange={setNotificationItems}
      />
    </Box>
  );
}

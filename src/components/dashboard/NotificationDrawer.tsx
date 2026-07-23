import { useMemo, useState } from 'react';
import { cv } from '../../theme/cssVars';
import {
  Box,
  Drawer,
  IconButton,
  InputAdornment,
  List,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
  Button,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import DoneAllOutlinedIcon from '@mui/icons-material/DoneAllOutlined';
import MarkEmailReadOutlinedIcon from '@mui/icons-material/MarkEmailReadOutlined';
import MarkEmailUnreadOutlinedIcon from '@mui/icons-material/MarkEmailUnreadOutlined';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import SearchIcon from '@mui/icons-material/Search';
import { NOTIFICATION_DRAWER_WIDTH } from '../../constants/layout';
import type { Notification } from '../../data/mockNotifications';
import { markNotificationAsRead } from '../../api/notification.service';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutlined';
import { useNavigate } from 'react-router-dom';

interface NotificationDrawerProps {
  open: boolean;
  onClose: () => void;
  items: Notification[];
  onItemsChange: (items: Notification[]) => void;
}

type ReadFilter = 'all' | 'unread' | 'read';

const filterButtonSx = {
  px: 1.25,
  py: 0.35,
  fontSize: '0.75rem',
  fontWeight: 500,
  textTransform: 'none' as const,
  borderColor: `${cv.border} !important`,
  color: cv.textSecondary,
  '&.Mui-selected': {
    backgroundColor: `${cv.blueGlow18} !important`,
    color: cv.textPrimary,
    borderColor: `${cv.blueGlow35} !important`,
  },
  '&:hover': {
    backgroundColor: cv.surfaceHover,
  },
};

const rowActionSx = {
  width: 32,
  height: 32,
  color: cv.textMuted,
  '&:hover': {
    color: cv.textPrimary,
    backgroundColor: cv.surfaceHover,
  },
};

export default function NotificationDrawer({
  open,
  onClose,
  items,
  onItemsChange,
}: NotificationDrawerProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [readFilter, setReadFilter] = useState<ReadFilter>('all');

  const unreadCount = items.filter((notification) => notification.unread).length;

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return items.filter((notification) => {
      if (readFilter === 'unread' && !notification.unread) return false;
      if (readFilter === 'read' && notification.unread) return false;

      if (!query) return true;

      return (
        notification.title.toLowerCase().includes(query) ||
        notification.message.toLowerCase().includes(query)
      );
    });
  }, [items, readFilter, searchQuery]);

  const toggleReadState = (id: string) => {
    const target = items.find(n => n.id === id);
    if (target && target.unread) {
       markNotificationAsRead(id).catch(console.error);
    }
    onItemsChange(
      items.map((notification) =>
        notification.id === id
          ? { ...notification, unread: !notification.unread }
          : notification,
      ),
    );
  };

  const deleteNotification = (id: string) => {
    onItemsChange(items.filter((notification) => notification.id !== id));
  };

  const markAllAsRead = () => {
    markNotificationAsRead('all').catch(console.error);
    onItemsChange(
      items.map((notification) => ({ ...notification, unread: false })),
    );
  };

  const handleFilterChange = (
    _event: React.MouseEvent<HTMLElement>,
    value: ReadFilter | null,
  ) => {
    if (value) {
      setReadFilter(value);
    }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      slotProps={{
        backdrop: {
          sx: {
            backgroundColor: cv.dialogShadow,
          },
        },
        paper: {
          sx: {
            width: { xs: '100%', md: NOTIFICATION_DRAWER_WIDTH },
            maxWidth: '100vw',
            backgroundColor: cv.bg,
            borderLeft: `1px solid ${cv.border}`,
            boxShadow: cv.dropdownShadow,
          },
        },
        root: {
          sx: {
            zIndex: (theme) => theme.zIndex.drawer + 2,
          },
        },
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Box
          sx={{
            px: 2,
            pt: 2,
            pb: 1.5,
            borderBottom: `1px solid ${cv.border}`,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 1,
              mb: 1.5,
            }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 600, color: cv.textPrimary, lineHeight: 1.3 }}
              >
                Notifications
              </Typography>
              <Typography variant="caption" sx={{ color: cv.textMuted }}>
                {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, flexShrink: 0 }}>
              {unreadCount > 0 ? (
                <Tooltip title="Mark all as read">
                  <IconButton
                    size="small"
                    aria-label="Mark all as read"
                    onClick={markAllAsRead}
                    sx={rowActionSx}
                  >
                    <DoneAllOutlinedIcon sx={{ fontSize: 20 }} />
                  </IconButton>
                </Tooltip>
              ) : null}
              <Tooltip title="Close">
                <IconButton
                  size="small"
                  onClick={onClose}
                  aria-label="Close notifications"
                  sx={rowActionSx}
                >
                  <CloseIcon sx={{ fontSize: 20 }} />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          <TextField
            fullWidth
            size="small"
            placeholder="Search notifications"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ fontSize: 18, color: cv.textMuted }} />
                  </InputAdornment>
                ),
                sx: {
                  fontSize: '0.875rem',
                  color: cv.textPrimary,
                  backgroundColor: cv.surface,
                  borderRadius: '10px',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: cv.border,
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: cv.surfaceActive,
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: cv.borderFocus,
                  },
                },
              },
            }}
          />

          <ToggleButtonGroup
            exclusive
            size="small"
            value={readFilter}
            onChange={handleFilterChange}
            aria-label="Filter notifications by read status"
            sx={{ mt: 1.25, display: 'flex', gap: 0.75 }}
          >
            <ToggleButton value="all" aria-label="Show all notifications" sx={filterButtonSx}>
              All
            </ToggleButton>
            <ToggleButton value="unread" aria-label="Show unread notifications" sx={filterButtonSx}>
              Unread
            </ToggleButton>
            <ToggleButton value="read" aria-label="Show read notifications" sx={filterButtonSx}>
              Read
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {items.length === 0 ? (
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              px: 3,
              color: cv.textMuted,
            }}
          >
            <NotificationsNoneOutlinedIcon sx={{ fontSize: 40, mb: 1.5, opacity: 0.5 }} />
            <Typography variant="body2" sx={{ textAlign: 'center' }}>
              No notifications yet
            </Typography>
          </Box>
        ) : filteredItems.length === 0 ? (
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              px: 3,
              color: cv.textMuted,
            }}
          >
            <SearchIcon sx={{ fontSize: 36, mb: 1.5, opacity: 0.45 }} />
            <Typography variant="body2" sx={{ textAlign: 'center' }}>
              No notifications match your search or filter
            </Typography>
          </Box>
        ) : (
          <List
            disablePadding
            sx={{
              flex: 1,
              overflowY: 'auto',
              py: 0.5,
            }}
          >
            {filteredItems.map((notification) => (
              <Box
                key={notification.id}
                sx={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 1,
                  px: 2,
                  py: 1.5,
                  borderBottom: `1px solid ${cv.border}`,
                  backgroundColor: notification.unread
                    ? cv.blueSelectionFaint
                    : 'transparent',
                  '&:hover': {
                    backgroundColor: notification.unread
                      ? cv.blueDragSurface
                      : cv.surfaceHover,
                  },
                }}
              >
                <Box
                  sx={{
                    mt: 0.75,
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    flexShrink: 0,
                    backgroundColor: notification.unread ? cv.brandBlue : 'transparent',
                    boxShadow: notification.unread ? cv.notificationGlow : 'none',
                  }}
                />

                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: notification.unread ? 600 : 500,
                      fontSize: '0.875rem',
                      color: cv.textPrimary,
                      mb: 0.25,
                    }}
                  >
                    {notification.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: '0.8125rem',
                      color: cv.textSecondary,
                      lineHeight: 1.45,
                      mb: 0.5,
                    }}
                  >
                    {notification.message}
                  </Typography>
                  <Typography variant="caption" sx={{ color: cv.textMuted, fontSize: '0.75rem' }}>
                    {notification.time}
                  </Typography>

                  {notification.type === 'approval_request' && notification.relatedEntityId && (
                    <Box sx={{ display: 'flex', gap: 1, mt: 1.5 }}>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<PlayCircleOutlineIcon />}
                        onClick={(e) => { e.stopPropagation(); navigate(`/home/deletion-requests`); onClose(); }}
                        sx={{
                          fontSize: '0.7rem',
                          minWidth: 0,
                          py: 0.25,
                          px: 1.25,
                          color: cv.brandBlue,
                          borderColor: cv.brandBlue,
                          '&:hover': {
                            backgroundColor: cv.blueGlow18,
                            borderColor: cv.brandBlue,
                          },
                        }}
                      >
                        Review Request
                      </Button>
                    </Box>
                  )}
                </Box>

                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: { xs: 'row', sm: 'column' },
                    gap: 0.25,
                    flexShrink: 0,
                  }}
                >
                  <Tooltip
                    title={notification.unread ? 'Mark as read' : 'Mark as unread'}
                  >
                    <IconButton
                      size="small"
                      aria-label={
                        notification.unread ? 'Mark as read' : 'Mark as unread'
                      }
                      onClick={() => toggleReadState(notification.id)}
                      sx={rowActionSx}
                    >
                      {notification.unread ? (
                        <MarkEmailReadOutlinedIcon sx={{ fontSize: 18 }} />
                      ) : (
                        <MarkEmailUnreadOutlinedIcon sx={{ fontSize: 18 }} />
                      )}
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete notification">
                    <IconButton
                      size="small"
                      aria-label="Delete notification"
                      onClick={() => deleteNotification(notification.id)}
                      sx={{
                        ...rowActionSx,
                        '&:hover': {
                          color: cv.destructive,
                          backgroundColor: cv.destructiveHover,
                        },
                      }}
                    >
                      <DeleteOutlinedIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            ))}
          </List>
        )}
      </Box>
    </Drawer>
  );
}

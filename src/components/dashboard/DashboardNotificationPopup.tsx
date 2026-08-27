import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
} from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import { fetchPublicDashboardNotification, type DashboardNotificationSettings } from '../../platform/api/platformApi';
import { cv } from '../../theme/cssVars';

export default function DashboardNotificationPopup() {
  const [open, setOpen] = useState(false);
  const [notification, setNotification] = useState<DashboardNotificationSettings | null>(null);

  useEffect(() => {
    let mounted = true;
    const checkNotification = async () => {
      try {
        const res = await fetchPublicDashboardNotification();
        if (mounted && res.success && res.notification && res.notification.isEnabled) {
          const { updatedAt } = res.notification;
          const dismissalKey = `dashboard_notification_dismissed_${updatedAt}`;
          
          if (!localStorage.getItem(dismissalKey)) {
            setNotification(res.notification);
            setOpen(true);
          }
        }
      } catch (err) {
        console.warn('Failed to load dashboard notification', err);
      }
    };
    
    checkNotification();
    
    return () => {
      mounted = false;
    };
  }, []);

  const handleDismiss = () => {
    if (notification?.updatedAt) {
      const dismissalKey = `dashboard_notification_dismissed_${notification.updatedAt}`;
      localStorage.setItem(dismissalKey, 'true');
    }
    setOpen(false);
  };

  const handleCtaClick = () => {
    if (notification?.ctaUrl) {
      window.open(notification.ctaUrl, '_blank', 'noopener,noreferrer');
    }
    handleDismiss();
  };

  if (!notification || !open) return null;

  return (
    <Dialog
      open={open}
      onClose={handleDismiss}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        elevation: 24,
        sx: {
          borderRadius: 3,
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(16px) saturate(180%)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          color: '#f8fafc',
          p: 1,
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        pb: 1,
      }}>
        <Typography variant="h5" sx={{ fontWeight: 600, color: '#f8fafc' }}>
          {notification.title}
        </Typography>
        <IconButton 
          onClick={handleDismiss} 
          size="small"
          sx={{ 
            color: '#94a3b8', 
            '&:hover': { color: '#f8fafc', backgroundColor: 'rgba(255,255,255,0.1)' } 
          }}
        >
          <CloseRoundedIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ py: 2 }}>
        <Typography 
          variant="body1" 
          sx={{ 
            color: '#cbd5e1', 
            lineHeight: 1.6,
            whiteSpace: 'pre-line' 
          }}
        >
          {notification.body}
        </Typography>
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 2, pt: 1, gap: 1.5 }}>
        <Button 
          variant="text" 
          onClick={handleDismiss}
          sx={{ 
            color: '#94a3b8', 
            textTransform: 'none',
            '&:hover': { backgroundColor: 'rgba(255,255,255,0.05)', color: '#f8fafc' }
          }}
        >
          Dismiss
        </Button>
        {notification.ctaLabel && notification.ctaUrl && (
          <Button 
            variant="contained" 
            onClick={handleCtaClick}
            sx={{ 
              textTransform: 'none', 
              backgroundColor: cv.primary,
              '&:hover': { backgroundColor: cv.primaryHover },
              borderRadius: 2,
              px: 3,
            }}
          >
            {notification.ctaLabel}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

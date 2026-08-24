import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Switch,
  Typography,
  Box,
  Divider,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CookieOutlinedIcon from '@mui/icons-material/CookieOutlined';
import toast from 'react-hot-toast';
import { useAuth } from '../../auth/AuthContext';
import { updateProfileRequest } from '../../api/users.service';
import {
  getStoredCookieConsent,
  saveCookieConsent,
  acceptAllCookies,
  type CookieConsentPreferences,
} from '../../utils/cookieConsent';

interface CookiePreferencesDialogProps {
  open: boolean;
  onClose: () => void;
}

interface CookieCategoryConfig {
  key: keyof Omit<CookieConsentPreferences, 'updatedAt'>;
  title: string;
  badge?: string;
  description: string;
  required?: boolean;
}

const CATEGORIES: CookieCategoryConfig[] = [
  {
    key: 'essential',
    title: 'Essential & Security Cookies',
    badge: 'Always active',
    description:
      'Required for core application security, user login authentication, session management, and CSRF protection. Cannot be turned off.',
    required: true,
  },
  {
    key: 'functional',
    title: 'Functional & Preference Cookies',
    description:
      'Remembers your personal UI preferences, such as selected dark/light theme mode, default workspace views, and localized date settings.',
    required: false,
  },
  {
    key: 'analytics',
    title: 'Performance & Analytics Cookies',
    description:
      'Helps us understand how Noah Cloud is used by collecting anonymous interaction metrics to improve application performance and features.',
    required: false,
  },
  {
    key: 'marketing',
    title: 'Marketing & Targeting Cookies',
    description:
      'Used to measure the performance of advertising campaigns and personalize product recommendations if enabled.',
    required: false,
  },
];

export default function CookiePreferencesDialog({ open, onClose }: CookiePreferencesDialogProps) {
  const { user, refreshUser } = useAuth();
  const [preferences, setPreferences] = useState<CookieConsentPreferences>(getStoredCookieConsent());

  useEffect(() => {
    if (open) {
      if (user?.preferences?.cookieConsent) {
        const dbConsent = user.preferences.cookieConsent as CookieConsentPreferences;
        const fullConsent = saveCookieConsent({
          functional: dbConsent.functional,
          analytics: dbConsent.analytics,
          marketing: dbConsent.marketing,
        });
        setPreferences(fullConsent);
      } else {
        setPreferences(getStoredCookieConsent());
      }
    }
  }, [open, user]);

  const handleToggle = (key: keyof Omit<CookieConsentPreferences, 'updatedAt'>) => {
    if (key === 'essential') return;
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const persistPreferences = async (newConsent: CookieConsentPreferences) => {
    // 1. Always save to LocalStorage for fast client-side checks
    saveCookieConsent({
      functional: newConsent.functional,
      analytics: newConsent.analytics,
      marketing: newConsent.marketing,
    });

    // 2. If logged in, sync to database via updateProfileRequest
    if (user) {
      try {
        await updateProfileRequest({
          preferences: {
            cookieConsent: newConsent,
          },
        });
        await refreshUser();
      } catch (err: any) {
        console.error('Failed to sync cookie preferences to database:', err);
      }
    }
  };

  const handleSave = async () => {
    await persistPreferences(preferences);
    toast.success('Cookie preferences saved');
    onClose();
  };

  const handleAcceptAll = async () => {
    const updated = acceptAllCookies();
    setPreferences(updated);
    await persistPreferences(updated);
    toast.success('All cookie preferences enabled');
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '16px',
          bgcolor: 'var(--noah-surface, #1e1e2d)',
          color: 'var(--noah-text-primary, #ffffff)',
          border: '1px solid var(--noah-border, rgba(255, 255, 255, 0.12))',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
          p: 1,
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justify: 'space-between',
          pb: 1,
          pt: 2,
          px: 3,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <CookieOutlinedIcon sx={{ color: '#38BDF8', fontSize: 28 }} />
          <Typography variant="h6" fontWeight={700} sx={{ color: 'var(--noah-text-primary, #ffffff)' }}>
            Cookie Preferences
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ px: 3, py: 1 }}>
        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 3 }}>
          Configure data tracking and privacy consent options. Essential cookies are required to run Noah Cloud securely and stay logged in.
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {CATEGORIES.map((cat, index) => (
            <React.Fragment key={cat.key}>
              {index > 0 && <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.08)' }} />}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Typography variant="subtitle2" fontWeight={600} sx={{ color: 'var(--noah-text-primary, #ffffff)' }}>
                      {cat.title}
                    </Typography>
                    {cat.badge && (
                      <Box
                        component="span"
                        sx={{
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          px: 1,
                          py: 0.2,
                          borderRadius: '12px',
                          bgcolor: 'rgba(56, 189, 248, 0.15)',
                          color: '#38BDF8',
                          textTransform: 'uppercase',
                        }}
                      >
                        {cat.badge}
                      </Box>
                    )}
                  </Box>
                  <Typography variant="body2" fontSize="0.825rem" sx={{ color: 'rgba(255, 255, 255, 0.6)', lineHeight: 1.45 }}>
                    {cat.description}
                  </Typography>
                </Box>

                <Switch
                  checked={Boolean(preferences[cat.key])}
                  onChange={() => handleToggle(cat.key)}
                  disabled={cat.required}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: '#38BDF8',
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: '#0284C7',
                    },
                  }}
                />
              </Box>
            </React.Fragment>
          ))}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, gap: 1.5, borderTop: '1px solid rgba(255, 255, 255, 0.08)', mt: 2 }}>
        <Button
          onClick={handleAcceptAll}
          variant="outlined"
          sx={{
            borderColor: 'rgba(255, 255, 255, 0.2)',
            color: 'var(--noah-text-primary, #ffffff)',
            borderRadius: '10px',
            textTransform: 'none',
            fontWeight: 600,
            '&:hover': { borderColor: '#38BDF8', color: '#38BDF8' },
          }}
        >
          Accept all
        </Button>
        <Box sx={{ flex: 1 }} />
        <Button
          onClick={onClose}
          sx={{
            color: 'rgba(255, 255, 255, 0.7)',
            textTransform: 'none',
            fontWeight: 600,
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          sx={{
            bgcolor: '#38BDF8',
            color: '#0F172A',
            borderRadius: '10px',
            textTransform: 'none',
            fontWeight: 700,
            px: 2.5,
            '&:hover': { bgcolor: '#0284C7' },
          }}
        >
          Save preferences
        </Button>
      </DialogActions>
    </Dialog>
  );
}

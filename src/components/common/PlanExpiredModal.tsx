import { useState, useMemo } from 'react';
import { Box, Button, Dialog, DialogActions, DialogContent, Typography, IconButton } from '@mui/material';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import CloseIcon from '@mui/icons-material/Close';
import toast from 'react-hot-toast';
import { useAuth } from '../../auth/AuthContext';
import { cv } from '../../theme/cssVars';
import ChoosePlanScreen from '../onboarding/ChoosePlanScreen';
import { getDynamicPlanDetails } from '../../utils/planHelper';
import { apiClient } from '../../api/client';

import { billingService } from '../../api/billing.service';

export default function PlanExpiredModal() {
  const { user, refreshUser, clearSession } = useAuth();
  const [choosePlanOpen, setChoosePlanOpen] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);

  const planDetails = useMemo(() => getDynamicPlanDetails(user), [user]);

  const isExpired = useMemo(() => {
    if (!user || !user.organization) return false;
    const expiresAt = user.organization.planExpiresAt;
    if (!expiresAt) return false;
    const expireTime = new Date(expiresAt).getTime();
    return !isNaN(expireTime) && expireTime < Date.now();
  }, [user]);

  if (!user || !isExpired) {
    return null;
  }

  const rawRole = (user.role || '').toLowerCase().replace(/_/g, ' ');
  const isSuperAdmin =
    rawRole.includes('super admin') ||
    rawRole.includes('superadmin') ||
    rawRole.includes('system admin') ||
    rawRole.includes('admin');

  const handleUpgradePlan = async (
    planId: string,
    billingCycle: 'annual' | 'monthly',
    priceId?: string,
    useSavedCard: boolean = true,
  ) => {
    setIsUpgrading(true);
    try {
      let activePriceId = priceId;
      const normalizedId = planId.toLowerCase().trim();

      if (!activePriceId && normalizedId !== 'free') {
        const { fetchPublicCatalogPlans } = await import('../../platform/api/platformApi');
        const catalog = await fetchPublicCatalogPlans().catch(() => null);
        const match = catalog?.plans?.find(
          (p: any) => p.name?.toLowerCase() === normalizedId || p.id?.toLowerCase() === normalizedId
        );
        if (match) {
          activePriceId = billingCycle === 'annual' ? (match.yearlyPriceId || match.monthlyPriceId) : match.monthlyPriceId;
        }
        if (!activePriceId) {
          activePriceId = normalizedId;
        }
      }

      if (activePriceId) {
        toast.loading(useSavedCard ? 'Processing subscription upgrade...' : 'Opening payment page...', { id: 'stripe-checkout' });
        const res: any = await billingService.createCheckoutSession(activePriceId, useSavedCard);
        if (res?.directUpgrade) {
          await refreshUser();
          toast.success(res.message || 'Subscription successfully upgraded!', { id: 'stripe-checkout' });
          setChoosePlanOpen(false);
          return;
        }
        if (res?.url) {
          window.location.href = res.url;
          return;
        }
      }

      const token = localStorage.getItem('token');
      const res = await apiClient.post<any>(
        '/auth/upgrade-plan',
        { planId, billingCycle },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      await refreshUser();
      toast.success((res as any)?.message || `Upgraded to ${planId.toUpperCase()} plan!`);
      setChoosePlanOpen(false);
    } catch (err: any) {
      console.error('Failed to upgrade plan:', err);
      const errMsg = err?.response?.data?.message || err?.message || 'Failed to upgrade plan';
      toast.error(errMsg, { id: 'stripe-checkout' });
    } finally {
      setIsUpgrading(false);
    }
  };

  return (
    <>
      <Dialog
        open={true}
        keepMounted
        sx={{
          zIndex: 9999,
          '& .MuiBackdrop-root': {
            backgroundColor: 'rgba(5, 7, 15, 0.88)',
            backdropFilter: 'blur(20px)',
          },
          '& .MuiDialog-paper': {
            backgroundColor: cv.glassBackground,
            backdropFilter: 'blur(40px) saturate(180%)',
            border: `1px solid ${cv.border}`,
            borderRadius: '24px',
            boxShadow: `0 24px 80px rgba(0, 0, 0, 0.6), 0 0 40px ${cv.purpleGlow24}`,
            color: cv.textPrimary,
            maxWidth: 480,
            width: '100%',
            p: 1,
            m: 2,
          },
        }}
      >
        <DialogContent sx={{ pt: 3, pb: 2, px: 3, textAlign: 'center' }}>
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              backgroundColor: 'rgba(239, 68, 68, 0.12)',
              border: `1px solid rgba(239, 68, 68, 0.25)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 2.5,
              color: '#ef4444',
            }}
          >
            {isSuperAdmin ? (
              <WarningAmberRoundedIcon sx={{ fontSize: 36 }} />
            ) : (
              <LockOutlinedIcon sx={{ fontSize: 32 }} />
            )}
          </Box>

          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              color: cv.textPrimary,
              letterSpacing: '-0.02em',
              mb: 1,
            }}
          >
            Subscription Plan Expired
          </Typography>

          <Typography
            sx={{
              fontSize: '0.9375rem',
              color: cv.textSecondary,
              lineHeight: 1.55,
              mb: 3,
            }}
          >
            {isSuperAdmin ? (
              <>
                Your organization&apos;s subscription plan expired on{' '}
                <strong style={{ color: cv.textPrimary }}>{planDetails.expiryDateFormatted}</strong>.
                Please upgrade your plan to restore full workspace access for your team.
              </>
            ) : (
              <>
                Your organization&apos;s subscription plan expired on{' '}
                <strong style={{ color: cv.textPrimary }}>{planDetails.expiryDateFormatted}</strong>.
                Please contact your organization Super Admin to upgrade the subscription.
              </>
            )}
          </Typography>
        </DialogContent>

        <DialogActions
          sx={{
            pb: 3,
            px: 3,
            pt: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5,
          }}
        >
          {isSuperAdmin ? (
            <Button
              variant="contained"
              fullWidth
              disabled={isUpgrading}
              onClick={() => setChoosePlanOpen(true)}
              sx={{
                py: 1.25,
                background: cv.brandGradient,
                color: cv.textOnCta,
                textTransform: 'none',
                borderRadius: '12px',
                fontWeight: 600,
                fontSize: '0.9375rem',
                boxShadow: cv.brandShadowSoft,
                '&:hover': {
                  background: cv.brandGradientHover,
                  boxShadow: cv.brandShadowStrong,
                },
              }}
            >
              Upgrade Your Plan
            </Button>
          ) : null}

          <Button
            variant="outlined"
            fullWidth
            onClick={() => clearSession()}
            sx={{
              py: 1.1,
              borderColor: cv.border,
              color: cv.textSecondary,
              textTransform: 'none',
              borderRadius: '12px',
              fontWeight: 500,
              fontSize: '0.875rem',
              '&:hover': {
                borderColor: cv.borderFocus,
                backgroundColor: cv.surfaceHover,
                color: cv.textPrimary,
              },
            }}
          >
            Log Out
          </Button>
        </DialogActions>
      </Dialog>

      {/* Upgrade Plan Screen Modal for Super Admin */}
      <Dialog
        fullScreen
        open={choosePlanOpen}
        onClose={() => setChoosePlanOpen(false)}
        sx={{
          zIndex: 10000,
          '& .MuiDialog-paper': {
            background: cv.bg,
            color: cv.textPrimary,
          },
        }}
      >
        <Box sx={{ position: 'absolute', top: 20, right: 24, zIndex: 1200 }}>
          <IconButton
            onClick={() => setChoosePlanOpen(false)}
            sx={{
              color: cv.textSecondary,
              backgroundColor: cv.surfaceHover,
              border: `1px solid ${cv.border}`,
              '&:hover': { backgroundColor: cv.surfaceActive, color: cv.textPrimary },
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
        <ChoosePlanScreen
          onSelectPlan={handleUpgradePlan}
          currentPlanId={planDetails.planId}
        />
      </Dialog>
    </>
  );
}

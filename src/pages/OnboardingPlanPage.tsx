import React from 'react';
import { Box, Typography } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import ChoosePlanScreen from '../components/onboarding/ChoosePlanScreen';
import { billingService } from '../api/billing.service';
import { toast } from 'react-hot-toast';

export default function OnboardingPlanPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const canceled = queryParams.get('canceled');

  const handlePlanSelect = async (planId: string, billingCycle: string) => {
    if (planId.toLowerCase() === 'free') {
      navigate('/home', { replace: true });
      return;
    }

    try {
      const { fetchPublicCatalogPlans } = await import('../platform/api/platformApi');
      const catalog = await fetchPublicCatalogPlans().catch(() => null);
      const match = catalog?.plans?.find(
        (p: any) => p.name?.toLowerCase() === planId.toLowerCase() || p.id?.toLowerCase() === planId.toLowerCase()
      );
      
      let activePriceId = null;
      if (match) {
        activePriceId = billingCycle === 'annual' ? (match.yearlyPriceId || match.monthlyPriceId) : match.monthlyPriceId;
      }
      
      if (activePriceId) {
        toast.loading('Redirecting to secure checkout...', { id: 'stripe-signup-checkout' });
        const res: any = await billingService.createCheckoutSession(
          activePriceId, 
          false,
          '/home?payment_success=true',
          '/onboarding/plan?canceled=true'
        );
        if (res?.url) {
          window.location.href = res.url;
          return;
        }
      }
    } catch (err: any) {
      console.error('Failed to initiate checkout:', err);
      toast.dismiss('stripe-signup-checkout');
      toast.error('Could not start checkout. Please try again.');
    }
  };

  return (
    <Box sx={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {canceled && (
        <Box sx={{ p: 2, textAlign: 'center', backgroundColor: '#3b0764', color: '#fff' }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            Payment was canceled. You are currently on the Free plan. Please select a plan to continue to your dashboard.
          </Typography>
        </Box>
      )}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <ChoosePlanScreen onSelectPlan={(planId, billingCycle) => void handlePlanSelect(planId, billingCycle)} />
      </Box>
    </Box>
  );
}

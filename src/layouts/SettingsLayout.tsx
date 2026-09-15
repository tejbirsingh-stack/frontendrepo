import { useMemo } from 'react';
import { Outlet, useParams } from 'react-router-dom';
import { cv } from '../theme/cssVars';
import { Box, Typography } from '@mui/material';
import PlanBadge from '../components/dashboard/PlanBadge';
import { getSettingsSectionMeta } from '../constants/settingsNav';
import { useAuth } from '../auth/AuthContext';
import { getDynamicPlanDetails } from '../utils/planHelper';

export default function SettingsLayout() {
  const { group, section } = useParams();
  const { user } = useAuth();
  const planDetails = useMemo(() => getDynamicPlanDetails(user), [user]);
  const isFreePlan = planDetails.planId === 'free';
  const pathSuffix = [group, section].filter(Boolean).join('/');
  const sectionMeta = getSettingsSectionMeta(pathSuffix);
  const displayPlan = (planDetails.planId || 'free').toUpperCase();

  return (
    <Box
      component="main"
      sx={{
        flex: 1,
        overflowY: 'auto',
        px: { xs: 2, md: 3 },
        py: { xs: 2, md: 3 },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 2,
          mb: { xs: 2.5, md: 3 },
        }}
      >
        <Box>
          <Typography
            component="h1"
            sx={{
              fontSize: { xs: '1.5rem', md: '1.75rem' },
              fontWeight: 600,
              color: cv.textPrimary,
              letterSpacing: '-0.02em',
            }}
          >
            {sectionMeta?.sectionLabel ?? 'Settings'}
          </Typography>
          {sectionMeta ? (
            <Typography sx={{ mt: 0.5, fontSize: '0.875rem', color: cv.textSecondary }}>
              {sectionMeta.groupLabel}
            </Typography>
          ) : null}
        </Box>
        <PlanBadge
          label={displayPlan}
          size="md"
          expiryText={isFreePlan ? planDetails.expiryDateFormatted : null}
        />
      </Box>

      <Box sx={{ width: '100%', minWidth: 0 }}>
        <Outlet />
      </Box>
    </Box>
  );
}

import { Outlet, useLocation } from 'react-router-dom';
import PageSuspense from '../components/loading/PageSuspense';
import SettingsContentSkeleton from '../components/loading/SettingsContentSkeleton';
import { cv } from '../theme/cssVars';
import { Box, Typography } from '@mui/material';
import PlanBadge from '../components/dashboard/PlanBadge';
import { getSettingsSectionMeta } from '../constants/settingsNav';

export default function SettingsLayout() {
  const location = useLocation();
  const pathSuffix = location.pathname.replace('/home/settings/', '').replace(/\/$/, '');
  const sectionMeta = getSettingsSectionMeta(pathSuffix);

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
        <PlanBadge label="Team · Premium" size="md" />
      </Box>

      <Box sx={{ width: '100%', minWidth: 0 }}>
        <PageSuspense fallback={<SettingsContentSkeleton />}>
          <Outlet />
        </PageSuspense>
      </Box>
    </Box>
  );
}

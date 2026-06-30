import Skeleton from 'react-loading-skeleton';
import { Box } from '@mui/material';
import { cv } from '../../theme/cssVars';
import {
  DASHBOARD_TOP_BAR_BORDER,
  DASHBOARD_TOP_BAR_HEIGHT,
  SIDE_PANEL_WIDTH,
  SIDEBAR_DESKTOP_BREAKPOINT,
} from '../../constants/layout';

const mediaCardSkeletons = Array.from({ length: 8 }, (_, index) => index);

export default function DashboardShellSkeleton() {
  return (
    <Box
      sx={{
        display: 'flex',
        height: '100vh',
        overflow: 'hidden',
        backgroundColor: cv.bg,
      }}
    >
      <Box
        sx={{
          display: { xs: 'none', [SIDEBAR_DESKTOP_BREAKPOINT]: 'flex' },
          flexDirection: 'column',
          width: SIDE_PANEL_WIDTH,
          flexShrink: 0,
          borderRight: DASHBOARD_TOP_BAR_BORDER,
          backgroundColor: cv.sidebarSurface,
          p: 2,
        }}
      >
        <Box sx={{ height: DASHBOARD_TOP_BAR_HEIGHT, display: 'flex', alignItems: 'center', mb: 2 }}>
          <Skeleton width={108} height={28} />
        </Box>
        <Skeleton count={6} height={36} style={{ marginBottom: 8 }} />
        <Box sx={{ mt: 'auto' }}>
          <Skeleton height={40} borderRadius="0.75rem" />
        </Box>
      </Box>

      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          height: '100vh',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            height: DASHBOARD_TOP_BAR_HEIGHT,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: { xs: 2, md: 3 },
            borderBottom: DASHBOARD_TOP_BAR_BORDER,
            backgroundColor: cv.headerBackground,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ display: { xs: 'block', [SIDEBAR_DESKTOP_BREAKPOINT]: 'none' } }}>
              <Skeleton width={36} height={36} borderRadius="0.5rem" />
            </Box>
            <Skeleton width={160} height={24} />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Skeleton width={36} height={36} circle />
            <Skeleton width={36} height={36} circle />
            <Skeleton width={36} height={36} circle />
          </Box>
        </Box>

        <Box
          sx={{
            flex: 1,
            overflow: 'hidden',
            px: { xs: 2, md: 3 },
            py: { xs: 2, md: 3 },
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 2,
              mb: 3,
            }}
          >
            <Skeleton width={180} height={32} />
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Skeleton width={100} height={36} borderRadius="0.75rem" />
              <Skeleton width={120} height={36} borderRadius="0.75rem" />
            </Box>
          </Box>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: 'repeat(2, minmax(0, 1fr))',
                sm: 'repeat(3, minmax(0, 1fr))',
                md: 'repeat(4, minmax(0, 1fr))',
              },
              gap: 2,
            }}
          >
            {mediaCardSkeletons.map((index) => (
              <Box key={index}>
                <Skeleton height={140} borderRadius="0.75rem" />
                <Box sx={{ mt: 1 }}>
                  <Skeleton height={16} width="75%" />
                </Box>
                <Box sx={{ mt: 0.5 }}>
                  <Skeleton height={14} width="45%" />
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

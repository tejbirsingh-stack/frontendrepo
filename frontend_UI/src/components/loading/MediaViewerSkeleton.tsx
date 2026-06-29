import Skeleton from 'react-loading-skeleton';
import { Box } from '@mui/material';
import { cv } from '../../theme/cssVars';
import {
  DASHBOARD_TOP_BAR_BORDER,
  DASHBOARD_TOP_BAR_HEIGHT,
} from '../../constants/layout';

export default function MediaViewerSkeleton() {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflow: 'hidden',
        backgroundColor: cv.bg,
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
          <Skeleton width={108} height={28} />
          <Skeleton width={140} height={20} />
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Skeleton width={36} height={36} circle />
          <Skeleton width={36} height={36} circle />
        </Box>
      </Box>

      <Box
        sx={{
          flex: 1,
          display: 'flex',
          minHeight: 0,
          backgroundColor: cv.videoStage,
        }}
      >
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: { xs: 2, md: 4 },
          }}
        >
          <Box sx={{ width: '100%', maxWidth: 960 }}>
            <Skeleton height="min(56vw, 540px)" borderRadius="0.75rem" />
          </Box>
        </Box>

        <Box
          sx={{
            display: { xs: 'none', md: 'flex' },
            flexDirection: 'column',
            width: 360,
            flexShrink: 0,
            borderLeft: DASHBOARD_TOP_BAR_BORDER,
            backgroundColor: cv.panelTint,
            p: 2,
            gap: 2,
          }}
        >
          <Skeleton height={24} width="60%" />
          <Skeleton count={4} height={72} style={{ marginBottom: 12 }} borderRadius="0.75rem" />
        </Box>
      </Box>

      <Box
        sx={{
          flexShrink: 0,
          borderTop: DASHBOARD_TOP_BAR_BORDER,
          backgroundColor: cv.footerTint,
          px: { xs: 2, md: 3 },
          py: 2,
        }}
      >
        <Skeleton height={48} borderRadius="999px" />
      </Box>
    </Box>
  );
}

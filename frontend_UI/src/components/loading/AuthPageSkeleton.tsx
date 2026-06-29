import Skeleton from 'react-loading-skeleton';
import { Box } from '@mui/material';
import { cv } from '../../theme/cssVars';

export default function AuthPageSkeleton() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: { xs: 2, sm: 3, md: 4 },
        backgroundColor: cv.bg,
      }}
    >
      <Box
        sx={{
          width: '100%',
          maxWidth: 440,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 3,
        }}
      >
        <Skeleton circle width={56} height={56} />

        <Box
          sx={{
            width: '100%',
            p: { xs: 3, sm: 4 },
            borderRadius: 3,
            border: `1px solid ${cv.border}`,
            backgroundColor: cv.glassBackground,
            boxShadow: cv.cardShadow,
          }}
        >
          <Box sx={{ mb: 4 }}>
            <Skeleton height={32} width="55%" />
            <Box sx={{ mt: 1.5 }}>
              <Skeleton height={18} width="80%" />
            </Box>
          </Box>

          <Box sx={{ mb: 2.5 }}>
            <Skeleton height={14} width={48} />
            <Box sx={{ mt: 1 }}>
              <Skeleton height={48} borderRadius="0.75rem" />
            </Box>
          </Box>

          <Box sx={{ mb: 2 }}>
            <Skeleton height={14} width={64} />
            <Box sx={{ mt: 1 }}>
              <Skeleton height={48} borderRadius="0.75rem" />
            </Box>
          </Box>

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 3,
            }}
          >
            <Skeleton width={120} height={20} />
            <Skeleton width={110} height={20} />
          </Box>

          <Skeleton height={48} borderRadius="0.75rem" />

          <Box sx={{ my: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Skeleton height={4} containerClassName="skeleton-stretch" />
            </Box>
            <Skeleton width={24} height={16} />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Skeleton height={4} containerClassName="skeleton-stretch" />
            </Box>
          </Box>

          <Skeleton height={48} borderRadius="0.75rem" />

          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
            <Skeleton width={220} height={18} />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

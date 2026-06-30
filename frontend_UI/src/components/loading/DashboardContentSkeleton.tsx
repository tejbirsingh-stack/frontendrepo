import Skeleton from 'react-loading-skeleton';
import { Box } from '@mui/material';

const mediaCardSkeletons = Array.from({ length: 8 }, (_, index) => index);

export default function DashboardContentSkeleton() {
  return (
    <Box
      sx={{
        flex: 1,
        overflow: 'auto',
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
  );
}

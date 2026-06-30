import Skeleton from 'react-loading-skeleton';
import { Box } from '@mui/material';

const rowSkeletons = Array.from({ length: 5 }, (_, index) => index);

export default function SettingsContentSkeleton() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      {rowSkeletons.map((index) => (
        <Box
          key={index}
          sx={{
            p: 2.5,
            borderRadius: 2,
            border: '1px solid var(--noah-border)',
            backgroundColor: 'var(--noah-surface)',
          }}
        >
          <Skeleton width="30%" height={20} />
          <Box sx={{ mt: 1.5 }}>
            <Skeleton height={44} borderRadius="0.75rem" />
          </Box>
        </Box>
      ))}
    </Box>
  );
}

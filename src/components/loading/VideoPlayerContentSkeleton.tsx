import Skeleton from 'react-loading-skeleton';
import { Box } from '@mui/material';
import { cv } from '../../theme/cssVars';

export default function VideoPlayerContentSkeleton() {
  return (
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
          <Skeleton height={420} borderRadius="0.75rem" />
        </Box>
      </Box>

      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          width: 360,
          flexShrink: 0,
          borderLeft: '1px solid var(--noah-border)',
          backgroundColor: cv.panelTint,
          p: 2,
          gap: 2,
        }}
      >
        <Skeleton width="60%" height={24} />
        <Skeleton count={4} height={72} style={{ marginBottom: 12 }} borderRadius="0.75rem" />
      </Box>
    </Box>
  );
}

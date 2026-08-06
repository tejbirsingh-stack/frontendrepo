import { Box, CircularProgress, Typography } from '@mui/material';
import { forwardRef } from 'react';
import { cv } from '../../theme/cssVars';

interface LibraryScrollSentinelProps {
  loading: boolean;
  hasMore: boolean;
}

const LibraryScrollSentinel = forwardRef<HTMLDivElement, LibraryScrollSentinelProps>(
  ({ loading, hasMore }, ref) => {
    return (
      <Box
        ref={ref}
        sx={{
          width: '100%',
          py: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 80,
        }}
      >
        {loading && (
          <CircularProgress
            size={24}
            thickness={4}
            sx={{
              color: cv.brandOrchid,
            }}
          />
        )}
        {!hasMore && !loading && (
          <Typography variant="caption" sx={{ color: cv.textMuted }}>
            No more items to show.
          </Typography>
        )}
      </Box>
    );
  }
);

LibraryScrollSentinel.displayName = 'LibraryScrollSentinel';

export default LibraryScrollSentinel;

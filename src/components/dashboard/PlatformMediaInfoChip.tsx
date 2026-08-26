import { Box, Tooltip } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { cv } from '../../theme/cssVars';
import type { MediaItem } from '../../data/mockMedia';
import { isPlatformMediaAsset } from '../../utils/platformMedia';

const PLATFORM_MEDIA_TOOLTIP =
  'NOAH Cloud platform content — stored on NOAH Cloud and cannot be deleted or removed from your library.';

interface PlatformMediaInfoChipProps {
  readonly item: MediaItem;
}

/** Footer chip shown next to the actions menu for platform-seeded media. */
export default function PlatformMediaInfoChip({ item }: PlatformMediaInfoChipProps) {
  if (!isPlatformMediaAsset(item)) return null;

  return (
    <Tooltip title={PLATFORM_MEDIA_TOOLTIP} arrow placement="top">
      <Box
        component="span"
        aria-label="NOAH Cloud platform content"
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 28,
          height: 28,
          flexShrink: 0,
          borderRadius: '8px',
          color: cv.textMuted,
          '&:hover': {
            color: cv.textPrimary,
            backgroundColor: cv.surfaceHover,
          },
        }}
      >
        <InfoOutlinedIcon sx={{ fontSize: 18 }} />
      </Box>
    </Tooltip>
  );
}

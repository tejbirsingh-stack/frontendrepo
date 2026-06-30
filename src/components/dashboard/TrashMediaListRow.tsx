import { Box, Button, Checkbox, Tooltip, Typography } from '@mui/material';
import { cv } from '../../theme/cssVars';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import VideocamOutlinedIcon from '@mui/icons-material/VideocamOutlined';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import AudioFileOutlinedIcon from '@mui/icons-material/AudioFileOutlined';
import RestoreFromTrashOutlinedIcon from '@mui/icons-material/RestoreFromTrashOutlined';
import type { MediaItem, MediaType } from '../../data/mockMedia';
import { formatTrashDaysRemaining } from '../../utils/trashRetention';
import { formatRelativeTime } from '../../utils/formatRelativeTime';
import TruncatedText from '../TruncatedText';

interface TrashMediaListRowProps {
  item: MediaItem;
  deletedAt: string;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onRestore: (id: string) => void;
}

const typeIcons: Record<MediaType, typeof FolderOutlinedIcon> = {
  folder: FolderOutlinedIcon,
  video: VideocamOutlinedIcon,
  image: ImageOutlinedIcon,
  audio: AudioFileOutlinedIcon,
};

const typeLabels: Record<MediaType, string> = {
  folder: 'Folder',
  video: 'Video',
  image: 'Image',
  audio: 'Audio',
};

export default function TrashMediaListRow({
  item,
  deletedAt,
  isSelected,
  onToggleSelect,
  onRestore,
}: TrashMediaListRowProps) {
  const TypeIcon = typeIcons[item.type];
  const daysLabel = formatTrashDaysRemaining(deletedAt);
  const deletedLabel = formatRelativeTime(new Date(deletedAt).getTime());

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        px: 1.5,
        py: 1.25,
        borderRadius: '12px',
        border: `1px solid ${isSelected ? cv.borderFocus : cv.border}`,
        background: isSelected ? cv.blueSelectionHover : cv.surface,
      }}
    >
      <Tooltip title={isSelected ? 'Deselect' : 'Select'} arrow placement="top">
        <Checkbox
          size="small"
          checked={isSelected}
          onChange={() => onToggleSelect(item.id)}
          slotProps={{ input: { 'aria-label': `Select ${item.title}` } }}
          sx={{ p: 0.5, color: cv.textSecondary, '&.Mui-checked': { color: cv.brandBlue } }}
        />
      </Tooltip>

      <Box
        sx={{
          width: 40,
          height: 40,
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: cv.insetHighlight,
          flexShrink: 0,
        }}
      >
        <TypeIcon sx={{ fontSize: 20, color: cv.textSecondary }} />
      </Box>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <TruncatedText
          text={item.title}
          sx={{
            fontWeight: 600,
            fontSize: '0.875rem',
            color: cv.textPrimary,
          }}
        />
        <Typography variant="caption" sx={{ color: cv.textMuted }}>
          {typeLabels[item.type]} · Deleted {deletedLabel}
        </Typography>
      </Box>

      <Typography
        variant="caption"
        sx={{
          color: cv.textSecondary,
          fontWeight: 600,
          whiteSpace: 'nowrap',
          display: { xs: 'none', sm: 'block' },
        }}
      >
        {daysLabel}
      </Typography>

      <Tooltip title="Restore to library" arrow placement="top">
        <Button
          size="small"
          startIcon={<RestoreFromTrashOutlinedIcon sx={{ fontSize: 16 }} />}
          onClick={() => onRestore(item.id)}
          sx={{
            flexShrink: 0,
            minWidth: 0,
            px: 1.25,
            py: 0.5,
            fontSize: '0.75rem',
            fontWeight: 600,
            borderRadius: '8px',
            color: cv.textPrimary,
            border: `1px solid ${cv.border}`,
            '&:hover': { backgroundColor: cv.surfaceHover },
          }}
        >
          Restore
        </Button>
      </Tooltip>
    </Box>
  );
}

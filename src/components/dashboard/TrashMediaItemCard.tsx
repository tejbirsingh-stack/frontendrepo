import { Box, Button, Checkbox, Tooltip, Typography } from '@mui/material';
import { cv } from '../../theme/cssVars';
import {
  thumbnailOverlayChipHoverStyles,
  thumbnailOverlayChipStyles,
} from '../../utils/thumbnailOverlayStyles';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import VideocamOutlinedIcon from '@mui/icons-material/VideocamOutlined';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import AudioFileOutlinedIcon from '@mui/icons-material/AudioFileOutlined';
import GraphicEqIcon from '@mui/icons-material/GraphicEq';
import RestoreFromTrashOutlinedIcon from '@mui/icons-material/RestoreFromTrashOutlined';
import type { MediaItem, MediaType } from '../../data/mockMedia';
import { folderAccentBackground, resolveFolderColor } from '../../utils/folderColorStyle';
import { formatTrashDaysRemaining } from '../../utils/trashRetention';
import { formatRelativeTime } from '../../utils/formatRelativeTime';
import TruncatedText from '../TruncatedText';
import { formatFolderItemCount, getFolderChildCount } from '../../utils/folderItemCount';
import { useDashboard } from '../../context/DashboardContext';

interface TrashMediaItemCardProps {
  item: MediaItem;
  deletedAt: string;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onRestore: (id: string) => void;
}

const typeConfig: Record<
  MediaType,
  { label: string; accent: string; icon: typeof FolderOutlinedIcon }
> = {
  folder: { label: 'Folder', accent: cv.yellowAccentSurface, icon: FolderOutlinedIcon },
  video: { label: 'Video', accent: cv.blueAccentSurface, icon: VideocamOutlinedIcon },
  image: { label: 'Image', accent: cv.greenAccentSurface, icon: ImageOutlinedIcon },
  audio: { label: 'Audio', accent: cv.purpleAccentSurface, icon: AudioFileOutlinedIcon },
  document: { label: 'File', accent: cv.grayAccentSurface || '#f5f5f5', icon: FolderOutlinedIcon },
};

function MediaPreview({ item, childCount }: { item: MediaItem; childCount?: number }) {
  const config = typeConfig[item.type];

  if (item.type === 'folder') {
    const folderColor = resolveFolderColor(item.folderColor);
    return (
      <Box
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: folderAccentBackground(item.folderColor),
          gap: 1,
        }}
      >
        <FolderOutlinedIcon sx={{ fontSize: 48, color: folderColor }} />
        <Typography variant="caption" sx={{ color: cv.textMuted }}>
          {formatFolderItemCount(childCount ?? 0)}
        </Typography>
      </Box>
    );
  }

  if (item.type === 'video' && item.thumbnail) {
    return (
      <Box
        component="img"
        src={item.thumbnail}
        alt={item.title}
        loading="lazy"
        sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />
    );
  }

  if (item.type === 'image' && item.thumbnail) {
    return (
      <Box
        component="img"
        src={item.thumbnail}
        alt={item.title}
        loading="lazy"
        sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />
    );
  }

  if (item.type === 'audio') {
    return (
      <Box
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: `linear-gradient(160deg, ${config.accent} 0%, ${cv.mediaTypeGradientEnd} 100%)`,
          gap: 1.5,
        }}
      >
        <GraphicEqIcon sx={{ fontSize: 52, color: cv.brandPurple, opacity: 0.85 }} />
      </Box>
    );
  }

  const Icon = config.icon;
  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: config.accent,
      }}
    >
      <Icon sx={{ fontSize: 48, color: cv.textMuted }} />
    </Box>
  );
}

export default function TrashMediaItemCard({
  item,
  deletedAt,
  isSelected,
  onToggleSelect,
  onRestore,
}: TrashMediaItemCardProps) {
  const { mediaItems, trashedIds } = useDashboard();
  const config = typeConfig[item.type];
  const daysLabel = formatTrashDaysRemaining(deletedAt);
  const deletedLabel = formatRelativeTime(new Date(deletedAt).getTime());
  const folderChildCount =
    item.type === 'folder'
      ? getFolderChildCount(item.id, mediaItems, {
          workspaceId: item.workspaceId,
          trashedIds,
        })
      : undefined;

  return (
    <Box
      sx={{
        borderRadius: '16px',
        border: `1px solid ${isSelected ? cv.borderFocus : cv.border}`,
        background: isSelected ? cv.blueSelectionHover : cv.surface,
        overflow: 'hidden',
        transition: 'border-color 0.15s ease, background-color 0.15s ease',
        '&:hover': {
          borderColor: isSelected ? cv.borderFocus : cv.surfaceActive,
        },
      }}
    >
      <Box sx={{ position: 'relative', aspectRatio: '16 / 10', background: cv.bg }}>
        <MediaPreview item={item} childCount={folderChildCount} />

        <Box sx={{ position: 'absolute', top: 8, left: 8 }}>
          <Tooltip title={isSelected ? 'Deselect' : 'Select'} arrow placement="top">
            <Checkbox
              size="small"
              checked={isSelected}
              onChange={() => onToggleSelect(item.id)}
              slotProps={{ input: { 'aria-label': `Select ${item.title}` } }}
              sx={{
                p: 0.5,
                ...thumbnailOverlayChipStyles,
                borderRadius: '8px',
                color: cv.textInverse,
                '&.Mui-checked': { color: cv.brandOrchid },
                '&:hover': thumbnailOverlayChipHoverStyles,
              }}
            />
          </Tooltip>
        </Box>

        <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
          <Box
            sx={{
              px: 1,
              py: 0.35,
              borderRadius: '999px',
              ...thumbnailOverlayChipStyles,
            }}
          >
            <Typography
              variant="caption"
              sx={{ fontSize: '0.6875rem', fontWeight: 600, color: cv.textInverse }}
            >
              {daysLabel}
            </Typography>
          </Box>
        </Box>
      </Box>

      <Box sx={{ p: 1.5 }}>
        <TruncatedText
          variant="subtitle2"
          text={item.title}
          sx={{
            fontWeight: 600,
            fontSize: '0.9375rem',
            color: cv.textPrimary,
            mb: 0.25,
          }}
        />
        <Typography variant="caption" sx={{ color: cv.textMuted, display: 'block', mb: 1.25 }}>
          {config.label} · Deleted {deletedLabel}
        </Typography>

        <Tooltip title="Restore to library" arrow placement="top">
          <Button
            size="small"
            fullWidth
            startIcon={<RestoreFromTrashOutlinedIcon sx={{ fontSize: 16 }} />}
            onClick={() => onRestore(item.id)}
            sx={{
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
    </Box>
  );
}

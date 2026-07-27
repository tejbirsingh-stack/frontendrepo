import { Box, Checkbox, IconButton, Tooltip, Typography } from '@mui/material';
import { cv } from '../../theme/cssVars';
import StarBorderOutlinedIcon from '@mui/icons-material/StarBorderOutlined';
import StarIcon from '@mui/icons-material/Star';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import WorkOutlineOutlinedIcon from '@mui/icons-material/WorkOutlineOutlined';
import VideocamOutlinedIcon from '@mui/icons-material/VideocamOutlined';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import AudioFileOutlinedIcon from '@mui/icons-material/AudioFileOutlined';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import MediaItemActionsMenu from './MediaItemActionsMenu';
import { useNavigate } from 'react-router-dom';
import type { MediaItem, MediaType } from '../../data/mockMedia';
import { getMediaViewerPath } from '../../utils/mediaNavigation';
import { getMediaDragPayload, hasMediaDragPayload, setMediaDragPayload } from '../../utils/mediaDrag';
import { removeMediaDragGhost, setMediaDragImage } from '../../utils/mediaDragPreview';
import { resolveFolderColor } from '../../utils/folderColorStyle';
import TruncatedText from '../TruncatedText';
import VideoHoverPreview from './VideoHoverPreview';
import { formatFolderItemCount, getFolderChildCount } from '../../utils/folderItemCount';
import { useDashboard } from '../../context/DashboardContext';

interface MediaListRowProps {
  item: MediaItem;
  isFavorite: boolean;
  isSelected: boolean;
  isDragging: boolean;
  isDropTarget?: boolean;
  selectedMediaIds: Set<string>;
  onToggleFavorite: (id: string) => void;
  onToggleSelect: (id: string) => void;
  onDragStart: (ids: string[]) => void;
  onDragEnd: () => void;
  onDropOnFolder?: (folderId: string, mediaIds: string[]) => void;
  onFolderDragOver?: (folderId: string) => void;
  onFolderDragLeave?: () => void;
}

const typeIcons: Record<MediaType, typeof FolderOutlinedIcon> = {
  folder: FolderOutlinedIcon,
  video: VideocamOutlinedIcon,
  image: ImageOutlinedIcon,
  audio: AudioFileOutlinedIcon,
  document: InsertDriveFileOutlinedIcon,
};

const typeLabels: Record<MediaType, string> = {
  folder: 'Folder',
  video: 'Video',
  image: 'Image',
  audio: 'Audio',
  document: 'File',
};

export default function MediaListRow({
  item,
  isFavorite,
  isSelected,
  isDragging,
  isDropTarget = false,
  selectedMediaIds,
  onToggleFavorite,
  onToggleSelect,
  onDragStart,
  onDragEnd,
  onDropOnFolder,
  onFolderDragOver,
  onFolderDragLeave,
}: MediaListRowProps) {
  const navigate = useNavigate();
  const { mediaItems, trashedIds } = useDashboard();
  const TypeIcon = item.isProject ? WorkOutlineOutlinedIcon : typeIcons[item.type];
  const isFolder = item.type === 'folder';
  const folderChildCount = isFolder
    ? getFolderChildCount(item.id, mediaItems, {
      workspaceId: item.workspaceId,
      trashedIds,
    })
    : null;
  const selectionActive = selectedMediaIds.size > 0;

  const openPath = getMediaViewerPath(item);
  const documentUrl = item.videoSrc;
  const isClickable = (openPath || (item.type === 'document' && documentUrl)) && !selectionActive;

  const handleOpen = () => {
    if (!isClickable) return;
    if (openPath) {
      navigate(openPath);
    } else if (item.type === 'document' && documentUrl) {
      window.open(documentUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const getDragIds = () => {
    if (selectedMediaIds.has(item.id) && selectedMediaIds.size > 0) {
      return [...selectedMediaIds];
    }
    return [item.id];
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.stopPropagation();
    const dragIds = getDragIds();
    setMediaDragPayload(e, dragIds);
    setMediaDragImage(e, item.title, item.type, dragIds.length);
    onDragStart(dragIds);
  };

  const handleDragEnd = () => {
    removeMediaDragGhost();
    onDragEnd();
  };

  const handleFolderDragOver = (e: React.DragEvent) => {
    if (!isFolder || !hasMediaDragPayload(e)) return;
    const dragIds = getMediaDragPayload(e);
    if (dragIds.includes(item.id)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    onFolderDragOver?.(item.id);
  };

  const handleFolderDrop = (e: React.DragEvent) => {
    if (!isFolder) return;
    e.preventDefault();
    e.stopPropagation();
    const dragIds = getMediaDragPayload(e).filter((id) => id !== item.id);
    if (dragIds.length > 0) {
      onDropOnFolder?.(item.id, dragIds);
    }
    onFolderDragLeave?.();
  };

  const borderColor = isDropTarget
    ? cv.brandPurple
    : isSelected
      ? cv.borderFocus
      : isDragging
        ? cv.borderFocus
        : cv.border;

  return (
    <Box
      onClick={handleOpen}
      onDragOver={handleFolderDragOver}
      onDragLeave={isFolder ? onFolderDragLeave : undefined}
      onDrop={handleFolderDrop}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        px: 1.5,
        py: 1,
        borderRadius: '12px',
        border: `1px solid ${borderColor}`,
        background: isDropTarget ? cv.purpleSelectionSoft : 'var(--noah-footer-tint)',
        opacity: isDragging ? 0.45 : 1,
        cursor: isClickable ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
        '&:hover': {
          backgroundColor: cv.surfaceHover,
          borderColor: isDropTarget ? cv.brandPurple : cv.surfaceActive,
        },
      }}
    >
      <Tooltip title={isSelected ? 'Deselect' : 'Select'} arrow placement="top">
        <Checkbox
          size="small"
          checked={isSelected}
          onClick={(e) => e.stopPropagation()}
          onChange={() => onToggleSelect(item.id)}
          slotProps={{ input: { 'aria-label': `Select ${item.title}` } }}
          sx={{
            p: 0.25,
            color: cv.textMuted,
            '&.Mui-checked': { color: cv.brandBlue },
          }}
        />
      </Tooltip>

      <Tooltip title="Drag to move" arrow placement="top">
        <Box
          draggable
          aria-label={`Drag ${item.title}`}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onClick={(e) => e.stopPropagation()}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 28,
            height: 28,
            flexShrink: 0,
            borderRadius: '6px',
            color: cv.textMuted,
            cursor: 'grab',
            '&:hover': {
              color: cv.textPrimary,
              backgroundColor: cv.surfaceHover,
            },
            '&:active': { cursor: 'grabbing' },
          }}
        >
          <DragIndicatorIcon sx={{ fontSize: 18, pointerEvents: 'none' }} />
        </Box>
      </Tooltip>

      <Box
        sx={{
          width: 96,
          aspectRatio: '16 / 9',
          borderRadius: '10px',
          overflow: 'hidden',
          flexShrink: 0,
          border: "1px solid var(--noah-border)",
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: cv.glassBackground,
        }}
      >
        {item.type === 'video' ? (
          <VideoHoverPreview
            videoSrc={item.videoSrc}
            thumbnail={item.thumbnail}
            title={item.title}
            duration={item.duration}
            showPlayOverlay={false}
          />
        ) : item.thumbnail ? (
          <Box
            component="img"
            src={item.thumbnail}
            alt=""
            sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <TypeIcon
            sx={{
              fontSize: 22,
              color:
                item.type === 'folder'
                  ? resolveFolderColor(item.folderColor)
                  : cv.brandPurple,
            }}
          />
        )}
      </Box>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <TruncatedText
          text={item.title}
          variant="body2"
          sx={{ fontWeight: 500, fontSize: '0.875rem' }}
        >
          {item.title}
          {isDropTarget ? ' — Drop to add' : ''}
        </TruncatedText>
        <Typography variant="caption" sx={{ color: cv.textMuted }}>
          {item.type === 'folder' && item.isProject ? 'Project' : typeLabels[item.type]}
          {item.duration ? ` · ${item.duration}` : ''}
          {isFolder && folderChildCount != null
            ? ` · ${formatFolderItemCount(folderChildCount)}`
            : ''}
        </Typography>
      </Box>

      <Tooltip
        title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        arrow
        placement="top"
      >
        <IconButton
          size="small"
          aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(item.id);
          }}
          sx={{
            color: isFavorite ? cv.warning : cv.textMuted,
            '&:hover': { color: isFavorite ? cv.warning : cv.textPrimary },
          }}
        >
          {isFavorite ? (
            <StarIcon sx={{ fontSize: 20 }} />
          ) : (
            <StarBorderOutlinedIcon sx={{ fontSize: 20 }} />
          )}
        </IconButton>
      </Tooltip>

      <MediaItemActionsMenu item={item} />
    </Box>
  );
}

import { useState, useEffect } from 'react';
import { Box, Checkbox, IconButton, Popover, Tooltip, Typography } from '@mui/material';
import { cv } from '../../theme/cssVars';
import StarBorderOutlinedIcon from '@mui/icons-material/StarBorderOutlined';
import StarIcon from '@mui/icons-material/Star';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import WorkOutlineOutlinedIcon from '@mui/icons-material/WorkOutlineOutlined';
import GraphicEqIcon from '@mui/icons-material/GraphicEq';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import VideocamOutlinedIcon from '@mui/icons-material/VideocamOutlined';
import AudioFileOutlinedIcon from '@mui/icons-material/AudioFileOutlined';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import LinkIcon from '@mui/icons-material/Link';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import PublicOutlinedIcon from '@mui/icons-material/PublicOutlined';
import MediaItemActionsMenu from './MediaItemActionsMenu';
import PlatformMediaInfoChip from './PlatformMediaInfoChip';
import AiSummaryBlock from '../media/AiSummaryBlock';
import TruncatedText from '../TruncatedText';
import CircularProgress from '@mui/material/CircularProgress';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import type { MediaItem, MediaType } from '../../data/mockMedia';
import { getMediaViewerPath } from '../../utils/mediaNavigation';
import { getMediaDragPayload, hasMediaDragPayload, setMediaDragPayload } from '../../utils/mediaDrag';
import { removeMediaDragGhost, setMediaDragImage } from '../../utils/mediaDragPreview';
import {
  folderAccentBackground,
  folderAccentTint,
  projectAccentBackground,
  projectAccentTint,
  resolveLibraryFolderColor,
} from '../../utils/folderColorStyle';
import VideoHoverPreview from './VideoHoverPreview';
import {
  thumbnailOverlayChipHoverStyles,
  thumbnailOverlayChipStyles,
} from '../../utils/thumbnailOverlayStyles';
import { formatFolderItemCount, getFolderChildCount } from '../../utils/folderItemCount';
import { useDashboard } from '../../context/DashboardContext';
import { decodeClientImageToDataUrl } from '../../utils/clientImageDecoder';
import { parseFileReviewStatus, getFileReviewStatusColor } from '../../constants/fileReviewStatus';

interface MediaItemCardProps {
  item: MediaItem;
  isFavorite: boolean;
  isSelected: boolean;
  isDragging: boolean;
  isDropTarget?: boolean;
  selectedMediaIds: Set<string>;
  onToggleFavorite: (id: string, type?: 'asset' | 'folder' | 'project') => void;
  onToggleSelect: (id: string) => void;
  onDragStart: (ids: string[]) => void;
  onDragEnd: () => void;
  onDropOnFolder?: (folderId: string, mediaIds: string[]) => void;
  onFolderDragOver?: (folderId: string) => void;
  onFolderDragLeave?: () => void;
}

const typeConfig: Record<
  MediaType,
  { label: string; accent: string; icon: typeof FolderOutlinedIcon }
> = {
  folder: {
    label: 'Folder',
    accent: cv.yellowAccentSurface,
    icon: FolderOutlinedIcon,
  },
  video: {
    label: 'Video',
    accent: cv.blueAccentSurface,
    icon: VideocamOutlinedIcon,
  },
  image: {
    label: 'Image',
    accent: cv.greenAccentSurface,
    icon: ImageOutlinedIcon,
  },
  audio: {
    label: 'Audio',
    accent: cv.purpleAccentSurface,
    icon: AudioFileOutlinedIcon,
  },
  document: {
    label: 'File',
    accent: cv.surfaceHover,
    icon: InsertDriveFileOutlinedIcon,
  },
};

function FavoriteButton({
  isFavorite,
  onToggle,
}: {
  isFavorite: boolean;
  onToggle: () => void;
}) {
  return (
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
          onToggle();
        }}
        sx={{
          width: 32,
          height: 32,
          borderRadius: '8px',
          ...thumbnailOverlayChipStyles,
          color: isFavorite ? cv.warning : cv.textInverse,
          transition: 'all 0.2s ease',
          '&:hover': {
            ...thumbnailOverlayChipHoverStyles,
            transform: 'scale(1.05)',
          },
        }}
      >
        {isFavorite ? (
          <StarIcon sx={{ fontSize: 18 }} />
        ) : (
          <StarBorderOutlinedIcon sx={{ fontSize: 18 }} />
        )}
      </IconButton>
    </Tooltip>
  );
}

function SearchMatchBadge({ matchType }: { matchType?: string }) {
  if (matchType !== 'semantic' && matchType !== 'transcript' && matchType !== 'highlight') {
    return null;
  }
  const isSemantic = matchType === 'semantic';
  const isHighlight = matchType === 'highlight';
  const label = isSemantic ? 'Related' : isHighlight ? 'AI Tags' : 'Transcript';
  const ariaLabel = isSemantic
    ? 'Matched because the spoken content is related'
    : isHighlight
      ? 'Matched because AI summary or tags contain this search'
      : 'Matched because the transcript contains this search';

  return (
    <Tooltip title={label} arrow placement="top">
      <Box
        component="span"
        aria-label={ariaLabel}
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          px: 0.875,
          py: 0.25,
          borderRadius: '999px',
          minHeight: 22,
          ...thumbnailOverlayChipStyles,
          border: `1px solid ${cv.purpleChipBorder}`,
          backgroundColor: cv.purpleSurface,
        }}
      >
        <Typography
          variant="caption"
          sx={{ fontSize: '0.6875rem', fontWeight: 600, color: cv.brandPurpleLight }}
        >
          {label}
        </Typography>
      </Box>
    </Tooltip>
  );
}

function TypeBadge({ type, isProject }: { type: MediaType; isProject?: boolean }) {
  const config = typeConfig[type];
  const Icon = type === 'folder' && isProject ? WorkOutlineOutlinedIcon : config.icon;
  const label = type === 'folder' && isProject ? 'Project' : config.label;

  return (
    <Tooltip title={label} arrow placement="top">
      <Box
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 0.5,
          height: 32,
          px: 1,
          borderRadius: '8px',
          ...thumbnailOverlayChipStyles,
        }}
      >
        <Icon sx={{ fontSize: 16, color: cv.textInverse }} />
        <Typography
          variant="caption"
          sx={{
            fontSize: '0.6875rem',
            fontWeight: 500,
            color: cv.textInverse,
            lineHeight: 1,
          }}
        >
          {label}
        </Typography>
      </Box>
    </Tooltip>
  );
}

function VisibilityBadge({ item }: { item: MediaItem }) {
  if (item.type === 'folder' || item.isProject) return null;
  const vis = (item as any)?.visibility?.toLowerCase();
  if (vis !== 'private' && vis !== 'public') return null;
  const isPrivate = vis === 'private';
  
  return (
    <Tooltip title={isPrivate ? 'Private' : 'Public'} arrow placement="top">
      <Box
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 32,
          height: 32,
          borderRadius: '8px',
          ...thumbnailOverlayChipStyles,
          color: cv.textInverse,
        }}
      >
        {isPrivate ? <LockOutlinedIcon sx={{ fontSize: 16 }} /> : <PublicOutlinedIcon sx={{ fontSize: 16 }} />}
      </Box>
    </Tooltip>
  );
}

/** Badge shown next to the type pill on media cards to indicate review progress. */
function ReviewStatusBadge({ item }: { item: MediaItem }) {
  if (item.type === 'folder' || item.isProject) return null;

  const status = parseFileReviewStatus(
    (item.customMetadata as { reviewStatus?: unknown } | undefined)?.reviewStatus ??
      (item as { reviewStatus?: unknown }).reviewStatus,
  );

  if (status === 'New') return null;

  const color = getFileReviewStatusColor(status);

  return (
    <Tooltip title={`Review status: ${status}`} arrow placement="top">
      <Box
        aria-label={`Review status: ${status}`}
        sx={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          backgroundColor: color,
          boxShadow: status === 'Approved' ? `0 0 6px ${color}` : 'none',
          flexShrink: 0,
          ml: 0.5,
        }}
      />
    </Tooltip>
  );
}

function ShareStatusBadge({ item }: { item: MediaItem }) {
  const raw = item as any;
  if (!raw.shareLinks) return null;
  const isActive: boolean = raw.isShareActive ?? false;
  const total: number = raw.shareCount ?? 0;
  const color = isActive ? '#22c55e' : '#f97316';
  const label = isActive ? 'Active' : 'Expired';
  const tip = isActive
    ? `${total} active share link${total !== 1 ? 's' : ''}`
    : `${total} share link${total !== 1 ? 's' : ''} — all expired`;

  return (
    <Tooltip title={tip} arrow placement="top">
      <Box
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.4,
          px: 0.75,
          py: 0.2,
          borderRadius: '999px',
          backgroundColor: `${color}22`,
          border: `1px solid ${color}55`,
          flexShrink: 0,
        }}
      >
        <LinkIcon sx={{ fontSize: 10, color }} />
        <Typography variant="caption" sx={{ fontSize: '0.625rem', fontWeight: 600, color, lineHeight: 1 }}>
          {label}
        </Typography>
      </Box>
    </Tooltip>
  );
}

function FolderPreview({ item, childCount }: { item: MediaItem; childCount: number }) {
  const accentColor = resolveLibraryFolderColor({
    folderColor: item.folderColor,
    isProject: item.isProject,
  });

  if (item.isProject) {
    console.log(`Project Preview ${item.title}: color=${item.folderColor}, accent=${accentColor}`);
  }

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: item.isProject
          ? projectAccentBackground(item.folderColor)
          : folderAccentBackground(item.folderColor),
        gap: 1,
      }}
    >
      {item.isProject ? (
        <WorkOutlineOutlinedIcon sx={{ fontSize: 48, color: accentColor }} />
      ) : (
        <FolderOutlinedIcon sx={{ fontSize: 48, color: accentColor }} />
      )}
      <Typography variant="caption" sx={{ color: cv.textMuted }}>
        {formatFolderItemCount(childCount)}
      </Typography>
    </Box>
  );
}

function VideoPreview({ item }: { item: MediaItem }) {
  const isProcessing =
    item.compressionStatus === 'processing' ||
    item.compressionStatus === 'queued' ||
    item.compressionStatus === 'in_progress';

  return (
    <VideoHoverPreview
      videoSrc={item.videoSrc}
      thumbnail={item.thumbnail}
      title={item.title}
      duration={item.duration}
      accent={typeConfig.video.accent}
      showPlayOverlay
      isProcessing={isProcessing}
      progress={item.customMetadata?.transcodingProgress as string | undefined}
    />
  );
}

function ImagePreview({ item }: { item: MediaItem }) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [clientDecodedUrl, setClientDecodedUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const ext = item.title?.split('.').pop()?.toLowerCase() || '';
    const nonWebExts = ['exr', 'openexr', 'dpx', 'cin', 'tiff', 'tif', 'psd', 'psb', 'ai', 'eps', 'pcx', 'jpf', 'bmp', 'mpo'];
    const mediaSource = item.videoSrc || (item.id ? `/api/media/${encodeURIComponent(item.id)}/stream` : item.thumbnail);

    if (nonWebExts.includes(ext) && mediaSource) {
      decodeClientImageToDataUrl(mediaSource, ext)
        .then((dataUrl) => {
          if (active && dataUrl) {
            setClientDecodedUrl(dataUrl);
          }
        })
        .catch(() => {});
    }
    return () => {
      active = false;
    };
  }, [item.title, item.videoSrc, item.thumbnail, item.id]);

  const displaySrc = clientDecodedUrl || item.thumbnail || (item.id ? `/api/media/${encodeURIComponent(item.id)}/thumbnail` : undefined);

  if (imageError && !clientDecodedUrl) {
    const ext = item.title?.split('.').pop()?.toUpperCase() || 'IMG';
    return (
      <Box
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(160deg, rgba(30,30,42,1) 0%, rgba(12,12,18,1) 100%)',
          gap: 1.5,
          px: 2,
        }}
      >
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(56, 189, 248, 0.1)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#38BDF8', fontSize: '0.85rem' }}>
            {ext}
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <>
      {!imageLoaded && !imageError && (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: `linear-gradient(160deg, ${cv.greenAccentSurface} 0%, ${cv.surfaceSubtle} 100%)`,
            zIndex: 1,
          }}
        >
          <CircularProgress size={24} sx={{ color: cv.textMuted }} />
        </Box>
      )}
      <Box
        component="img"
        src={displaySrc}
        alt={item.title}
        loading="lazy"
        onLoad={() => setImageLoaded(true)}
        onError={() => setImageError(true)}
        sx={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
          opacity: imageLoaded ? 1 : 0,
          transition: 'opacity 0.2s ease',
        }}
      />
    </>
  );
}

function AudioPreview({ item }: { item: MediaItem }) {
  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(160deg, ${typeConfig.audio.accent} 0%, ${cv.mediaTypeGradientEnd} 100%)`,
        gap: 1.5,
        px: 2,
      }}
    >
      <GraphicEqIcon sx={{ fontSize: 52, color: cv.brandPurple, opacity: 0.85 }} />
      {item.duration && (
        <Typography variant="caption" sx={{ color: cv.textSecondary, fontWeight: 500 }}>
          {item.duration}
        </Typography>
      )}
    </Box>
  );
}

function DocumentPreview() {
  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(160deg, ${typeConfig.document.accent} 0%, ${cv.mediaTypeGradientEnd} 100%)`,
        gap: 1.5,
        px: 2,
      }}
    >
      <InsertDriveFileOutlinedIcon sx={{ fontSize: 52, color: cv.textMuted, opacity: 0.85 }} />
    </Box>
  );
}

function MediaPreview({ item, folderChildCount }: { item: MediaItem; folderChildCount?: number }) {
  switch (item.type) {
    case 'folder':
      return <FolderPreview item={item} childCount={folderChildCount ?? 0} />;
    case 'video':
      return <VideoPreview item={item} />;
    case 'image':
      return <ImagePreview item={item} />;
    case 'audio':
      return <AudioPreview item={item} />;
    case 'document':
      return <DocumentPreview />;
    default:
      return null;
  }
}

export default function MediaItemCard({
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
}: MediaItemCardProps) {
  const navigate = useNavigate();
  const { mediaItems, trashedIds } = useDashboard();
  const [summaryAnchor, setSummaryAnchor] = useState<HTMLElement | null>(null);
  const config = typeConfig[item.type];
  const isFolder = item.type === 'folder';
  const folderChildCount = isFolder
    ? Math.max(
        item.itemCount ?? 0,
        getFolderChildCount(item.id, mediaItems, {
          workspaceId: item.workspaceId,
          trashedIds,
        })
      )
    : 0;
  const folderFooterAccent = isFolder
    ? item.isProject
      ? projectAccentTint(item.folderColor)
      : folderAccentTint(item.folderColor)
    : config.accent;
  const selectionActive = selectedMediaIds.size > 0;

  const { projectId: pathProjectId } = useParams<{ projectId: string }>();
  const [searchParams] = useSearchParams();
  const activeProjectId = pathProjectId || searchParams.get('projectId') || undefined;

  const openPath = getMediaViewerPath(item, activeProjectId);

  // Allow clicking if it's a navigatable path OR if it's a document (which opens in a new tab)
  // But wait, the url is needed. Where is the url stored? Assuming `item.videoSrc` or similar for now?
  // Let's assume the component consuming this has `item.videoSrc` or `item.thumbnail` or similar as the URL for the document.
  // We'll use `item.videoSrc` as the generic raw asset URL fallback, or perhaps `item.customMetadata?.url`.
  // Wait, the API sends `filePath`, we might need to rely on the backend signing logic.
  // The frontend `MediaItem` has `videoSrc` mapped to the raw asset if it's not a video? Yes, it's mapped in `apiToFrontendMedia`.
  const documentUrl = item.videoSrc || (item.id ? `/api/media/${encodeURIComponent(item.id)}/stream` : undefined);
  const isClickable = (Boolean(openPath) || (item.type === 'document' && Boolean(documentUrl))) && !selectionActive;

  const fullSummary = item.summary?.trim() || '';
  const aiTagList = Array.isArray(item.aiTags)
    ? item.aiTags.filter((t) => typeof t === 'string' && t.trim().length > 0)
    : [];
  const showAiSummaryIcon =
    (item.type === 'video' || item.type === 'audio') &&
    (Boolean(fullSummary) || aiTagList.length > 0);
  const summaryPopoverOpen = Boolean(summaryAnchor);

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
    <>
    <Box
      onClick={isClickable ? handleOpen : undefined}
      onDragOver={handleFolderDragOver}
      onDragLeave={isFolder ? onFolderDragLeave : undefined}
      onDrop={handleFolderDrop}
      sx={{
        borderRadius: '14px',
        border: `1px solid ${borderColor}`,
        overflow: 'hidden',
        cursor: isClickable ? 'pointer' : 'default',
        background: isDropTarget ? cv.purpleSelectionSoft : 'var(--noah-footer-tint)',
        opacity: isDragging ? 0.45 : 1,
        boxShadow: isDropTarget ? cv.purpleSelectionStrong : 'none',
        transition: 'all 0.2s ease',
        '&:hover .media-select-checkbox': {
          opacity: 1,
        },
        '&:hover': {
          borderColor: isDropTarget ? cv.brandPurple : cv.borderInputHover,
          transform: isDragging || isDropTarget ? 'none' : 'translateY(-2px)',
          boxShadow:
            isDragging || isDropTarget ? undefined : cv.cardHoverShadow,
        },
      }}
    >
      <Box sx={{ position: 'relative', aspectRatio: '16 / 9', overflow: 'hidden' }}>
        <MediaPreview item={item} folderChildCount={folderChildCount} />

        <Box
          sx={{
            position: 'absolute',
            top: 8,
            left: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
          }}
        >
          <FavoriteButton
            isFavorite={isFavorite}
            onToggle={() => onToggleFavorite(item.id, item.isProject ? 'project' : (item.type === 'folder' ? 'folder' : 'asset'))}
          />
          <VisibilityBadge item={item} />
          <TypeBadge type={item.type} isProject={item.isProject} />
          <SearchMatchBadge matchType={item.searchMatch?.matchType} />
          {showAiSummaryIcon ? (
            <Tooltip title="AI summary" arrow placement="top">
              <IconButton
                type="button"
                size="small"
                aria-label="AI summary"
                aria-haspopup="dialog"
                aria-expanded={summaryPopoverOpen}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  const target = event.currentTarget;
                  setSummaryAnchor((current) => (current ? null : target));
                }}
                onMouseDown={(event) => event.stopPropagation()}
                sx={{
                  width: 28,
                  height: 28,
                  ...thumbnailOverlayChipStyles,
                  borderRadius: '8px',
                  color: cv.textInverse,
                  '&:hover': {
                    ...thumbnailOverlayChipHoverStyles,
                  },
                }}
              >
                <AutoAwesomeOutlinedIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
          ) : null}
          <ReviewStatusBadge item={item} />
        </Box>

        <Box
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
          }}
        >
          <Tooltip title="Drag to move" arrow placement="top">
            <Box
              draggable
              aria-label={`Drag ${item.title}`}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onClick={(e) => e.stopPropagation()}
              sx={{
                width: 28,
                height: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: cv.textInverse,
                opacity: 0.85,
                cursor: 'grab',
                borderRadius: '6px',
                '&:hover': {
                  opacity: 1,
                  ...thumbnailOverlayChipStyles,
                  ...thumbnailOverlayChipHoverStyles,
                },
                '&:active': { cursor: 'grabbing' },
              }}
            >
              <DragIndicatorIcon sx={{ fontSize: 18, pointerEvents: 'none' }} />
            </Box>
          </Tooltip>
          {item.isProject ? null : (
            <Tooltip
              title={isSelected ? 'Deselect' : 'Select'}
              arrow
              placement="top"
            >
              <Checkbox
                size="small"
                className="media-select-checkbox"
                checked={isSelected}
                onClick={(e) => e.stopPropagation()}
                onChange={() => onToggleSelect(item.id)}
                slotProps={{ input: { 'aria-label': `Select ${item.title}` } }}
                sx={{
                  p: 0,
                  width: 32,
                  height: 32,
                  ...thumbnailOverlayChipStyles,
                  borderRadius: '8px',
                  color: cv.textInverse,
                  opacity: isSelected || selectionActive ? 1 : 0,
                  transition: 'opacity 0.15s ease, background-color 0.15s ease',
                  '&.Mui-checked': {
                    color: cv.brandOrchid,
                  },
                  '&:hover': {
                    ...thumbnailOverlayChipHoverStyles,
                  },
                }}
              />
            </Tooltip>
          )}
        </Box>

        {isDropTarget ? (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: cv.purpleSurfaceActive,
              border: `2px dashed ${cv.brandPurple}`,
              borderRadius: '12px',
              m: 1,
              pointerEvents: 'none',
            }}
          >
            <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: cv.textPrimary }}>
              Drop to add
            </Typography>
          </Box>
        ) : null}
      </Box>

      <Box
        onClick={(event) => event.stopPropagation()}
        onMouseDown={(event) => event.stopPropagation()}
        sx={{
          px: 2,
          py: 1.5,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          borderTop: "1px solid var(--noah-border)",
          background: folderFooterAccent,
        }}
      >
        <TruncatedText
          variant="body2"
          text={item.title}
          sx={{ flex: 1, minWidth: 0, fontWeight: 500, fontSize: '0.875rem', textAlign: 'left' }}
        />
        <ShareStatusBadge item={item} />
        <PlatformMediaInfoChip item={item} />
        <MediaItemActionsMenu item={item} />
      </Box>
    </Box>
    <Popover
      open={summaryPopoverOpen}
      anchorEl={summaryAnchor}
      onClose={() => setSummaryAnchor(null)}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      slotProps={{
        paper: {
          sx: {
            mt: 0.75,
            p: 1.5,
            maxWidth: 320,
            borderRadius: '12px',
            border: `1px solid ${cv.border}`,
            background: 'var(--noah-dialog-surface)',
            boxShadow: cv.dialogShadow,
          },
        },
      }}
      onClick={(event) => event.stopPropagation()}
    >
      <Typography
        component="h3"
        sx={{
          mb: 0.75,
          fontSize: '0.75rem',
          fontWeight: 600,
          color: cv.textSecondary,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}
      >
        Summary
      </Typography>
      <AiSummaryBlock compact summary={fullSummary} tags={aiTagList} />
    </Popover>
    </>
  );
}

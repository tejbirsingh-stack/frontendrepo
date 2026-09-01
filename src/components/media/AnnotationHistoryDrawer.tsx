import { useMemo, useState, useRef, useEffect } from 'react';
import { cv, palette } from '../../theme/cssVars';
import {
  Avatar,
  Box,
  Divider,
  Drawer,
  FormControl,
  IconButton,
  InputAdornment,
  Menu,
  MenuItem,
  Select,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import ReplayOutlinedIcon from '@mui/icons-material/ReplayOutlined';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import PushPinOutlinedIcon from '@mui/icons-material/PushPinOutlined';
import PushPinIcon from '@mui/icons-material/PushPin';
import FilterListOutlinedIcon from '@mui/icons-material/FilterListOutlined';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import MoreHorizOutlinedIcon from '@mui/icons-material/MoreHorizOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import ShareOutlinedIcon from '@mui/icons-material/ShareOutlined';
import { useActiveUser } from '../../hooks/useActiveUser';
import type { MediaItem } from '../../data/mockMedia';
import { MOCK_FRAME_PEOPLE, type FramePerson } from '../../data/mockFramePeople';
import TranscriptPanel from './TranscriptPanel';
import AiSummaryBlock from './AiSummaryBlock';
import type { AnnotationHistoryEntry, AnnotationHistoryType } from '../../types/annotationHistory';
import { getAiHighlightsRequest } from '../../api/ai.service';
import { useAiEntitled } from '../../hooks/useAiEntitled';
import type { CommentReply, VideoComment } from '../../types/videoComments';
import CommentImageAttachment from './CommentImageAttachment';
import type { AnnotationAccessGroup, AnnotationVisibility } from '../../types/annotationVisibility';
import type { MediaCollaborator } from '../../types/mediaCollaborator';
import AnnotationVisibilityPicker from './AnnotationVisibilityPicker';
import MediaDetailsPanel, {
  type MediaDetailsSection,
  type MediaTechnicalDetails,
} from './MediaDetailsPanel';
import { formatRelativeTime } from '../../utils/formatRelativeTime';
import { formatVideoTimestamp } from '../../utils/formatVideoTimestamp';
import { getHistoryTypeLabel } from '../../utils/annotationHistoryLabels';
import { historyEntryBodyScrollSx, longFormTextSx } from '../../constants/overlayScroll';
import { formatAnnotationDisplayText } from '../../utils/textContent';
import { SIDEBAR_DESKTOP_BREAKPOINT } from '../../constants/layout';
import {
  DATE_RANGE_OPTIONS,
  matchesCustomDateRange,
  matchesDateRange,
  type DateRangeFilter,
} from '../../constants/mediaFilters';
import { dropdownMenuPaperSx } from '../../constants/dropdownMenu';

type DrawerTab = 'history' | 'details' | 'ai';
type AiSubTab = 'summary' | 'transcript';
type StatusFilter = 'all' | 'unread' | 'resolved' | 'archive';

const AI_SUB_TABS: { value: AiSubTab; label: string }[] = [
  { value: 'summary', label: 'Summary' },
  { value: 'transcript', label: 'Transcript' },
];

function getCommentIdForEntry(entry: AnnotationHistoryEntry): string | null {
  if (entry.sourceCommentId) return entry.sourceCommentId;
  if (entry.type === 'comment' && entry.id.startsWith('comment-')) {
    return entry.id.slice('comment-'.length);
  }
  return null;
}

function HistoryEntryReplies({ replies }: { replies: CommentReply[] }) {
  return (
    <Box
      component="ul"
      aria-label="Thread replies"
      sx={{
        listStyle: 'none',
        m: 0,
        mt: 1,
        pl: 5.5,
        display: 'flex',
        flexDirection: 'column',
        gap: 1.25,
      }}
    >
      {replies.map((reply) => (
        <Box
          component="li"
          key={reply.id}
          sx={{
            position: 'relative',
            pl: 1.5,
            borderLeft: `2px solid ${cv.brandPurple}55`,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
            <Avatar
              src={reply.author.avatarUrl}
              alt=""
              sx={{
                width: 24,
                height: 24,
                flexShrink: 0,
                fontSize: '0.625rem',
                fontWeight: 600,
                background: cv.brandGradient,
              }}
            >
              {!reply.author.avatarUrl ? reply.author.initials : null}
            </Avatar>

            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: 0.75 }}>
                <Typography
                  component="span"
                  sx={{ fontSize: '0.8125rem', fontWeight: 600, color: cv.textPrimary }}
                >
                  {reply.author.name}
                </Typography>
                <Typography
                  component="time"
                  dateTime={new Date(reply.createdAt).toISOString()}
                  sx={{ fontSize: '0.75rem', color: cv.textMuted }}
                >
                  {formatRelativeTime(reply.createdAt)}
                </Typography>
              </Box>

              <Typography
                sx={{
                  mt: 0.25,
                  fontSize: '0.875rem',
                  lineHeight: 1.45,
                  color: cv.textSecondary,
                  ...longFormTextSx,
                }}
              >
                {formatAnnotationDisplayText(reply.text)}
              </Typography>

              {reply.imageUrl ? (
                <Box sx={{ mt: 0.75 }}>
                  <CommentImageAttachment
                    src={reply.imageUrl}
                    alt={`Image attached by ${reply.author.name}`}
                    variant="message"
                  />
                </Box>
              ) : null}
            </Box>
          </Box>
        </Box>
      ))}
    </Box>
  );
}

interface AnnotationHistoryDrawerProps {
  open: boolean;
  entries: AnnotationHistoryEntry[];
  comments?: VideoComment[];
  mediaItem?: MediaItem;
  technicalDetails?: MediaTechnicalDetails;
  tags?: string[];
  onTagsChange?: (tags: string[]) => void;
  activeTab?: DrawerTab;
  onTabChange?: (tab: DrawerTab) => void;
  /** Restricts which sections are selectable, e.g. guests without comment access. */
  availableTabs?: DrawerTab[];
  detailsSection?: MediaDetailsSection;
  onDetailsSectionChange?: (section: MediaDetailsSection) => void;
  /** Person whose headshot is highlighted on the frame from the AI insights tab. */
  selectedFramePersonId?: string | null;
  onFramePersonSelect?: (person: FramePerson) => void;
  /** Seek player to a transcript segment (milliseconds). */
  onTranscriptSeek?: (startMs: number) => void;
  /** Media element the transcript follows to highlight the line being spoken. */
  videoRef?: React.RefObject<HTMLVideoElement | null>;
  onClose: () => void;
  onEntryClick?: (entry: AnnotationHistoryEntry) => void;
  onToggleResolved: (entryId: string) => void;
  onTogglePinned?: (entryId: string) => void;
  onMarkUnread: (entryId: string) => void;
  onMarkRead?: (entryId: string) => void;
  onCopyLink: (entry: AnnotationHistoryEntry) => void;
  onDeleteEntry: (entryId: string) => void;
  onHardDeleteEntry?: (entryId: string) => void;
  onRestoreEntry?: (entryId: string) => void;
  onEditComment?: (commentId: string, text: string) => void;
  annotationGroups: AnnotationAccessGroup[];
  onVisibilityChange: (
    entryId: string,
    visibility: AnnotationVisibility,
    groupId?: string,
  ) => void;
  collaborators: MediaCollaborator[];
  onCreateAnnotationGroup: (name: string, memberIds: string[]) => AnnotationAccessGroup | Promise<AnnotationAccessGroup | null | undefined>;
  onDeleteAnnotationGroup?: (groupId: string) => void;
  onUpdateAnnotationGroup?: (groupId: string, name: string, memberIds: string[]) => Promise<AnnotationAccessGroup | null | undefined>;
  onAddCollaborator?: (name: string, email: string) => MediaCollaborator | null;
  activeHistoryEntryId?: string | null;
}

const DRAWER_TABS: { value: Exclude<DrawerTab, 'ai'>; label: string }[] = [
  { value: 'history', label: 'Annotation History' },
  { value: 'details', label: 'Details' },
];

const DRAWER_TAB_PANEL_LABELS: Record<DrawerTab, string> = {
  history: 'Annotation history',
  details: 'Media details',
  ai: 'AI insights',
};

const STATUS_FILTER_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'unread', label: 'Unread' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'archive', label: 'Archive' },
];

const TYPE_FILTER_OPTIONS: { value: 'all' | AnnotationHistoryType; label: string }[] = [
  { value: 'all', label: 'All types' },
  { value: 'comment', label: 'Comments' },
  { value: 'drawing', label: 'Drawings' },
  { value: 'shape', label: 'Shapes' },
  { value: 'stamp', label: 'Stamps' },
];

const AI_FRAME_PEOPLE_PREVIEW_COUNT = 8;
const AI_FRAME_HEADSHOT_SIZE = 34;

const drawerSurface = 'var(--noah-drawer-surface)';

const filterSelectSx = {
  borderRadius: '10px',
  backgroundColor: cv.surface,
  fontSize: '0.75rem',
  color: cv.textSecondary,
  '& .MuiOutlinedInput-notchedOutline': { borderColor: cv.border },
  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: cv.borderStrong },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: cv.brandPurple },
  '& .MuiSelect-icon': { color: cv.textMuted },
  '& .MuiSelect-select': { py: 0.85 },
};
const menuPaperSx = {
  mt: 0.5,
  minWidth: 168,
  borderRadius: '12px',
  border: "1px solid var(--noah-border)",
  background: 'var(--noah-popover-surface-deep)',
  backdropFilter: 'blur(20px)',
  boxShadow: cv.dropdownShadow,
};

const rowActionSx = {
  width: 28,
  height: 28,
  color: cv.textSecondary,
  '&:hover': {
    backgroundColor: cv.surfaceHover,
    color: cv.textPrimary,
  },
};

function HistoryEntryRow({
  entry,
  isActive,
  replies = [],
  isTimeBasedMedia = true,
  annotationGroups,
  onEntryClick,
  onToggleResolved,
  onMarkUnread,
  onCopyLink,
  onDeleteEntry,
  onEditComment,
  onVisibilityChange,
  onCreateAnnotationGroup,
  collaborators,
  onDeleteAnnotationGroup,
  onUpdateAnnotationGroup,
  onAddCollaborator,
  onTogglePinned,
  onHardDeleteEntry,
  onRestoreEntry,
  onMarkRead,
}: {
  entry: AnnotationHistoryEntry;
  replies?: CommentReply[];
  isTimeBasedMedia?: boolean;
  onEditComment?: (commentId: string, text: string) => void;
  annotationGroups: AnnotationAccessGroup[];
  collaborators: MediaCollaborator[];
  onEntryClick?: (entry: AnnotationHistoryEntry) => void;
  onToggleResolved: (entryId: string) => void;
  onTogglePinned?: (entryId: string) => void;
  onMarkUnread: (entryId: string) => void;
  onMarkRead?: (entryId: string) => void;
  onCopyLink: (entry: AnnotationHistoryEntry) => void;
  onDeleteEntry: (entryId: string) => void;
  onHardDeleteEntry?: (entryId: string) => void;
  onRestoreEntry?: (entryId: string) => void;
  onVisibilityChange: (
    entryId: string,
    visibility: AnnotationVisibility,
    groupId?: string,
  ) => void;
  onCreateAnnotationGroup: (name: string, memberIds: string[]) => AnnotationAccessGroup | Promise<AnnotationAccessGroup | null | undefined>;
  onDeleteAnnotationGroup?: (groupId: string) => void;
  onUpdateAnnotationGroup?: (groupId: string, name: string, memberIds: string[]) => Promise<AnnotationAccessGroup | null | undefined>;
  onAddCollaborator?: (name: string, email: string) => MediaCollaborator | null;
}) {
  const activeUser = useActiveUser();
  const rowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isActive && rowRef.current) {
      rowRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [isActive]);

  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [repliesOpen, setRepliesOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState('');
  const replyCount = replies.length || entry.replyCount || 0;
  const hasReplies = replyCount > 0;
  const isResolved = Boolean(entry.resolved);
  const isErased = Boolean(entry.erasedAt);
  const commentId = getCommentIdForEntry(entry);
  const canEdit =
    Boolean(commentId && onEditComment) &&
    entry.author.name === activeUser.name &&
    !isResolved &&
    !isErased;
  const isMergedAnnotationThread = Boolean(
    entry.sourceCommentId && (entry.type === 'drawing' || entry.type === 'shape'),
  );
  const body = isMergedAnnotationThread && entry.detail
    ? formatAnnotationDisplayText(`${entry.summary}: ${entry.detail}`)
    : formatAnnotationDisplayText(entry.detail ?? entry.summary);
  const editableText = isMergedAnnotationThread
    ? entry.detail ?? ''
    : entry.detail ?? entry.summary ?? '';

  const startEditing = () => {
    setEditText(editableText);
    setIsEditing(true);
  };

  const saveEdit = () => {
    if (!commentId || !onEditComment || !editText.trim()) return;
    onEditComment(commentId, editText.trim());
    setIsEditing(false);
  };

  const handleEntryClick = () => {
    onEntryClick?.(entry);
  };

  return (
    <Box
      ref={rowRef}
      sx={{
        position: 'relative',
        py: 1.5,
        px: 1,
        mx: -1,
        borderRadius: '10px',
        opacity: isResolved ? 0.62 : 1,
        backgroundColor: isActive 
          ? cv.purpleSelectionSoft 
          : entry.unread 
            ? cv.purpleSelectionSoft 
            : 'transparent',
        borderLeft: isActive ? `3px solid ${cv.brandPurple}` : '3px solid transparent',
        transition: 'background-color 0.2s ease, border-left 0.2s ease',
        '&:hover': {
          backgroundColor: (isActive || entry.unread) ? cv.purpleSelectionHover : cv.surfaceHover,
        },
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: 10,
          right: 4,
          display: 'flex',
          alignItems: 'center',
          gap: 0.25,
          zIndex: 1,
        }}
      >
        <AnnotationVisibilityPicker
          visibility={entry.visibility}
          groupId={entry.groupId}
          groups={annotationGroups}
          collaborators={collaborators}
          onChange={(visibility, groupId) =>
            onVisibilityChange(entry.id, visibility, groupId)
          }
          onCreateGroup={onCreateAnnotationGroup}
          onDeleteGroup={onDeleteAnnotationGroup}
          onUpdateGroup={onUpdateAnnotationGroup}
          onAddCollaborator={onAddCollaborator}
          isAuthor={entry.author.name === activeUser.name}
          variant="dark"
        />

        <Tooltip title="More options" arrow placement="top">
          <IconButton
            type="button"
            aria-label="Entry options"
            size="small"
            onClick={(event) => {
              event.stopPropagation();
              setMenuAnchor(event.currentTarget);
            }}
            sx={{
              ...rowActionSx,
              backgroundColor: cv.purpleSelectionSoft,
              color: cv.brandPurple,
              '&:hover': {
                backgroundColor: cv.purpleSurfaceActive,
                color: cv.purpleLight,
              },
            }}
          >
            <MoreHorizOutlinedIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>

        <Tooltip
          title={isResolved ? 'Reopen' : 'Mark as Resolved'}
          arrow
          placement="top"
        >
          <IconButton
            type="button"
            aria-label={isResolved ? 'Reopen' : 'Mark as Resolved'}
            aria-pressed={isResolved}
            size="small"
            onClick={(event) => {
              event.stopPropagation();
              onToggleResolved(entry.id);
            }}
            sx={{
              ...rowActionSx,
              color: isResolved ? cv.brandPurple : cv.textSecondary,
              '&:hover': {
                backgroundColor: isResolved
                  ? cv.purpleSelectionHover
                  : cv.greenBrightSurface,
                color: isResolved ? cv.purpleLight : cv.greenBright,
              },
            }}
          >
            {isResolved ? (
              <ReplayOutlinedIcon sx={{ fontSize: 18 }} />
            ) : (
              <CheckCircleOutlineOutlinedIcon sx={{ fontSize: 18 }} />
            )}
          </IconButton>
        </Tooltip>

        <Tooltip
          title={entry.pinned ? 'Unpin' : 'Pin to top'}
          arrow
          placement="top"
        >
          <IconButton
            type="button"
            aria-label={entry.pinned ? 'Unpin' : 'Pin to top'}
            aria-pressed={Boolean(entry.pinned)}
            size="small"
            onClick={(event) => {
              event.stopPropagation();
              onTogglePinned?.(entry.id);
            }}
            sx={{
              ...rowActionSx,
              color: entry.pinned ? cv.brandPurple : cv.textSecondary,
              '&:hover': {
                backgroundColor: entry.pinned
                  ? cv.purpleSelectionHover
                  : cv.surfaceHover,
                color: entry.pinned ? cv.purpleLight : cv.textPrimary,
              },
            }}
          >
            {entry.pinned ? (
              <PushPinIcon sx={{ fontSize: 18, transform: 'rotate(45deg)', color: 'var(--noah-brand-purple)' }} />
            ) : (
              <PushPinOutlinedIcon sx={{ fontSize: 18, transform: 'rotate(45deg)', color: cv.textSecondary }} />
            )}
          </IconButton>
        </Tooltip>
      </Box>

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: menuPaperSx } }}
      >
        {canEdit ? (
          <MenuItem
            onClick={() => {
              startEditing();
              setMenuAnchor(null);
            }}
            sx={{ fontSize: '0.875rem', color: cv.textPrimary }}
          >
            Edit
          </MenuItem>
        ) : null}
        <MenuItem
          onClick={() => {
            onToggleResolved(entry.id);
            setMenuAnchor(null);
          }}
          sx={{
            fontSize: '0.875rem',
            color: isResolved ? cv.destructive : cv.textPrimary,
          }}
        >
          {isResolved ? 'Reopen' : 'Mark as Resolved'}
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (entry.unread) {
              onMarkRead?.(entry.id);
            } else {
              onMarkUnread(entry.id);
            }
            setMenuAnchor(null);
          }}
          sx={{ fontSize: '0.875rem', color: cv.textPrimary }}
        >
          {entry.unread ? 'Mark as read' : 'Mark as unread'}
        </MenuItem>
        <MenuItem
          onClick={() => {
            onCopyLink(entry);
            setMenuAnchor(null);
          }}
          sx={{ fontSize: '0.875rem', color: cv.textPrimary }}
        >
          Copy link
        </MenuItem>
        {entry.author.name === activeUser.name ? (
          <>
            {isErased ? (
              <MenuItem
                onClick={() => {
                  if (onRestoreEntry) {
                    onRestoreEntry(entry.id);
                  }
                  setMenuAnchor(null);
                }}
                sx={{ fontSize: '0.875rem', color: cv.textPrimary }}
              >
                Restore from Archive
              </MenuItem>
            ) : null}
            <MenuItem
              onClick={() => {
                if (isErased && onHardDeleteEntry) {
                  setDeleteConfirmOpen(true);
                } else {
                  onDeleteEntry(entry.id);
                }
                setMenuAnchor(null);
              }}
              sx={{ fontSize: '0.875rem', color: cv.destructive }}
            >
              {isErased ? 'Delete Permanently' : 'Archive'}
            </MenuItem>
          </>
        ) : null}
      </Menu>

      <Tooltip
        title={onEntryClick && isTimeBasedMedia ? `Jump to ${formatVideoTimestamp(entry.videoTimestamp)}` : ''}
        arrow
        placement="top"
        disableHoverListener={!onEntryClick || !isTimeBasedMedia}
      >
        <Box
          component="button"
          type="button"
          onClick={handleEntryClick}
          sx={{
            display: 'flex',
            gap: 1.25,
            width: '100%',
            pr: 6.5,
            textAlign: 'left',
            border: 'none',
            background: 'transparent',
            cursor: onEntryClick ? 'pointer' : 'default',
            p: 0,
            color: 'inherit',
          }}
        >
        {entry.type === 'system' ? (
          <Avatar
            sx={{
              width: 32,
              height: 32,
              flexShrink: 0,
              fontSize: '0.75rem',
              fontWeight: 600,
              background: 'rgba(147, 51, 234, 0.12)',
              color: cv.brandPurple,
              border: `1px solid ${cv.border}`,
            }}
          >
            <ShareOutlinedIcon sx={{ fontSize: 16 }} />
          </Avatar>
        ) : (
          <Avatar
            src={entry.author.avatarUrl}
            alt=""
            sx={{
              width: 32,
              height: 32,
              flexShrink: 0,
              fontSize: '0.75rem',
              fontWeight: 600,
              background: cv.brandGradient,
            }}
          >
            {!entry.author.avatarUrl ? entry.author.initials : null}
          </Avatar>
        )}

        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography
            sx={{
              fontSize: '0.75rem',
              color: cv.textMuted,
              mb: 0.5,
            }}
          >
            #{entry.index}{isTimeBasedMedia ? ` · ${formatVideoTimestamp(entry.videoTimestamp)}` : ''}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: 0.75, mb: 0.5 }}>
            <Typography
              component="span"
              sx={{ fontSize: '0.875rem', fontWeight: 700, color: cv.textPrimary }}
            >
              {entry.type === 'system' ? 'System Event' : entry.author.name}
            </Typography>
            <Typography
              component="time"
              dateTime={new Date(entry.createdAt).toISOString()}
              sx={{ fontSize: '0.8125rem', color: cv.textMuted }}
            >
              {formatRelativeTime(entry.createdAt)}
            </Typography>
            {entry.unread && (
              <Box
                component="span"
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  backgroundColor: cv.brandPurple,
                  flexShrink: 0,
                }}
                aria-label="Unread"
              />
            )}
          </Box>

          <Typography
            sx={{
              fontSize: '0.8125rem',
              color: entry.type === 'system' ? cv.textPrimary : cv.textSecondary,
              fontWeight: entry.type === 'system' ? 500 : 400,
              mb: 0.25,
            }}
          >
            {entry.type === 'system' ? entry.summary : getHistoryTypeLabel(entry.type)}
          </Typography>

          {isEditing ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <TextField
                autoFocus
                multiline
                minRows={2}
                value={editText}
                onChange={(event) => setEditText(event.target.value)}
                size="small"
                aria-label="Edit comment"
                sx={{
                  '& .MuiInputBase-root': {
                    fontSize: '0.875rem',
                    color: cv.textPrimary,
                    backgroundColor: cv.surface,
                  },
                }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                <Tooltip title="Cancel editing" arrow placement="top">
                  <Box
                    component="button"
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      setIsEditing(false);
                    }}
                    sx={{
                      border: 'none',
                      background: 'transparent',
                      color: cv.textMuted,
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </Box>
                </Tooltip>
                <Tooltip title="Save changes" arrow placement="top">
                  <span>
                    <Box
                      component="button"
                      type="button"
                      disabled={!editText.trim()}
                      onClick={(event) => {
                        event.stopPropagation();
                        saveEdit();
                      }}
                      sx={{
                        border: 'none',
                        background: 'transparent',
                        color: editText.trim() ? cv.brandPurple : cv.textMuted,
                        fontSize: '0.8125rem',
                        fontWeight: 600,
                        cursor: editText.trim() ? 'pointer' : 'default',
                      }}
                    >
                      Save
                    </Box>
                  </span>
                </Tooltip>
              </Box>
            </Box>
          ) : (
            <Box sx={historyEntryBodyScrollSx}>
              <Typography
                sx={{
                  fontSize: '0.9375rem',
                  lineHeight: 1.45,
                  color: isResolved || isErased ? cv.textMuted : cv.textPrimary,
                  textDecoration: isResolved || isErased ? 'line-through' : 'none',
                  ...longFormTextSx,
                }}
              >
                {body}
              </Typography>
            </Box>
          )}

          {isErased && entry.erasedBy && entry.erasedAt != null && (
            <Typography
              sx={{
                mt: 0.75,
                fontSize: '0.8125rem',
                lineHeight: 1.4,
                color: palette.red,
              }}
            >
              {entry.type === 'shape'
                ? 'Shape deleted'
                : entry.type === 'stamp'
                  ? 'Stamp deleted'
                  : entry.type === 'drawing'
                    ? 'Drawing deleted'
                    : 'Erased'}{' '}
              by {entry.erasedBy.name} · {formatRelativeTime(entry.erasedAt)}
            </Typography>
          )}

        </Box>
      </Box>
      </Tooltip>

      {hasReplies ? (
        <Box sx={{ pl: 5.5, pr: 6.5 }}>
          <Tooltip
            title={repliesOpen ? 'Hide replies' : `Show ${replyCount} replies`}
            arrow
            placement="top"
          >
            <Box
              component="button"
              type="button"
              aria-expanded={repliesOpen}
              onClick={(event) => {
                event.stopPropagation();
                setRepliesOpen((open) => !open);
              }}
            sx={{
              mt: 0.75,
              p: 0,
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              fontSize: '0.8125rem',
              fontWeight: 500,
              color: isResolved ? cv.textMuted : cv.brandPurple,
              textDecoration: isResolved ? 'line-through' : 'none',
              '&:hover': {
                color: isResolved ? cv.textMuted : cv.purpleLight,
                textDecoration: isResolved ? 'line-through' : 'underline',
              },
            }}
          >
            {repliesOpen
              ? 'Hide replies'
              : replyCount === 1
                ? '1 reply'
                : `${replyCount} replies`}
            </Box>
          </Tooltip>

          {repliesOpen && replies.length > 0 ? <HistoryEntryReplies replies={replies} /> : null}
        </Box>
      ) : null}

      {isResolved && entry.resolvedBy && entry.resolvedAt != null ? (
        <Typography
          sx={{
            mt: 0.75,
            pl: 5.5,
            pr: 6.5,
            fontSize: '0.75rem',
            lineHeight: 1.4,
            color: cv.greenBright,
          }}
        >
          Resolved by {entry.resolvedBy.name} · {formatRelativeTime(entry.resolvedAt)}
        </Typography>
      ) : null}

      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        PaperProps={{
          sx: {
            backgroundColor: cv.surface,
            backgroundImage: 'none',
            borderRadius: '12px',
            border: `1px solid ${cv.border}`,
            boxShadow: cv.dialogShadow,
          },
        }}
      >
        <DialogTitle sx={{ color: cv.textPrimary, fontSize: '1.125rem', pb: 1 }}>
          Permanently Delete Annotation?
        </DialogTitle>
        <DialogContent sx={{ pb: 2 }}>
          <DialogContentText sx={{ color: cv.textSecondary, fontSize: '0.875rem' }}>
            Are you sure you want to permanently delete this annotation? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button
            onClick={() => setDeleteConfirmOpen(false)}
            sx={{ textTransform: 'none', color: cv.textSecondary }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (onHardDeleteEntry) {
                onHardDeleteEntry(entry.id);
              }
              setDeleteConfirmOpen(false);
            }}
            variant="contained"
            color="error"
            disableElevation
            sx={{ textTransform: 'none' }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

function FramePeopleHeadshots({
  people,
  query,
  selectedPersonId,
  onSelectPerson,
}: Readonly<{
  people: FramePerson[];
  query: string;
  selectedPersonId?: string | null;
  onSelectPerson?: (person: FramePerson) => void;
}>) {
  const [showAll, setShowAll] = useState(false);
  const hiddenCount = Math.max(people.length - AI_FRAME_PEOPLE_PREVIEW_COUNT, 0);
  const visiblePeople =
    showAll || hiddenCount === 0 ? people : people.slice(0, AI_FRAME_PEOPLE_PREVIEW_COUNT);

  return (
    <Box
      sx={{
        p: 1,
        borderRadius: '12px',
        border: `1px dashed ${cv.borderStrong}`,
        backgroundColor: cv.surface,
      }}
    >
      {people.length === 0 ? (
        <Typography sx={{ fontSize: '0.8125rem', color: cv.textMuted, textAlign: 'center' }}>
          No people match "{query.trim()}".
        </Typography>
      ) : (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            component="ul"
            aria-label="People detected in this frame"
            sx={{
              listStyle: 'none',
              m: 0,
              // Keeps the selected headshot's focus ring from being clipped by the scroller
              p: 0.5,
              flex: 1,
              minWidth: 0,
              display: 'flex',
              flexWrap: 'nowrap',
              gap: 1,
              overflowX: 'auto',
              overflowY: 'hidden',
              overscrollBehavior: 'contain',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            {visiblePeople.map((person) => {
              const isSelected = person.id === selectedPersonId;

              return (
                <Box component="li" key={person.id} sx={{ display: 'flex', flexShrink: 0 }}>
                  <Tooltip
                    title={`${
                      isSelected ? 'Hide' : 'Show'
                    } ${person.name} on the frame · ${person.detail}`}
                    arrow
                    placement="top"
                  >
                    <Avatar
                      component="button"
                      type="button"
                      aria-pressed={isSelected}
                      aria-label={`${person.name}, ${person.detail}`}
                      onClick={() => onSelectPerson?.(person)}
                      sx={{
                        width: AI_FRAME_HEADSHOT_SIZE,
                        height: AI_FRAME_HEADSHOT_SIZE,
                        p: 0,
                        fontSize: '0.625rem',
                        fontWeight: 600,
                        color: cv.textPrimary,
                        background: cv.brandGradient,
                        border: 'none',
                        cursor: onSelectPerson ? 'pointer' : 'default',
                        outline: isSelected ? `2px solid ${cv.purpleLight}` : 'none',
                        outlineOffset: '2px',
                        transition: 'transform 0.15s ease',
                        '&:hover': { transform: onSelectPerson ? 'scale(1.08)' : 'none' },
                        '&:focus-visible': {
                          outline: `2px solid ${cv.purpleFocusBorder}`,
                          outlineOffset: '2px',
                        },
                      }}
                    >
                      {person.initials}
                    </Avatar>
                  </Tooltip>
                </Box>
              );
            })}
          </Box>

          {hiddenCount > 0 && !showAll ? (
            <Tooltip title={`Show ${hiddenCount} more`} arrow placement="top">
              <Box
                component="button"
                type="button"
                aria-label={`Show ${hiddenCount} more people in this frame`}
                onClick={() => setShowAll(true)}
                sx={{
                  flexShrink: 0,
                  width: AI_FRAME_HEADSHOT_SIZE,
                  height: AI_FRAME_HEADSHOT_SIZE,
                  borderRadius: '50%',
                  border: `1px solid ${cv.borderStrong}`,
                  backgroundColor: cv.glassBackground,
                  color: cv.textSecondary,
                  fontSize: '0.625rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  '&:hover': {
                    color: cv.textPrimary,
                    backgroundColor: cv.surfaceHover,
                  },
                }}
              >
                +{hiddenCount}
              </Box>
            </Tooltip>
          ) : null}
        </Box>
      )}
    </Box>
  );
}

export default function AnnotationHistoryDrawer({
  open,
  activeHistoryEntryId,
  entries,
  comments = [],
  mediaItem,
  technicalDetails,
  tags = [],
  onTagsChange,
  activeTab: controlledTab,
  onTabChange,
  availableTabs,
  detailsSection,
  onDetailsSectionChange,
  selectedFramePersonId,
  onFramePersonSelect,
  onTranscriptSeek,
  videoRef,
  onClose,
  onEntryClick,
  onToggleResolved,
  onTogglePinned,
  onMarkUnread,
  onMarkRead,
  onCopyLink,
  onDeleteEntry,
  onHardDeleteEntry,
  onRestoreEntry,
  onEditComment,
  annotationGroups,
  collaborators,
  onVisibilityChange,
  onCreateAnnotationGroup,
  onDeleteAnnotationGroup,
  onUpdateAnnotationGroup,
  onAddCollaborator,
}: AnnotationHistoryDrawerProps) {
  const theme = useTheme();
  const activeUser = useActiveUser();
  const isDesktopPanel = useMediaQuery(theme.breakpoints.up(SIDEBAR_DESKTOP_BREAKPOINT));
  const [internalTab, setInternalTab] = useState<DrawerTab>('history');
  const visibleTabs = DRAWER_TABS.filter(
    (tab) => !availableTabs || availableTabs.includes(tab.value),
  );
  const requestedTab = controlledTab ?? internalTab;
  const activeTab: DrawerTab =
    requestedTab === 'ai'
      ? 'ai'
      : visibleTabs.some((tab) => tab.value === requestedTab)
        ? requestedTab
        : visibleTabs[0]?.value ?? 'details';

  
  const isTimeBasedMedia = mediaItem?.type === 'video' || mediaItem?.type === 'audio';

  const handleTabChange = (tab: DrawerTab) => {
    if (onTabChange) {
      onTabChange(tab);
    } else {
      setInternalTab(tab);
    }
  };
  const [query, setQuery] = useState('');
  const [aiQuery, setAiQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | AnnotationHistoryType>('all');
  const [dateRangeFilter, setDateRangeFilter] = useState<DateRangeFilter>('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [aiSubTab, setAiSubTab] = useState<AiSubTab>('summary');
  const aiEntitled = useAiEntitled();
  const [highlightSummary, setHighlightSummary] = useState<string | null>(null);
  const [highlightTags, setHighlightTags] = useState<string[]>([]);
  const [highlightLoading, setHighlightLoading] = useState(false);
  const [highlightError, setHighlightError] = useState<string | null>(null);

  const commentById = useMemo(
    () => new Map(comments.map((comment) => [comment.id, comment])),
    [comments],
  );

  const filteredEntries = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return [...entries]
      .filter((entry) => {
        if (entry.visibility === 'private' && entry.author.name !== activeUser.name) {
          return false;
        }

        const sourceComment = entry.sourceCommentId ? commentById.get(entry.sourceCommentId) : null;
        const isArchived = Boolean(entry.erasedAt || sourceComment?.erasedAt);

        if (isArchived && statusFilter !== 'archive') return false;
        if (statusFilter === 'archive' && !isArchived) return false;

        if (statusFilter === 'unread' && !(entry.unread && !entry.resolved)) {
          return false;
        }
        if (statusFilter === 'resolved' && !entry.resolved) return false;

        if (typeFilter !== 'all' && entry.type !== typeFilter) return false;

        if (dateRangeFilter === 'custom') {
          if (!matchesCustomDateRange(entry.createdAt, customStartDate, customEndDate)) {
            return false;
          }
        } else if (
          !matchesDateRange(new Date(entry.createdAt).toISOString(), dateRangeFilter)
        ) {
          return false;
        }

        if (!normalizedQuery) return true;

        const commentId = getCommentIdForEntry(entry);
        const comment = commentId ? commentById.get(commentId) : undefined;
        const replyLabel =
          (entry.replyCount ?? 0) > 0
            ? entry.replyCount === 1
              ? '1 reply'
              : `${entry.replyCount} replies`
            : '';

        const haystack = [
          entry.author.name,
          entry.summary,
          entry.detail,
          replyLabel,
          getHistoryTypeLabel(entry.type),
          formatVideoTimestamp(entry.videoTimestamp),
          ...(comment?.replies.map((reply) => `${reply.author.name} ${reply.text}`) ?? []),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return haystack.includes(normalizedQuery);
      })
      .sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return b.createdAt - a.createdAt;
      });
  }, [commentById, customEndDate, customStartDate, dateRangeFilter, entries, query, statusFilter, typeFilter, activeUser.name]);

  const filteredFramePeople = useMemo(() => {
    const normalizedQuery = aiQuery.trim().toLowerCase();
    if (!normalizedQuery) return MOCK_FRAME_PEOPLE;

    return MOCK_FRAME_PEOPLE.filter((person) =>
      `${person.name} ${person.detail}`.toLowerCase().includes(normalizedQuery),
    );
  }, [aiQuery]);

  // People detection runs on frames, so audio and documents have no faces to list.
  const supportsFramePeople = mediaItem?.type === 'video' || mediaItem?.type === 'image';

  useEffect(() => {
    setAiSubTab('summary');
  }, [mediaItem?.id]);

  useEffect(() => {
    if (activeTab !== 'ai' || !aiEntitled || !mediaItem?.id) {
      return;
    }

    let cancelled = false;
    setHighlightLoading(true);
    setHighlightError(null);

    void getAiHighlightsRequest(mediaItem.id)
      .then((res) => {
        if (cancelled) return;
        const apiSummary = res.summary?.trim() || '';
        const apiTags = Array.isArray(res.tags)
          ? res.tags.filter((t) => typeof t === 'string' && t.trim())
          : [];
        setHighlightSummary(apiSummary || null);
        setHighlightTags(apiTags);
        if (res.status === 'failed' || res.error) {
          setHighlightError(res.error || 'AI summary failed.');
        }
      })
      .catch(() => {
        if (cancelled) return;
        setHighlightError('Could not load AI summary.');
        setHighlightSummary(null);
        setHighlightTags([]);
      })
      .finally(() => {
        if (!cancelled) setHighlightLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeTab, aiEntitled, mediaItem?.id]);

  const insightsSummary = useMemo(() => {
    if (highlightSummary?.trim()) return highlightSummary.trim();
    const userSummary =
      (typeof mediaItem?.customMetadata?.summary === 'string' &&
        mediaItem.customMetadata.summary.trim()) ||
      mediaItem?.summary?.trim() ||
      '';
    return userSummary || null;
  }, [highlightSummary, mediaItem?.customMetadata, mediaItem?.summary]);

  const insightsTags = useMemo(() => {
    if (highlightTags.length > 0) return highlightTags;
    return Array.isArray(mediaItem?.aiTags)
      ? mediaItem.aiTags.filter((t) => typeof t === 'string' && t.trim())
      : [];
  }, [highlightTags, mediaItem?.aiTags]);

  const panelBody = (
    <>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.75,
          px: 1.5,
          pt: 1.25,
          pb: 1,
        }}
      >
        {activeTab === 'ai' ? (
          <Typography
            component="h2"
            sx={{
              flex: 1,
              fontSize: '0.875rem',
              fontWeight: 600,
              color: cv.textPrimary,
              lineHeight: 1.3,
            }}
          >
            AI insights
          </Typography>
        ) : (
          <Box
            role="tablist"
            aria-label="Annotation panel sections"
            sx={{
              display: 'flex',
              flex: 1,
              gap: 0.5,
              p: 0.5,
              borderRadius: '12px',
              border: "1px solid var(--noah-border)",
              backgroundColor: cv.surface,
            }}
          >
            {visibleTabs.map((tab) => {
              const isActive = activeTab === tab.value;

              return (
                <Tooltip key={tab.value} title={tab.label} arrow placement="top">
                  <Box
                    component="button"
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => handleTabChange(tab.value)}
                    sx={{
                      flex: 1,
                      border: 'none',
                      borderRadius: '8px',
                      px: 1,
                      py: 0.75,
                      fontSize: '0.75rem',
                      fontWeight: isActive ? 600 : 500,
                      lineHeight: 1.2,
                      cursor: 'pointer',
                      color: isActive ? cv.textPrimary : cv.textSecondary,
                      backgroundColor: isActive ? cv.purpleSelectionHover : 'transparent',
                      boxShadow: isActive ? `inset 0 0 0 1px ${cv.purpleSelectionStrong}` : 'none',
                      transition: 'background-color 0.15s ease, color 0.15s ease',
                      '&:hover': {
                        color: cv.textPrimary,
                        backgroundColor: isActive
                          ? cv.purpleSelectionMedium
                          : cv.glassBackground,
                      },
                    }}
                  >
                    {tab.label}
                  </Box>
                </Tooltip>
              );
            })}
          </Box>
        )}

        {isDesktopPanel ? null : (
          <Tooltip title="Close panel" arrow placement="top">
            <IconButton
              type="button"
              aria-label="Close panel"
              onClick={onClose}
              sx={{ color: cv.textSecondary }}
            >
              <CloseOutlinedIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {activeTab === 'ai' && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25, px: 1.5, pb: 1.25 }}>
          <Box
            role="tablist"
            aria-label="AI insights sections"
            sx={{
              display: 'flex',
              gap: 0.5,
              p: 0.5,
              borderRadius: '12px',
              border: '1px solid var(--noah-border)',
              backgroundColor: cv.surface,
            }}
          >
            {AI_SUB_TABS.map((tab) => {
              const isActive = aiSubTab === tab.value;
              return (
                <Box
                  key={tab.value}
                  component="button"
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setAiSubTab(tab.value)}
                  sx={{
                    flex: 1,
                    border: 'none',
                    borderRadius: '8px',
                    px: 1,
                    py: 0.75,
                    fontSize: '0.75rem',
                    fontWeight: isActive ? 600 : 500,
                    lineHeight: 1.2,
                    cursor: 'pointer',
                    color: isActive ? cv.textPrimary : cv.textSecondary,
                    backgroundColor: isActive ? cv.purpleSelectionHover : 'transparent',
                    boxShadow: isActive ? `inset 0 0 0 1px ${cv.purpleSelectionStrong}` : 'none',
                    transition: 'background-color 0.15s ease, color 0.15s ease',
                    '&:hover': {
                      color: cv.textPrimary,
                      backgroundColor: isActive
                        ? cv.purpleSelectionMedium
                        : cv.glassBackground,
                    },
                  }}
                >
                  {tab.label}
                </Box>
              );
            })}
          </Box>

          {aiSubTab === 'transcript' ? (
            <>
              <TextField
                fullWidth
                size="small"
                placeholder={supportsFramePeople ? 'Search people, objects or moments' : 'Search transcript'}
                value={aiQuery}
                onChange={(event) => setAiQuery(event.target.value)}
                aria-label="Search transcript"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '999px',
                    backgroundColor: cv.surface,
                    fontSize: '0.875rem',
                    color: cv.textPrimary,
                    '& fieldset': { borderColor: cv.border },
                    '&:hover fieldset': { borderColor: cv.annotationGuide },
                    '&.Mui-focused fieldset': { borderColor: cv.purpleFocusBorder },
                  },
                  '& .MuiInputBase-input::placeholder': {
                    color: cv.textMuted,
                    opacity: 1,
                  },
                }}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchOutlinedIcon sx={{ fontSize: 18, color: cv.textMuted }} />
                      </InputAdornment>
                    ),
                  },
                }}
              />

              {supportsFramePeople && (
                <FramePeopleHeadshots
                  people={filteredFramePeople}
                  query={aiQuery}
                  selectedPersonId={selectedFramePersonId}
                  onSelectPerson={onFramePersonSelect}
                />
              )}
            </>
          ) : null}
        </Box>
      )}

      {activeTab === 'history' && (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            px: 1.5,
            pb: 1.25,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <TextField
              size="small"
              placeholder="Search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label="Search history"
              sx={{
                flex: 1,
                '& .MuiOutlinedInput-root': {
                  borderRadius: '999px',
                  backgroundColor: cv.surface,
                  fontSize: '0.875rem',
                  color: cv.textPrimary,
                  '& fieldset': { borderColor: cv.border },
                  '&:hover fieldset': { borderColor: cv.annotationGuide },
                  '&.Mui-focused fieldset': { borderColor: cv.purpleFocusBorder },
                },
                '& .MuiInputBase-input::placeholder': {
                  color: cv.textMuted,
                  opacity: 1,
                },
              }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchOutlinedIcon sx={{ fontSize: 18, color: cv.textMuted }} />
                    </InputAdornment>
                  ),
                },
              }}
            />

            <Tooltip title={filterOpen ? 'Hide filters' : 'Show filters'} arrow placement="top">
              <IconButton
                type="button"
                aria-label="Toggle filters"
                aria-expanded={filterOpen}
                onClick={() => setFilterOpen((current) => !current)}
                sx={{
                  color: filterOpen ? cv.brandPurple : cv.textSecondary,
                  backgroundColor: filterOpen ? cv.purpleSelectionSoft : 'transparent',
                  '&:hover': {
                    color: filterOpen ? cv.purpleLight : cv.textPrimary,
                    backgroundColor: filterOpen ? cv.purpleSelectionHover : cv.surfaceHover,
                  },
                }}
              >
                <FilterListOutlinedIcon sx={{ fontSize: 20 }} />
              </IconButton>
            </Tooltip>
          </Box>

          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 0.75,
            }}
          >
            {STATUS_FILTER_OPTIONS.map((option) => {
              const isActive = statusFilter === option.value;

              return (
                <Box
                  key={option.value}
                  component="button"
                  type="button"
                  onClick={() => setStatusFilter(option.value)}
                  aria-pressed={isActive}
                  sx={{
                    border: `1px solid ${isActive ? cv.brandPurple : cv.border}`,
                    backgroundColor: isActive ? cv.purpleSelectionHover : 'transparent',
                    color: isActive ? cv.textPrimary : cv.textSecondary,
                    borderRadius: '999px',
                    px: 1.25,
                    py: 0.5,
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    '&:hover': {
                      color: cv.textPrimary,
                      borderColor: isActive ? cv.brandPurple : cv.borderStrong,
                    },
                  }}
                >
                  {option.label}
                </Box>
              );
            })}
          </Box>

          {filterOpen ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 1,
                }}
              >
                <FormControl size="small" fullWidth>
                  <Select
                    value={typeFilter}
                    onChange={(event: SelectChangeEvent) =>
                      setTypeFilter(event.target.value as 'all' | AnnotationHistoryType)
                    }
                    displayEmpty
                    IconComponent={KeyboardArrowDownIcon}
                    sx={filterSelectSx}
                    MenuProps={{
                      slotProps: { paper: { sx: dropdownMenuPaperSx } },
                    }}
                  >
                    {TYPE_FILTER_OPTIONS.map((option) => (
                      <MenuItem key={option.value} value={option.value} sx={{ fontSize: '0.8125rem' }}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl size="small" fullWidth>
                  <Select
                    value={dateRangeFilter}
                    onChange={(event: SelectChangeEvent) =>
                      setDateRangeFilter(event.target.value as DateRangeFilter)
                    }
                    displayEmpty
                    IconComponent={KeyboardArrowDownIcon}
                    sx={{
                      ...filterSelectSx,
                      ...(dateRangeFilter === 'custom'
                        ? {
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: cv.brandPurple,
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                              borderColor: cv.brandPurple,
                            },
                          }
                        : null),
                    }}
                    MenuProps={{
                      slotProps: { paper: { sx: dropdownMenuPaperSx } },
                    }}
                  >
                    {DATE_RANGE_OPTIONS.map((option) => (
                      <MenuItem key={option.value} value={option.value} sx={{ fontSize: '0.8125rem' }}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              {dateRangeFilter === 'custom' ? (
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 1,
                    mt: 0.5,
                  }}
                >
                  <TextField
                    type="date"
                    size="small"
                    label="Start date"
                    value={customStartDate}
                    onChange={(event) => setCustomStartDate(event.target.value)}
                    slotProps={{
                      inputLabel: { shrink: true },
                      htmlInput: {
                        max: customEndDate || undefined,
                      },
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '10px',
                        backgroundColor: cv.surface,
                        fontSize: '0.75rem',
                        '& fieldset': { borderColor: cv.border },
                        '&:hover fieldset': { borderColor: cv.borderStrong },
                        '&.Mui-focused fieldset': { borderColor: cv.brandPurple },
                      },
                      '& .MuiInputLabel-root': {
                        fontSize: '0.75rem',
                        color: cv.textMuted,
                      },
                      '& ::-webkit-calendar-picker-indicator': { cursor: 'pointer' },
                    }}
                  />
                  <TextField
                    type="date"
                    size="small"
                    label="End date"
                    value={customEndDate}
                    onChange={(event) => setCustomEndDate(event.target.value)}
                    slotProps={{
                      inputLabel: { shrink: true },
                      htmlInput: {
                        min: customStartDate || undefined,
                      },
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '10px',
                        backgroundColor: cv.surface,
                        fontSize: '0.75rem',
                        '& fieldset': { borderColor: cv.border },
                        '&:hover fieldset': { borderColor: cv.borderStrong },
                        '&.Mui-focused fieldset': { borderColor: cv.brandPurple },
                      },
                      '& .MuiInputLabel-root': {
                        fontSize: '0.75rem',
                        color: cv.textMuted,
                      },
                      '& ::-webkit-calendar-picker-indicator': { cursor: 'pointer' },
                    }}
                  />
                </Box>
              ) : null}
            </Box>
          ) : null}
        </Box>
      )}

      <Divider sx={{ borderColor: cv.border }} />

      <Box
        role="tabpanel"
        aria-label={DRAWER_TAB_PANEL_LABELS[activeTab]}
        sx={{
          flex: 1,
          overflowY: 'auto',
          px: 1.5,
          py: 0.5,
        }}
      >
        {activeTab === 'history' ? (
          filteredEntries.length === 0 ? (
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <Typography sx={{ fontSize: '0.875rem', color: cv.textMuted }}>
                No annotation history yet
              </Typography>
            </Box>
          ) : (
            filteredEntries.map((entry, index) => (
              <Box key={entry.id}>
                <HistoryEntryRow
                  isActive={entry.id === activeHistoryEntryId}
                  entry={entry}
                  isTimeBasedMedia={isTimeBasedMedia}
                  replies={
                    (() => {
                      const commentId = getCommentIdForEntry(entry);
                      return commentId ? commentById.get(commentId)?.replies ?? [] : [];
                    })()
                  }
                  annotationGroups={annotationGroups}
                  collaborators={collaborators}
                  onEntryClick={onEntryClick}
                  onToggleResolved={onToggleResolved}
                  onTogglePinned={onTogglePinned}
                  onMarkUnread={onMarkUnread}
                  onMarkRead={onMarkRead}
                  onCopyLink={onCopyLink}
                  onDeleteEntry={onDeleteEntry}
                  onEditComment={onEditComment}
                  onVisibilityChange={onVisibilityChange}
                  onCreateAnnotationGroup={onCreateAnnotationGroup}
                  onDeleteAnnotationGroup={onDeleteAnnotationGroup}
                  onUpdateAnnotationGroup={onUpdateAnnotationGroup}
                  onAddCollaborator={onAddCollaborator}
                  onHardDeleteEntry={onHardDeleteEntry}
                  onRestoreEntry={onRestoreEntry}
                />
                {index < filteredEntries.length - 1 && (
                  <Divider sx={{ borderColor: cv.border }} />
                )}
              </Box>
            ))
          )
        ) : activeTab === 'ai' ? (
          aiSubTab === 'summary' ? (
            <Box
              role="tabpanel"
              aria-label="Summary"
              sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 0.75,
                py: 1,
              }}
            >
              {aiEntitled ? (
                <AiSummaryBlock
                  summary={insightsSummary}
                  tags={insightsTags}
                  loading={highlightLoading}
                  error={highlightError}
                  emptyMessage="No AI summary yet."
                />
              ) : (
                <Typography sx={{ fontSize: '0.875rem', color: cv.textMuted }}>
                  AI summary is not available for this organization.
                </Typography>
              )}
            </Box>
          ) : (
            <Box role="tabpanel" aria-label="Transcript">
              <TranscriptPanel
                assetId={mediaItem?.id}
                filterQuery={aiQuery}
                onSeekMs={onTranscriptSeek}
                videoRef={videoRef}
              />
            </Box>
          )
        ) : mediaItem && onTagsChange ? (
          <MediaDetailsPanel
            mediaItem={mediaItem}
            technicalDetails={technicalDetails}
            tags={tags}
            onTagsChange={onTagsChange}
            activeSection={detailsSection}
            onSectionChange={onDetailsSectionChange}
          />
        ) : (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <Typography sx={{ fontSize: '0.875rem', color: cv.textMuted }}>
              Media details unavailable
            </Typography>
          </Box>
        )}
      </Box>
    </>
  );

  const panelShell = (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {panelBody}
    </Box>
  );

  if (!isDesktopPanel) {
    return (
      <Drawer
        anchor="right"
        open={open}
        onClose={onClose}
        slotProps={{
          backdrop: {
            sx: {
              backgroundColor: cv.dialogShadow,
            },
          },
          paper: {
            sx: {
              width: '100%',
              maxWidth: '100vw',
              backgroundColor: cv.bg,
              borderLeft: `1px solid ${cv.border}`,
              boxShadow: cv.dropdownShadow,
            },
          },
          root: {
            sx: {
              zIndex: (drawerTheme) => drawerTheme.zIndex.drawer + 2,
            },
          },
        }}
      >
        {panelShell}
      </Drawer>
    );
  }

  if (!open) return null;

  return (
    <Box
      component="aside"
      aria-label="Media panel"
      sx={{
        width: 380,
        maxWidth: '100%',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        borderRadius: '16px',
        border: '1px solid var(--noah-border)',
        background: drawerSurface,
        backdropFilter: 'blur(24px) saturate(160%)',
        WebkitBackdropFilter: 'blur(24px) saturate(160%)',
        boxShadow:
          cv.popoverShadow,
        position: 'relative',
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1, borderRadius: '16px', overflow: 'hidden' }}>
        {panelShell}
      </Box>

      <Tooltip title="Close panel" arrow placement="left">
        <IconButton
          type="button"
          aria-label="Close panel"
          onClick={onClose}
          sx={{
            position: 'absolute',
            top: 0,
            right: 0,
            transform: 'translate(50%, -50%)',
            zIndex: 2,
            width: 28,
            height: 28,
            color: cv.textSecondary,
            border: '1px solid var(--noah-border)',
            background: 'var(--noah-popover-surface-deep)',
            boxShadow: cv.popoverShadow,
            '&:hover': {
              color: cv.textPrimary,
              backgroundColor: cv.surfaceHover,
            },
          }}
        >
          <CloseOutlinedIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Tooltip>
    </Box>
  );
}

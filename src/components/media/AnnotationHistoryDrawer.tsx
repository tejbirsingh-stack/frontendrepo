import { useMemo, useState } from 'react';
import { cv, palette } from '../../theme/cssVars';
import {
  Avatar,
  Box,
  Divider,
  Drawer,
  IconButton,
  InputAdornment,
  Menu,
  MenuItem,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import ReplayOutlinedIcon from '@mui/icons-material/ReplayOutlined';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import FilterListOutlinedIcon from '@mui/icons-material/FilterListOutlined';
import MoreHorizOutlinedIcon from '@mui/icons-material/MoreHorizOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import { CURRENT_USER } from '../../constants/currentUser';
import type { MediaItem } from '../../data/mockMedia';
import type { AnnotationHistoryEntry, AnnotationHistoryType } from '../../types/annotationHistory';
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

type DrawerTab = 'history' | 'details';

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
  detailsSection?: MediaDetailsSection;
  onDetailsSectionChange?: (section: MediaDetailsSection) => void;
  onClose: () => void;
  onSeekToTimestamp?: (timestamp: number) => void;
  onToggleResolved: (entryId: string) => void;
  onMarkUnread: (entryId: string) => void;
  onCopyLink: (entry: AnnotationHistoryEntry) => void;
  onDeleteEntry: (entryId: string) => void;
  onEditComment?: (commentId: string, text: string) => void;
  annotationGroups: AnnotationAccessGroup[];
  onVisibilityChange: (
    entryId: string,
    visibility: AnnotationVisibility,
    groupId?: string,
  ) => void;
  collaborators: MediaCollaborator[];
  onCreateAnnotationGroup: (name: string, memberIds: string[]) => AnnotationAccessGroup;
  onAddCollaborator?: (name: string, email: string) => MediaCollaborator | null;
}

const DRAWER_TABS: { value: DrawerTab; label: string }[] = [
  { value: 'history', label: 'Annotation History' },
  { value: 'details', label: 'Details' },
];

const FILTER_OPTIONS: { value: 'all' | AnnotationHistoryType; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'comment', label: 'Comments' },
  { value: 'drawing', label: 'Drawings' },
  { value: 'shape', label: 'Shapes' },
  { value: 'stamp', label: 'Stamps' },
];

const drawerSurface = 'var(--noah-drawer-surface)';

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
  replies = [],
  annotationGroups,
  onSeekToTimestamp,
  onToggleResolved,
  onMarkUnread,
  onCopyLink,
  onDeleteEntry,
  onEditComment,
  onVisibilityChange,
  onCreateAnnotationGroup,
  collaborators,
  onAddCollaborator,
}: {
  entry: AnnotationHistoryEntry;
  replies?: CommentReply[];
  onEditComment?: (commentId: string, text: string) => void;
  annotationGroups: AnnotationAccessGroup[];
  collaborators: MediaCollaborator[];
  onSeekToTimestamp?: (timestamp: number) => void;
  onToggleResolved: (entryId: string) => void;
  onMarkUnread: (entryId: string) => void;
  onCopyLink: (entry: AnnotationHistoryEntry) => void;
  onDeleteEntry: (entryId: string) => void;
  onVisibilityChange: (
    entryId: string,
    visibility: AnnotationVisibility,
    groupId?: string,
  ) => void;
  onCreateAnnotationGroup: (name: string, memberIds: string[]) => AnnotationAccessGroup;
  onAddCollaborator?: (name: string, email: string) => MediaCollaborator | null;
}) {
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
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
    entry.author.name === CURRENT_USER.name &&
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

  const handleSeek = () => {
    onSeekToTimestamp?.(entry.videoTimestamp);
  };

  return (
    <Box
      sx={{
        position: 'relative',
        py: 1.5,
        px: 0.5,
        mx: -0.5,
        borderRadius: '10px',
        opacity: isResolved ? 0.62 : 1,
        '&:hover': {
          backgroundColor: cv.surfaceHover,
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
          onAddCollaborator={onAddCollaborator}
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
            onMarkUnread(entry.id);
            setMenuAnchor(null);
          }}
          sx={{ fontSize: '0.875rem', color: cv.textPrimary }}
        >
          Mark as unread
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
        <MenuItem
          onClick={() => {
            onDeleteEntry(entry.id);
            setMenuAnchor(null);
          }}
          sx={{ fontSize: '0.875rem', color: cv.destructive }}
        >
          Delete thread...
        </MenuItem>
      </Menu>

      <Tooltip
        title={onSeekToTimestamp ? `Jump to ${formatVideoTimestamp(entry.videoTimestamp)}` : ''}
        arrow
        placement="top"
        disableHoverListener={!onSeekToTimestamp}
      >
        <Box
          component="button"
          type="button"
          onClick={handleSeek}
          sx={{
            display: 'flex',
            gap: 1.25,
            width: '100%',
            pr: 6.5,
            textAlign: 'left',
            border: 'none',
            background: 'transparent',
            cursor: onSeekToTimestamp ? 'pointer' : 'default',
            p: 0,
            color: 'inherit',
          }}
        >
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

        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography
            sx={{
              fontSize: '0.75rem',
              color: cv.textMuted,
              mb: 0.5,
            }}
          >
            #{entry.index} · {formatVideoTimestamp(entry.videoTimestamp)}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: 0.75, mb: 0.5 }}>
            <Typography
              component="span"
              sx={{ fontSize: '0.875rem', fontWeight: 700, color: cv.textPrimary }}
            >
              {entry.author.name}
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
              color: cv.textSecondary,
              mb: 0.25,
            }}
          >
            {getHistoryTypeLabel(entry.type)}
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
                : entry.type === 'sticky_note'
                  ? 'Sticky note deleted'
                  : entry.type === 'stamp'
                    ? 'Stamp deleted'
                    : entry.type === 'text'
                      ? 'Text deleted'
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
    </Box>
  );
}

export default function AnnotationHistoryDrawer({
  open,
  entries,
  comments = [],
  mediaItem,
  technicalDetails,
  tags = [],
  onTagsChange,
  activeTab: controlledTab,
  onTabChange,
  detailsSection,
  onDetailsSectionChange,
  onClose,
  onSeekToTimestamp,
  onToggleResolved,
  onMarkUnread,
  onCopyLink,
  onDeleteEntry,
  onEditComment,
  annotationGroups,
  collaborators,
  onVisibilityChange,
  onCreateAnnotationGroup,
  onAddCollaborator,
}: AnnotationHistoryDrawerProps) {
  const theme = useTheme();
  const isDesktopPanel = useMediaQuery(theme.breakpoints.up(SIDEBAR_DESKTOP_BREAKPOINT));
  const [internalTab, setInternalTab] = useState<DrawerTab>('history');
  const activeTab = controlledTab ?? internalTab;

  const handleTabChange = (tab: DrawerTab) => {
    if (onTabChange) {
      onTabChange(tab);
    } else {
      setInternalTab(tab);
    }
  };
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | AnnotationHistoryType>('all');
  const [filterOpen, setFilterOpen] = useState(false);

  const commentById = useMemo(
    () => new Map(comments.map((comment) => [comment.id, comment])),
    [comments],
  );

  const filteredEntries = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return [...entries]
      .filter((entry) => {
        if (typeFilter !== 'all' && entry.type !== typeFilter) return false;
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
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [commentById, entries, query, typeFilter]);

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
          {DRAWER_TABS.map((tab) => {
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

        <Tooltip title="Close panel" arrow placement="top">
          <IconButton type="button" aria-label="Close panel" onClick={onClose} sx={{ color: cv.textSecondary }}>
            <CloseOutlinedIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </Tooltip>
      </Box>

      {activeTab === 'history' && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.75,
            px: 1.5,
            pb: 1.25,
          }}
        >
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

          <Tooltip title={filterOpen ? 'Hide filters' : 'Filter by type'} arrow placement="top">
            <IconButton
              type="button"
              aria-label="Filter history"
              aria-expanded={filterOpen}
              onClick={() => setFilterOpen((current) => !current)}
              sx={{ color: cv.textSecondary }}
            >
              <FilterListOutlinedIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </Tooltip>
        </Box>
      )}

      {activeTab === 'history' && filterOpen && (
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 0.75,
            px: 1.5,
            pb: 1,
          }}
        >
          {FILTER_OPTIONS.map((option) => {
            const isActive = typeFilter === option.value;

            return (
              <Tooltip
                key={option.value}
                title={`Show ${option.label.toLowerCase()} annotations`}
                arrow
                placement="top"
              >
                <Box
                  component="button"
                  type="button"
                  onClick={() => setTypeFilter(option.value)}
                  sx={{
                    border: `1px solid ${isActive ? cv.brandPurple : cv.border}`,
                    backgroundColor: isActive ? cv.purpleSelectionHover : 'transparent',
                    color: isActive ? cv.purpleLight : cv.textSecondary,
                    borderRadius: '999px',
                    px: 1.25,
                    py: 0.5,
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  {option.label}
                </Box>
              </Tooltip>
            );
          })}
        </Box>
      )}

      <Divider sx={{ borderColor: cv.border }} />

      <Box
        role="tabpanel"
        aria-label={activeTab === 'history' ? 'Annotation history' : 'Media details'}
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
                  entry={entry}
                  replies={
                    (() => {
                      const commentId = getCommentIdForEntry(entry);
                      return commentId ? commentById.get(commentId)?.replies ?? [] : [];
                    })()
                  }
                  annotationGroups={annotationGroups}
                  collaborators={collaborators}
                  onSeekToTimestamp={onSeekToTimestamp}
                  onToggleResolved={onToggleResolved}
                  onMarkUnread={onMarkUnread}
                  onCopyLink={onCopyLink}
                  onDeleteEntry={onDeleteEntry}
                  onEditComment={onEditComment}
                  onVisibilityChange={onVisibilityChange}
                  onCreateAnnotationGroup={onCreateAnnotationGroup}
                  onAddCollaborator={onAddCollaborator}
                />
                {index < filteredEntries.length - 1 && (
                  <Divider sx={{ borderColor: cv.border }} />
                )}
              </Box>
            ))
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
      aria-label="Annotation history"
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
        overflow: 'hidden',
      }}
    >
      {panelShell}
    </Box>
  );
}

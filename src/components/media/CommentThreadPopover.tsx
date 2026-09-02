import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { cv, palette } from '../../theme/cssVars';
import { getPortalTarget } from '../../utils/portalTarget';
import {
  Avatar,
  Box,
  Divider,
  IconButton,
  InputBase,
  Menu,
  MenuItem,
  Tooltip,
  Typography,
  Popover,
} from '@mui/material';
import MoreHorizOutlinedIcon from '@mui/icons-material/MoreHorizOutlined';
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import ReplayOutlinedIcon from '@mui/icons-material/ReplayOutlined';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import ArrowUpwardRoundedIcon from '@mui/icons-material/ArrowUpwardRounded';
import MoodOutlinedIcon from '@mui/icons-material/MoodOutlined';
import AlternateEmailOutlinedIcon from '@mui/icons-material/AlternateEmailOutlined';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import { floatingPanelMenuSlotProps } from '../../constants/floatingPanel';
import { useActiveUser } from '../../hooks/useActiveUser';
import { formatRelativeTime } from '../../utils/formatRelativeTime';
import type { CommentAuthor, CommentReply } from '../../types/videoComments';
import type { AnnotationAccessGroup, AnnotationVisibility } from '../../types/annotationVisibility';
import type { MediaCollaborator } from '../../types/mediaCollaborator';
import AnnotationVisibilityPicker from './AnnotationVisibilityPicker';
import {
  overlayMultilineFieldSx,
  overlayScrollContainerSx,
} from '../../constants/overlayScroll';
import CommentImageAttachment, { CommentImageError } from './CommentImageAttachment';
import SystemEmojiPicker from './SystemEmojiPicker';
import { readCommentImageFile } from '../../utils/commentImage';
import {
  focusInputAtCursor,
  insertAtSelection,
  readInputSelection,
  type TextSelection,
} from '../../utils/textInsertion';

interface CommentThreadPopoverProps {
  author: CommentAuthor;
  createdAt: number;
  text: string;
  imageUrl?: string;
  replies: CommentReply[];
  resolved?: boolean;
  resolvedAt?: number;
  resolvedBy?: CommentAuthor;
  reopenedAt?: number;
  reopenedBy?: CommentAuthor;
  onClose: () => void;
  onAddReply: (text: string, imageUrl?: string) => void;
  onToggleResolved: () => void;
  onMarkUnread: () => void;
  onCopyLink: () => void;
  onDeleteThread: () => void;
  onEditComment?: (text: string, imageUrl?: string) => void;
  onEditReply?: (replyId: string, text: string, imageUrl?: string) => void;
  visibility?: AnnotationVisibility;
  groupId?: string;
  annotationGroups: AnnotationAccessGroup[];
  collaborators: MediaCollaborator[];
  onVisibilityChange: (visibility: AnnotationVisibility, groupId?: string) => void;
  onCreateAnnotationGroup: (name: string, memberIds: string[]) => AnnotationAccessGroup;
  onUpdateAnnotationGroup?: (groupId: string, name: string, memberIds: string[]) => Promise<AnnotationAccessGroup | null | undefined>;
  onAddCollaborator?: (name: string, email: string) => MediaCollaborator | null;
}

const menuPaperSx = {
  mt: 0.5,
  minWidth: 168,
  borderRadius: '12px',
  border: `1px solid ${cv.inkOverlay12}`,
  background: 'var(--noah-popover-surface-deep)',
  backdropFilter: 'blur(20px)',
  boxShadow: cv.dropdownShadow,
};

const headerIconSx = {
  width: 32,
  height: 32,
  color: cv.dialogShadow,
  '&:hover': {
    backgroundColor: cv.inkOverlay06,
    color: cv.inkOverlay80,
  },
};

const actionIconSx = {
  width: 34,
  height: 34,
  color: cv.backdropScrimStrong,
  '&:hover': {
    backgroundColor: cv.inkOverlay06,
    color: cv.inkOverlay88,
  },
};

function AuthorAvatar({
  author,
  size = 36,
}: {
  author: CommentAuthor;
  size?: number;
}) {
  return (
    <Avatar
      src={author.avatarUrl}
      alt=""
      sx={{
        width: size,
        height: size,
        flexShrink: 0,
        fontSize: '0.8125rem',
        fontWeight: 600,
        background: cv.brandGradient,
      }}
    >
      {!author.avatarUrl ? author.initials : null}
    </Avatar>
  );
}

type ThreadTimelineItem =
  | { kind: 'reply'; createdAt: number; reply: CommentReply }
  | { kind: 'reopened'; createdAt: number; by: CommentAuthor }
  | { kind: 'resolved'; createdAt: number; by: CommentAuthor };

function buildThreadTimeline(
  replies: CommentReply[],
  resolved: boolean,
  resolvedAt?: number,
  resolvedBy?: CommentAuthor,
  reopenedAt?: number,
  reopenedBy?: CommentAuthor,
): ThreadTimelineItem[] {
  const items: ThreadTimelineItem[] = replies.map((reply) => ({
    kind: 'reply',
    createdAt: reply.createdAt,
    reply,
  }));

  if (resolved && resolvedAt != null && resolvedBy) {
    items.push({ kind: 'resolved', createdAt: resolvedAt, by: resolvedBy });
  } else if (!resolved && reopenedAt != null && reopenedBy) {
    items.push({ kind: 'reopened', createdAt: reopenedAt, by: reopenedBy });
  }

  return items.sort((a, b) => a.createdAt - b.createdAt);
}

function ThreadStatusLine({
  variant,
  by,
  createdAt,
}: {
  variant: 'reopened' | 'resolved';
  by: CommentAuthor;
  createdAt: number;
}) {
  const isReopened = variant === 'reopened';

  return (
    <Typography
      sx={{
        fontSize: '0.8125rem',
        lineHeight: 1.4,
        color: isReopened ? palette.red : cv.successDark,
      }}
    >
      {isReopened ? 'Reopened' : 'Resolved'} by {by.name} · {formatRelativeTime(createdAt)}
    </Typography>
  );
}

function CommentMessage({
  author,
  createdAt,
  text,
  imageUrl,
  showActions = false,
  showAvatar = true,
  editable = false,
  isEditing = false,
  scrollAnchorId,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
}: {
  author: CommentAuthor;
  createdAt: number;
  text: string;
  imageUrl?: string;
  showActions?: boolean;
  showAvatar?: boolean;
  editable?: boolean;
  isEditing?: boolean;
  scrollAnchorId?: string;
  onStartEdit?: () => void;
  onSaveEdit?: (text: string, imageUrl?: string) => void;
  onCancelEdit?: () => void;
}) {
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [editText, setEditText] = useState(text);

  useEffect(() => {
    if (!isEditing) {
      setEditText(text);
    }
  }, [isEditing, text]);

  const canSaveEdit = Boolean(editText.trim() || imageUrl);

  return (
    <Box
      id={scrollAnchorId}
      sx={{ display: 'flex', alignItems: 'flex-start', gap: showAvatar ? 1.25 : 0 }}
    >
      {showAvatar && <AuthorAvatar author={author} />}

      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.75,
            mb: 0.5,
          }}
        >
          <Typography
            component="span"
            sx={{
              fontSize: '0.9375rem',
              fontWeight: 700,
              color: palette.black,
              lineHeight: 1.3,
            }}
          >
            {author.name}
          </Typography>
          <Typography
            component="time"
            dateTime={new Date(createdAt).toISOString()}
            sx={{
              fontSize: '0.8125rem',
              color: cv.dropdownShadow,
              lineHeight: 1.3,
            }}
          >
            {formatRelativeTime(createdAt)}
          </Typography>
          <Box sx={{ flex: 1 }} />
          {showActions && editable && !isEditing ? (
            <>
              <Tooltip title="More options" arrow placement="top">
                <IconButton
                  type="button"
                  aria-label="Comment options"
                  aria-haspopup="menu"
                  aria-expanded={Boolean(menuAnchor)}
                  size="small"
                  onClick={(event) => {
                    event.stopPropagation();
                    setMenuAnchor(event.currentTarget);
                  }}
                  sx={{
                    width: 28,
                    height: 28,
                    color: cv.dropdownShadow,
                    '&:hover': { backgroundColor: cv.inkOverlay06 },
                  }}
                >
                  <MoreHorizOutlinedIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
              <Menu
                container={getPortalTarget}
                anchorEl={menuAnchor}
                open={Boolean(menuAnchor)}
                onClose={() => setMenuAnchor(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                slotProps={{
                  ...floatingPanelMenuSlotProps,
                  paper: { sx: menuPaperSx },
                }}
              >
                <MenuItem
                  onClick={() => {
                    onStartEdit?.();
                    setMenuAnchor(null);
                  }}
                  sx={{ fontSize: '0.875rem', color: cv.textPrimary }}
                >
                  Edit
                </MenuItem>
              </Menu>
            </>
          ) : null}
        </Box>

        {isEditing ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <InputBase
              autoFocus
              value={editText}
              onChange={(event) => setEditText(event.target.value)}
              onKeyDown={(event) => {
                event.stopPropagation();
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  if (canSaveEdit) {
                    onSaveEdit?.(editText.trim(), imageUrl);
                  }
                }
              }}
              multiline
              minRows={2}
              aria-label="Edit comment"
              sx={{
                width: '100%',
                fontSize: '0.9375rem',
                color: palette.black,
                backgroundColor: cv.inkOverlay04,
                borderRadius: '10px',
                px: 1.25,
                py: 1,
                ...overlayMultilineFieldSx,
                '& textarea': {
                  lineHeight: 1.45,
                  ...overlayMultilineFieldSx['& textarea'],
                },
              }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
              <Tooltip title="Cancel editing" arrow placement="top">
                <Box
                  component="button"
                  type="button"
                  onClick={() => onCancelEdit?.()}
                  sx={{
                    border: 'none',
                    background: 'transparent',
                    color: cv.dialogShadow,
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    px: 0.5,
                    py: 0.25,
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
                    disabled={!canSaveEdit}
                    onClick={() => onSaveEdit?.(editText.trim(), imageUrl)}
                    sx={{
                      border: 'none',
                      background: 'transparent',
                      color: canSaveEdit ? cv.brandBlue : cv.inkOverlay28,
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                      cursor: canSaveEdit ? 'pointer' : 'default',
                      px: 0.5,
                      py: 0.25,
                    }}
                  >
                    Save
                  </Box>
                </span>
              </Tooltip>
            </Box>
          </Box>
        ) : text ? (
          <Typography
            sx={{
              fontSize: '0.9375rem',
              lineHeight: 1.45,
              color: palette.black,
              wordBreak: 'break-word',
              whiteSpace: 'pre-wrap',
            }}
          >
            {text}
          </Typography>
        ) : null}

        {!isEditing && imageUrl ? (
          <CommentImageAttachment src={imageUrl} alt="Comment attachment" />
        ) : null}
      </Box>
    </Box>
  );
}

export default function CommentThreadPopover({
  author,
  createdAt,
  text = '',
  imageUrl,
  replies,
  resolved = false,
  resolvedAt,
  resolvedBy,
  reopenedAt,
  reopenedBy,
  onClose,
  onAddReply,
  onToggleResolved,
  onMarkUnread,
  onCopyLink,
  onDeleteThread,
  onEditComment,
  onEditReply,
  visibility,
  groupId,
  annotationGroups,
  collaborators,
  onVisibilityChange,
  onCreateAnnotationGroup,
  onUpdateAnnotationGroup,
  onAddCollaborator,
}: CommentThreadPopoverProps) {
  const activeUser = useActiveUser();
  const replyInputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const savedSelectionRef = useRef<TextSelection | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replyImageUrl, setReplyImageUrl] = useState<string | null>(null);
  const [replyImageError, setReplyImageError] = useState<string | null>(null);
  const [isReplyFocused, setIsReplyFocused] = useState(false);
  const threadBodyRef = useRef<HTMLDivElement>(null);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [editingTarget, setEditingTarget] = useState<'comment' | string | null>(null);
  const [emojiPickerAnchor, setEmojiPickerAnchor] = useState<HTMLElement | null>(null);
  const emojiPickerOpen = Boolean(emojiPickerAnchor);

  const [mentionSearchText, setMentionSearchText] = useState<string | null>(null);
  const [mentionActiveIndex, setMentionActiveIndex] = useState(0);

  const mentionSuggestions = useMemo(() => {
    if (mentionSearchText === null) return [];
    const query = mentionSearchText.toLowerCase();
    return (collaborators || []).filter(
      (c) =>
        (c.name.toLowerCase().includes(query) || (c.email?.toLowerCase().includes(query) ?? false)) &&
        !c.isCurrentUser
    );
  }, [mentionSearchText, collaborators]);

  useEffect(() => {
    setMentionActiveIndex(0);
  }, [mentionSearchText]);

  const selectMention = (collaborator: MediaCollaborator) => {
    if (!replyInputRef.current) return;
    const cursor = replyInputRef.current.selectionStart || replyText.length;
    const textBeforeCursor = replyText.slice(0, cursor);
    const lastAtSymbolIndex = textBeforeCursor.lastIndexOf('@');
    if (lastAtSymbolIndex !== -1) {
      const nextValue =
        replyText.slice(0, lastAtSymbolIndex) +
        `@${collaborator.name} ` +
        replyText.slice(cursor);
      setReplyText(nextValue);
      setMentionSearchText(null);
      
      const newCursorPos = lastAtSymbolIndex + collaborator.name.length + 2;
      requestAnimationFrame(() => {
        focusInputAtCursor(replyInputRef.current, newCursorPos);
      });
    }
  };

  const handleReplyTextChange = (value: string) => {
    setReplyText(value);
    
    requestAnimationFrame(() => {
      if (!replyInputRef.current) return;
      const cursor = replyInputRef.current.selectionStart || 0;
      const textBeforeCursor = value.slice(0, cursor);
      const lastAtSymbolIndex = textBeforeCursor.lastIndexOf('@');
      
      if (lastAtSymbolIndex !== -1 && !textBeforeCursor.slice(lastAtSymbolIndex).includes(' ')) {
        const query = textBeforeCursor.slice(lastAtSymbolIndex + 1);
        setMentionSearchText(query);
      } else {
        setMentionSearchText(null);
      }
    });
  };

  const canEditComment =
    !resolved && author.name === activeUser.name && Boolean(onEditComment);

  const beginEditing = useCallback((target: 'comment' | string) => {
    setEditingTarget(target);
    requestAnimationFrame(() => {
      const anchorId = target === 'comment' ? 'thread-comment' : `thread-reply-${target}`;
      if (target === 'comment') {
        threadBodyRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      }
      document.getElementById(anchorId)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    });
  }, []);

  const canSubmitReply = Boolean(replyText.trim() || replyImageUrl);
  const showExpandedReplyEditor =
    isReplyFocused || replyText.length > 0 || Boolean(replyImageUrl);

  const threadTimeline = useMemo(
    () =>
      buildThreadTimeline(
        replies,
        Boolean(resolved),
        resolvedAt,
        resolvedBy,
        reopenedAt,
        reopenedBy,
      ),
    [replies, resolved, resolvedAt, resolvedBy, reopenedAt, reopenedBy],
  );

  const focusReplyInput = useCallback(() => {
    setIsReplyFocused(true);
    requestAnimationFrame(() => {
      replyInputRef.current?.focus({ preventScroll: true });
    });
  }, []);

  useEffect(() => {
    if (resolved) {
      setReplyText('');
      setReplyImageUrl(null);
      setReplyImageError(null);
      setIsReplyFocused(false);
      return;
    }

    focusReplyInput();
  }, [focusReplyInput, resolved]);

  const handleReplyAreaMouseDown = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    const target = event.target as HTMLElement;
    if (target.closest('button')) return;
    if (target.closest('input, textarea')) return;

    event.preventDefault();
    focusReplyInput();
  };

  const handleSubmitReply = () => {
    if (!canSubmitReply) return;
    onAddReply(replyText.trim(), replyImageUrl ?? undefined);
    setReplyText('');
    setReplyImageUrl(null);
    setReplyImageError(null);
    setIsReplyFocused(false);
    replyInputRef.current?.focus();
  };

  const insertAtCursor = (
    value: string,
    selection = readInputSelection(replyInputRef.current, replyText.length),
  ) => {
    const { nextValue, cursor } = insertAtSelection(replyText, value, selection);
    setReplyText(nextValue);
    focusInputAtCursor(replyInputRef.current, cursor);
  };

  const openEmojiPicker = (anchor: HTMLElement) => {
    savedSelectionRef.current = readInputSelection(replyInputRef.current, replyText.length);
    setIsReplyFocused(true);
    setEmojiPickerAnchor(anchor);
  };

  const handleMention = () => {
    setIsReplyFocused(true);
    insertAtCursor('@');
    setMentionSearchText('');
  };

  const handleEmojiSelect = (emoji: string) => {
    setIsReplyFocused(true);
    insertAtCursor(
      emoji,
      savedSelectionRef.current ?? readInputSelection(replyInputRef.current, replyText.length),
    );
    savedSelectionRef.current = null;
    setEmojiPickerAnchor(null);
  };

  const emojiButton = (
    <Tooltip title="Add emoji">
      <IconButton
        type="button"
        aria-label="Add emoji"
        aria-expanded={emojiPickerOpen}
        onMouseDown={(event) => event.preventDefault()}
        onClick={(event) => openEmojiPicker(event.currentTarget)}
        sx={actionIconSx}
      >
        <MoodOutlinedIcon sx={{ fontSize: 20 }} />
      </IconButton>
    </Tooltip>
  );

  const handleImageSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) return;

    setIsReplyFocused(true);
    setReplyImageError(null);

    try {
      const dataUrl = await readCommentImageFile(file);
      setReplyImageUrl(dataUrl);
    } catch (error) {
      setReplyImageError(error instanceof Error ? error.message : 'Could not attach image.');
    }
  };

  const imageButton = (
    <Tooltip title="Attach image">
      <IconButton
        type="button"
        aria-label="Attach image"
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => fileInputRef.current?.click()}
        sx={actionIconSx}
      >
        <ImageOutlinedIcon sx={{ fontSize: 20 }} />
      </IconButton>
    </Tooltip>
  );

  const handleReplyKeyDown = (event: React.KeyboardEvent) => {
    event.stopPropagation();
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSubmitReply();
    }
  };

  const handleReplyKeyDownNav = (event: React.KeyboardEvent) => {
    const isPopoverOpen = mentionSearchText !== null && mentionSuggestions.length > 0;
    
    if (isPopoverOpen) {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setMentionActiveIndex((prev) => (prev + 1) % mentionSuggestions.length);
        return;
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setMentionActiveIndex((prev) => (prev - 1 + mentionSuggestions.length) % mentionSuggestions.length);
        return;
      }
      if (event.key === 'Enter') {
        event.preventDefault();
        selectMention(mentionSuggestions[mentionActiveIndex]);
        return;
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        setMentionSearchText(null);
        return;
      }
    }
    
    handleReplyKeyDown(event);
  };

  return (
    <Box
      role="dialog"
      aria-label="Comment thread"
      data-comment-thread
      onClick={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
      sx={{
        width: '100%',
        maxWidth: '100%',
        maxHeight: 'inherit',
        borderRadius: '16px',
        backgroundColor: cv.textInverse,
        boxShadow: cv.commentCardShadow,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        animation: 'commentThreadIn 0.18s ease-out',
        '@keyframes commentThreadIn': {
          from: { opacity: 0, transform: 'translateY(6px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 1.5,
          pt: 1.25,
          pb: 1,
          flexShrink: 0,
        }}
      >
        <Typography
          sx={{
            fontSize: '1rem',
            fontWeight: 600,
            color: palette.black,
          }}
        >
          Comment
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
          <AnnotationVisibilityPicker
            visibility={visibility}
            groupId={groupId}
            groups={annotationGroups}
            collaborators={collaborators}
            onChange={onVisibilityChange}
            onCreateGroup={onCreateAnnotationGroup}
            onUpdateGroup={onUpdateAnnotationGroup}
            onAddCollaborator={onAddCollaborator}
            variant="light"
            size="medium"
            elevated
          />

          <Tooltip title="More options" arrow placement="top">
            <IconButton
              type="button"
              aria-label="More options"
              aria-haspopup="menu"
              aria-expanded={Boolean(menuAnchor)}
              onClick={(event) => {
                event.stopPropagation();
                setMenuAnchor(event.currentTarget);
              }}
              sx={headerIconSx}
            >
              <MoreHorizOutlinedIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </Tooltip>

          <Menu
            container={getPortalTarget}
            anchorEl={menuAnchor}
            open={Boolean(menuAnchor)}
            onClose={() => setMenuAnchor(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            slotProps={{
              ...floatingPanelMenuSlotProps,
              paper: { sx: menuPaperSx },
            }}
          >
            {canEditComment ? (
              <MenuItem
                onClick={() => {
                  beginEditing('comment');
                  setMenuAnchor(null);
                }}
                sx={{ fontSize: '0.875rem', color: cv.textPrimary }}
              >
                Edit
              </MenuItem>
            ) : null}
            <MenuItem
              onClick={() => {
                onToggleResolved();
                setMenuAnchor(null);
              }}
              sx={{
                fontSize: '0.875rem',
                color: resolved ? palette.redLight : cv.textPrimary,
              }}
            >
              {resolved ? 'Reopen' : 'Mark as Resolved'}
            </MenuItem>
            <MenuItem
              onClick={() => {
                onMarkUnread();
                setMenuAnchor(null);
              }}
              sx={{ fontSize: '0.875rem', color: cv.textPrimary }}
            >
              Mark as unread
            </MenuItem>
            <MenuItem
              onClick={() => {
                onCopyLink();
                setMenuAnchor(null);
              }}
              sx={{ fontSize: '0.875rem', color: cv.textPrimary }}
            >
              Copy link
            </MenuItem>
            {author.name === activeUser.name ? (
              <MenuItem
                onClick={() => {
                  onDeleteThread();
                  setMenuAnchor(null);
                }}
                sx={{ fontSize: '0.875rem', color: palette.redLight }}
              >
                Archive
              </MenuItem>
            ) : null}
          </Menu>
          <Tooltip
            title={resolved ? 'Reopen' : 'Mark as Resolved'}
            arrow
            placement="top"
          >
            <IconButton
              type="button"
              aria-label={resolved ? 'Reopen' : 'Mark as Resolved'}
              aria-pressed={resolved}
              onClick={(event) => {
                event.stopPropagation();
                onToggleResolved();
              }}
              sx={{
                ...headerIconSx,
                color: resolved ? cv.brandPurple : cv.dialogShadow,
                '&:hover': {
                  backgroundColor: resolved ? cv.purpleSelectionSoft : cv.inkOverlay06,
                  color: resolved ? cv.brandPurpleDark : cv.inkOverlay80,
                },
              }}
            >
              {resolved ? (
                <ReplayOutlinedIcon sx={{ fontSize: 20 }} />
              ) : (
                <CheckCircleOutlineOutlinedIcon sx={{ fontSize: 20 }} />
              )}
            </IconButton>
          </Tooltip>
          <Tooltip title="Close" arrow placement="top">
            <IconButton type="button" aria-label="Close comment" onClick={onClose} sx={headerIconSx}>
              <CloseOutlinedIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Divider sx={{ borderColor: cv.inkOverlay08, flexShrink: 0 }} />

      <Box
        ref={threadBodyRef}
        sx={{
          px: 1.5,
          py: 1.5,
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5,
          flex: 1,
          minHeight: 0,
          ...overlayScrollContainerSx,
        }}
      >
        <CommentMessage
          author={author}
          createdAt={createdAt}
          text={text}
          imageUrl={imageUrl}
          showActions
          editable={canEditComment}
          scrollAnchorId="thread-comment"
          isEditing={editingTarget === 'comment'}
          onStartEdit={() => beginEditing('comment')}
          onCancelEdit={() => setEditingTarget(null)}
          onSaveEdit={(nextText, nextImageUrl) => {
            onEditComment?.(nextText, nextImageUrl);
            setEditingTarget(null);
          }}
        />

        {threadTimeline.map((item) => {
          if (item.kind === 'reply') {
            const canEditReply =
              !resolved &&
              item.reply.author.name === activeUser.name &&
              Boolean(onEditReply);

            return (
              <CommentMessage
                key={item.reply.id}
                author={item.reply.author}
                createdAt={item.reply.createdAt}
                text={item.reply.text}
                imageUrl={item.reply.imageUrl}
                showActions={canEditReply}
                editable={canEditReply}
                scrollAnchorId={`thread-reply-${item.reply.id}`}
                isEditing={editingTarget === item.reply.id}
                onStartEdit={() => beginEditing(item.reply.id)}
                onCancelEdit={() => setEditingTarget(null)}
                onSaveEdit={(nextText, nextImageUrl) => {
                  onEditReply?.(item.reply.id, nextText, nextImageUrl);
                  setEditingTarget(null);
                }}
              />
            );
          }

          return (
            <ThreadStatusLine
              key={`${item.kind}-${item.createdAt}`}
              variant={item.kind}
              by={item.by}
              createdAt={item.createdAt}
            />
          );
        })}
      </Box>

      {!resolved && (
      <Box
        data-comment-reply-editor
        onMouseDown={handleReplyAreaMouseDown}
        sx={{
          display: 'flex',
          alignItems: showExpandedReplyEditor ? 'flex-start' : 'center',
          gap: 1.25,
          px: 1.5,
          pb: 1.5,
          cursor: 'text',
          flexShrink: 0,
        }}
      >
        <AuthorAvatar
          author={{
            name: activeUser.name,
            avatarUrl: activeUser.avatarUrl,
            initials: activeUser.initials,
          }}
          size={32}
        />

        <Box
          onMouseDown={handleReplyAreaMouseDown}
          sx={{
            flex: 1,
            minWidth: 0,
            backgroundColor: cv.inkOverlay06,
            borderRadius: showExpandedReplyEditor ? '16px' : '999px',
            overflow: 'hidden',
            transition: 'border-radius 0.2s ease',
            cursor: 'text',
            ...(showExpandedReplyEditor
              ? {
                  pl: 1.5,
                  pr: 1.25,
                  pt: 1.25,
                  pb: 0.75,
                }
              : {
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.75,
                  pl: 1.5,
                  pr: 0.75,
                  py: 0.5,
                }),
          }}
        >
          <InputBase
            inputRef={replyInputRef}
            autoFocus
            value={replyText}
            onChange={(event) => handleReplyTextChange(event.target.value)}
            onFocus={() => setIsReplyFocused(true)}
            onBlur={() => {
              if (!replyText.trim()) {
                setIsReplyFocused(false);
              }
            }}
            onKeyDown={handleReplyKeyDownNav}
            placeholder="Reply"
            aria-label="Reply to comment"
            multiline={showExpandedReplyEditor}
            minRows={showExpandedReplyEditor ? 2 : 1}
            sx={{
              width: '100%',
              fontSize: '0.9375rem',
              color: palette.black,
              alignItems: showExpandedReplyEditor ? 'flex-start' : 'center',
              ...overlayMultilineFieldSx,
              '& textarea, & input': {
                py: showExpandedReplyEditor ? 0 : 0.5,
                px: 0,
                lineHeight: 1.5,
                ...(showExpandedReplyEditor
                  ? {
                      ...overlayMultilineFieldSx['& textarea'],
                      maxHeight: 'min(160px, calc(100dvh - 420px))',
                    }
                  : { resize: 'none' }),
                '&::placeholder': {
                  color: cv.inkOverlay38,
                  opacity: 1,
                },
              },
            }}
          />

          {showExpandedReplyEditor && replyImageUrl ? (
            <CommentImageAttachment
              src={replyImageUrl}
              alt="Attached reply image"
              variant="editor"
              onRemove={() => {
                setReplyImageError(null);
                setReplyImageUrl(null);
              }}
            />
          ) : null}

          {replyImageError ? <CommentImageError message={replyImageError} /> : null}

          {showExpandedReplyEditor ? (
            <>
              <Divider sx={{ my: 1, borderColor: cv.inkOverlay08 }} />

              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 1,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                  {emojiButton}

                  <Tooltip title="Mention someone">
                    <IconButton
                      type="button"
                      aria-label="Mention someone"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={handleMention}
                      sx={actionIconSx}
                    >
                      <AlternateEmailOutlinedIcon sx={{ fontSize: 20 }} />
                    </IconButton>
                  </Tooltip>

                  {imageButton}
                </Box>

                <Tooltip title="Send reply" arrow placement="top">
                  <span>
                    <IconButton
                      type="button"
                      aria-label="Submit reply"
                      disabled={!canSubmitReply}
                      onClick={handleSubmitReply}
                      sx={{
                        width: 36,
                        height: 36,
                        flexShrink: 0,
                        backgroundColor: canSubmitReply ? cv.brandPurple : cv.inkOverlay08,
                        color: canSubmitReply ? cv.textInverse : cv.inkOverlay35,
                        transition: 'background-color 0.2s ease, color 0.2s ease',
                        '&:hover': {
                          backgroundColor: canSubmitReply ? cv.brandPurpleDark : cv.inkOverlay12,
                        },
                        '&.Mui-disabled': {
                          backgroundColor: cv.inkOverlay08,
                          color: cv.inkOverlay35,
                        },
                      }}
                    >
                      <ArrowUpwardRoundedIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </span>
                </Tooltip>
              </Box>
            </>
          ) : (
            <>
              {emojiButton}
              {imageButton}
              <Tooltip title="Send reply" arrow placement="top">
                <span>
                  <IconButton
                    type="button"
                    aria-label="Submit reply"
                    disabled={!canSubmitReply}
                    onClick={handleSubmitReply}
                    sx={{
                      width: 30,
                      height: 30,
                      flexShrink: 0,
                      backgroundColor: canSubmitReply ? cv.brandPurple : cv.inkOverlay10,
                      color: canSubmitReply ? cv.textInverse : cv.inkOverlay35,
                      '&:hover': {
                        backgroundColor: canSubmitReply ? cv.brandPurpleDark : cv.inkOverlay14,
                      },
                      '&.Mui-disabled': {
                        backgroundColor: cv.inkOverlay10,
                        color: cv.inkOverlay35,
                      },
                    }}
                  >
                    <ArrowUpwardRoundedIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </span>
              </Tooltip>
            </>
          )}
        </Box>
      </Box>
      )}

      {resolved && (
        <Box sx={{ px: 1.5, pb: 1.5 }}>
          <Typography sx={{ fontSize: '0.8125rem', color: cv.dropdownShadow }}>
            This thread is resolved. Reopen it to add more replies.
          </Typography>
        </Box>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={handleImageSelect}
      />

      <SystemEmojiPicker
        open={emojiPickerOpen}
        anchorEl={emojiPickerAnchor}
        insertMode
        elevated
        onClose={() => {
          savedSelectionRef.current = null;
          setEmojiPickerAnchor(null);
        }}
        onEmojiSelect={handleEmojiSelect}
      />

      <Popover
        container={getPortalTarget}
        open={mentionSearchText !== null && mentionSuggestions.length > 0}
        anchorEl={replyInputRef.current}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        disableAutoFocus
        disableEnforceFocus
        disableRestoreFocus
        slotProps={{
          root: {
            sx: {
              zIndex: 1600,
            },
          },
          paper: {
            sx: {
              mt: 0.5,
              width: 240,
              borderRadius: '12px',
              border: '1px solid var(--noah-border)',
              backgroundColor: cv.elevatedSurface,
              boxShadow: cv.dropdownShadow,
              overflow: 'hidden',
            },
          },
        }}
      >
        <Box sx={{ maxHeight: 200, overflowY: 'auto', p: 1 }}>
          {mentionSuggestions.map((c, index) => {
            const highlighted = index === mentionActiveIndex;
            return (
              <Box
                key={c.id}
                role="option"
                aria-selected={highlighted}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => selectMention(c)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.25,
                  px: 1.25,
                  py: 1,
                  cursor: 'pointer',
                  borderRadius: '8px',
                  backgroundColor: highlighted ? cv.surfaceHover : 'transparent',
                  '&:hover': {
                    backgroundColor: cv.surfaceHover,
                  },
                }}
              >
                <Box
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    backgroundColor: c.avatarColor || cv.brandPurple,
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                  }}
                >
                  {c.initials}
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography noWrap sx={{ fontSize: '0.8125rem', fontWeight: 600, color: cv.textPrimary }}>
                    {c.name}
                  </Typography>
                  <Typography noWrap sx={{ fontSize: '0.75rem', color: cv.textMuted }}>
                    {c.email}
                  </Typography>
                </Box>
              </Box>
            );
          })}
        </Box>
      </Popover>
    </Box>
  );
}

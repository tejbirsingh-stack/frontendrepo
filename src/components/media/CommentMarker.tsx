import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { cv } from '../../theme/cssVars';
import { createPortal } from 'react-dom';
import { getPortalTarget } from '../../utils/portalTarget';
import {
  Box,
  Divider,
  IconButton,
  InputBase,
  Tooltip,
  Popover,
  Typography,
} from '@mui/material';
import ArrowUpwardRoundedIcon from '@mui/icons-material/ArrowUpwardRounded';
import MoodOutlinedIcon from '@mui/icons-material/MoodOutlined';
import AlternateEmailOutlinedIcon from '@mui/icons-material/AlternateEmailOutlined';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import CommentAvatarPin from './CommentAvatarPin';
import CommentHoverCard from './CommentHoverCard';
import CommentImageAttachment, { CommentImageError } from './CommentImageAttachment';
import CommentPin from './CommentPin';
import CommentThreadPopover from './CommentThreadPopover';
import SystemEmojiPicker from './SystemEmojiPicker';
import { readCommentImageFile } from '../../utils/commentImage';
import type { CommentAuthor, CommentReply } from '../../types/videoComments';
import type { AnnotationAccessGroup, AnnotationVisibility } from '../../types/annotationVisibility';
import type { MediaCollaborator } from '../../types/mediaCollaborator';
import {
  OVERLAY_CONTENT_MAX_HEIGHT,
  OVERLAY_PANEL_MAX_HEIGHT,
  overlayMultilineFieldSx,
} from '../../constants/overlayScroll';
import {
  useDraftCommentPanelPosition,
  useFloatingPanelPosition,
} from '../../hooks/useFloatingPanelPosition';
import {
  focusInputAtCursor,
  insertAtSelection,
  readInputSelection,
  type TextSelection,
} from '../../utils/textInsertion';

interface CommentMarkerProps {
  index?: number;
  xPercent: number;
  yPercent: number;
  mode: 'draft' | 'placed';
  text: string;
  imageUrl?: string;
  author?: CommentAuthor;
  createdAt?: number;
  replies?: CommentReply[];
  resolved?: boolean;
  resolvedAt?: number;
  resolvedBy?: CommentAuthor;
  reopenedAt?: number;
  reopenedBy?: CommentAuthor;
  isThreadOpen?: boolean;
  onOpenThread?: () => void;
  onCloseThread?: () => void;
  onAddReply?: (text: string, imageUrl?: string) => void;
  onToggleResolved?: () => void;
  onMarkUnread?: () => void;
  onCopyLink?: () => void;
  onDeleteThread?: () => void;
  onEditComment?: (text: string, imageUrl?: string) => void;
  onEditReply?: (replyId: string, text: string, imageUrl?: string) => void;
  visibility?: AnnotationVisibility;
  groupId?: string;
  annotationGroups?: AnnotationAccessGroup[];
  collaborators?: MediaCollaborator[];
  onVisibilityChange?: (visibility: AnnotationVisibility, groupId?: string) => void;
  onCreateAnnotationGroup?: (name: string, memberIds: string[]) => AnnotationAccessGroup;
  onUpdateAnnotationGroup?: (groupId: string, name: string, memberIds: string[]) => Promise<AnnotationAccessGroup | null | undefined>;
  onAddCollaborator?: (name: string, email: string) => MediaCollaborator | null;
  onTextChange?: (text: string) => void;
  onImageChange?: (imageUrl: string | null) => void;
  onSubmit?: () => void;
  onCancel?: () => void;
  placeholder?: string;
  requireText?: boolean;
  panMode?: boolean;
  overlayRef?: RefObject<HTMLElement | null>;
  onPositionChange?: (xPercent: number, yPercent: number) => void;
  onPanActionStart?: () => void;
}

const actionIconSx = {
  width: 34,
  height: 34,
  color: cv.backdropScrimStrong,
  '&:hover': {
    backgroundColor: cv.inkOverlay06,
    color: cv.inkOverlay88,
  },
};

export default function CommentMarker({
  index,
  xPercent,
  yPercent,
  mode,
  text = '',
  imageUrl,
  author,
  createdAt,
  replies = [],
  resolved = false,
  resolvedAt,
  resolvedBy,
  reopenedAt,
  reopenedBy,
  isThreadOpen = false,
  onOpenThread,
  onCloseThread,
  onAddReply,
  onToggleResolved,
  onMarkUnread,
  onCopyLink,
  onDeleteThread,
  onEditComment,
  onEditReply,
  visibility,
  groupId,
  annotationGroups = [],
  collaborators = [],
  onVisibilityChange,
  onCreateAnnotationGroup,
  onUpdateAnnotationGroup,
  onAddCollaborator,
  onTextChange,
  onImageChange,
  onSubmit,
  onCancel,
  placeholder = 'Add a comment',
  requireText = false,
  panMode = false,
  overlayRef,
  onPositionChange,
  onPanActionStart,
}: CommentMarkerProps) {
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pinRef = useRef<HTMLButtonElement>(null);
  const draftAnchorRef = useRef<HTMLDivElement>(null);
  const savedSelectionRef = useRef<TextSelection | null>(null);
  const panDragRef = useRef<{
    startPointer: { xPercent: number; yPercent: number };
    origin: { xPercent: number; yPercent: number };
  } | null>(null);
  const [isExpanded, setIsExpanded] = useState(requireText);
  const [isHovered, setIsHovered] = useState(false);
  const [isPanDragging, setIsPanDragging] = useState(false);
  const [emojiPickerAnchor, setEmojiPickerAnchor] = useState<HTMLElement | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const emojiPickerOpen = Boolean(emojiPickerAnchor);

  const [mentionSearchText, setMentionSearchText] = useState<string | null>(null);
  const [mentionActiveIndex, setMentionActiveIndex] = useState(0);

  const mentionSuggestions = useMemo(() => {
    if (mentionSearchText === null) return [];
    const query = mentionSearchText.toLowerCase();
    return collaborators.filter(
      (c) =>
        (c.name.toLowerCase().includes(query) || (c.email?.toLowerCase().includes(query) ?? false)) &&
        !c.isCurrentUser
    );
  }, [mentionSearchText, collaborators]);

  useEffect(() => {
    setMentionActiveIndex(0);
  }, [mentionSearchText]);

  const selectMention = (collaborator: MediaCollaborator) => {
    if (!inputRef.current) return;
    const cursor = inputRef.current.selectionStart || text.length;
    const textBeforeCursor = text.slice(0, cursor);
    const lastAtSymbolIndex = textBeforeCursor.lastIndexOf('@');
    if (lastAtSymbolIndex !== -1) {
      const nextValue =
        text.slice(0, lastAtSymbolIndex) +
        `@${collaborator.name} ` +
        text.slice(cursor);
      onTextChange?.(nextValue);
      setMentionSearchText(null);
      
      const newCursorPos = lastAtSymbolIndex + collaborator.name.length + 2; // +2 for '@' and space
      requestAnimationFrame(() => {
        focusInputAtCursor(inputRef.current, newCursorPos);
      });
    }
  };

  const handleTextChange = (value: string) => {
    onTextChange?.(value);
    
    requestAnimationFrame(() => {
      if (!inputRef.current) return;
      const cursor = inputRef.current.selectionStart || 0;
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

  const canSubmit = requireText ? Boolean(text.trim()) : Boolean(text.trim() || imageUrl);
  const showExpandedEditor = isExpanded || text.length > 0 || Boolean(imageUrl);
  const isPlacedComment = mode === 'placed' && author && createdAt != null;
  const isDraftMode = mode === 'draft';
  const threadPosition = useFloatingPanelPosition(
    pinRef,
    Boolean(isPlacedComment && isThreadOpen),
    'right',
  );
  const draftPanelPosition = useDraftCommentPanelPosition(draftAnchorRef, isDraftMode);

  const getOverlayPoint = (clientX: number, clientY: number) => {
    const rect = overlayRef?.current?.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) return null;

    return {
      xPercent: Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100)),
      yPercent: Math.min(100, Math.max(0, ((clientY - rect.top) / rect.height) * 100)),
    };
  };

  const handlePanPointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!panMode || !onPositionChange) return;

    const point = getOverlayPoint(event.clientX, event.clientY);
    if (!point) return;

    event.stopPropagation();
    event.preventDefault();
    onPanActionStart?.();
    panDragRef.current = {
      startPointer: point,
      origin: { xPercent, yPercent },
    };
    setIsPanDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePanPointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!panDragRef.current || !onPositionChange) return;

    const point = getOverlayPoint(event.clientX, event.clientY);
    if (!point) return;

    const dx = point.xPercent - panDragRef.current.startPointer.xPercent;
    const dy = point.yPercent - panDragRef.current.startPointer.yPercent;

    onPositionChange(
      Math.min(100, Math.max(0, panDragRef.current.origin.xPercent + dx)),
      Math.min(100, Math.max(0, panDragRef.current.origin.yPercent + dy)),
    );
  };

  const handlePanPointerUp = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!panDragRef.current) return;

    panDragRef.current = null;
    setIsPanDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  useEffect(() => {
    if (mode !== 'draft') return;

    let cancelled = false;

    const focusInput = () => {
      if (cancelled) return;
      inputRef.current?.focus({ preventScroll: true });
    };

    requestAnimationFrame(() => {
      requestAnimationFrame(focusInput);
    });

    return () => {
      cancelled = true;
    };
  }, [mode, xPercent, yPercent]);

  useEffect(() => {
    if (mode !== 'draft') return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCancel?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, onCancel]);

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit?.();
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    event.stopPropagation();
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  };

  const handleEditorKeyDown = (event: React.KeyboardEvent) => {
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
    
    handleKeyDown(event);
  };

  const insertAtCursor = (value: string, selection = readInputSelection(inputRef.current, text.length)) => {
    const { nextValue, cursor } = insertAtSelection(text, value, selection);
    onTextChange?.(nextValue);
    focusInputAtCursor(inputRef.current, cursor);
  };

  const openEmojiPicker = (anchor: HTMLElement) => {
    savedSelectionRef.current = readInputSelection(inputRef.current, text.length);
    setIsExpanded(true);
    setEmojiPickerAnchor(anchor);
  };

  const handleMention = () => {
    setIsExpanded(true);
    insertAtCursor('@');
    setMentionSearchText('');
  };

  const handleEmojiSelect = (emoji: string) => {
    setIsExpanded(true);
    insertAtCursor(emoji, savedSelectionRef.current ?? readInputSelection(inputRef.current, text.length));
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

  const handleImageSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) return;

    setIsExpanded(true);
    setImageError(null);

    try {
      const dataUrl = await readCommentImageFile(file);
      onImageChange?.(dataUrl);
    } catch (error) {
      setImageError(error instanceof Error ? error.message : 'Could not attach image.');
    }
  };

  if (isPlacedComment) {
    const showHoverPreview = isHovered && !isThreadOpen;

    const panelSx = {
      position: 'absolute' as const,
      left: 'calc(100% + 10px)',
      top: 0,
      zIndex: 1,
    };

    return (
      <Box
        data-comment-marker
        onMouseEnter={() => {
          if (!panMode) setIsHovered(true);
        }}
        onMouseLeave={() => {
          if (!panMode) setIsHovered(false);
        }}
        sx={{
          position: 'absolute',
          left: `${xPercent}%`,
          top: `${yPercent}%`,
          transform: 'translate(-50%, -50%)',
          zIndex: isThreadOpen ? 30 : isPanDragging ? 25 : isHovered ? 20 : 6,
          pointerEvents: 'auto',
        }}
      >
        <Box sx={{ position: 'relative', display: 'inline-block' }}>
          <Box
            component="button"
            ref={pinRef}
            type="button"
            aria-label={`Comment by ${author.name}: ${text}`}
            aria-expanded={panMode ? undefined : isThreadOpen}
            onPointerDown={panMode ? handlePanPointerDown : undefined}
            onPointerMove={panMode ? handlePanPointerMove : undefined}
            onPointerUp={panMode ? handlePanPointerUp : undefined}
            onClick={(event) => {
              if (panMode || isPanDragging) {
                event.stopPropagation();
                return;
              }
              event.stopPropagation();
              if (isThreadOpen) {
                onCloseThread?.();
              } else {
                onOpenThread?.();
              }
            }}
            sx={{
              display: 'block',
              p: 0,
              m: 0,
              border: 'none',
              background: 'transparent',
              cursor: panMode ? (isPanDragging ? 'grabbing' : 'grab') : 'pointer',
              lineHeight: 0,
              touchAction: panMode ? 'none' : 'auto',
              '&:focus-visible': {
                outline: `2px solid ${cv.brandPurple}`,
                outlineOffset: 3,
                borderRadius: '50%',
              },
            }}
          >
            <CommentAvatarPin author={author} />
          </Box>

          {showHoverPreview && !panMode ? (
            <Box
              sx={{
                ...panelSx,
                animation: 'commentCardIn 0.15s ease-out',
                '@keyframes commentCardIn': {
                  from: { opacity: 0, transform: 'translateY(4px)' },
                  to: { opacity: 1, transform: 'translateY(0)' },
                },
              }}
            >
              <CommentHoverCard
                index={index}
                authorName={author.name}
                authorAvatarUrl={author.avatarUrl}
                authorInitials={author.initials}
                createdAt={createdAt}
                text={text}
                imageUrl={imageUrl}
                showAvatar={false}
              />
            </Box>
          ) : null}

          {isThreadOpen && threadPosition
            ? createPortal(
                <Box
                  sx={{
                    ...threadPosition,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                  }}
                  onClick={(event) => event.stopPropagation()}
                  onMouseDown={(event) => event.stopPropagation()}
                >
                  <CommentThreadPopover
                    author={author}
                    createdAt={createdAt}
                    text={text}
                    imageUrl={imageUrl}
                    replies={replies}
                    resolved={resolved}
                    resolvedAt={resolvedAt}
                    resolvedBy={resolvedBy}
                    reopenedAt={reopenedAt}
                    reopenedBy={reopenedBy}
                    onClose={() => onCloseThread?.()}
                    onAddReply={(replyText, replyImageUrl) =>
                      onAddReply?.(replyText, replyImageUrl)
                    }
                    onToggleResolved={() => onToggleResolved?.()}
                    onMarkUnread={() => onMarkUnread?.()}
                    onCopyLink={() => onCopyLink?.()}
                    onDeleteThread={() => onDeleteThread?.()}
                    onEditComment={onEditComment}
                    onEditReply={onEditReply}
                    visibility={visibility}
                    groupId={groupId}
                    annotationGroups={annotationGroups}
                    collaborators={collaborators}
                    onVisibilityChange={(nextVisibility, nextGroupId) =>
                      onVisibilityChange?.(nextVisibility, nextGroupId)
                    }
                    onCreateAnnotationGroup={(name, memberIds) =>
                      onCreateAnnotationGroup?.(name, memberIds) ?? {
                        id: crypto.randomUUID(),
                        name,
                        createdAt: Date.now(),
                        memberIds,
                      }
                    }
                    onUpdateAnnotationGroup={onUpdateAnnotationGroup}
                    onAddCollaborator={onAddCollaborator}
                  />
                </Box>,
                getPortalTarget(),
              )
            : null}
        </Box>
      </Box>
    );
  }

  const draftEditor = (
    <>
      <Box sx={{ flexShrink: 0, mt: showExpandedEditor ? 0.5 : 0 }}>
        <CommentPin />
      </Box>

      <Box
        sx={{
          ml: -0.5,
          minWidth: showExpandedEditor ? 260 : 220,
          maxWidth: 300,
          maxHeight: showExpandedEditor ? OVERLAY_PANEL_MAX_HEIGHT : undefined,
          backgroundColor: cv.textInverse,
          boxShadow: cv.markerShadow,
          borderRadius: showExpandedEditor ? '16px' : '999px',
          overflow: 'hidden',
          transition: 'border-radius 0.2s ease, min-width 0.2s ease',
          display: 'flex',
          flexDirection: showExpandedEditor ? 'column' : 'row',
          alignItems: showExpandedEditor ? 'stretch' : 'center',
          ...(showExpandedEditor
            ? {
                pl: 1.5,
                pr: 1.25,
                pt: 1.25,
                pb: 0.75,
              }
            : {
                gap: 0.75,
                pl: 1.75,
                pr: 0.75,
                py: 0.5,
              }),
        }}
      >
        <InputBase
          inputRef={inputRef}
          autoFocus
          value={text}
          onChange={(event) => handleTextChange(event.target.value)}
          onFocus={() => setIsExpanded(true)}
          onKeyDown={handleEditorKeyDown}
          placeholder={placeholder}
          aria-label="Comment text"
          multiline={showExpandedEditor}
          minRows={showExpandedEditor ? 2 : 1}
          sx={{
            width: '100%',
            fontSize: '0.9375rem',
            color: cv.inkDark,
            alignItems: showExpandedEditor ? 'flex-start' : 'center',
            ...overlayMultilineFieldSx,
            '& textarea, & input': {
              py: showExpandedEditor ? 0 : 0.75,
              px: 0.5,
              lineHeight: 1.5,
              ...(showExpandedEditor
                ? {
                    ...overlayMultilineFieldSx['& textarea'],
                    maxHeight: OVERLAY_CONTENT_MAX_HEIGHT,
                  }
                : { resize: 'none' }),
              '&::placeholder': {
                color: cv.inkOverlay38,
                opacity: 1,
              },
            },
          }}
        />

        {showExpandedEditor && imageUrl ? (
          <CommentImageAttachment
            src={imageUrl}
            alt="Attached comment image"
            variant="editor"
            onRemove={() => {
              setImageError(null);
              onImageChange?.(null);
            }}
          />
        ) : null}

        {imageError ? <CommentImageError message={imageError} /> : null}

        {showExpandedEditor ? (
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
                    onClick={handleMention}
                    sx={actionIconSx}
                  >
                    <AlternateEmailOutlinedIcon sx={{ fontSize: 20 }} />
                  </IconButton>
                </Tooltip>

                {imageButton}
              </Box>

              <Tooltip title="Send comment" arrow placement="top">
                <span>
                  <IconButton
                    type="button"
                    aria-label="Submit comment"
                    disabled={!canSubmit}
                    onClick={handleSubmit}
                    sx={{
                      width: 36,
                      height: 36,
                      flexShrink: 0,
                      backgroundColor: canSubmit ? cv.brandPurple : cv.inkOverlay08,
                      color: canSubmit ? cv.textInverse : cv.inkOverlay35,
                      transition: 'background-color 0.2s ease, color 0.2s ease',
                      '&:hover': {
                        backgroundColor: canSubmit ? cv.brandPurpleDark : cv.inkOverlay12,
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
            <Tooltip title="Send comment" arrow placement="top">
              <span>
                <IconButton
                  type="button"
                  aria-label="Submit comment"
                  disabled={!canSubmit}
                  onClick={handleSubmit}
                  sx={{
                    width: 32,
                    height: 32,
                    flexShrink: 0,
                    backgroundColor: canSubmit ? cv.brandPurple : cv.inkOverlay08,
                    color: canSubmit ? cv.textInverse : cv.inkOverlay35,
                    transition: 'background-color 0.2s ease, color 0.2s ease',
                    '&:hover': {
                      backgroundColor: canSubmit ? cv.brandPurpleDark : cv.inkOverlay12,
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
          </>
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
          anchorEl={inputRef.current}
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
    </>
  );

  return (
    <>
      <Box
        ref={draftAnchorRef}
        data-comment-marker
        aria-hidden
        sx={{
          position: 'absolute',
          left: `${xPercent}%`,
          top: `${yPercent}%`,
          width: 1,
          height: 1,
          pointerEvents: 'none',
        }}
      />

      {draftPanelPosition
        ? createPortal(
            <Box
              role="group"
              aria-label={requireText ? 'Add required annotation comment' : 'Add comment'}
              onClick={(event) => event.stopPropagation()}
              onMouseDown={(event) => event.stopPropagation()}
              sx={{
                display: 'flex',
                ...draftPanelPosition,
                alignItems: showExpandedEditor
                  ? draftPanelPosition.alignItems ?? 'flex-start'
                  : 'center',
                pointerEvents: 'auto',
              }}
            >
              {draftEditor}
            </Box>,
            getPortalTarget(),
          )
        : null}
    </>
  );
}

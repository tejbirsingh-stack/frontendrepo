import { useEffect, useMemo, useRef, useState } from 'react';
import { Box } from '@mui/material';
import { cv } from '../../theme/cssVars';
import CommentMarker from './CommentMarker';
import type { DraftVideoComment, VideoComment } from '../../types/videoComments';
import type { AnnotationAccessGroup, AnnotationVisibility } from '../../types/annotationVisibility';
import type { MediaCollaborator } from '../../types/mediaCollaborator';
import { getAnnotationCommentPlaceholder } from '../../utils/annotationCommentPrompt';
import { isCommentVisibleAtTime } from '../../utils/commentTimestampVisibility';

interface VideoCommentLayerProps {
  active: boolean;
  panActive?: boolean;
  annotationsVisible?: boolean;
  videoRef?: React.RefObject<HTMLVideoElement | null>;
  comments: VideoComment[];
  draftComment: DraftVideoComment | null;
  onPlaceDraft: (position: { xPercent: number; yPercent: number }) => void;
  onDraftTextChange: (text: string) => void;
  onDraftImageChange: (imageUrl: string | null) => void;
  onSubmitDraft: () => void;
  onCancelDraft: () => void;
  onAddReply: (commentId: string, text: string, imageUrl?: string) => void;
  onToggleCommentResolved: (commentId: string) => void;
  onMarkCommentUnread: (commentId: string) => void;
  onCopyCommentLink: (comment: VideoComment) => void;
  onDeleteComment: (commentId: string) => void;
  onEditComment?: (commentId: string, text: string, imageUrl?: string) => void;
  onEditReply?: (
    commentId: string,
    replyId: string,
    text: string,
    imageUrl?: string,
  ) => void;
  onThreadOpenChange?: (open: boolean) => void;
  annotationGroups: AnnotationAccessGroup[];
  collaborators: MediaCollaborator[];
  onCommentVisibilityChange: (
    commentId: string,
    visibility: AnnotationVisibility,
    groupId?: string,
  ) => void;
  onCreateAnnotationGroup: (name: string, memberIds: string[]) => AnnotationAccessGroup;
  onAddCollaborator?: (name: string, email: string) => MediaCollaborator | null;
  onMoveComment?: (commentId: string, xPercent: number, yPercent: number) => void;
  onPanActionStart?: () => void;
  openCommentId?: string | null;
  onOpenCommentIdChange?: (id: string | null) => void;
}

export default function VideoCommentLayer({
  active,
  panActive = false,
  annotationsVisible = true,
  videoRef,
  comments,
  draftComment,
  onPlaceDraft,
  onDraftTextChange,
  onDraftImageChange,
  onSubmitDraft,
  onCancelDraft,
  onAddReply,
  onToggleCommentResolved,
  onMarkCommentUnread,
  onCopyCommentLink,
  onDeleteComment,
  onEditComment,
  onEditReply,
  onThreadOpenChange,
  annotationGroups,
  collaborators,
  onCommentVisibilityChange,
  onCreateAnnotationGroup,
  onAddCollaborator,
  onMoveComment,
  onPanActionStart,
  openCommentId: externalOpenCommentId,
  onOpenCommentIdChange,
}: VideoCommentLayerProps) {
  const [internalOpenCommentId, setInternalOpenCommentId] = useState<string | null>(null);
  const openCommentId = externalOpenCommentId !== undefined ? externalOpenCommentId : internalOpenCommentId;
  const setOpenCommentId = (id: string | null) => {
    setInternalOpenCommentId(id);
    onOpenCommentIdChange?.(id);
  };
  const overlayRef = useRef<HTMLDivElement>(null);
  const [currentVideoTime, setCurrentVideoTime] = useState(0);

  useEffect(() => {
    const video = videoRef?.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentVideoTime(video.currentTime);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('seeked', handleTimeUpdate);
    handleTimeUpdate();

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('seeked', handleTimeUpdate);
    };
  }, [videoRef]);

  useEffect(() => {
    onThreadOpenChange?.(Boolean(openCommentId));
  }, [openCommentId, onThreadOpenChange]);

  useEffect(() => {
    if (!active && !panActive) {
      setOpenCommentId(null);
    }
  }, [active, panActive]);

  useEffect(() => {
    if (!annotationsVisible) {
      setOpenCommentId(null);
    }
  }, [annotationsVisible]);

  useEffect(() => {
    if (!openCommentId) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenCommentId(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [openCommentId]);

  const visibleComments = useMemo(
    () =>
      comments.filter(
        (comment) =>
          !comment.resolved &&
          isCommentVisibleAtTime(comment.videoTimestamp, currentVideoTime, comment.endTimestamp),
      ),
    [comments, currentVideoTime],
  );

  useEffect(() => {
    if (!openCommentId) return;

    const openComment = comments.find((comment) => comment.id === openCommentId);
    if (
      !openComment ||
      openComment.resolved ||
      !isCommentVisibleAtTime(
        openComment.videoTimestamp,
        currentVideoTime,
        openComment.endTimestamp,
      )
    ) {
      setOpenCommentId(null);
    }
  }, [comments, currentVideoTime, openCommentId]);

  const handleOverlayClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (panActive) return;

    if ((event.target as HTMLElement).closest('[data-comment-marker]')) return;

    if (openCommentId) {
      setOpenCommentId(null);
      return;
    }

    if (draftComment) {
      if (
        !draftComment.linkedAnnotationKind &&
        !draftComment.text.trim() &&
        !draftComment.imageUrl
      ) {
        onCancelDraft();
      }
      return;
    }

    if (!active) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const xPercent = ((event.clientX - rect.left) / rect.width) * 100;
    const yPercent = ((event.clientY - rect.top) / rect.height) * 100;

    onPlaceDraft({
      xPercent: Math.min(100, Math.max(0, xPercent)),
      yPercent: Math.min(100, Math.max(0, yPercent)),
    });
  };

  const layerInteractive =
    annotationsVisible && (active || panActive || draftComment || openCommentId);

  return (
    <Box
      ref={overlayRef}
      aria-hidden={!annotationsVisible || (!active && !panActive && visibleComments.length === 0 && !draftComment)}
      onClick={handleOverlayClick}
      sx={{
        position: 'absolute',
        inset: 0,
        zIndex: 4,
        pointerEvents: layerInteractive ? (panActive ? 'none' : 'auto') : 'none',
        cursor:
          annotationsVisible && active && !openCommentId
            ? 'crosshair'
            : panActive
              ? 'default'
              : 'default',
      }}
    >
      {annotationsVisible && visibleComments.map((comment) => (
        <CommentMarker
          key={comment.id}
          index={comment.historyIndex}
          xPercent={comment.xPercent}
          yPercent={comment.yPercent}
          mode="placed"
          panMode={panActive}
          overlayRef={overlayRef}
          onPositionChange={
            onMoveComment
              ? (xPercent, yPercent) => onMoveComment(comment.id, xPercent, yPercent)
              : undefined
          }
          onPanActionStart={onPanActionStart}
          text={comment.text}
          imageUrl={comment.imageUrl}
          author={comment.author}
          createdAt={comment.createdAt}
          replies={comment.replies}
          isThreadOpen={openCommentId === comment.id}
          resolved={comment.resolved}
          resolvedAt={comment.resolvedAt}
          resolvedBy={comment.resolvedBy}
          reopenedAt={comment.reopenedAt}
          reopenedBy={comment.reopenedBy}
          onOpenThread={() => setOpenCommentId(comment.id)}
          onCloseThread={() => setOpenCommentId(null)}
          onAddReply={(text, imageUrl) => onAddReply(comment.id, text, imageUrl)}
          onToggleResolved={() => onToggleCommentResolved(comment.id)}
          onMarkUnread={() => onMarkCommentUnread(comment.id)}
          onCopyLink={() => onCopyCommentLink(comment)}
          onDeleteThread={() => {
            onDeleteComment(comment.id);
            setOpenCommentId(null);
          }}
          onEditComment={
            onEditComment
              ? (text, imageUrl) => onEditComment(comment.id, text, imageUrl)
              : undefined
          }
          onEditReply={
            onEditReply
              ? (replyId, text, imageUrl) =>
                  onEditReply(comment.id, replyId, text, imageUrl)
              : undefined
          }
          visibility={comment.visibility}
          groupId={comment.groupId}
          annotationGroups={annotationGroups}
          collaborators={collaborators}
          onVisibilityChange={(visibility, groupId) =>
            onCommentVisibilityChange(comment.id, visibility, groupId)
          }
          onCreateAnnotationGroup={onCreateAnnotationGroup}
          onAddCollaborator={onAddCollaborator}
        />
      ))}

      {annotationsVisible && draftComment && (
        <CommentMarker
          xPercent={draftComment.xPercent}
          yPercent={draftComment.yPercent}
          mode="draft"
          text={draftComment.text}
          imageUrl={draftComment.imageUrl}
          placeholder={
            draftComment.linkedAnnotationKind
              ? getAnnotationCommentPlaceholder(draftComment.linkedAnnotationKind)
              : 'Add a comment'
          }
          requireText={Boolean(draftComment.linkedAnnotationKind)}
          onTextChange={onDraftTextChange}
          onImageChange={onDraftImageChange}
          onSubmit={onSubmitDraft}
          onCancel={onCancelDraft}
          collaborators={collaborators}
        />
      )}

      {annotationsVisible && panActive && !draftComment && (
        <Box
          sx={{
            position: 'absolute',
            left: 16,
            bottom: 16,
            px: 1.5,
            py: 0.75,
            borderRadius: '8px',
            backgroundColor: 'var(--noah-toolbar-surface)',
            border: `1px solid ${cv.whiteBorderSoft}`,
            color: cv.textInverseSoft,
            fontSize: '0.8125rem',
            pointerEvents: 'none',
          }}
        >
          Drag annotations to reposition them on this frame
        </Box>
      )}

      {annotationsVisible && active && !draftComment && !openCommentId && !panActive && (
        <Box
          sx={{
            position: 'absolute',
            left: 16,
            bottom: 16,
            px: 1.5,
            py: 0.75,
            borderRadius: '8px',
            backgroundColor: 'var(--noah-toolbar-surface)',
            border: `1px solid ${cv.whiteBorderSoft}`,
            color: cv.textInverseSoft,
            fontSize: '0.8125rem',
            pointerEvents: 'none',
          }}
        >
          Click anywhere to add a comment
        </Box>
      )}
    </Box>
  );
}

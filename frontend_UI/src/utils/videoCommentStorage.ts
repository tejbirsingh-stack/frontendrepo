import type { VideoComment } from '../types/videoComments';
import { withCurrentUserProfile } from '../constants/currentUser';

const STORAGE_PREFIX = 'noah-video-comments:';

function syncCommentAuthors(comments: VideoComment[]): VideoComment[] {
  return comments.map((comment) => ({
    ...comment,
    author: withCurrentUserProfile(comment.author),
    resolvedBy: comment.resolvedBy
      ? withCurrentUserProfile(comment.resolvedBy)
      : comment.resolvedBy,
    reopenedBy: comment.reopenedBy
      ? withCurrentUserProfile(comment.reopenedBy)
      : comment.reopenedBy,
    replies: comment.replies.map((reply) => ({
      ...reply,
      author: withCurrentUserProfile(reply.author),
    })),
  }));
}

export function loadVideoComments(mediaId: string): VideoComment[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(`${STORAGE_PREFIX}${mediaId}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Partial<VideoComment>[];
    if (!Array.isArray(parsed)) return [];

    return syncCommentAuthors(
      parsed.map((comment, index) => ({
        ...comment,
        id: comment.id ?? `legacy-comment-${index}`,
        videoTimestamp: comment.videoTimestamp ?? 0,
        replies: comment.replies ?? [],
      })) as VideoComment[],
    );
  } catch {
    return [];
  }
}

export function saveVideoComments(mediaId: string, comments: VideoComment[]) {
  if (typeof window === 'undefined') return;

  window.localStorage.setItem(`${STORAGE_PREFIX}${mediaId}`, JSON.stringify(comments));
}

import type { AnnotationHistoryEntry } from '../types/annotationHistory';
import type { VideoComment } from '../types/videoComments';
import { withCurrentUserProfile } from '../constants/currentUser';
import { DEFAULT_ANNOTATION_VISIBILITY } from '../types/annotationVisibility';
import {
  getDrawingHistoryEntryId,
  getShapeHistoryEntryId,
} from './annotationOverlayVisibility';

const STORAGE_PREFIX = 'noah-annotation-history:';

function syncHistoryAuthors(entries: AnnotationHistoryEntry[]): AnnotationHistoryEntry[] {
  return entries.map((entry) => ({
    ...entry,
    author: withCurrentUserProfile(entry.author),
    resolvedBy: entry.resolvedBy
      ? withCurrentUserProfile(entry.resolvedBy)
      : entry.resolvedBy,
    reopenedBy: entry.reopenedBy
      ? withCurrentUserProfile(entry.reopenedBy)
      : entry.reopenedBy,
  }));
}

export function loadAnnotationHistory(mediaId: string): AnnotationHistoryEntry[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(`${STORAGE_PREFIX}${mediaId}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as AnnotationHistoryEntry[];
    return Array.isArray(parsed)
      ? syncHistoryAuthors(dedupeHistoryEntries(parsed))
      : [];
  } catch {
    return [];
  }
}

export function saveAnnotationHistory(mediaId: string, history: AnnotationHistoryEntry[]) {
  if (typeof window === 'undefined') return;

  window.localStorage.setItem(`${STORAGE_PREFIX}${mediaId}`, JSON.stringify(history));
}

export function dedupeHistoryEntries(entries: AnnotationHistoryEntry[]): AnnotationHistoryEntry[] {
  const seenIds = new Set<string>();
  const seenFingerprints = new Set<string>();
  const result: AnnotationHistoryEntry[] = [];

  for (const entry of entries) {
    if (seenIds.has(entry.id)) continue;

    const fingerprint = [
      entry.type,
      entry.detail ?? entry.summary,
      entry.videoTimestamp,
      entry.author.name,
      Math.floor(entry.createdAt / 1000),
    ].join('|');

    if (seenFingerprints.has(fingerprint)) continue;

    seenIds.add(entry.id);
    seenFingerprints.add(fingerprint);
    result.push(entry);
  }

  return result;
}

export function backfillHistoryFromComments(
  comments: VideoComment[],
  existing: AnnotationHistoryEntry[],
): AnnotationHistoryEntry[] {
  if (existing.length > 0) return dedupeHistoryEntries(existing);

  const entries: AnnotationHistoryEntry[] = [];
  let index = 1;

  for (const comment of comments) {
    entries.push({
      id: `comment-${comment.id}`,
      index: index++,
      type: 'comment',
      author: comment.author,
      createdAt: comment.createdAt,
      videoTimestamp: comment.videoTimestamp ?? 0,
      summary: 'Comment added',
      detail: comment.text,
      resolved: comment.resolved ?? false,
      resolvedAt: comment.resolvedAt,
      resolvedBy: comment.resolvedBy,
      unread: false,
      sourceCommentId: comment.id,
      replyCount: comment.replies.length,
      visibility: comment.visibility ?? DEFAULT_ANNOTATION_VISIBILITY,
      groupId: comment.groupId,
    });

  }

  return entries;
}

function findCommentForHistoryEntry(
  entry: AnnotationHistoryEntry,
  comments: VideoComment[],
): VideoComment | undefined {
  if (!entry.sourceCommentId) return undefined;
  return comments.find((comment) => comment.id === entry.sourceCommentId);
}

/** Merge linked drawing/shape + explanation comment into a single history row. */
export function mergeLinkedAnnotationHistory(
  history: AnnotationHistoryEntry[],
  comments: VideoComment[],
): AnnotationHistoryEntry[] {
  const redundantCommentEntryIds = new Set<string>();
  const merged = history.map((entry) => ({ ...entry }));

  for (const comment of comments) {
    const commentEntryId = `comment-${comment.id}`;
    const linkedEntryId = comment.linkedDrawingId
      ? getDrawingHistoryEntryId(comment.linkedDrawingId)
      : comment.linkedShapeId
        ? getShapeHistoryEntryId(comment.linkedShapeId)
        : null;

    if (!linkedEntryId) continue;

    const linkedIndex = merged.findIndex((entry) => entry.id === linkedEntryId);
    if (linkedIndex < 0) continue;

    merged[linkedIndex] = {
      ...merged[linkedIndex],
      detail: comment.text.trim() || merged[linkedIndex].detail,
      sourceCommentId: comment.id,
      linkedDrawingId: comment.linkedDrawingId,
      linkedShapeId: comment.linkedShapeId,
      resolved: comment.resolved ?? merged[linkedIndex].resolved ?? false,
      resolvedAt: comment.resolvedAt ?? merged[linkedIndex].resolvedAt,
      resolvedBy: comment.resolvedBy ?? merged[linkedIndex].resolvedBy,
      reopenedAt: comment.reopenedAt ?? merged[linkedIndex].reopenedAt,
      reopenedBy: comment.reopenedBy ?? merged[linkedIndex].reopenedBy,
      visibility: comment.visibility ?? merged[linkedIndex].visibility ?? DEFAULT_ANNOTATION_VISIBILITY,
      groupId: comment.groupId ?? merged[linkedIndex].groupId,
      replyCount: comment.replies.length,
    };

    redundantCommentEntryIds.add(commentEntryId);
  }

  return merged.filter((entry) => !redundantCommentEntryIds.has(entry.id));
}

/** Collapse legacy reply rows into parent comment reply counts. */
export function normalizeCommentHistory(
  history: AnnotationHistoryEntry[],
  comments: VideoComment[],
): AnnotationHistoryEntry[] {
  const replyCountByCommentId = new Map(
    comments.map((comment) => [comment.id, comment.replies.length]),
  );

  return history
    .filter((entry) => entry.type !== 'reply')
    .map((entry) => {
      const comment = findCommentForHistoryEntry(entry, comments);

      if (entry.type === 'comment' && entry.sourceCommentId) {
        return {
          ...entry,
          replyCount: replyCountByCommentId.get(entry.sourceCommentId) ?? entry.replyCount ?? 0,
          resolved: comment?.resolved ?? entry.resolved ?? false,
          resolvedAt: comment?.resolvedAt ?? entry.resolvedAt,
          resolvedBy: comment?.resolvedBy ?? entry.resolvedBy,
          reopenedAt: comment?.reopenedAt ?? entry.reopenedAt,
          reopenedBy: comment?.reopenedBy ?? entry.reopenedBy,
          visibility: comment?.visibility ?? entry.visibility ?? DEFAULT_ANNOTATION_VISIBILITY,
          groupId: comment?.groupId ?? entry.groupId,
        };
      }

      if (!comment) return entry;

      return {
        ...entry,
        detail: comment.text.trim() || entry.detail,
        replyCount: replyCountByCommentId.get(comment.id) ?? entry.replyCount ?? 0,
        resolved: comment.resolved ?? entry.resolved ?? false,
        resolvedAt: comment.resolvedAt ?? entry.resolvedAt,
        resolvedBy: comment.resolvedBy ?? entry.resolvedBy,
        reopenedAt: comment.reopenedAt ?? entry.reopenedAt,
        reopenedBy: comment.reopenedBy ?? entry.reopenedBy,
        visibility: comment.visibility ?? entry.visibility ?? DEFAULT_ANNOTATION_VISIBILITY,
        groupId: comment.groupId ?? entry.groupId,
      };
    });
}

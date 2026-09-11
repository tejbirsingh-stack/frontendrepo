import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Box, Button, CircularProgress, List, ListItemButton, Typography } from '@mui/material';
import { cv } from '../../theme/cssVars';
import {
  getTranscriptRequest,
  retryAiAnalyzeRequest,
  type TranscriptSegmentDto,
} from '../../api/ai.service';
import { mapTranscriptFailure } from './transcriptFailureMessage';

interface TranscriptPanelProps {
  assetId?: string;
  filterQuery?: string;
  onSeekMs?: (startMs: number) => void;
  videoRef?: React.RefObject<HTMLVideoElement | null>;
  insightSeekMs?: number | null;
}

function formatTimecode(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

/** Index of the last segment that has started, or -1 before the first one. */
function findActiveIndex(segments: TranscriptSegmentDto[], ms: number): number {
  let active = -1;
  for (const segment of segments) {
    if (segment.startMs > ms) break;
    active += 1;
  }
  return active;
}

function segmentTextColor(isActive: boolean, isRead: boolean): string {
  if (isActive) return cv.brandPurpleLight;
  return isRead ? cv.textMuted : cv.textPrimary;
}

/** Drive transcript UX off the ASR step, not the overall AI job status. */
function isAsrInProgress(status: string, asr?: string): boolean {
  if (asr === 'skipped' || asr === 'completed' || asr === 'failed' || asr === 'idle') {
    return false;
  }
  if (asr === 'queued' || asr === 'processing' || asr === 'transcribing') {
    return true;
  }
  // Legacy / missing asr: fall back to overall status
  return status === 'queued' || status === 'processing';
}

/**
 * Tracks which segment is being spoken. The media element carries key={videoSrc} and
 * remounts on source change, so the ref is polled rather than bound with a timeupdate
 * listener that would need re-attaching. State only commits when the index changes, so
 * the panel re-renders once per line instead of on every tick.
 */
function useActiveSegmentIndex(
  segments: TranscriptSegmentDto[],
  videoRef?: React.RefObject<HTMLVideoElement | null>,
): number {
  const [activeIndex, setActiveIndex] = useState(-1);

  useEffect(() => {
    if (!videoRef || segments.length === 0) return;
    const tick = () => {
      const element = videoRef.current;
      if (!element) return;
      const next = findActiveIndex(segments, element.currentTime * 1000);
      setActiveIndex((prev) => (prev === next ? prev : next));
    };
    tick();
    const timer = window.setInterval(tick, 200);
    return () => window.clearInterval(timer);
  }, [videoRef, segments]);

  return activeIndex;
}

interface TranscriptRowProps {
  segment: TranscriptSegmentDto;
  isActive: boolean;
  isRead: boolean;
  isSeeking: boolean;
  rowRef?: React.Ref<HTMLDivElement>;
  onSeekMs?: (startMs: number) => void;
}

function TranscriptRow({
  segment,
  isActive,
  isRead,
  isSeeking,
  rowRef,
  onSeekMs,
}: Readonly<TranscriptRowProps>) {
  return (
    <ListItemButton
      ref={rowRef}
      onClick={() => onSeekMs?.(segment.startMs)}
      aria-current={isActive ? 'true' : undefined}
      aria-busy={isSeeking}
      sx={{
        alignItems: 'flex-start',
        gap: 1,
        px: 0.5,
        py: 0.75,
        minHeight: 44,
        borderRadius: '6px',
        borderLeft: '2px solid',
        borderLeftColor: isActive || isSeeking ? cv.brandPurpleLight : 'transparent',
        backgroundColor: isActive || isSeeking ? cv.purpleSurface : 'transparent',
      }}
    >
      <Typography
        component="span"
        sx={{
          flexShrink: 0,
          width: 40,
          pt: '0.1rem',
          fontSize: '0.7rem',
          fontVariantNumeric: 'tabular-nums',
          color: isActive || isSeeking ? cv.brandPurpleLight : cv.textMuted,
        }}
      >
        {formatTimecode(segment.startMs)}
      </Typography>
      <Typography
        component="span"
        sx={{
          flex: 1,
          minWidth: 0,
          fontSize: '0.8125rem',
          fontWeight: isActive || isSeeking ? 600 : 400,
          color: segmentTextColor(isActive || isSeeking, isRead),
        }}
      >
        {segment.text}
      </Typography>
      {isSeeking ? (
        <CircularProgress size={14} sx={{ flexShrink: 0, mt: 0.35, color: cv.brandPurpleLight }} />
      ) : null}
    </ListItemButton>
  );
}

export default function TranscriptPanel({
  assetId,
  filterQuery = '',
  onSeekMs,
  videoRef,
  insightSeekMs = null,
}: Readonly<TranscriptPanelProps>) {
  const [segments, setSegments] = useState<TranscriptSegmentDto[]>([]);
  const [status, setStatus] = useState('idle');
  const [asr, setAsr] = useState<string | undefined>();
  const [jobError, setJobError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);
  const activeRowRef = useRef<HTMLDivElement | null>(null);
  const activeIndex = useActiveSegmentIndex(segments, videoRef);

  const loadTranscript = useCallback(async () => {
    if (!assetId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await getTranscriptRequest(assetId);
      setSegments(result.segments || []);
      setStatus(result.status);
      setAsr(result.asr);
      setJobError(result.error ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load transcript');
    } finally {
      setLoading(false);
    }
  }, [assetId]);

  useEffect(() => {
    void loadTranscript();
  }, [loadTranscript]);

  useEffect(() => {
    if (!assetId) return;
    if (!isAsrInProgress(status, asr)) return;
    const timer = window.setInterval(() => {
      void loadTranscript();
    }, 4000);
    return () => window.clearInterval(timer);
  }, [assetId, status, asr, loadTranscript]);

  useEffect(() => {
    activeRowRef.current?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  const filtered = useMemo(() => {
    const rows = segments.map((segment, index) => ({ segment, index }));
    const q = filterQuery.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(({ segment }) => segment.text.toLowerCase().includes(q));
  }, [segments, filterQuery]);

  const failureInfo = useMemo(() => mapTranscriptFailure(jobError), [jobError]);

  const handleRetry = async () => {
    if (!assetId) return;
    setRetrying(true);
    setError(null);
    try {
      await retryAiAnalyzeRequest(assetId, { force: true, features: ['asr'] });
      setStatus('queued');
      setAsr('queued');
      setJobError(null);
      await loadTranscript();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to retry transcription');
    } finally {
      setRetrying(false);
    }
  };

  if (!assetId) {
    return (
      <Typography sx={{ fontSize: '0.75rem', color: cv.textMuted }}>
        Transcript is unavailable for this file.
      </Typography>
    );
  }

  if (loading && segments.length === 0) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1.5 }}>
        <CircularProgress size={14} />
        <Typography sx={{ fontSize: '0.75rem', color: cv.textMuted }}>Loading transcript…</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ py: 1.5 }}>
        <Typography sx={{ fontSize: '0.75rem', color: cv.textMuted }}>{error}</Typography>
        <Button size="small" onClick={() => void loadTranscript()} sx={{ mt: 0.5, minHeight: 44 }}>
          Try again
        </Button>
      </Box>
    );
  }

  if (isAsrInProgress(status, asr)) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1.5 }}>
        <CircularProgress size={14} />
        <Typography sx={{ fontSize: '0.75rem', color: cv.textMuted }}>
          Transcribing audio. This can take a few minutes.
        </Typography>
      </Box>
    );
  }

  if (asr === 'failed' || (status === 'failed' && asr !== 'skipped' && asr !== 'completed' && asr !== 'idle')) {
    return (
      <Box sx={{ py: 1.5 }}>
        <Typography sx={{ fontSize: '0.75rem', color: cv.textMuted }}>{failureInfo.message}</Typography>
        {failureInfo.canRetry ? (
          <Button size="small" onClick={() => void handleRetry()} disabled={retrying} sx={{ mt: 0.5, minHeight: 44 }}>
            {retrying ? 'Retrying…' : 'Retry transcript'}
          </Button>
        ) : null}
      </Box>
    );
  }

  if (filtered.length === 0) {
    let emptyMessage = 'No transcript lines match this search.';
    if (segments.length === 0) {
      if (asr === 'skipped') {
        emptyMessage = 'Transcript was not run for this analysis.';
      } else {
        emptyMessage = 'No spoken dialogue was found for this file yet.';
      }
    }
    return (
      <Box sx={{ py: 1.5 }}>
        <Typography sx={{ fontSize: '0.75rem', color: cv.textMuted }}>{emptyMessage}</Typography>
        {segments.length === 0 ? (
          <Button size="small" onClick={() => void handleRetry()} disabled={retrying} sx={{ mt: 0.5, minHeight: 44 }}>
            {retrying ? 'Starting…' : 'Generate transcript'}
          </Button>
        ) : null}
      </Box>
    );
  }

  return (
    <List disablePadding aria-label="Timed transcript">
      {filtered.map(({ segment, index }) => (
        <TranscriptRow
          key={segment.id}
          segment={segment}
          isActive={index === activeIndex}
          isRead={index < activeIndex}
          isSeeking={insightSeekMs != null && segment.startMs === insightSeekMs}
          rowRef={index === activeIndex ? activeRowRef : undefined}
          onSeekMs={onSeekMs}
        />
      ))}
    </List>
  );
}

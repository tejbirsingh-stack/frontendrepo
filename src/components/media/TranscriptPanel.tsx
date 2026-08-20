import { useCallback, useEffect, useMemo, useState } from 'react';
import { Box, Button, CircularProgress, List, ListItemButton, ListItemText, Typography } from '@mui/material';
import { cv } from '../../theme/cssVars';
import {
  getTranscriptRequest,
  retryAiAnalyzeRequest,
  type TranscriptSegmentDto,
} from '../../api/ai.service';

interface TranscriptPanelProps {
  assetId?: string;
  filterQuery?: string;
  onSeekMs?: (startMs: number) => void;
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

export default function TranscriptPanel({ assetId, filterQuery = '', onSeekMs }: Readonly<TranscriptPanelProps>) {
  const [segments, setSegments] = useState<TranscriptSegmentDto[]>([]);
  const [status, setStatus] = useState('idle');
  const [asr, setAsr] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);

  const loadTranscript = useCallback(async () => {
    if (!assetId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await getTranscriptRequest(assetId);
      setSegments(result.segments || []);
      setStatus(result.status);
      setAsr(result.asr);
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
    const processing = status === 'queued' || status === 'processing' || asr === 'queued';
    if (!processing) return;
    const timer = window.setInterval(() => {
      void loadTranscript();
    }, 4000);
    return () => window.clearInterval(timer);
  }, [assetId, status, asr, loadTranscript]);

  const filtered = useMemo(() => {
    const q = filterQuery.trim().toLowerCase();
    if (!q) return segments;
    return segments.filter((s) => s.text.toLowerCase().includes(q));
  }, [segments, filterQuery]);

  const handleRetry = async () => {
    if (!assetId) return;
    setRetrying(true);
    setError(null);
    try {
      await retryAiAnalyzeRequest(assetId, true);
      setStatus('queued');
      setAsr('queued');
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

  if (status === 'queued' || status === 'processing' || asr === 'queued') {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1.5 }}>
        <CircularProgress size={14} />
        <Typography sx={{ fontSize: '0.75rem', color: cv.textMuted }}>
          Transcribing audio. This can take a few minutes.
        </Typography>
      </Box>
    );
  }

  if (status === 'failed' || asr === 'failed') {
    return (
      <Box sx={{ py: 1.5 }}>
        <Typography sx={{ fontSize: '0.75rem', color: cv.textMuted }}>
          Transcription failed. You can retry without affecting playback.
        </Typography>
        <Button size="small" onClick={() => void handleRetry()} disabled={retrying} sx={{ mt: 0.5, minHeight: 44 }}>
          {retrying ? 'Retrying…' : 'Retry transcript'}
        </Button>
      </Box>
    );
  }

  if (filtered.length === 0) {
    return (
      <Box sx={{ py: 1.5 }}>
        <Typography sx={{ fontSize: '0.75rem', color: cv.textMuted }}>
          {segments.length === 0
            ? 'No spoken dialogue was found for this file yet.'
            : 'No transcript lines match this search.'}
        </Typography>
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
      {filtered.map((segment) => (
        <ListItemButton
          key={segment.id}
          onClick={() => onSeekMs?.(segment.startMs)}
          sx={{
            alignItems: 'flex-start',
            px: 0.5,
            py: 0.75,
            minHeight: 44,
            borderRadius: 1,
          }}
        >
          <ListItemText
            primary={
              <Typography component="span" sx={{ fontSize: '0.8125rem', color: cv.textPrimary }}>
                {segment.text}
              </Typography>
            }
            secondary={
              <Typography component="span" sx={{ fontSize: '0.7rem', color: cv.textMuted }}>
                {formatTimecode(segment.startMs)}
              </Typography>
            }
          />
        </ListItemButton>
      ))}
    </List>
  );
}

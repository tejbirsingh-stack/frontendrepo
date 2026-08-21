import { Box, Typography } from '@mui/material';
import { cv } from '../../theme/cssVars';

export interface AiSummaryBlockProps {
  summary?: string | null;
  tags?: string[];
  loading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  /** Compact spacing for the Insights panel */
  compact?: boolean;
}

export default function AiSummaryBlock({
  summary,
  tags = [],
  loading = false,
  error = null,
  emptyMessage = 'No AI summary yet.',
  compact = false,
}: AiSummaryBlockProps) {
  const trimmed = summary?.trim() || '';
  const tagList = tags.filter((t) => typeof t === 'string' && t.trim().length > 0);
  const hasContent = Boolean(trimmed) || tagList.length > 0;

  if (loading) {
    return (
      <Typography sx={{ fontSize: '0.8125rem', color: cv.textMuted }}>
        Loading summary…
      </Typography>
    );
  }

  if (error) {
    return (
      <Typography sx={{ fontSize: '0.8125rem', color: cv.textMuted }} role="status">
        {error}
      </Typography>
    );
  }

  if (!hasContent) {
    return (
      <Typography sx={{ fontSize: '0.8125rem', color: cv.textMuted }}>
        {emptyMessage}
      </Typography>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: compact ? 0.75 : 1.25 }}>
      {trimmed ? (
        <Typography
          sx={{
            fontSize: compact ? '0.8125rem' : '0.875rem',
            lineHeight: 1.5,
            color: cv.textPrimary,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {trimmed}
        </Typography>
      ) : null}

      {tagList.length > 0 ? (
        <Box
          sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}
          aria-label="AI tags"
        >
          {tagList.map((tag) => (
            <Box
              key={tag}
              component="span"
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                px: 0.875,
                py: 0.25,
                borderRadius: '999px',
                border: `1px solid ${cv.purpleChipBorder}`,
                backgroundColor: cv.purpleSurface,
              }}
            >
              <Typography
                component="span"
                sx={{
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  color: cv.brandPurpleLight,
                  lineHeight: 1.4,
                }}
              >
                {tag}
              </Typography>
            </Box>
          ))}
        </Box>
      ) : null}
    </Box>
  );
}

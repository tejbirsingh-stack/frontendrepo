import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  Typography,
} from '@mui/material';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import { cv } from '../../theme/cssVars';
import type { AiAnalyzeFeature } from '../../api/ai.service';

export type AiFeatureSelectDialogProps = {
  open: boolean;
  mediaType?: string | null;
  submitting?: boolean;
  onClose: () => void;
  onConfirm: (features: AiAnalyzeFeature[]) => void;
};

const dialogPaperSx = {
  borderRadius: '20px',
  border: '1px solid var(--noah-border)',
  background: 'var(--noah-dialog-surface)',
  backdropFilter: 'blur(40px) saturate(180%)',
  boxShadow: cv.dialogShadow,
  maxWidth: 480,
};

type FeatureOption = {
  key: AiAnalyzeFeature;
  label: string;
  description: string;
  videoOnly?: boolean;
};

const FEATURE_OPTIONS: FeatureOption[] = [
  {
    key: 'asr',
    label: 'Transcript',
    description: 'Generate a timed transcript from the audio track.',
  },
  {
    key: 'highlights',
    label: 'Summary & tags',
    description: 'Create a short summary and topic tags from the transcript.',
  },
  {
    key: 'embeddings',
    label: 'Semantic search',
    description: 'Index the transcript so it can be found with natural-language search.',
  },
  {
    key: 'people_scenes',
    label: 'People & scenes',
    description: 'Detect people and scene labels with timestamps to seek in the player.',
    videoOnly: true,
  },
];

function defaultSelection(mediaType?: string | null): Record<AiAnalyzeFeature, boolean> {
  const isVideo = mediaType === 'video';
  return {
    asr: true,
    highlights: true,
    embeddings: true,
    people_scenes: isVideo,
  };
}

export default function AiFeatureSelectDialog({
  open,
  mediaType,
  submitting = false,
  onClose,
  onConfirm,
}: AiFeatureSelectDialogProps) {
  const [selected, setSelected] = useState<Record<AiAnalyzeFeature, boolean>>(() =>
    defaultSelection(mediaType),
  );

  useEffect(() => {
    if (open) {
      setSelected(defaultSelection(mediaType));
    }
  }, [open, mediaType]);

  const visibleOptions = useMemo(
    () => FEATURE_OPTIONS.filter((opt) => !(opt.videoOnly && mediaType !== 'video')),
    [mediaType],
  );

  const selectedFeatures = useMemo(
    () => visibleOptions.filter((opt) => selected[opt.key]).map((opt) => opt.key),
    [selected, visibleOptions],
  );

  const toggleFeature = (key: AiAnalyzeFeature, checked: boolean) => {
    setSelected((prev) => {
      const next = { ...prev, [key]: checked };
      if (checked && (key === 'highlights' || key === 'embeddings')) {
        next.asr = true;
      }
      if (key === 'asr' && !checked) {
        next.highlights = false;
        next.embeddings = false;
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelected((prev) => {
      const next = { ...prev };
      for (const opt of visibleOptions) {
        next[opt.key] = true;
      }
      return next;
    });
  };

  const clearAll = () => {
    setSelected({
      asr: false,
      highlights: false,
      embeddings: false,
      people_scenes: false,
    });
  };

  return (
    <Dialog
      open={open}
      onClose={submitting ? undefined : onClose}
      fullWidth
      aria-labelledby="ai-feature-select-title"
      slotProps={{
        paper: { sx: dialogPaperSx },
        backdrop: {
          sx: { backgroundColor: cv.backdropScrim, backdropFilter: 'blur(4px)' },
        },
      }}
    >
      <DialogTitle
        id="ai-feature-select-title"
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1,
          pb: 1,
          fontWeight: 600,
          fontSize: '1.125rem',
          color: cv.textPrimary,
        }}
      >
        <Typography component="span" sx={{ fontWeight: 600, fontSize: '1.125rem' }}>
          Run AI insights
        </Typography>
        <IconButton
          type="button"
          aria-label="Close"
          onClick={onClose}
          disabled={submitting}
          sx={{ color: cv.textSecondary }}
        >
          <CloseOutlinedIcon sx={{ fontSize: 20 }} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: '8px !important', pb: 1 }}>
        <Typography sx={{ fontSize: '0.875rem', color: cv.textSecondary, mb: 1.5 }}>
          Choose which AI features to run for this media. You can select any combination.
        </Typography>

        <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
          <Button
            type="button"
            size="small"
            onClick={selectAll}
            disabled={submitting}
            sx={{ textTransform: 'none', color: cv.brandBlue, minHeight: 44 }}
          >
            Select all
          </Button>
          <Button
            type="button"
            size="small"
            onClick={clearAll}
            disabled={submitting}
            sx={{ textTransform: 'none', color: cv.textSecondary, minHeight: 44 }}
          >
            Clear
          </Button>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {visibleOptions.map((opt) => (
            <FormControlLabel
              key={opt.key}
              sx={{
                alignItems: 'flex-start',
                mx: 0,
                py: 0.75,
                px: 1,
                borderRadius: '12px',
                '&:hover': { backgroundColor: cv.surfaceHover },
              }}
              control={
                <Checkbox
                  checked={Boolean(selected[opt.key])}
                  onChange={(_, checked) => toggleFeature(opt.key, checked)}
                  disabled={submitting}
                  sx={{
                    color: cv.textSecondary,
                    '&.Mui-checked': { color: cv.brandBlue },
                    mt: -0.25,
                  }}
                />
              }
              label={
                <Box sx={{ pt: 0.5 }}>
                  <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: cv.textPrimary }}>
                    {opt.label}
                  </Typography>
                  <Typography sx={{ fontSize: '0.75rem', color: cv.textSecondary, lineHeight: 1.4 }}>
                    {opt.description}
                  </Typography>
                </Box>
              }
            />
          ))}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, pt: 1, gap: 1 }}>
        <Button
          type="button"
          onClick={onClose}
          disabled={submitting}
          sx={{ textTransform: 'none', color: cv.textSecondary, minHeight: 44 }}
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="contained"
          disableElevation
          disabled={submitting || selectedFeatures.length === 0}
          onClick={() => onConfirm(selectedFeatures)}
          sx={{
            textTransform: 'none',
            borderRadius: '10px',
            px: 2.5,
            minHeight: 44,
            backgroundColor: cv.brandBlue,
            '&:hover': { backgroundColor: cv.brandBlueDark },
          }}
        >
          {submitting ? 'Starting…' : 'Run AI insights'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

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

export type AiFeatureSelectMode = 'initial' | 'add';

export type AiFeatureSelectDialogProps = {
  open: boolean;
  mediaType?: string | null;
  submitting?: boolean;
  /** initial = first run; add = run features skipped earlier */
  mode?: AiFeatureSelectMode;
  /** Features already completed — checked and disabled in add mode */
  lockedFeatures?: AiAnalyzeFeature[];
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

const ALL_FEATURES: AiAnalyzeFeature[] = ['asr', 'highlights', 'embeddings', 'people_scenes'];

function defaultSelection(
  mediaType?: string | null,
  mode: AiFeatureSelectMode = 'initial',
  locked: Set<AiAnalyzeFeature> = new Set(),
): Record<AiAnalyzeFeature, boolean> {
  const isVideo = mediaType === 'video';
  if (mode === 'add') {
    return {
      asr: locked.has('asr') ? true : true,
      highlights: locked.has('highlights') ? true : true,
      embeddings: locked.has('embeddings') ? true : true,
      people_scenes: locked.has('people_scenes') ? true : isVideo,
    };
  }
  return {
    asr: true,
    highlights: true,
    embeddings: true,
    people_scenes: isVideo,
  };
}

/** Features that are done and should not be re-requested in add mode. */
export function getLockedAiFeatures(params: {
  steps?: Record<string, string> | null;
  mediaType?: string | null;
  hasTranscript?: boolean;
  hasHighlights?: boolean;
  hasPeopleOrScenes?: boolean;
}): AiAnalyzeFeature[] {
  const steps = params.steps || {};
  const locked: AiAnalyzeFeature[] = [];

  const asrStep = steps.asr;
  if (asrStep === 'completed' || params.hasTranscript) {
    locked.push('asr');
  }

  const highlightsStep = steps.highlights;
  if (highlightsStep === 'completed' || params.hasHighlights) {
    locked.push('highlights');
  }

  const embeddingsStep = steps.embeddings;
  if (embeddingsStep === 'completed') {
    locked.push('embeddings');
  }

  if (params.mediaType === 'video') {
    const peopleStep = steps.people_scenes;
    if (peopleStep === 'completed' || params.hasPeopleOrScenes) {
      locked.push('people_scenes');
    }
  }

  return locked;
}

export function getAvailableAiFeatures(
  mediaType?: string | null,
  locked: AiAnalyzeFeature[] = [],
): AiAnalyzeFeature[] {
  const lockedSet = new Set(locked);
  return ALL_FEATURES.filter((key) => {
    if (lockedSet.has(key)) return false;
    if (key === 'people_scenes' && mediaType !== 'video') return false;
    return true;
  });
}

export default function AiFeatureSelectDialog({
  open,
  mediaType,
  submitting = false,
  mode = 'initial',
  lockedFeatures = [],
  onClose,
  onConfirm,
}: AiFeatureSelectDialogProps) {
  const lockedSet = useMemo(() => new Set(lockedFeatures), [lockedFeatures]);

  const [selected, setSelected] = useState<Record<AiAnalyzeFeature, boolean>>(() =>
    defaultSelection(mediaType, mode, lockedSet),
  );

  useEffect(() => {
    if (open) {
      setSelected(defaultSelection(mediaType, mode, lockedSet));
    }
  }, [open, mediaType, mode, lockedSet]);

  const visibleOptions = useMemo(
    () => FEATURE_OPTIONS.filter((opt) => !(opt.videoOnly && mediaType !== 'video')),
    [mediaType],
  );

  const unlockedSelected = useMemo(
    () =>
      visibleOptions
        .filter((opt) => selected[opt.key] && !lockedSet.has(opt.key))
        .map((opt) => opt.key),
    [selected, visibleOptions, lockedSet],
  );

  const toggleFeature = (key: AiAnalyzeFeature, checked: boolean) => {
    if (lockedSet.has(key)) return;
    setSelected((prev) => {
      const next = { ...prev, [key]: checked };
      if (checked && (key === 'highlights' || key === 'embeddings')) {
        // Prefer existing transcript when asr is locked; otherwise require asr.
        if (!lockedSet.has('asr')) {
          next.asr = true;
        }
      }
      if (key === 'asr' && !checked && !lockedSet.has('asr')) {
        next.highlights = lockedSet.has('highlights') ? next.highlights : false;
        next.embeddings = lockedSet.has('embeddings') ? next.embeddings : false;
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelected((prev) => {
      const next = { ...prev };
      for (const opt of visibleOptions) {
        if (!lockedSet.has(opt.key)) {
          next[opt.key] = true;
        }
      }
      return next;
    });
  };

  const clearAll = () => {
    setSelected((prev) => {
      const next = { ...prev };
      for (const opt of visibleOptions) {
        if (!lockedSet.has(opt.key)) {
          next[opt.key] = false;
        }
      }
      return next;
    });
  };

  const isAdd = mode === 'add';
  const title = isAdd ? 'Add AI features' : 'Run AI insights';
  const description = isAdd
    ? 'Choose additional AI features to run. Features already completed stay selected and cannot be changed.'
    : 'Choose which AI features to run for this media. You can select any combination.';
  const confirmLabel = submitting ? 'Starting…' : isAdd ? 'Run selected' : 'Run AI insights';

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
          {title}
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
          {description}
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
          {visibleOptions.map((opt) => {
            const locked = lockedSet.has(opt.key);
            return (
              <FormControlLabel
                key={opt.key}
                sx={{
                  alignItems: 'flex-start',
                  mx: 0,
                  py: 0.75,
                  px: 1,
                  borderRadius: '12px',
                  opacity: locked ? 0.72 : 1,
                  '&:hover': { backgroundColor: locked ? 'transparent' : cv.surfaceHover },
                }}
                control={
                  <Checkbox
                    checked={Boolean(selected[opt.key])}
                    onChange={(_, checked) => toggleFeature(opt.key, checked)}
                    disabled={submitting || locked}
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
                      {locked ? (
                        <Typography
                          component="span"
                          sx={{ ml: 1, fontSize: '0.7rem', fontWeight: 500, color: cv.textMuted }}
                        >
                          Done
                        </Typography>
                      ) : null}
                    </Typography>
                    <Typography sx={{ fontSize: '0.75rem', color: cv.textSecondary, lineHeight: 1.4 }}>
                      {opt.description}
                    </Typography>
                  </Box>
                }
              />
            );
          })}
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
          disabled={submitting || unlockedSelected.length === 0}
          onClick={() => onConfirm(unlockedSelected)}
          sx={{
            textTransform: 'none',
            borderRadius: '10px',
            px: 2.5,
            minHeight: 44,
            backgroundColor: cv.brandBlue,
            '&:hover': { backgroundColor: cv.brandBlueDark },
          }}
        >
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

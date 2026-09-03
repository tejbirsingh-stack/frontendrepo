import { useMemo } from 'react';
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Typography,
} from '@mui/material';
import { cv } from '../../theme/cssVars';
import type { AiAnalyzeFeature } from '../../api/ai.service';

export type AiFeatureSelectMode = 'initial' | 'add';

type FeatureOption = {
  key: AiAnalyzeFeature;
  label: string;
  description: string;
  videoOnly?: boolean;
};

export const FEATURE_OPTIONS: FeatureOption[] = [
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

export function defaultSelection(
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

export function selectionToFeatures(
  selected: Record<AiAnalyzeFeature, boolean>,
  mediaType?: string | null,
): AiAnalyzeFeature[] {
  return FEATURE_OPTIONS.filter(
    (opt) => selected[opt.key] && !(opt.videoOnly && mediaType !== 'video'),
  ).map((opt) => opt.key);
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

export type AiFeatureCheckboxGroupProps = {
  mediaType?: string | null;
  selected: Record<AiAnalyzeFeature, boolean>;
  onSelectedChange: (next: Record<AiAnalyzeFeature, boolean>) => void;
  lockedFeatures?: AiAnalyzeFeature[];
  disabled?: boolean;
  /** Show Select all / Clear controls */
  showBulkActions?: boolean;
  /** Compact layout for inline forms (upload modal) */
  variant?: 'default' | 'compact';
};

export function toggleAiFeatureSelection(
  prev: Record<AiAnalyzeFeature, boolean>,
  key: AiAnalyzeFeature,
  checked: boolean,
  lockedSet: Set<AiAnalyzeFeature>,
): Record<AiAnalyzeFeature, boolean> {
  if (lockedSet.has(key)) return prev;
  const next = { ...prev, [key]: checked };
  if (checked && (key === 'highlights' || key === 'embeddings')) {
    if (!lockedSet.has('asr')) {
      next.asr = true;
    }
  }
  if (key === 'asr' && !checked && !lockedSet.has('asr')) {
    next.highlights = lockedSet.has('highlights') ? next.highlights : false;
    next.embeddings = lockedSet.has('embeddings') ? next.embeddings : false;
  }
  return next;
}

export default function AiFeatureCheckboxGroup({
  mediaType,
  selected,
  onSelectedChange,
  lockedFeatures = [],
  disabled = false,
  showBulkActions = true,
  variant = 'default',
}: AiFeatureCheckboxGroupProps) {
  const lockedSet = useMemo(() => new Set(lockedFeatures), [lockedFeatures]);

  const visibleOptions = useMemo(
    () => FEATURE_OPTIONS.filter((opt) => !(opt.videoOnly && mediaType !== 'video')),
    [mediaType],
  );

  const toggleFeature = (key: AiAnalyzeFeature, checked: boolean) => {
    onSelectedChange(toggleAiFeatureSelection(selected, key, checked, lockedSet));
  };

  const selectAll = () => {
    onSelectedChange(
      visibleOptions.reduce(
        (acc, opt) => {
          if (!lockedSet.has(opt.key)) {
            acc[opt.key] = true;
          }
          return acc;
        },
        { ...selected },
      ),
    );
  };

  const clearAll = () => {
    onSelectedChange(
      visibleOptions.reduce(
        (acc, opt) => {
          if (!lockedSet.has(opt.key)) {
            acc[opt.key] = false;
          }
          return acc;
        },
        { ...selected },
      ),
    );
  };

  const isCompact = variant === 'compact';

  return (
    <Box>
      {showBulkActions ? (
        <Box sx={{ display: 'flex', gap: 1, mb: isCompact ? 1 : 1.5 }}>
          <Button
            type="button"
            size="small"
            onClick={selectAll}
            disabled={disabled}
            sx={{ textTransform: 'none', color: cv.brandBlue, minHeight: 44 }}
          >
            Select all
          </Button>
          <Button
            type="button"
            size="small"
            onClick={clearAll}
            disabled={disabled}
            sx={{ textTransform: 'none', color: cv.textSecondary, minHeight: 44 }}
          >
            Clear
          </Button>
        </Box>
      ) : null}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: isCompact ? 0 : 0.5 }}>
        {visibleOptions.map((opt) => {
          const locked = lockedSet.has(opt.key);
          return (
            <FormControlLabel
              key={opt.key}
              sx={{
                alignItems: 'flex-start',
                mx: 0,
                py: isCompact ? 0.5 : 0.75,
                px: 1,
                borderRadius: '12px',
                opacity: locked ? 0.72 : 1,
                '&:hover': {
                  backgroundColor: locked || disabled ? 'transparent' : cv.surfaceHover,
                },
              }}
              control={
                <Checkbox
                  checked={Boolean(selected[opt.key])}
                  onChange={(_, checked) => toggleFeature(opt.key, checked)}
                  disabled={disabled || locked}
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
    </Box>
  );
}

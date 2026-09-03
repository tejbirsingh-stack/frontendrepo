import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
} from '@mui/material';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import { cv } from '../../theme/cssVars';
import type { AiAnalyzeFeature } from '../../api/ai.service';
import AiFeatureCheckboxGroup, {
  FEATURE_OPTIONS,
  defaultSelection,
  getLockedAiFeatures,
  type AiFeatureSelectMode,
} from './AiFeatureCheckboxGroup';

export type { AiFeatureSelectMode };
export { defaultSelection, getLockedAiFeatures };
export { getAvailableAiFeatures } from './AiFeatureCheckboxGroup';

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

        <AiFeatureCheckboxGroup
          mediaType={mediaType}
          selected={selected}
          onSelectedChange={setSelected}
          lockedFeatures={lockedFeatures}
          disabled={submitting}
        />
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

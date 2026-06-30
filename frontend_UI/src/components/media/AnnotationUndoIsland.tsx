import { Box, IconButton } from '@mui/material';
import { cv } from '../../theme/cssVars';
import DeleteSweepOutlinedIcon from '@mui/icons-material/DeleteSweepOutlined';
import LabeledToolbarButton from './LabeledToolbarButton';
import ShortcutTooltip from './ShortcutTooltip';
import {
  ANNOTATION_TOOL_BUTTON_SIZE,
  ANNOTATION_TOOL_ICON_SIZE,
} from '../../constants/layout';

const ISLAND_BUTTON_SIZE = ANNOTATION_TOOL_BUTTON_SIZE;
const ISLAND_ICON_SIZE = ANNOTATION_TOOL_ICON_SIZE;

const islandSx = {
  display: 'flex',
  alignItems: 'center',
  gap: 0.5,
  px: { xs: 0.75, lg: 1.25 },
  py: { xs: 0.5, lg: 0.75 },
  borderRadius: '999px',
  border: '1px solid var(--noah-border)',
  background: 'var(--noah-toolbar-surface)',
  backdropFilter: 'blur(24px) saturate(160%)',
  WebkitBackdropFilter: 'blur(24px) saturate(160%)',
  boxShadow: cv.islandShadow,
};

interface AnnotationUndoIslandProps {
  canClear: boolean;
  onClear: () => void;
  compact?: boolean;
}

export default function AnnotationUndoIsland({
  canClear,
  onClear,
  compact = false,
}: AnnotationUndoIslandProps) {
  if (compact) {
    return (
      <LabeledToolbarButton
        label="Clear"
        disabled={!canClear}
        onClick={onClear}
        ariaLabel="Clear all annotations"
      >
        <DeleteSweepOutlinedIcon sx={{ fontSize: ISLAND_ICON_SIZE }} />
      </LabeledToolbarButton>
    );
  }

  return (
    <Box role="toolbar" aria-label="Annotation history controls" sx={islandSx}>
      <ShortcutTooltip label="Clear all annotations">
        <span>
          <IconButton
            type="button"
            aria-label="Clear all annotations"
            disabled={!canClear}
            onClick={onClear}
            sx={{
              width: ISLAND_BUTTON_SIZE,
              height: ISLAND_BUTTON_SIZE,
              borderRadius: { xs: '8px', lg: '10px' },
              color: canClear ? cv.textSecondary : cv.textMuted,
              '&:hover': {
                backgroundColor: canClear ? cv.surfaceHover : undefined,
                color: canClear ? cv.destructive : cv.textMuted,
              },
              '&.Mui-disabled': {
                color: cv.textMuted,
              },
            }}
          >
            <DeleteSweepOutlinedIcon sx={{ fontSize: ISLAND_ICON_SIZE }} />
          </IconButton>
        </span>
      </ShortcutTooltip>
    </Box>
  );
}

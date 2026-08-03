import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';
import {
  annotationToolShortcuts,
  getRedoShortcutLabel,
  getUndoShortcutLabel,
  workspaceZoomShortcuts,
} from '../../constants/annotationShortcuts';
import { timelineZoomShortcuts } from '../../utils/timelineZoom';
import { cv } from '../../theme/cssVars';
import { PLAYER_TOOL_SECTIONS } from '../../constants/playerTools';

interface AnnotationHelpDialogProps {
  open: boolean;
  onClose: () => void;
}

const dialogPaperSx = {
  borderRadius: '20px',
  border: "1px solid var(--noah-border)",
  background: 'var(--noah-dialog-surface)',
  backdropFilter: 'blur(40px) saturate(180%)',
  boxShadow: cv.dialogShadow,
  maxWidth: 480,
};

const toolLabels: Record<string, string> = {
  select: 'Select',
  pan: 'Pan',
  draw: 'Draw',
  shape: 'Shape',
  comment: 'Comment',
  stamp: 'Stamp',
};

const annotationShortcutRows = [
  ...Object.entries(annotationToolShortcuts).map(([tool, shortcut]) => ({
    label: toolLabels[tool] ?? tool,
    shortcut,
  })),
  { label: 'Workspace zoom in', shortcut: workspaceZoomShortcuts.in },
  { label: 'Workspace zoom out', shortcut: workspaceZoomShortcuts.out },
  {
    label: 'Timeline zoom in (over timeline)',
    shortcut: timelineZoomShortcuts.in,
  },
  {
    label: 'Timeline zoom out (over timeline)',
    shortcut: timelineZoomShortcuts.out,
  },
  { label: 'Undo', shortcut: getUndoShortcutLabel() },
  { label: 'Redo', shortcut: getRedoShortcutLabel() },
];

const playerToolShortcutRows = [
  { label: 'Previous frame', shortcut: 'Shift+← or ,' },
  { label: 'Next frame', shortcut: 'Shift+→ or .' },
  ...PLAYER_TOOL_SECTIONS.flat()
    .filter((tool) => Boolean(tool.shortcut))
    .map((tool) => ({
      label: tool.label,
      shortcut: tool.shortcut!,
    })),
];

function ShortcutList({ rows }: { rows: { label: string; shortcut: string }[] }) {
  return (
    <Box
      component="dl"
      sx={{
        m: 0,
        display: 'grid',
        gridTemplateColumns: '1fr auto',
        gap: 1,
        alignItems: 'center',
      }}
    >
      {rows.map((row) => (
        <Box key={row.label} sx={{ display: 'contents' }}>
          <Typography
            component="dt"
            sx={{ fontSize: '0.875rem', color: cv.textSecondary, m: 0 }}
          >
            {row.label}
          </Typography>
          <Box
            component="dd"
            sx={{
              m: 0,
              justifySelf: 'end',
              minWidth: 28,
              px: 0.75,
              py: 0.25,
              borderRadius: '6px',
              backgroundColor: cv.surfaceRaised,
              color: cv.textPrimary,
              fontSize: '0.75rem',
              fontWeight: 600,
              textAlign: 'center',
            }}
          >
            {row.shortcut}
          </Box>
        </Box>
      ))}
    </Box>
  );
}

export default function AnnotationHelpDialog({ open, onClose }: AnnotationHelpDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      aria-labelledby="annotation-help-title"
      slotProps={{
        paper: { sx: dialogPaperSx },
        backdrop: {
          sx: { backgroundColor: cv.backdropScrim, backdropFilter: 'blur(4px)' },
        },
      }}
    >
      <DialogTitle
        id="annotation-help-title"
        sx={{
          pb: 1,
          fontWeight: 600,
          fontSize: '1.25rem',
          color: cv.textPrimary,
        }}
      >
        Keyboard shortcuts
      </DialogTitle>
      <DialogContent sx={{ pt: '8px !important', maxHeight: 'min(70vh, 560px)' }}>
        <ShortcutList rows={annotationShortcutRows} />

        <Typography
          sx={{
            mt: 2.5,
            mb: 1,
            fontSize: '0.75rem',
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: cv.textMuted,
          }}
        >
          Player tools
        </Typography>

        <ShortcutList rows={playerToolShortcutRows} />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, pt: 1 }}>
        <Button
          type="button"
          onClick={onClose}
          variant="contained"
          sx={{
            borderRadius: '10px',
            px: 2.5,
            backgroundColor: cv.brandBlue,
            '&:hover': { backgroundColor: cv.brandBlueDark },
          }}
        >
          Got it
        </Button>
      </DialogActions>
    </Dialog>
  );
}

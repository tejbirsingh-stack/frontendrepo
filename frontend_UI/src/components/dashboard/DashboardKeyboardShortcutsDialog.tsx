import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';
import { getDashboardShortcutDefinitions } from '../../constants/dashboardShortcuts';
import { useResolvedKeyboardShortcuts } from '../../hooks/useResolvedKeyboardShortcuts';
import { cv } from '../../theme/cssVars';

interface DashboardKeyboardShortcutsDialogProps {
  open: boolean;
  onClose: () => void;
}

const dialogPaperSx = {
  borderRadius: '20px',
  border: '1px solid var(--noah-border)',
  background: 'var(--noah-dialog-surface)',
  backdropFilter: 'blur(40px) saturate(180%)',
  boxShadow: cv.dialogShadow,
  maxWidth: 480,
};

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
      {rows.map((row, index) => (
        <Box key={`${row.label}-${row.shortcut}-${index}`} sx={{ display: 'contents' }}>
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
              whiteSpace: 'nowrap',
            }}
          >
            {row.shortcut}
          </Box>
        </Box>
      ))}
    </Box>
  );
}

export default function DashboardKeyboardShortcutsDialog({
  open,
  onClose,
}: DashboardKeyboardShortcutsDialogProps) {
  const { getShortcut } = useResolvedKeyboardShortcuts();
  const rows = getDashboardShortcutDefinitions().map((row) => ({
    label: row.label,
    shortcut: getShortcut(row.id) ?? row.shortcut,
  }));

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      aria-labelledby="dashboard-shortcuts-title"
      slotProps={{
        paper: { sx: dialogPaperSx },
        backdrop: {
          sx: { backgroundColor: cv.backdropScrim, backdropFilter: 'blur(4px)' },
        },
      }}
    >
      <DialogTitle
        id="dashboard-shortcuts-title"
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
        <Typography
          sx={{
            mb: 1.5,
            fontSize: '0.75rem',
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: cv.textMuted,
          }}
        >
          Library
        </Typography>

        <ShortcutList rows={rows} />
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

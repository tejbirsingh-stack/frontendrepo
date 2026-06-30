import { useEffect, useState } from 'react';
import { cv } from '../../theme/cssVars';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from '@mui/material';
import DeleteSweepOutlinedIcon from '@mui/icons-material/DeleteSweepOutlined';

const CONFIRMATION_PHRASE = 'Delete all annotations';

interface ClearAnnotationsModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const dialogPaperSx = {
  borderRadius: '20px',
  border: "1px solid var(--noah-border)",
  background: 'var(--noah-dialog-surface)',
  backdropFilter: 'blur(40px) saturate(180%)',
  boxShadow: cv.dialogShadow,
  maxWidth: 440,
};

export default function ClearAnnotationsModal({
  open,
  onClose,
  onConfirm,
}: ClearAnnotationsModalProps) {
  const [confirmationText, setConfirmationText] = useState('');
  const isConfirmed = confirmationText === CONFIRMATION_PHRASE;

  useEffect(() => {
    if (!open) {
      setConfirmationText('');
    }
  }, [open]);

  const handleClose = () => {
    setConfirmationText('');
    onClose();
  };

  const handleConfirm = () => {
    if (!isConfirmed) return;
    setConfirmationText('');
    onConfirm();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      aria-labelledby="clear-annotations-title"
      aria-describedby="clear-annotations-desc"
      slotProps={{
        paper: { sx: dialogPaperSx },
        backdrop: {
          sx: { backgroundColor: cv.backdropScrim, backdropFilter: 'blur(4px)' },
        },
      }}
    >
      <DialogTitle
        id="clear-annotations-title"
        sx={{
          pb: 1,
          fontWeight: 600,
          fontSize: '1.25rem',
          color: cv.textPrimary,
        }}
      >
        Clear all annotations?
      </DialogTitle>
      <DialogContent sx={{ pt: '8px !important' }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 1.5,
            p: 1.5,
            borderRadius: '12px',
            border: `1px solid ${cv.redGlowSoft}`,
            backgroundColor: cv.destructiveHover,
          }}
        >
          <DeleteSweepOutlinedIcon
            sx={{ fontSize: 22, color: cv.destructive, mt: 0.25, flexShrink: 0 }}
          />
          <Typography
            id="clear-annotations-desc"
            variant="body2"
            sx={{ color: cv.textSecondary, fontSize: '0.875rem', lineHeight: 1.5 }}
          >
            This will remove every comment, drawing, shape, and stamp
            annotation from this video. You can undo this action afterward.
          </Typography>
        </Box>

        <Typography
          id="clear-annotations-confirm-label"
          sx={{ mt: 2.5, mb: 1, fontSize: '0.875rem', color: cv.textSecondary }}
        >
          Type{' '}
          <Box component="span" sx={{ fontWeight: 600, color: cv.textPrimary }}>
            {CONFIRMATION_PHRASE}
          </Box>{' '}
          to confirm.
        </Typography>

        <TextField
          autoFocus
          fullWidth
          value={confirmationText}
          onChange={(event) => setConfirmationText(event.target.value)}
          placeholder={CONFIRMATION_PHRASE}
          aria-labelledby="clear-annotations-confirm-label"
          aria-describedby="clear-annotations-desc"
          size="small"
          sx={{
            '& .MuiInputBase-root': {
              borderRadius: '10px',
              fontSize: '0.875rem',
              color: cv.textPrimary,
              backgroundColor: cv.surface,
            },
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: cv.border,
            },
            '& .Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: cv.destructiveBorder,
            },
          }}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, pt: 1, gap: 1 }}>
        <Button
          type="button"
          onClick={handleClose}
          sx={{
            color: cv.textSecondary,
            borderRadius: '10px',
            '&:hover': { backgroundColor: cv.surfaceHover },
          }}
        >
          Cancel
        </Button>
        <Button
          type="button"
          onClick={handleConfirm}
          disabled={!isConfirmed}
          variant="contained"
          sx={{
            borderRadius: '10px',
            px: 2.5,
            backgroundColor: cv.destructiveBorder,
            boxShadow: cv.redGlowSoft,
            '&:hover': {
              backgroundColor: cv.destructiveStrong,
            },
            '&.Mui-disabled': {
              backgroundColor: cv.destructiveBorderSoft,
              color: cv.textInverseMuted,
            },
          }}
        >
          Clear all
        </Button>
      </DialogActions>
    </Dialog>
  );
}

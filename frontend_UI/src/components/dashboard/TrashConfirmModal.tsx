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
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';

interface TrashConfirmModalProps {
  open: boolean;
  itemTitle: string;
  /** Individual names shown when deleting multiple items. */
  itemNames?: string[];
  title?: string;
  confirmLabel?: string;
  description?: string;
  /** Phrase the user must type to confirm. Defaults to itemTitle. */
  confirmationPhrase?: string;
  /** Require typing the confirmation phrase before delete is enabled. */
  requireNameConfirmation?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

function blockClipboardInsertion(event: React.ClipboardEvent | React.DragEvent) {
  event.preventDefault();
}

const dialogPaperSx = {
  borderRadius: '20px',
  border: "1px solid var(--noah-border)",
  background: 'var(--noah-dialog-surface)',
  backdropFilter: 'blur(40px) saturate(180%)',
  boxShadow: cv.dialogShadow,
  maxWidth: 440,
};

export default function TrashConfirmModal({
  open,
  itemTitle,
  itemNames,
  title = 'Move to trash?',
  confirmLabel = 'Move to trash',
  description = 'This item will be removed from your library and moved to trash. You can restore it later from the Trash view.',
  confirmationPhrase,
  requireNameConfirmation = false,
  onClose,
  onConfirm,
}: TrashConfirmModalProps) {
  const [confirmationText, setConfirmationText] = useState('');
  const phraseToConfirm = confirmationPhrase ?? itemTitle;
  const isNameConfirmed = !requireNameConfirmation || confirmationText === phraseToConfirm;
  const isMultiItem = (itemNames?.length ?? 0) > 1;

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
    if (!isNameConfirmed) return;
    setConfirmationText('');
    onConfirm();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      aria-labelledby="trash-confirm-title"
      aria-describedby="trash-confirm-desc"
      slotProps={{
        paper: { sx: dialogPaperSx },
        backdrop: {
          sx: { backgroundColor: cv.backdropScrim, backdropFilter: 'blur(4px)' },
        },
      }}
    >
      <DialogTitle
        id="trash-confirm-title"
        sx={{
          pb: 1,
          fontWeight: 600,
          fontSize: '1.25rem',
          color: cv.textPrimary,
        }}
      >
        {title}
      </DialogTitle>
      <DialogContent sx={{ pt: '8px !important' }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 1.5,
            p: 1.5,
            mb: requireNameConfirmation ? 0 : 2,
            borderRadius: '12px',
            border: `1px solid ${cv.redGlowSoft}`,
            backgroundColor: cv.destructiveHover,
          }}
        >
          <DeleteOutlinedIcon sx={{ fontSize: 22, color: cv.destructive, mt: 0.25, flexShrink: 0 }} />
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography
              variant="body2"
              sx={{ fontWeight: 600, color: cv.textPrimary, mb: isMultiItem ? 1 : 0.5 }}
            >
              {itemTitle}
            </Typography>

            {isMultiItem ? (
              <Box
                component="ul"
                sx={{
                  m: 0,
                  mb: 1,
                  pl: 2,
                  maxHeight: 160,
                  overflowY: 'auto',
                  '& li': {
                    fontSize: '0.875rem',
                    color: cv.textPrimary,
                    fontWeight: 500,
                    py: 0.25,
                  },
                }}
              >
                {itemNames!.map((name, index) => (
                  <Box component="li" key={`${name}-${index}`}>
                    {name}
                  </Box>
                ))}
              </Box>
            ) : null}

            <Typography
              id="trash-confirm-desc"
              variant="body2"
              sx={{ color: cv.textSecondary, fontSize: '0.875rem' }}
            >
              {description}
            </Typography>
          </Box>
        </Box>

        {requireNameConfirmation ? (
          <>
            <Typography
              id="trash-confirm-name-label"
              sx={{ mt: 2.5, mb: 1, fontSize: '0.875rem', color: cv.textSecondary }}
            >
              Type{' '}
              <Box component="span" sx={{ fontWeight: 600, color: cv.textPrimary }}>
                {phraseToConfirm}
              </Box>{' '}
              to confirm.
            </Typography>

            <TextField
              autoFocus
              fullWidth
              value={confirmationText}
              onChange={(event) => setConfirmationText(event.target.value)}
              placeholder={phraseToConfirm}
              aria-labelledby="trash-confirm-name-label"
              aria-describedby="trash-confirm-desc"
              size="small"
              slotProps={{
                htmlInput: {
                  onPaste: blockClipboardInsertion,
                  onDrop: blockClipboardInsertion,
                },
              }}
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
          </>
        ) : null}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, pt: 1, gap: 1 }}>
        <Button
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
          onClick={handleConfirm}
          disabled={!isNameConfirmed}
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
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

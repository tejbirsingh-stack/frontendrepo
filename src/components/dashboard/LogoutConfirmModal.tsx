import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import { cv } from '../../theme/cssVars';

interface LogoutConfirmModalProps {
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

export default function LogoutConfirmModal({
  open,
  onClose,
  onConfirm,
}: LogoutConfirmModalProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      aria-labelledby="logout-confirm-title"
      aria-describedby="logout-confirm-desc"
      slotProps={{
        paper: { sx: dialogPaperSx },
        backdrop: {
          sx: { backgroundColor: cv.backdropScrim, backdropFilter: 'blur(4px)' },
        },
      }}
    >
      <DialogTitle
        id="logout-confirm-title"
        sx={{
          pb: 1,
          fontWeight: 600,
          fontSize: '1.25rem',
          color: cv.textPrimary,
        }}
      >
        Log out?
      </DialogTitle>
      <DialogContent sx={{ pt: '8px !important' }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 1.5,
            p: 1.5,
            borderRadius: '12px',
            border: "1px solid var(--noah-border)",
            backgroundColor: cv.surface,
          }}
        >
          <LogoutOutlinedIcon
            sx={{ fontSize: 22, color: cv.textSecondary, mt: 0.25, flexShrink: 0 }}
          />
          <Typography
            id="logout-confirm-desc"
            variant="body2"
            sx={{ color: cv.textSecondary, fontSize: '0.875rem', lineHeight: 1.5 }}
          >
            You will be signed out of NOAH and returned to the login screen. Any unsaved work may
            be lost.
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, pt: 1, gap: 1 }}>
        <Button
          type="button"
          onClick={onClose}
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
          onClick={onConfirm}
          variant="contained"
          sx={{
            borderRadius: '10px',
            px: 2.5,
            backgroundColor: cv.destructiveBorder,
            boxShadow: cv.redGlowSoft,
            '&:hover': {
              backgroundColor: cv.destructiveStrong,
            },
          }}
        >
          Log out
        </Button>
      </DialogActions>
    </Dialog>
  );
}

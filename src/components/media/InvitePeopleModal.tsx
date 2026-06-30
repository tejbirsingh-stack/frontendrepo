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

interface InvitePeopleModalProps {
  open: boolean;
  onClose: () => void;
  onInvite: (name: string, email: string) => boolean;
}

const dialogPaperSx = {
  borderRadius: '20px',
  border: "1px solid var(--noah-border)",
  background: 'var(--noah-dialog-surface)',
  backdropFilter: 'blur(40px) saturate(180%)',
  boxShadow: cv.dialogShadow,
  maxWidth: 440,
};

export default function InvitePeopleModal({ open, onClose, onInvite }: InvitePeopleModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setName('');
    setEmail('');
    setError('');
  }, [open]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName || !trimmedEmail) {
      setError('Name and email are required.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError('Enter a valid email address.');
      return;
    }

    const success = onInvite(trimmedName, trimmedEmail);
    if (!success) {
      setError('This person is already collaborating on this file.');
      return;
    }

    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      aria-labelledby="invite-people-title"
      slotProps={{
        paper: { sx: dialogPaperSx },
        backdrop: {
          sx: { backgroundColor: cv.backdropScrim, backdropFilter: 'blur(4px)' },
        },
      }}
    >
      <Box component="form" onSubmit={handleSubmit}>
        <DialogTitle
          id="invite-people-title"
          sx={{ pb: 1, fontWeight: 600, fontSize: '1.25rem', color: cv.textPrimary }}
        >
          Add people
        </DialogTitle>
        <DialogContent sx={{ pt: '8px !important' }}>
          <Typography variant="body2" sx={{ color: cv.textSecondary, mb: 2 }}>
            Invite a teammate to collaborate on this file from their account.
          </Typography>
          <TextField
            fullWidth
            label="Full name"
            placeholder="e.g. Alex Morgan"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              setError('');
            }}
            autoFocus
            required
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Email address"
            placeholder="name@company.com"
            type="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setError('');
            }}
            required
            slotProps={{ inputLabel: { shrink: true } }}
          />
          {error ? (
            <Typography sx={{ mt: 1.5, fontSize: '0.8125rem', color: cv.destructive }}>
              {error}
            </Typography>
          ) : null}
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
            type="submit"
            variant="contained"
            disabled={!name.trim() || !email.trim()}
            sx={{
              borderRadius: '10px',
              px: 2.5,
              background: cv.brandGradient,
              boxShadow: cv.brandShadow,
              '&:hover': {
                background: cv.brandGradientHover,
              },
            }}
          >
            Send invite
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}

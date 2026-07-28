import { useEffect, useState } from 'react';
import { cv } from '../../theme/cssVars';
import { useDashboard } from '../../context/DashboardContext';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';

interface NewProjectModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (name: string) => void;
  parentFolderTitle?: string;
}

const dialogPaperSx = {
  borderRadius: '20px',
  border: "1px solid var(--noah-border)",
  background: 'var(--noah-dialog-surface)',
  backdropFilter: 'blur(40px) saturate(180%)',
  boxShadow: cv.dialogShadow,
  maxWidth: 440,
};

export default function NewProjectModal({
  open,
  onClose,
  onCreate,
  parentFolderTitle,
}: NewProjectModalProps) {
  const { systemTimezone } = useDashboard();
  const [name, setName] = useState('');

  useEffect(() => {
    if (!open) return;
    setName('');
  }, [open]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onCreate(trimmed);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      aria-labelledby="new-project-title"
      slotProps={{
        paper: { sx: dialogPaperSx },
        backdrop: {
          sx: { backgroundColor: cv.backdropScrim, backdropFilter: 'blur(4px)' },
        },
      }}
    >
      <Box component="form" onSubmit={handleSubmit}>
        <DialogTitle
          id="new-project-title"
          sx={{
            pb: 1,
            fontWeight: 600,
            fontSize: '1.25rem',
            color: cv.textPrimary,
          }}
        >
          New project
        </DialogTitle>
        <DialogContent sx={{ pt: '8px !important' }}>
          <Typography variant="body2" sx={{ color: cv.textSecondary, mb: 2 }}>
            {parentFolderTitle
              ? `Create a new project inside ${parentFolderTitle}.`
              : 'Create a new project in your workspace.'}
          </Typography>
          <TextField
            fullWidth
            label="Project name"
            placeholder="e.g. Summer Campaign"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            required
            helperText={`${name.length}/100`}
            slotProps={{
              inputLabel: { shrink: true },
              htmlInput: { maxLength: 100 }
            }}
            sx={{
              mb: !parentFolderTitle ? 2.5 : 0,
              '& .MuiFormHelperText-root': {
                textAlign: 'right',
                color: cv.textMuted,
                fontSize: '0.75rem',
                mt: 0.5,
              },
            }}
          />

          {!parentFolderTitle && (
            <FormControl fullWidth size="small">
              <InputLabel shrink>Add to folder</InputLabel>
              <Select
                value=""
                displayEmpty
                notched
                disabled
                renderValue={() => {
                  const now = new Date();
                  const currentYear = new Intl.DateTimeFormat('en-US', { year: 'numeric', timeZone: systemTimezone }).format(now);
                  const currentMonth = new Intl.DateTimeFormat('en-US', { month: 'long', timeZone: systemTimezone }).format(now);
                  return `${currentYear} / ${currentMonth}`;
                }}
                sx={{
                  borderRadius: '10px',
                  backgroundColor: cv.surface,
                  '&.Mui-disabled': {
                    backgroundColor: cv.surfaceRaised,
                  }
                }}
              >
                <MenuItem value="">
                  <em>Auto-assigned by workspace</em>
                </MenuItem>
              </Select>
            </FormControl>
          )}
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
            disabled={!name.trim()}
            sx={{
              borderRadius: '10px',
              px: 2.5,
              background: cv.brandGradient,
              boxShadow: cv.brandShadow,
              '&:hover': {
                background: cv.brandGradientHover,
              },
              '&.Mui-disabled': {
                background: cv.surfaceRaised,
                color: cv.textMuted,
              },
            }}
          >
            Create project
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}

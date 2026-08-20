import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  TextField,
  Typography,
} from '@mui/material';
import { toast } from 'react-hot-toast';
import { createPlanFeature, updatePlanFeature, type PlanFeature } from '../api/platformApi';
import { noahDialogSlotProps } from '../../constants/dialogStyles';
import { cv } from '../../theme/cssVars';

const emptyForm = {
  name: '',
  description: '',
  sortOrder: '0',
  isActive: true,
};

export function PlatformFeatureEditModal({
  open,
  feature,
  onClose,
  onSaveSuccess,
}: Readonly<{
  open: boolean;
  feature: PlanFeature | null;
  onClose: () => void;
  onSaveSuccess: () => void;
}>) {
  const [form, setForm] = useState(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      if (feature) {
        setForm({
          name: feature.name,
          description: feature.description || '',
          sortOrder: String(feature.sortOrder),
          isActive: feature.isActive,
        });
      } else {
        setForm(emptyForm);
      }
      setError('');
    }
  }, [open, feature]);

  const save = async () => {
    setError('');
    const body = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      sortOrder: Number(form.sortOrder) || 0,
      isActive: form.isActive,
    };

    if (!body.name) {
      setError('Feature name is required');
      return;
    }

    setIsSaving(true);
    try {
      if (feature) {
        await updatePlanFeature(feature.id, body);
        toast.success('Feature updated successfully');
      } else {
        await createPlanFeature(body);
        toast.success('Feature created successfully');
      }
      onSaveSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Save failed';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      slotProps={noahDialogSlotProps({ overflow: 'hidden' })}
    >
      <DialogTitle sx={{ fontWeight: 600, color: cv.textPrimary }}>
        {feature ? `Edit feature — ${feature.name}` : 'Create feature'}
      </DialogTitle>

      <DialogContent sx={{ pt: '8px !important' }}>
        {error ? (
          <Typography sx={{ color: cv.destructive, mb: 2 }} role="alert">
            {error}
          </Typography>
        ) : null}

        <Box sx={{ display: 'grid', gap: 2 }}>
          <TextField
            label="Feature Name"
            size="small"
            fullWidth
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Single Sign-On (SSO)"
            required
            autoFocus
          />

          <TextField
            label="Description (optional)"
            size="small"
            fullWidth
            multiline
            rows={2}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="A short description of what this feature provides."
          />

          <TextField
            label="Sort Order"
            type="number"
            size="small"
            fullWidth
            value={form.sortOrder}
            onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
            helperText="Lower numbers appear first in the pricing table"
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              />
            }
            label="Active"
            sx={{ ml: 0 }}
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5, pt: 1, gap: 1 }}>
        <Button onClick={onClose} disabled={isSaving} sx={{ textTransform: 'none' }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={() => void save()}
          disabled={isSaving}
          sx={{ textTransform: 'none', minWidth: 90 }}
        >
          {isSaving ? (
            <CircularProgress size={20} color="inherit" />
          ) : feature ? (
            'Update'
          ) : (
            'Create'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

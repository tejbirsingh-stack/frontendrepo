import { useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  TextField,
  Typography,
} from '@mui/material';
import {
  createPlan,
  deletePlan,
  updatePlan,
  type PlatformPlan,
} from '../api/platformApi';
import { PageHeader } from '../components/PlatformUi';
import { PlatformPlansCatalogSection } from '../components/PlatformPlansCatalogSection';
import { noahDialogSlotProps } from '../../constants/dialogStyles';
import { cv } from '../../theme/cssVars';

const emptyForm = {
  id: '',
  name: '',
  description: '',
  monthlyPriceCents: 0,
  yearlyPriceCents: 0,
  maxUsers: 5,
  maxWorkspaces: 3,
  storageQuotaBytes: String(5 * 1024 ** 3),
  featuresText: '',
  ctaLabel: 'Get started',
  isPublic: true,
  isFeatured: false,
  sortOrder: 0,
};

export default function PlatformPlansPage() {
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (plan: PlatformPlan) => {
    setEditingId(plan.id);
    setForm({
      id: plan.id,
      name: plan.name,
      description: plan.description || '',
      monthlyPriceCents: plan.monthlyPriceCents,
      yearlyPriceCents: plan.yearlyPriceCents || plan.annualPriceCents || 0,
      maxUsers: plan.maxUsers,
      maxWorkspaces: plan.maxWorkspaces,
      storageQuotaBytes: plan.storageQuotaBytes,
      featuresText: (plan.features || []).join('\n'),
      ctaLabel: plan.ctaLabel || '',
      isPublic: plan.isPublic,
      isFeatured: plan.isFeatured,
      sortOrder: plan.sortOrder,
    });
    setFormError('');
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setForm(emptyForm);
    setFormError('');
  };

  const save = async () => {
    setFormError('');
    const body = {
      id: form.id,
      name: form.name,
      description: form.description,
      monthlyPriceCents: Number(form.monthlyPriceCents),
      yearlyPriceCents: Number(form.yearlyPriceCents),
      maxUsers: Number(form.maxUsers),
      maxWorkspaces: Number(form.maxWorkspaces),
      storageQuotaBytes: form.storageQuotaBytes,
      features: form.featuresText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
      ctaLabel: form.ctaLabel,
      isPublic: form.isPublic,
      isFeatured: form.isFeatured,
      sortOrder: Number(form.sortOrder),
    };
    try {
      if (editingId) {
        await updatePlan(editingId, body);
      } else {
        await createPlan(body);
      }
      closeModal();
      setRefreshKey((k) => k + 1);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Save failed');
    }
  };

  return (
    <Box>
      <PageHeader
        title="Plans & packages"
        subtitle="Sellable catalog for customer onboarding"
        actions={
          <Button variant="contained" onClick={openCreate} sx={{ textTransform: 'none' }}>
            Create plan
          </Button>
        }
      />
      {error ? <Typography sx={{ color: cv.destructive, mb: 2 }}>{error}</Typography> : null}

      <PlatformPlansCatalogSection
        refreshKey={refreshKey}
        emptyMessage="No plans yet. Create a plan to start building your catalog."
        onEdit={openEdit}
        onDelete={async (plan) => {
          try {
            await deletePlan(plan.id);
          } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Delete failed');
            throw err;
          }
        }}
      />

      <Dialog
        open={modalOpen}
        onClose={closeModal}
        fullWidth
        maxWidth="md"
        aria-labelledby="plan-form-dialog-title"
        slotProps={noahDialogSlotProps({ overflow: 'hidden', maxHeight: '90vh' })}
      >
        <DialogTitle
          id="plan-form-dialog-title"
          sx={{ fontWeight: 600, color: cv.textPrimary }}
        >
          {editingId ? `Edit ${editingId}` : 'Create plan'}
        </DialogTitle>
        <DialogContent sx={{ pt: '8px !important' }}>
          {formError ? (
            <Typography sx={{ color: cv.destructive, mb: 2 }} role="alert">
              {formError}
            </Typography>
          ) : null}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
              gap: 1.5,
            }}
          >
            <TextField
              label="ID / slug"
              size="small"
              value={form.id}
              disabled={Boolean(editingId)}
              onChange={(e) => setForm((f) => ({ ...f, id: e.target.value }))}
            />
            <TextField
              label="Name"
              size="small"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
            <TextField
              label="Monthly cents"
              size="small"
              type="number"
              value={form.monthlyPriceCents}
              onChange={(e) =>
                setForm((f) => ({ ...f, monthlyPriceCents: Number(e.target.value) }))
              }
            />
            <TextField
              label="Yearly cents"
              size="small"
              type="number"
              value={form.yearlyPriceCents}
              onChange={(e) =>
                setForm((f) => ({ ...f, yearlyPriceCents: Number(e.target.value) }))
              }
            />
            <TextField
              label="Max users"
              size="small"
              type="number"
              value={form.maxUsers}
              onChange={(e) => setForm((f) => ({ ...f, maxUsers: Number(e.target.value) }))}
            />
            <TextField
              label="Storage bytes"
              size="small"
              value={form.storageQuotaBytes}
              onChange={(e) => setForm((f) => ({ ...f, storageQuotaBytes: e.target.value }))}
            />
            <TextField
              label="Description"
              size="small"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              sx={{ gridColumn: '1 / -1' }}
            />
            <TextField
              label="Features (one per line)"
              size="small"
              multiline
              minRows={4}
              value={form.featuresText}
              onChange={(e) => setForm((f) => ({ ...f, featuresText: e.target.value }))}
              sx={{ gridColumn: '1 / -1' }}
            />
          </Box>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mt: 1.5 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={form.isPublic}
                  onChange={(e) => setForm((f) => ({ ...f, isPublic: e.target.checked }))}
                />
              }
              label="Public"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={form.isFeatured}
                  onChange={(e) => setForm((f) => ({ ...f, isFeatured: e.target.checked }))}
                />
              }
              label="Featured"
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, pt: 1, gap: 1 }}>
          <Button onClick={closeModal} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button variant="contained" onClick={() => void save()} sx={{ textTransform: 'none' }}>
            {editingId ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

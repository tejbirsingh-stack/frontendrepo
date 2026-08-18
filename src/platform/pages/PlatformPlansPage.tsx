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
  CircularProgress,
} from '@mui/material';
import toast from 'react-hot-toast';
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
  monthlyPriceDollars: '0',
  yearlyPriceDollars: '0',
  maxUsers: '5',
  maxWorkspaces: '1',
  maxProjects: '1',
  storageAmount: '5120',
  featuresText: '',
  ctaLabel: 'Get started',
  isPublic: true,
  isFeatured: false,
  sortOrder: 0,
};

export default function PlatformPlansPage() {
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [planToDelete, setPlanToDelete] = useState<PlatformPlan | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (plan: PlatformPlan) => {
    setEditingId(plan.id);
    const bytes = Number(plan.storageQuotaBytes || 0);
    const storageAmount = bytes / (1024 ** 2);

    setForm({
      id: plan.id,
      name: plan.name,
      description: plan.description || '',
      monthlyPriceDollars: String(plan.monthlyPriceCents / 100),
      yearlyPriceDollars: String((plan.yearlyPriceCents || plan.annualPriceCents || 0) / 100),
      maxUsers: String(plan.maxUsers),
      maxWorkspaces: String(plan.maxWorkspaces),
      maxProjects: String(plan.maxProjects ?? 1),
      storageAmount: String(storageAmount),
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
    const storageQuotaBytes = String(
      Math.round(Number(form.storageAmount) * 1024 ** 2)
    );

    const body = {
      id: form.id || form.name.trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-'),
      name: form.name,
      description: form.description,
      monthlyPriceCents: Math.round(Number(form.monthlyPriceDollars) * 100),
      yearlyPriceCents: Math.round(Number(form.yearlyPriceDollars) * 100),
      maxUsers: Number(form.maxUsers),
      maxWorkspaces: Number(form.maxWorkspaces),
      maxProjects: Number(form.maxProjects),
      storageQuotaBytes,
      features: form.featuresText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
      ctaLabel: form.ctaLabel,
      isPublic: form.isPublic,
      isFeatured: form.isFeatured,
      sortOrder: Number(form.sortOrder),
    };
    setIsSaving(true);
    try {
      if (editingId) {
        await updatePlan(editingId, body);
        toast.success('Plan updated successfully');
      } else {
        await createPlan(body);
        toast.success('Plan created successfully');
      }
      closeModal();
      setRefreshKey((k) => k + 1);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Save failed';
      setFormError(msg);
      toast.error(msg);
    } finally {
      setIsSaving(false);
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
        onDelete={(plan) => {
          setPlanToDelete(plan);
          setDeleteDialogOpen(true);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        slotProps={noahDialogSlotProps({ overflow: 'hidden' })}
      >
        <DialogTitle sx={{ fontWeight: 600, color: cv.textPrimary }}>
          Delete Plan
        </DialogTitle>
        <DialogContent sx={{ pt: '8px !important' }}>
          <Typography sx={{ color: cv.textSecondary }}>
            Are you sure you want to delete the plan &quot;{planToDelete?.name}&quot;? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 1 }}>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            sx={{ color: cv.textSecondary, textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button
            onClick={async () => {
              if (!planToDelete) return;
              try {
                await deletePlan(planToDelete.id);
                toast.success('Plan deleted successfully');
                setRefreshKey((k) => k + 1);
              } catch (err: unknown) {
                const msg = err instanceof Error ? err.message : 'Delete failed';
                setError(msg);
                toast.error(msg);
              } finally {
                setDeleteDialogOpen(false);
                setPlanToDelete(null);
              }
            }}
            variant="contained"
            color="error"
            sx={{ textTransform: 'none' }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

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
              label="Name"
              size="small"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
            <TextField
              label="Monthly price (USD)"
              size="small"
              type="number"
              value={form.monthlyPriceDollars}
              onChange={(e) =>
                setForm((f) => ({ ...f, monthlyPriceDollars: e.target.value }))
              }
            />
            <TextField
              label="Yearly price (USD)"
              size="small"
              type="number"
              value={form.yearlyPriceDollars}
              onChange={(e) =>
                setForm((f) => ({ ...f, yearlyPriceDollars: e.target.value }))
              }
            />
            <TextField
              label="Max users"
              size="small"
              type="number"
              value={form.maxUsers}
              onChange={(e) => setForm((f) => ({ ...f, maxUsers: e.target.value }))}
            />
            <TextField
              label="Max workspaces"
              size="small"
              type="number"
              value={form.maxWorkspaces}
              onChange={(e) => setForm((f) => ({ ...f, maxWorkspaces: e.target.value }))}
            />
            <TextField
              label="Max projects"
              size="small"
              type="number"
              value={form.maxProjects}
              onChange={(e) => setForm((f) => ({ ...f, maxProjects: e.target.value }))}
            />
            <TextField
              label="Storage size (MB)"
              size="small"
              type="number"
              value={form.storageAmount}
              onChange={(e) => setForm((f) => ({ ...f, storageAmount: e.target.value }))}
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
          <Button onClick={closeModal} disabled={isSaving} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={() => void save()} 
            disabled={isSaving}
            sx={{ textTransform: 'none', minWidth: 80 }}
          >
            {isSaving ? <CircularProgress size={24} color="inherit" /> : (editingId ? 'Update' : 'Create')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

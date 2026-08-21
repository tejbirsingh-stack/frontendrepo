import { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
  CircularProgress,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import toast from 'react-hot-toast';
import {
  createPlan,
  deletePlan,
  updatePlan,
  fetchPlanFeatures,
  type PlatformPlan,
  type PlanFeature,
} from '../api/platformApi';
import { PageHeader, formatBytes } from '../components/PlatformUi';
import { PlatformPlansCatalogSection } from '../components/PlatformPlansCatalogSection';
import { PlatformFeaturesCatalogSection } from '../components/PlatformFeaturesCatalogSection';
import { PlatformFeatureEditModal } from '../components/PlatformFeatureEditModal';
import { noahDialogSlotProps } from '../../constants/dialogStyles';
import { cv } from '../../theme/cssVars';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatStorageMB(mb: number | string): string {
  const n = Number(mb) || 0;
  const bytes = n * 1024 * 1024;
  return formatBytes(String(bytes));
}

function buildDynamicFeatures(form: {
  maxProjects: string;
  maxWorkspaces: string;
  storageAmount: string;
  maxUsers: string;
}): string[] {
  const projects = Number(form.maxProjects) || 0;
  const workspaces = Number(form.maxWorkspaces) || 0;
  const users = Number(form.maxUsers) || 0;
  const storage = formatStorageMB(form.storageAmount);
  return [
    `${projects} Project${projects !== 1 ? 's' : ''} & ${workspaces} Workspace${workspaces !== 1 ? 's' : ''}`,
    `${storage} Storage`,
    `${users} Member${users !== 1 ? 's' : ''}`,
  ];
}

// ─── Form State ───────────────────────────────────────────────────────────────

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
  ctaLabel: 'Get started',
  isPublic: true,
  isFeatured: false,
  hasAI: false,
  sortOrder: '',
  // Visibility flags for dynamic features
  showProjectQuota: true,
  showStorageQuota: true,
  showMemberQuota: true,
  // Selected feature IDs from the plan_features catalog
  selectedFeatureIds: [] as string[],
  // Free-text custom features not in the catalog
  customFeatures: [] as string[],
};

// ─── Component ────────────────────────────────────────────────────────────────

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
  const [featureCatalog, setFeatureCatalog] = useState<PlanFeature[]>([]);
  const [tabIndex, setTabIndex] = useState(0);
  const [featureModalOpen, setFeatureModalOpen] = useState(false);
  const [editingFeature, setEditingFeature] = useState<PlanFeature | null>(null);
  const [featureToDelete, setFeatureToDelete] = useState<PlanFeature | null>(null);
  const [deleteFeatureDialogOpen, setDeleteFeatureDialogOpen] = useState(false);

  // Load the feature catalog from DB on mount
  useEffect(() => {
    fetchPlanFeatures()
      .then((res) => setFeatureCatalog(res.features || []))
      .catch(() => console.error('Failed to load plan features catalog'));
  }, []);

  // Live-computed auto bullet points based on current form values
  const dynamicFeatures = useMemo(() => buildDynamicFeatures(form), [form]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (plan: PlatformPlan) => {
    setEditingId(plan.id);
    const bytes = Number(plan.storageQuotaBytes || 0);
    const storageAmount = bytes / 1024 ** 2;

    // plan.features is now an array of PlanFeature objects
    const selectedFeatureIds = (plan.features || []).map((f) => f.id);

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
      ctaLabel: plan.ctaLabel || '',
      isPublic: plan.isPublic,
      isFeatured: plan.isFeatured,
      hasAI: plan.hasAI,
      sortOrder: String(plan.sortOrder || ''),
      showProjectQuota: plan.showProjectQuota ?? true,
      showStorageQuota: plan.showStorageQuota ?? true,
      showMemberQuota: plan.showMemberQuota ?? true,
      selectedFeatureIds,
      customFeatures: [],
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

  const toggleFeature = (featureId: string) => {
    setForm((f) => ({
      ...f,
      selectedFeatureIds: f.selectedFeatureIds.includes(featureId)
        ? f.selectedFeatureIds.filter((x) => x !== featureId)
        : [...f.selectedFeatureIds, featureId],
    }));
  };

  const save = async () => {
    setFormError('');

    if (editingId && (!form.sortOrder || Number(form.sortOrder) <= 0)) {
      setFormError('Sort order must be a positive number.');
      return;
    }

    const storageQuotaBytes = String(Math.round(Number(form.storageAmount) * 1024 ** 2));

    const body = {
      id: form.id || undefined,
      name: form.name,
      description: form.description,
      monthlyPriceCents: Math.round(Number(form.monthlyPriceDollars) * 100),
      yearlyPriceCents: Math.round(Number(form.yearlyPriceDollars) * 100),
      maxUsers: Number(form.maxUsers),
      maxWorkspaces: Number(form.maxWorkspaces),
      maxProjects: Number(form.maxProjects),
      storageQuotaBytes,
      showProjectQuota: form.showProjectQuota,
      showStorageQuota: form.showStorageQuota,
      showMemberQuota: form.showMemberQuota,
      featureIds: form.selectedFeatureIds,  // Send IDs to the backend
      ctaLabel: form.ctaLabel,
      isPublic: form.isPublic,
      isFeatured: form.isFeatured,
      hasAI: form.hasAI,
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
        title={tabIndex === 0 ? "Plans & packages" : "Global Features"}
        subtitle={tabIndex === 0 ? "Sellable catalog for customer onboarding" : "Manage plan features and limits"}
        actions={
          <Button
            variant="contained"
            onClick={tabIndex === 0 ? openCreate : () => { setEditingFeature(null); setFeatureModalOpen(true); }}
            sx={{ textTransform: 'none' }}
          >
            {tabIndex === 0 ? 'Create plan' : 'Create feature'}
          </Button>
        }
      />
      {error ? <Typography sx={{ color: cv.destructive, mb: 2 }}>{error}</Typography> : null}

      <Tabs
        value={tabIndex}
        onChange={(_e, v) => setTabIndex(v)}
        sx={{
          minHeight: 42,
          mb: 2.5,
          borderBottom: `1px solid ${cv.divider}`,
          '& .MuiTab-root': {
            minHeight: 42,
            textTransform: 'none',
            fontWeight: 500,
            color: cv.textSecondary,
            '&.Mui-selected': { color: cv.brandOrchid },
          },
          '& .MuiTabs-indicator': { backgroundColor: cv.brandOrchid },
        }}
      >
        <Tab label="Plans" />
        <Tab label="Features" />
      </Tabs>

      {tabIndex === 0 && (
        <PlatformPlansCatalogSection
          refreshKey={refreshKey}
          emptyMessage="No plans yet. Create a plan to start building your catalog."
          onEdit={openEdit}
          onDelete={(plan) => {
            setPlanToDelete(plan);
            setDeleteDialogOpen(true);
          }}
        />
      )}

      {tabIndex === 1 && (
        <PlatformFeaturesCatalogSection
          refreshKey={refreshKey}
          onEdit={(feat) => {
            setEditingFeature(feat);
            setFeatureModalOpen(true);
          }}
          onDelete={(feat) => {
            setFeatureToDelete(feat);
            setDeleteFeatureDialogOpen(true);
          }}
        />
      )}

      {/* ── Feature Delete Confirmation Dialog ── */}
      <Dialog
        open={deleteFeatureDialogOpen}
        onClose={() => setDeleteFeatureDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        slotProps={noahDialogSlotProps({ overflow: 'hidden' })}
      >
        <DialogTitle sx={{ fontWeight: 600, color: cv.textPrimary }}>Delete Feature</DialogTitle>
        <DialogContent sx={{ pt: '8px !important' }}>
          <Typography sx={{ color: cv.textSecondary }}>
            Are you sure you want to delete the feature &quot;{featureToDelete?.name}&quot;? This action cannot
            be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 1 }}>
          <Button
            onClick={() => setDeleteFeatureDialogOpen(false)}
            sx={{ color: cv.textSecondary, textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button
            onClick={async () => {
              if (!featureToDelete) return;
              try {
                const { deletePlanFeature } = await import('../api/platformApi');
                await deletePlanFeature(featureToDelete.id);
                toast.success('Feature deleted successfully');
                setRefreshKey((k) => k + 1);
                // Refresh catalog for plan edit modal
                fetchPlanFeatures()
                  .then((res) => setFeatureCatalog(res.features || []))
                  .catch(() => console.error('Failed to load plan features catalog'));
              } catch (err: unknown) {
                const msg = err instanceof Error ? err.message : 'Delete failed';
                toast.error(msg);
              } finally {
                setDeleteFeatureDialogOpen(false);
                setFeatureToDelete(null);
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

      {/* ── Delete Confirmation Dialog ── */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        slotProps={noahDialogSlotProps({ overflow: 'hidden' })}
      >
        <DialogTitle sx={{ fontWeight: 600, color: cv.textPrimary }}>Delete Plan</DialogTitle>
        <DialogContent sx={{ pt: '8px !important' }}>
          <Typography sx={{ color: cv.textSecondary }}>
            Are you sure you want to delete the plan &quot;{planToDelete?.name}&quot;? This action cannot
            be undone.
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

      {/* ── Create / Edit Plan Dialog ── */}
      <Dialog
        open={modalOpen}
        onClose={closeModal}
        fullWidth
        maxWidth="md"
        aria-labelledby="plan-form-dialog-title"
        slotProps={noahDialogSlotProps({ overflow: 'hidden', maxHeight: '92vh' })}
      >
        <DialogTitle id="plan-form-dialog-title" sx={{ fontWeight: 600, color: cv.textPrimary }}>
          {editingId ? `Edit plan — ${form.name || editingId}` : 'Create plan'}
        </DialogTitle>

        <DialogContent sx={{ pt: '8px !important', overflowY: 'auto' }}>
          {formError ? (
            <Typography sx={{ color: cv.destructive, mb: 2 }} role="alert">
              {formError}
            </Typography>
          ) : null}

          {/* ── Pricing & Limits Grid ── */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 1.5 }}>
            <TextField
              label="Plan name"
              size="small"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
            <TextField
              label="CTA label"
              size="small"
              value={form.ctaLabel}
              onChange={(e) => setForm((f) => ({ ...f, ctaLabel: e.target.value }))}
              placeholder="e.g. Get started"
            />
            <TextField
              label="Monthly price (USD)"
              size="small"
              type="number"
              value={form.monthlyPriceDollars}
              onChange={(e) => setForm((f) => ({ ...f, monthlyPriceDollars: e.target.value }))}
            />
            <TextField
              label="Yearly price (USD)"
              size="small"
              type="number"
              value={form.yearlyPriceDollars}
              onChange={(e) => setForm((f) => ({ ...f, yearlyPriceDollars: e.target.value }))}
            />
            <TextField
              label="Max users"
              size="small"
              type="number"
              value={form.maxUsers}
              onChange={(e) => setForm((f) => ({ ...f, maxUsers: e.target.value }))}
            />
            <TextField
              label="Storage size (MB)"
              size="small"
              type="number"
              value={form.storageAmount}
              onChange={(e) => setForm((f) => ({ ...f, storageAmount: e.target.value }))}
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
              label="Sort order"
              size="small"
              type="number"
              value={form.sortOrder}
              onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
              helperText={editingId ? 'Must be > 0' : 'Leave empty to auto-assign at the end'}
              inputProps={{ min: editingId ? 1 : 0 }}
            />
            <TextField
              label="Description"
              size="small"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              sx={{ gridColumn: '1 / -1' }}
            />
          </Box>

          {/* ── Features Section ── */}
          <Box sx={{ mt: 2.5 }}>
            <Typography
              sx={{ fontSize: '0.8125rem', fontWeight: 600, color: cv.textPrimary, mb: 1.25 }}
            >
              Plan features
            </Typography>

            {/* Auto-generated bullet points with checkboxes */}
            <Box
              sx={{
                p: 1.5,
                borderRadius: '8px',
                background: cv.surfaceMuted,
                border: `1px solid ${cv.border}`,
                mb: 1.5,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1 }}>
                <LockOutlinedIcon sx={{ fontSize: 13, color: cv.textMuted }} />
                <Typography
                  sx={{ fontSize: '0.7rem', fontWeight: 600, color: cv.textMuted, letterSpacing: '0.04em' }}
                >
                  AUTO-GENERATED FROM ABOVE FIELDS
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {[
                  {
                    id: 'dyn-project',
                    name: dynamicFeatures[0] || 'Projects & Workspaces',
                    checked: form.showProjectQuota,
                    onToggle: () => setForm((f) => ({ ...f, showProjectQuota: !f.showProjectQuota })),
                  },
                  {
                    id: 'dyn-storage',
                    name: dynamicFeatures[1] || 'Storage',
                    checked: form.showStorageQuota,
                    onToggle: () => setForm((f) => ({ ...f, showStorageQuota: !f.showStorageQuota })),
                  },
                  {
                    id: 'dyn-member',
                    name: dynamicFeatures[2] || 'Members',
                    checked: form.showMemberQuota,
                    onToggle: () => setForm((f) => ({ ...f, showMemberQuota: !f.showMemberQuota })),
                  },
                ].map((feat) => (
                  <FormControlLabel
                    key={feat.id}
                    control={
                      <Checkbox
                        size="small"
                        checked={feat.checked}
                        onChange={feat.onToggle}
                        sx={{
                          color: cv.textMuted,
                          py: 0.5,
                          '&.Mui-checked': { color: cv.brandOrchid },
                        }}
                      />
                    }
                    label={
                      <Typography sx={{ fontSize: '0.8125rem', color: cv.textSecondary }}>
                        {feat.name}
                      </Typography>
                    }
                    sx={{ m: 0 }}
                  />
                ))}
              </Box>
            </Box>

            {/* Feature checkboxes — driven by DB catalog */}
            <Typography
              sx={{ fontSize: '0.75rem', fontWeight: 600, color: cv.textMuted, mb: 0.75 }}
            >
              Included features
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                gap: 0,
                mb: 1.5,
                border: `1px solid ${cv.border}`,
                borderRadius: '8px',
                overflow: 'hidden',
              }}
            >
              {(() => {
                const activeFeatures = featureCatalog.filter(
                  (f) => f.isActive || form.selectedFeatureIds.includes(f.id)
                );
                return activeFeatures.map((feat, idx, arr) => {
                  const isChecked = form.selectedFeatureIds.includes(feat.id);
                  const isLast = idx === arr.length - 1;
                  const isSecondToLast = idx === arr.length - 2;
                  return (
                    <Box
                      key={feat.id}
                      sx={{
                        borderBottom:
                          (arr.length % 2 === 0
                            ? !isLast && !isSecondToLast
                            : !isLast)
                            ? `1px solid ${cv.border}`
                            : 'none',
                        borderRight:
                          idx % 2 === 0
                            ? { xs: 'none', sm: `1px solid ${cv.border}` }
                            : 'none',
                        px: 1.25,
                        py: 0.25,
                        background: isChecked ? cv.purpleSurface : 'transparent',
                        transition: 'background 0.15s ease',
                        display: 'flex',
                        alignItems: 'center',
                        '&:hover .feature-trash': { opacity: 1 },
                      }}
                    >
                      <FormControlLabel
                        control={
                          <Checkbox
                            size="small"
                            checked={isChecked}
                            onChange={() => toggleFeature(feat.id)}
                            sx={{
                              color: cv.textMuted,
                              '&.Mui-checked': { color: cv.brandOrchid },
                            }}
                          />
                        }
                        label={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography
                              sx={{
                                fontSize: '0.8125rem',
                                color: feat.isActive ? cv.textSecondary : cv.destructive,
                              }}
                            >
                              {feat.name}
                            </Typography>
                            {!feat.isActive && (
                              <Chip
                                size="small"
                                label="Inactive"
                                sx={{
                                  height: 20,
                                  fontSize: '0.625rem',
                                  background: cv.destructiveSurface,
                                  color: cv.destructive,
                                  fontWeight: 600,
                                }}
                              />
                            )}
                          </Box>
                        }
                        sx={{ m: 0, flex: 1 }}
                      />
                    </Box>
                  );
                });
              })()}
            </Box>
          </Box>

          {/* ── Visibility Flags ── */}
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mt: 2 }}>
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
            <FormControlLabel
              control={
                <Checkbox
                  checked={form.hasAI}
                  onChange={(e) => setForm((f) => ({ ...f, hasAI: e.target.checked }))}
                />
              }
              label="AI"
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
            sx={{ textTransform: 'none', minWidth: 90 }}
          >
            {isSaving ? (
              <CircularProgress size={20} color="inherit" />
            ) : editingId ? (
              'Update'
            ) : (
              'Create'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Create / Edit Feature Dialog ── */}
      <PlatformFeatureEditModal
        open={featureModalOpen}
        feature={editingFeature}
        onClose={() => setFeatureModalOpen(false)}
        onSaveSuccess={() => {
          setFeatureModalOpen(false);
          setRefreshKey((k) => k + 1);
          // Also fetch catalog so the Plan Modal gets the new feature list
          fetchPlanFeatures()
            .then((res) => setFeatureCatalog(res.features || []))
            .catch(() => console.error('Failed to load plan features catalog'));
        }}
      />
    </Box>
  );
}

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import GridViewIcon from '@mui/icons-material/GridView';
import ViewListIcon from '@mui/icons-material/ViewList';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  fetchLanding,
  fetchPlans,
  updateLanding,
  updatePlan,
  type PlatformPlan,
} from '../api/platformApi';
import {
  EmptyState,
  Panel,
  PlatformTableHead,
  PlatformTablePagination,
  StatusChip,
  formatBytes,
  formatMoneyCents,
} from './PlatformUi';
import { platformTableSx } from './platformTableStyles';
import {
  usePaginatedRows,
  usePlatformTablePagination,
} from '../hooks/usePlatformTablePagination';
import { cv } from '../../theme/cssVars';
import { noahDialogSlotProps } from '../../constants/dialogStyles';

type ViewMode = 'list' | 'grid';

function parsePlansEnabled(sections: unknown): boolean {
  if (sections && typeof sections === 'object' && !Array.isArray(sections)) {
    const value = (sections as { plansEnabled?: unknown }).plansEnabled;
    if (typeof value === 'boolean') return value;
  }
  return true;
}

function ViewToggle({
  value,
  onChange,
}: Readonly<{ value: ViewMode; onChange: (mode: ViewMode) => void }>) {
  const buttonSx = (active: boolean) => ({
    color: active ? cv.brandOrchid : cv.textMuted,
    background: active ? cv.purpleSurface : 'transparent',
    borderRadius: '6px',
    border: `1px solid ${active ? cv.borderStrong : 'transparent'}`,
  });

  return (
    <Box sx={{ display: 'flex', gap: 0.5 }}>
      <Tooltip title="List view">
        <IconButton
          size="small"
          aria-label="List view"
          aria-pressed={value === 'list'}
          onClick={() => onChange('list')}
          sx={buttonSx(value === 'list')}
        >
          <ViewListIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Tooltip>
      <Tooltip title="Grid view">
        <IconButton
          size="small"
          aria-label="Grid view"
          aria-pressed={value === 'grid'}
          onClick={() => onChange('grid')}
          sx={buttonSx(value === 'grid')}
        >
          <GridViewIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Tooltip>
    </Box>
  );
}

function PlanCard({
  plan,
  busy,
  onToggleActive,
  actions,
}: Readonly<{
  plan: PlatformPlan;
  busy: boolean;
  onToggleActive: (plan: PlatformPlan, next: boolean) => void;
  actions?: ReactNode;
}>) {
  const active = plan.isActive !== false;
  const yearly = plan.yearlyPriceCents ?? plan.annualPriceCents ?? 0;

  return (
    <Panel
      title={plan.name}
      subtitle={plan.description || plan.id}
      action={
        <FormControlLabel
          control={
            <Switch
              size="small"
              checked={active}
              disabled={busy}
              onChange={(e) => onToggleActive(plan, e.target.checked)}
              inputProps={{ 'aria-label': `Activate ${plan.name}` }}
            />
          }
          label={active ? 'Active' : 'Inactive'}
          sx={{
            m: 0,
            '& .MuiFormControlLabel-label': {
              fontSize: '0.75rem',
              color: cv.textSecondary,
              minWidth: 52,
            },
          }}
        />
      }
      sx={{
        opacity: active ? 1 : 0.72,
        transition: 'border-color 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease',
        '&:hover': {
          borderColor: cv.borderStrong,
          transform: 'translateY(-2px)',
          boxShadow: cv.brandShadowSoft,
        },
      }}
    >
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 1.5 }}>
        <StatusChip status={active ? 'active' : 'inactive'} />
        {plan.isPublic ? <StatusChip label="Public" /> : <StatusChip label="Private" />}
        {plan.isFeatured ? <StatusChip label="Featured" status="active" /> : null}
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 1,
          mb: 1.25,
        }}
      >
        <Box
          sx={{
            p: 1.1,
            borderRadius: '6px',
            background: cv.surfaceMuted,
            border: `1px solid ${cv.border}`,
          }}
        >
          <Typography sx={{ fontSize: '0.65rem', color: cv.textMuted, fontWeight: 600 }}>
            Monthly
          </Typography>
          <Typography sx={{ fontSize: '1.05rem', fontWeight: 700, mt: 0.25 }}>
            {formatMoneyCents(plan.monthlyPriceCents)}
          </Typography>
        </Box>
        <Box
          sx={{
            p: 1.1,
            borderRadius: '6px',
            background: cv.surfaceMuted,
            border: `1px solid ${cv.border}`,
          }}
        >
          <Typography sx={{ fontSize: '0.65rem', color: cv.textMuted, fontWeight: 600 }}>
            Yearly
          </Typography>
          <Typography sx={{ fontSize: '1.05rem', fontWeight: 700, mt: 0.25 }}>
            {formatMoneyCents(yearly)}
          </Typography>
        </Box>
      </Box>

      <Typography sx={{ fontSize: '0.75rem', color: cv.textSecondary, mb: actions ? 1.25 : 0 }}>
        {formatBytes(plan.storageQuotaBytes)} storage · {plan.maxUsers} users ·{' '}
        {plan.maxWorkspaces} workspaces
      </Typography>

      {actions ? (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 0.5,
            pt: 1.25,
            borderTop: `1px solid ${cv.border}`,
          }}
        >
          {actions}
        </Box>
      ) : null}
    </Panel>
  );
}

function PlansListView({
  plans,
  plansEnabled,
  togglingId,
  showManageActions,
  onToggleActive,
  renderManageActions,
}: Readonly<{
  plans: PlatformPlan[];
  plansEnabled: boolean;
  togglingId: string | null;
  showManageActions: boolean;
  onToggleActive: (plan: PlatformPlan, next: boolean) => void;
  renderManageActions: (plan: PlatformPlan) => ReactNode;
}>) {
  return (
    <Table size="small" sx={{ ...platformTableSx, opacity: plansEnabled ? 1 : 0.65 }}>
      <PlatformTableHead
        columns={[
          { id: 'name', label: 'Name' },
          { id: 'monthly', label: 'Monthly' },
          { id: 'public', label: 'Public' },
          { id: 'featured', label: 'Featured' },
          { id: 'active', label: 'Active', align: 'right' },
          ...(showManageActions ? [{ id: 'actions', label: '', align: 'right' as const }] : []),
        ]}
      />
      <TableBody>
        {plans.map((plan) => {
          const active = plan.isActive !== false;
          return (
            <TableRow key={plan.id}>
              <TableCell>
                <Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }}>{plan.name}</Typography>
                <Typography sx={{ fontSize: '0.75rem', color: cv.textMuted }}>{plan.id}</Typography>
              </TableCell>
              <TableCell>{formatMoneyCents(plan.monthlyPriceCents)}</TableCell>
              <TableCell>{plan.isPublic ? 'Yes' : 'No'}</TableCell>
              <TableCell>{plan.isFeatured ? 'Yes' : 'No'}</TableCell>
              <TableCell align="right">
                <Switch
                  size="small"
                  checked={active}
                  disabled={togglingId === plan.id}
                  onChange={(e) => onToggleActive(plan, e.target.checked)}
                  inputProps={{ 'aria-label': `Activate ${plan.name}` }}
                />
              </TableCell>
              {showManageActions ? (
                <TableCell align="right">{renderManageActions(plan)}</TableCell>
              ) : null}
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

function PlansGridView({
  plans,
  plansEnabled,
  togglingId,
  onToggleActive,
  renderManageActions,
}: Readonly<{
  plans: PlatformPlan[];
  plansEnabled: boolean;
  togglingId: string | null;
  onToggleActive: (plan: PlatformPlan, next: boolean) => void;
  renderManageActions: (plan: PlatformPlan) => ReactNode;
}>) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          sm: 'repeat(2, 1fr)',
          lg: 'repeat(3, 1fr)',
        },
        gap: 2,
        opacity: plansEnabled ? 1 : 0.65,
      }}
    >
      {plans.map((plan) => (
        <PlanCard
          key={plan.id}
          plan={plan}
          busy={togglingId === plan.id}
          onToggleActive={onToggleActive}
          actions={renderManageActions(plan)}
        />
      ))}
    </Box>
  );
}

export type PlatformPlansCatalogSectionProps = {
  emptyMessage?: string;
  onEdit?: (plan: PlatformPlan) => void;
  onDelete?: (plan: PlatformPlan) => void | Promise<void>;
  /** Called when the catalog list changes (toggle, external refresh). */
  onPlansChange?: (plans: PlatformPlan[]) => void;
  /** Imperative refresh key — bump to reload plans after create/update/delete. */
  refreshKey?: number;
};

export function PlatformPlansCatalogSection({
  emptyMessage = 'No plans configured. Create plans on the Plans page, then activate them here.',
  onEdit,
  onDelete,
  onPlansChange,
  refreshKey = 0,
}: Readonly<PlatformPlansCatalogSectionProps>) {
  const [plans, setPlans] = useState<PlatformPlan[]>([]);
  const [plansEnabled, setPlansEnabled] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [confirmToggleModalOpen, setConfirmToggleModalOpen] = useState(false);
  const [nextToggleState, setNextToggleState] = useState(false);
  const showManageActions = Boolean(onEdit || onDelete);
  const pagination = usePlatformTablePagination([plans.length, viewMode]);
  const paginatedPlans = usePaginatedRows(plans, pagination.page, pagination.rowsPerPage);

  const setPlansAndNotify = useCallback(
    (next: PlatformPlan[] | ((prev: PlatformPlan[]) => PlatformPlan[])) => {
      setPlans((prev) => {
        const resolved = typeof next === 'function' ? next(prev) : next;
        onPlansChange?.(resolved);
        return resolved;
      });
    },
    [onPlansChange],
  );

  const loadPlans = useCallback(() => {
    setLoading(true);
    return fetchPlans()
      .then((res) => setPlansAndNotify(res.plans))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [setPlansAndNotify]);

  useEffect(() => {
    fetchLanding('main')
      .then((res) => {
        const page = res.page;
        setPlansEnabled(
          typeof page.plansEnabled === 'boolean'
            ? page.plansEnabled
            : parsePlansEnabled(page.sections),
        );
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  useEffect(() => {
    void loadPlans();
  }, [loadPlans, refreshKey]);

  const togglePlansEnabled = async (next: boolean) => {
    setError('');
    setStatusMessage('');
    const previous = plansEnabled;
    setPlansEnabled(next);
    try {
      await updateLanding('main', {
        plansEnabled: next,
        sections: { plansEnabled: next },
      });
      setStatusMessage(next ? 'Plans tab activated' : 'Plans tab deactivated');
    } catch (err: unknown) {
      setPlansEnabled(previous);
      setError(err instanceof Error ? err.message : 'Failed to update Plans tab');
    }
  };

  const togglePlanActive = async (plan: PlatformPlan, next: boolean) => {
    setError('');
    setStatusMessage('');
    setTogglingId(plan.id);
    const previous = plans;
    setPlansAndNotify((list) => list.map((p) => (p.id === plan.id ? { ...p, isActive: next } : p)));
    try {
      await updatePlan(plan.id, { isActive: next });
      setStatusMessage(`${plan.name} ${next ? 'activated' : 'deactivated'}`);
    } catch (err: unknown) {
      setPlansAndNotify(previous);
      setError(err instanceof Error ? err.message : 'Failed to update plan');
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (plan: PlatformPlan) => {
    if (!onDelete) return;
    setError('');
    try {
      await onDelete(plan);
      await loadPlans();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete plan');
    }
  };

  const renderManageActions = (plan: PlatformPlan) => {
    if (!showManageActions) return null;
    return (
      <>
        {onEdit ? (
          <Button size="small" sx={{ textTransform: 'none' }} onClick={() => onEdit(plan)}>
            Edit
          </Button>
        ) : null}
        {onDelete ? (
          <Button
            size="small"
            color="error"
            sx={{ textTransform: 'none' }}
            onClick={() => void handleDelete(plan)}
          >
            Delete
          </Button>
        ) : null}
      </>
    );
  };

  const showList = !loading && plans.length > 0 && viewMode === 'list';
  const showGrid = !loading && plans.length > 0 && viewMode === 'grid';

  return (
    <Box>
      {error ? <Typography sx={{ color: cv.destructive, mb: 2 }}>{error}</Typography> : null}
      {statusMessage ? (
        <Typography sx={{ color: cv.success, mb: 2, fontSize: '0.875rem' }}>
          {statusMessage}
        </Typography>
      ) : null}

      <Panel
        title="Plans"
        subtitle="Control which catalog plans appear on the public Plans tab"
        action={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={plansEnabled}
                  onChange={(e) => {
                    setNextToggleState(e.target.checked);
                    setConfirmToggleModalOpen(true);
                  }}
                  inputProps={{ 'aria-label': 'Show Plans tab on landing page' }}
                />
              }
              label={plansEnabled ? 'Plans tab active' : 'Plans tab inactive'}
              sx={{
                m: 0,
                mr: 0.5,
                '& .MuiFormControlLabel-label': {
                  fontSize: '0.8125rem',
                  color: cv.textSecondary,
                },
              }}
            />
            <ViewToggle value={viewMode} onChange={setViewMode} />
          </Box>
        }
      >
        {!plansEnabled ? (
          <Typography sx={{ color: cv.textMuted, fontSize: '0.875rem', mb: 2 }}>
            Plans tab is deactivated. Turn it on to show plans on the public site. Individual plan
            toggles still update catalog availability.
          </Typography>
        ) : null}

        {loading ? (
          <Typography sx={{ color: cv.textMuted, fontSize: '0.875rem' }}>Loading plans…</Typography>
        ) : null}

        {!loading && plans.length === 0 ? <EmptyState message={emptyMessage} /> : null}

        {showList ? (
          <>
            <PlansListView
              plans={paginatedPlans}
              plansEnabled={plansEnabled}
              togglingId={togglingId}
              showManageActions={showManageActions}
              onToggleActive={(plan, next) => void togglePlanActive(plan, next)}
              renderManageActions={renderManageActions}
            />
            <PlatformTablePagination
              count={plans.length}
              page={pagination.page}
              rowsPerPage={pagination.rowsPerPage}
              onPageChange={pagination.onPageChange}
              onRowsPerPageChange={pagination.onRowsPerPageChange}
            />
          </>
        ) : null}

        {showGrid ? (
          <>
            <PlansGridView
              plans={paginatedPlans}
              plansEnabled={plansEnabled}
              togglingId={togglingId}
              onToggleActive={(plan, next) => void togglePlanActive(plan, next)}
              renderManageActions={renderManageActions}
            />
            <PlatformTablePagination
              count={plans.length}
              page={pagination.page}
              rowsPerPage={pagination.rowsPerPage}
              onPageChange={pagination.onPageChange}
              onRowsPerPageChange={pagination.onRowsPerPageChange}
            />
          </>
        ) : null}
      </Panel>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmToggleModalOpen}
        onClose={() => setConfirmToggleModalOpen(false)}
        maxWidth="xs"
        fullWidth
        slotProps={noahDialogSlotProps()}
      >
        <DialogTitle sx={{ fontWeight: 600 }}>
          {nextToggleState ? 'Activate Plans Tab?' : 'Deactivate Plans Tab?'}
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: cv.textSecondary }}>
            {nextToggleState
              ? 'Are you sure you want to activate the plans tab? This will make all public plans visible and available for purchase on the marketing site.'
              : 'Are you sure you want to deactivate the plans tab? This will hide all pricing information from the public marketing site.'}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 1 }}>
          <Button
            onClick={() => setConfirmToggleModalOpen(false)}
            sx={{ color: cv.textSecondary, textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              setConfirmToggleModalOpen(false);
              void togglePlansEnabled(nextToggleState);
            }}
            variant="contained"
            sx={{
              bgcolor: nextToggleState ? cv.success : cv.destructive,
              color: '#fff',
              textTransform: 'none',
              '&:hover': { bgcolor: nextToggleState ? cv.successHover : cv.destructiveHover },
            }}
          >
            {nextToggleState ? 'Activate' : 'Deactivate'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

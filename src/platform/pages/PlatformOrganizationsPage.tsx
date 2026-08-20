import { useEffect, useMemo, useRef, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  LinearProgress,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  createOrganization,
  fetchOrganizations,
  fetchPlans,
  type PlatformPlan,
} from '../api/platformApi';
import {
  ActiveFilterChips,
  EmptyState,
  FilterBar,
  FilterSelect,
  PageHeader,
  Panel,
  PlatformTableHead,
  PlatformTablePagination,
  SearchField,
  StatusChip,
  formatBytes,
  formatPercent,
  type FilterOption,
  type PlatformTableColumn,
} from '../components/PlatformUi';
import { platformTableSx } from '../components/platformTableStyles';
import { usePlatformTablePagination } from '../hooks/usePlatformTablePagination';
import { usePlatformTableSort } from '../hooks/usePlatformTableSort';
import { noahDialogSlotProps } from '../../constants/dialogStyles';
import { dropdownMenuInDialogProps } from '../../constants/dropdownMenu';
import { cv } from '../../theme/cssVars';

const emptyForm = {
  name: '',
  slug: '',
  planId: '',
  adminEmail: '',
  adminName: '',
};

type OrgSortField =
  | 'name'
  | 'plan'
  | 'status'
  | 'users'
  | 'workspaces'
  | 'storageUsedBytes'
  | 'createdAt';

const DESCENDING_FIRST_FIELDS: readonly OrgSortField[] = [
  'users',
  'workspaces',
  'storageUsedBytes',
  'createdAt',
];

const COLUMNS: ReadonlyArray<PlatformTableColumn<OrgSortField>> = [
  { id: 'name', label: 'Organization', sortField: 'name' },
  { id: 'plan', label: 'Plan', sortField: 'plan' },
  { id: 'status', label: 'Status', sortField: 'status', tooltip: 'Account status and Stripe subscription state' },
  { id: 'users', label: 'Users', sortField: 'users', align: 'right' },
  { id: 'workspaces', label: 'Workspaces', sortField: 'workspaces', align: 'right' },
  { id: 'storage', label: 'Storage', sortField: 'storageUsedBytes', width: 170 },
  { id: 'createdAt', label: 'Created', sortField: 'createdAt' },
  { id: 'actions', label: '', width: 92 },
];

const GB = 1024 ** 3;

const STATUS_OPTIONS: ReadonlyArray<FilterOption> = [
  { value: '', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
];

const SUBSCRIPTION_OPTIONS: ReadonlyArray<FilterOption> = [
  { value: '', label: 'All subscriptions' },
  { value: 'active', label: 'Active' },
  { value: 'trialing', label: 'Trialing' },
  { value: 'past_due', label: 'Past due' },
  { value: 'canceling', label: 'Canceling' },
  { value: 'canceled', label: 'Canceled' },
  { value: 'none', label: 'No subscription' },
];

const STORAGE_OPTIONS: ReadonlyArray<FilterOption & { min?: number; max?: number }> = [
  { value: '', label: 'Any storage' },
  { value: 'empty', label: 'Empty (0 B)', min: 0, max: 0 },
  { value: 'lt1', label: 'Under 1 GB', max: GB },
  { value: '1to10', label: '1 – 10 GB', min: GB, max: 10 * GB },
  { value: '10to100', label: '10 – 100 GB', min: 10 * GB, max: 100 * GB },
  { value: 'gt100', label: 'Over 100 GB', min: 100 * GB },
];

const CREATED_OPTIONS: ReadonlyArray<FilterOption & { days?: number }> = [
  { value: '', label: 'Any time' },
  { value: '7d', label: 'Last 7 days', days: 7 },
  { value: '30d', label: 'Last 30 days', days: 30 },
  { value: '90d', label: 'Last 90 days', days: 90 },
  { value: '365d', label: 'Last 12 months', days: 365 },
  { value: 'custom', label: 'Custom range' },
];

type OrgFilters = {
  q: string;
  status: string;
  planId: string;
  subscriptionStatus: string;
  storage: string;
  created: string;
  createdFrom: string;
  createdTo: string;
};

const emptyFilters: OrgFilters = {
  q: '',
  status: '',
  planId: '',
  subscriptionStatus: '',
  storage: '',
  created: '',
  createdFrom: '',
  createdTo: '',
};

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

function text(value: unknown, fallback = '—'): string {
  if (typeof value === 'string') return value || fallback;
  if (typeof value === 'number' || typeof value === 'bigint') return String(value);
  return fallback;
}

function formatDate(value: unknown): string {
  if (typeof value !== 'string' && typeof value !== 'number' && !(value instanceof Date)) {
    return '—';
  }
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? '—' : dateFormatter.format(parsed);
}

function daysAgoIso(days: number): string {
  const from = new Date();
  from.setDate(from.getDate() - days);
  return from.toISOString();
}

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export default function PlatformOrganizationsPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<OrgFilters>(emptyFilters);
  const [searchTerm, setSearchTerm] = useState('');
  const [rows, setRows] = useState<Array<Record<string, unknown>>>([]);
  const [total, setTotal] = useState(0);
  const [loadedKey, setLoadedKey] = useState('');
  const [refreshToken, setRefreshToken] = useState(0);
  const [error, setError] = useState('');
  const [plans, setPlans] = useState<PlatformPlan[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const pagination = usePlatformTablePagination();
  const sort = usePlatformTableSort<OrgSortField>('createdAt', 'desc', DESCENDING_FIRST_FIELDS);
  const requestIdRef = useRef(0);

  const planOptions = useMemo<FilterOption[]>(
    () => [
      { value: '', label: 'All plans' },
      ...plans.map((plan) => ({ value: plan.id, label: plan.name })),
      { value: 'none', label: 'No plan' },
    ],
    [plans],
  );

  const queryParams = useMemo(() => {
    const params: Record<string, string> = {
      limit: String(pagination.rowsPerPage),
      offset: String(pagination.page * pagination.rowsPerPage),
      sortBy: sort.sortBy,
      sortDir: sort.sortDir,
    };
    if (filters.q) params.q = filters.q;
    if (filters.status) params.status = filters.status;
    if (filters.planId) params.planId = filters.planId;
    if (filters.subscriptionStatus) params.subscriptionStatus = filters.subscriptionStatus;

    const storage = STORAGE_OPTIONS.find((option) => option.value === filters.storage);
    if (storage?.min !== undefined) params.minStorageBytes = String(storage.min);
    if (storage?.max !== undefined) params.maxStorageBytes = String(storage.max);

    if (filters.created === 'custom') {
      if (filters.createdFrom) params.createdFrom = filters.createdFrom;
      if (filters.createdTo) params.createdTo = filters.createdTo;
    } else {
      const created = CREATED_OPTIONS.find((option) => option.value === filters.created);
      if (created?.days) params.createdFrom = daysAgoIso(created.days);
    }
    return params;
  }, [filters, sort.sortBy, sort.sortDir, pagination.page, pagination.rowsPerPage]);

  useEffect(() => {
    fetchPlans()
      .then((res) => setPlans(res.plans || []))
      .catch(() => setPlans([]));
  }, []);

  const queryKey = useMemo(
    () => `${refreshToken}:${JSON.stringify(queryParams)}`,
    [queryParams, refreshToken],
  );
  const loading = loadedKey !== queryKey;

  useEffect(() => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    fetchOrganizations(queryParams)
      .then((res) => {
        if (requestIdRef.current !== requestId) return;
        setRows(res.organizations);
        setTotal(res.total);
        setError('');
      })
      .catch((err: Error) => {
        if (requestIdRef.current !== requestId) return;
        setError(err.message);
      })
      .finally(() => {
        if (requestIdRef.current === requestId) setLoadedKey(queryKey);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryKey]);

  const patchFilters = (patch: Partial<OrgFilters>) => {
    setFilters((current) => ({ ...current, ...patch }));
    pagination.setPage(0);
  };

  // Debounce free-text search so typing does not fire a request per keystroke.
  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmed = searchTerm.trim();
      setFilters((current) => (current.q === trimmed ? current : { ...current, q: trimmed }));
      pagination.setPage(0);
    }, 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  const handleSort = (field: OrgSortField) => {
    sort.toggleSort(field);
    pagination.setPage(0);
  };

  const clearFilter = (key: string) => {
    if (key === 'q') {
      setSearchTerm('');
      patchFilters({ q: '' });
      return;
    }
    if (key === 'created') {
      patchFilters({ created: '', createdFrom: '', createdTo: '' });
      return;
    }
    patchFilters({ [key]: '' } as Partial<OrgFilters>);
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setFilters(emptyFilters);
    pagination.setPage(0);
  };

  const activeFilterChips = useMemo(() => {
    const chips: Array<{ key: string; label: string }> = [];
    if (filters.q) chips.push({ key: 'q', label: `Search: ${filters.q}` });
    if (filters.status) {
      const option = STATUS_OPTIONS.find((item) => item.value === filters.status);
      chips.push({ key: 'status', label: `Status: ${option?.label ?? filters.status}` });
    }
    if (filters.planId) {
      const option = planOptions.find((item) => item.value === filters.planId);
      chips.push({ key: 'planId', label: `Plan: ${option?.label ?? filters.planId}` });
    }
    if (filters.subscriptionStatus) {
      const option = SUBSCRIPTION_OPTIONS.find((item) => item.value === filters.subscriptionStatus);
      chips.push({
        key: 'subscriptionStatus',
        label: `Subscription: ${option?.label ?? filters.subscriptionStatus}`,
      });
    }
    if (filters.storage) {
      const option = STORAGE_OPTIONS.find((item) => item.value === filters.storage);
      chips.push({ key: 'storage', label: `Storage: ${option?.label ?? filters.storage}` });
    }
    if (filters.created === 'custom') {
      if (filters.createdFrom || filters.createdTo) {
        chips.push({
          key: 'created',
          label: `Created: ${filters.createdFrom || 'any'} → ${filters.createdTo || 'today'}`,
        });
      }
    } else if (filters.created) {
      const option = CREATED_OPTIONS.find((item) => item.value === filters.created);
      chips.push({ key: 'created', label: `Created: ${option?.label ?? filters.created}` });
    }
    return chips;
  }, [filters, planOptions]);

  let emptyMessage = 'No organizations found';
  if (loading) emptyMessage = 'Loading organizations…';
  else if (activeFilterChips.length > 0) emptyMessage = 'No organizations match these filters';

  const openCreate = () => {
    if (plans.length === 0) {
      fetchPlans()
        .then((res) => {
          const list = res.plans || [];
          setPlans(list);
          const freePlan = list.find(
            (p) => p.id === 'free' || p.name?.toLowerCase() === 'free' || p.monthlyPriceCents === 0,
          );
          setForm({ ...emptyForm, planId: freePlan?.id || list[0]?.id || '' });
        })
        .catch(() => undefined);
    } else {
      const freePlan = plans.find(
        (p) => p.id === 'free' || p.name?.toLowerCase() === 'free' || p.monthlyPriceCents === 0,
      );
      setForm({ ...emptyForm, planId: freePlan?.id || plans[0]?.id || '' });
    }
    setFormError('');
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setForm(emptyForm);
    setFormError('');
    setSaving(false);
  };

  const reload = () => setRefreshToken((token) => token + 1);

  const save = async () => {
    setFormError('');
    if (!form.name.trim()) {
      setFormError('Organization name is required');
      return;
    }
    if (form.adminEmail.trim()) {
      const genericDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com', 'icloud.com'];
      const domain = form.adminEmail.trim().split('@')[1]?.toLowerCase();
      if (domain && genericDomains.includes(domain)) {
        setFormError('Please enter a valid business email address (personal email providers like @gmail.com are not allowed)');
        return;
      }
    }
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        name: form.name.trim(),
      };
      if (form.slug.trim()) body.slug = form.slug.trim();
      if (form.planId) body.planId = form.planId;
      if (form.adminEmail.trim()) {
        body.adminEmail = form.adminEmail.trim();
        if (form.adminName.trim()) body.adminName = form.adminName.trim();
      }
      await createOrganization(body);
      closeModal();
      reload();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Create failed');
      setSaving(false);
    }
  };

  return (
    <Box>
      <PageHeader
        title="Organizations"
        subtitle="All customer tenants — plan, seats, storage, and account status"
        actions={
          <Button variant="contained" onClick={openCreate} sx={{ textTransform: 'none' }}>
            Add organization
          </Button>
        }
      />

      <FilterBar
        actions={
          activeFilterChips.length > 0 ? (
            <Button onClick={clearAllFilters} size="small" sx={{ textTransform: 'none' }}>
              Reset filters
            </Button>
          ) : null
        }
      >
        <SearchField
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search name, slug, or member email"
          minWidth={280}
        />
        <FilterSelect
          label="Status"
          value={filters.status}
          options={STATUS_OPTIONS}
          onChange={(value) => patchFilters({ status: value })}
        />
        <FilterSelect
          label="Plan"
          value={filters.planId}
          options={planOptions}
          onChange={(value) => patchFilters({ planId: value })}
        />
        <FilterSelect
          label="Subscription"
          value={filters.subscriptionStatus}
          options={SUBSCRIPTION_OPTIONS}
          onChange={(value) => patchFilters({ subscriptionStatus: value })}
          minWidth={170}
        />
        <FilterSelect
          label="Storage used"
          value={filters.storage}
          options={STORAGE_OPTIONS}
          onChange={(value) => patchFilters({ storage: value })}
          minWidth={160}
        />
        <FilterSelect
          label="Created"
          value={filters.created}
          options={CREATED_OPTIONS}
          onChange={(value) =>
            patchFilters(
              value === 'custom' ? { created: value } : { created: value, createdFrom: '', createdTo: '' },
            )
          }
          minWidth={160}
        />
        {filters.created === 'custom' ? (
          <>
            <TextField
              size="small"
              type="date"
              label="From"
              value={filters.createdFrom}
              onChange={(event) => patchFilters({ createdFrom: event.target.value })}
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ minWidth: 150, '& .MuiInputBase-input': { fontSize: '0.8125rem' } }}
            />
            <TextField
              size="small"
              type="date"
              label="To"
              value={filters.createdTo}
              onChange={(event) => patchFilters({ createdTo: event.target.value })}
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ minWidth: 150, '& .MuiInputBase-input': { fontSize: '0.8125rem' } }}
            />
          </>
        ) : null}
      </FilterBar>

      <ActiveFilterChips
        filters={activeFilterChips}
        onClear={clearFilter}
        onClearAll={clearAllFilters}
      />

      {error ? (
        <Typography sx={{ color: cv.destructive, mb: 2 }} role="alert">
          {error}
        </Typography>
      ) : null}

      <Panel
        title={`${total} ${total === 1 ? 'organization' : 'organizations'}`}
        subtitle="Click a column header to sort, or a row to manage Super Admin / Admin details"
      >
        <Box sx={{ height: 2, mb: 0.5 }}>
          {loading ? (
            <LinearProgress
              sx={{
                height: 2,
                borderRadius: 999,
                background: 'transparent',
                '& .MuiLinearProgress-bar': { background: cv.brandGradient },
              }}
            />
          ) : null}
        </Box>
        {rows.length === 0 ? (
          <EmptyState message={emptyMessage} />
        ) : (
          <>
            <Box sx={{ overflowX: 'auto', opacity: loading ? 0.6 : 1, transition: 'opacity 0.15s ease' }}>
              <Table size="small" sx={platformTableSx}>
                <PlatformTableHead
                  columns={COLUMNS}
                  sortBy={sort.sortBy}
                  sortDir={sort.sortDir}
                  onSort={handleSort}
                />
                <TableBody>
                  {rows.map((org) => {
                    const count = org._count as
                      | { users?: number; workspaces?: number }
                      | undefined;
                    const plan = org.currentPlan as { name?: string } | null;
                    const name = text(org.name, '');
                    const used = org.storageUsedBytes as string;
                    const quota = org.storageQuotaBytes as string | undefined;
                    const percent = formatPercent(used, quota);
                    const subscription =
                      typeof org.subscriptionStatus === 'string' && org.subscriptionStatus
                        ? org.subscriptionStatus.replaceAll('_', ' ')
                        : null;
                    return (
                      <TableRow
                        key={String(org.id)}
                        hover
                        sx={{ cursor: 'pointer' }}
                        onClick={() => navigate(`/platform/organizations/${org.id}`)}
                      >
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                            <Box
                              aria-hidden="true"
                              sx={{
                                width: 30,
                                height: 30,
                                flexShrink: 0,
                                borderRadius: '6px',
                                display: 'grid',
                                placeItems: 'center',
                                background: cv.purpleSurface,
                                border: `1px solid ${cv.purpleChipBorder}`,
                                color: cv.brandOrchid,
                                fontSize: '0.7rem',
                                fontWeight: 700,
                              }}
                            >
                              {initialsOf(name) || '—'}
                            </Box>
                            <Box sx={{ minWidth: 0 }}>
                              <Typography
                                sx={{
                                  fontWeight: 600,
                                  fontSize: '0.875rem',
                                  color: cv.textPrimary,
                                }}
                              >
                                {name}
                              </Typography>
                              <Typography sx={{ fontSize: '0.75rem', color: cv.textMuted }}>
                                {text(org.slug, '')}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box
                            component="span"
                            sx={{
                              display: 'inline-block',
                              px: 1,
                              py: 0.25,
                              borderRadius: '6px',
                              border: `1px solid ${cv.border}`,
                              background: cv.surfaceMuted,
                              color: cv.textSecondary,
                              fontSize: '0.7rem',
                              fontWeight: 600,
                              textTransform: 'capitalize',
                            }}
                          >
                            {plan?.name || text(org.planType)}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <StatusChip status={text(org.status, 'active')} />
                          {subscription ? (
                            <Typography
                              sx={{
                                fontSize: '0.7rem',
                                color: cv.textMuted,
                                mt: 0.35,
                                textTransform: 'capitalize',
                              }}
                            >
                              {subscription}
                            </Typography>
                          ) : null}
                        </TableCell>
                        <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                          {count?.users ?? '—'}
                        </TableCell>
                        <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                          {count?.workspaces ?? '—'}
                        </TableCell>
                        <TableCell>
                          <Tooltip
                            title={quota && Number(quota) > 0 ? `${percent}% of ${formatBytes(quota)}` : ''}
                            arrow
                            placement="top"
                          >
                            <Box>
                              <Typography
                                sx={{
                                  fontSize: '0.8125rem',
                                  fontWeight: 600,
                                  color: cv.textPrimary,
                                  fontVariantNumeric: 'tabular-nums',
                                }}
                              >
                                {formatBytes(used)}
                              </Typography>
                              {quota && Number(quota) > 0 ? (
                                <LinearProgress
                                  variant="determinate"
                                  value={Math.min(100, percent)}
                                  sx={{
                                    mt: 0.5,
                                    height: 4,
                                    borderRadius: 999,
                                    background: cv.surfaceMuted,
                                    '& .MuiLinearProgress-bar': {
                                      borderRadius: 999,
                                      background: percent >= 85 ? cv.destructive : cv.brandGradient,
                                    },
                                  }}
                                />
                              ) : null}
                            </Box>
                          </Tooltip>
                        </TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>
                          {formatDate(org.createdAt)}
                        </TableCell>
                        <TableCell align="right">
                          <Button
                            component={RouterLink}
                            to={`/platform/organizations/${org.id}`}
                            size="small"
                            sx={{ textTransform: 'none' }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            Manage
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Box>
            <PlatformTablePagination
              count={total}
              page={pagination.page}
              rowsPerPage={pagination.rowsPerPage}
              onPageChange={pagination.onPageChange}
              onRowsPerPageChange={pagination.onRowsPerPageChange}
            />
          </>
        )}
      </Panel>

      <Dialog
        open={modalOpen}
        onClose={closeModal}
        fullWidth
        maxWidth="sm"
        aria-labelledby="create-org-dialog-title"
        slotProps={noahDialogSlotProps({ overflow: 'hidden' })}
      >
        <DialogTitle id="create-org-dialog-title" sx={{ fontWeight: 600, color: cv.textPrimary }}>
          Add organization
        </DialogTitle>
        <DialogContent sx={{ pt: '8px !important' }}>
          {formError ? (
            <Typography sx={{ color: cv.destructive, mb: 2 }} role="alert">
              {formError}
            </Typography>
          ) : null}
          <Box sx={{ display: 'grid', gap: 1.5 }}>
            <TextField
              label="Organization name"
              size="small"
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
            <TextField
              label="Slug (optional)"
              size="small"
              helperText="Leave blank to auto-generate from the name"
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
            />
            <TextField
              select
              label="Plan"
              size="small"
              value={form.planId}
              onChange={(e) => setForm((f) => ({ ...f, planId: e.target.value }))}
              helperText="Select plan for this organization (Free or Paid)"
              SelectProps={{
                displayEmpty: true,
                MenuProps: dropdownMenuInDialogProps,
              }}
              slotProps={{
                select: {
                  displayEmpty: true,
                  MenuProps: dropdownMenuInDialogProps,
                },
              }}
            >
              {plans.map((plan) => {
                const cents = plan.monthlyPriceCents ?? 0;
                const label = cents > 0 ? `${plan.name} — $${(cents / 100).toFixed(0)}/mo` : `${plan.name} ($0)`;
                return (
                  <MenuItem key={plan.id} value={plan.id}>
                    {label}
                  </MenuItem>
                );
              })}
            </TextField>
            <Typography sx={{ fontSize: '0.8rem', color: cv.textMuted, mt: 0.5 }}>
              Super Admin Invite & Onboarding
            </Typography>
            <TextField
              label="Admin email"
              size="small"
              type="email"
              value={form.adminEmail}
              onChange={(e) => setForm((f) => ({ ...f, adminEmail: e.target.value }))}
              helperText="Must be a valid business email. An invitation link to set up password will be sent."
            />
            <TextField
              label="Admin name"
              size="small"
              value={form.adminName}
              onChange={(e) => setForm((f) => ({ ...f, adminName: e.target.value }))}
              disabled={!form.adminEmail.trim()}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeModal} sx={{ textTransform: 'none' }} disabled={saving}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => void save()}
            sx={{ textTransform: 'none' }}
            disabled={saving}
          >
            {saving ? 'Creating…' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

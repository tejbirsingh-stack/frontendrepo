import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  Button,
  IconButton,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import GridViewIcon from '@mui/icons-material/GridView';
import ViewListIcon from '@mui/icons-material/ViewList';
import { fetchPlans, fetchUsageOverview, type PlatformPlan } from '../api/platformApi';
import { RadialGauge } from '../components/PlatformCharts';
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
  TableLoadingBar,
  formatBytes,
  formatPercent,
  type FilterOption,
  type PlatformTableColumn,
} from '../components/PlatformUi';
import { platformTableSx } from '../components/platformTableStyles';
import { usePlatformTablePagination } from '../hooks/usePlatformTablePagination';
import { usePlatformTableSort } from '../hooks/usePlatformTableSort';
import {
  STORAGE_FILTER_OPTIONS,
  SUBSCRIPTION_FILTER_OPTIONS,
  applyStorageParams,
  text,
} from '../utils/platformListHelpers';
import { cv } from '../../theme/cssVars';

type ViewMode = 'list' | 'grid';
type UsageRow = Record<string, unknown>;

type UsageSortField =
  | 'name'
  | 'plan'
  | 'storageUsedBytes'
  | 'users'
  | 'assets'
  | 'workspaces'
  | 'status';

const DESCENDING_FIRST: readonly UsageSortField[] = [
  'storageUsedBytes',
  'users',
  'assets',
  'workspaces',
];

const COLUMNS: ReadonlyArray<PlatformTableColumn<UsageSortField>> = [
  { id: 'org', label: 'Organization', sortField: 'name' },
  { id: 'plan', label: 'Plan', sortField: 'plan' },
  { id: 'status', label: 'Status', sortField: 'status' },
  { id: 'storage', label: 'Storage', sortField: 'storageUsedBytes', width: 180 },
  { id: 'users', label: 'Users', sortField: 'users', align: 'right' },
  { id: 'assets', label: 'Assets', sortField: 'assets', align: 'right' },
  { id: 'workspaces', label: 'Workspaces', sortField: 'workspaces', align: 'right' },
];

const STATUS_OPTIONS: ReadonlyArray<FilterOption> = [
  { value: '', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
];

type UsageFilters = {
  q: string;
  status: string;
  planId: string;
  subscriptionStatus: string;
  storage: string;
};

const emptyFilters: UsageFilters = {
  q: '',
  status: '',
  planId: '',
  subscriptionStatus: '',
  storage: '',
};

function storagePct(row: UsageRow) {
  return formatPercent(row.storageUsedBytes as string, row.storageQuotaBytes as string);
}

function seatsPct(row: UsageRow) {
  return formatPercent(row.usersUsed as string | number, row.maxUsers as string | number);
}

function ViewToggle({
  value,
  onChange,
}: Readonly<{
  value: ViewMode;
  onChange: (next: ViewMode) => void;
}>) {
  const buttonSx = (active: boolean) => ({
    width: 36,
    height: 36,
    borderRadius: '6px',
    border: `1px solid ${active ? cv.brandOrchid : cv.border}`,
    background: active ? cv.purpleSurface : 'transparent',
    color: active ? cv.brandOrchid : cv.textMuted,
    '&:hover': {
      background: cv.purpleSurface,
      borderColor: cv.brandOrchid,
      color: cv.brandOrchid,
    },
  });

  return (
    <Box
      role="group"
      aria-label="Usage view mode"
      sx={{ display: 'inline-flex', gap: 0.5, p: 0.35, borderRadius: '8px', border: `1px solid ${cv.border}` }}
    >
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

function UsageGridCard({ row }: Readonly<{ row: UsageRow }>) {
  const storageUsed = formatBytes(row.storageUsedBytes as string);
  const storageQuota = formatBytes(row.storageQuotaBytes as string);
  const usersUsed = Number(row.usersUsed ?? 0);
  const maxUsers = Number(row.maxUsers ?? 0);
  const assetsCount = Number(row.assetsCount ?? 0);
  const workspacesCount = Number(row.workspacesCount ?? 0);
  const plan = row.currentPlan as { name?: string } | null;
  const planLabel = plan?.name || (typeof row.planType === 'string' && row.planType ? row.planType : '—');

  return (
    <Panel
      title={String(row.name)}
      subtitle={planLabel}
      sx={{
        transition: 'border-color 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease',
        '&:hover': {
          borderColor: cv.borderStrong,
          transform: 'translateY(-2px)',
          boxShadow: cv.brandShadowSoft,
        },
      }}
    >
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mb: 1.5 }}>
        <RadialGauge
          percent={storagePct(row)}
          label="Storage"
          detail={`${storageUsed} of ${storageQuota}`}
          height={140}
        />
        <RadialGauge
          percent={seatsPct(row)}
          label="Seats"
          detail={`${usersUsed} of ${maxUsers} users`}
          height={140}
        />
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 1,
          pt: 1.25,
          borderTop: `1px solid ${cv.border}`,
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
            Assets
          </Typography>
          <Typography sx={{ fontSize: '1.05rem', fontWeight: 700, mt: 0.25 }}>
            {assetsCount}
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
            Workspaces
          </Typography>
          <Typography sx={{ fontSize: '1.05rem', fontWeight: 700, mt: 0.25 }}>
            {workspacesCount}
          </Typography>
        </Box>
      </Box>

      <Typography sx={{ fontSize: '0.7rem', color: cv.textMuted, mt: 1.25 }}>
        {storageUsed} / {storageQuota} · {usersUsed} / {maxUsers} users
      </Typography>
    </Panel>
  );
}

export default function PlatformUsagePage() {
  const [filters, setFilters] = useState<UsageFilters>(emptyFilters);
  const [searchTerm, setSearchTerm] = useState('');
  const [rows, setRows] = useState<UsageRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loadedKey, setLoadedKey] = useState('');
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [plans, setPlans] = useState<PlatformPlan[]>([]);
  const pagination = usePlatformTablePagination([viewMode]);
  const sort = usePlatformTableSort<UsageSortField>('storageUsedBytes', 'desc', DESCENDING_FIRST);
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
    applyStorageParams(params, filters.storage);
    return params;
  }, [filters, sort.sortBy, sort.sortDir, pagination.page, pagination.rowsPerPage]);

  const queryKey = useMemo(() => JSON.stringify(queryParams), [queryParams]);
  const loading = loadedKey !== queryKey;

  useEffect(() => {
    fetchPlans()
      .then((res) => setPlans(res.plans || []))
      .catch(() => setPlans([]));
  }, []);

  useEffect(() => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    fetchUsageOverview(queryParams)
      .then((res) => {
        if (requestIdRef.current !== requestId) return;
        setRows(res.usage);
        setTotal(Number((res as { total?: number }).total ?? res.usage.length));
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

  const patchFilters = (patch: Partial<UsageFilters>) => {
    setFilters((current) => ({ ...current, ...patch }));
    pagination.setPage(0);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmed = searchTerm.trim();
      setFilters((current) => (current.q === trimmed ? current : { ...current, q: trimmed }));
      pagination.setPage(0);
    }, 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  const handleSort = (field: UsageSortField) => {
    sort.toggleSort(field);
    pagination.setPage(0);
  };

  const clearFilter = (key: string) => {
    if (key === 'q') {
      setSearchTerm('');
      patchFilters({ q: '' });
      return;
    }
    patchFilters({ [key]: '' } as Partial<UsageFilters>);
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
      chips.push({
        key: 'status',
        label: `Status: ${STATUS_OPTIONS.find((o) => o.value === filters.status)?.label ?? filters.status}`,
      });
    }
    if (filters.planId) {
      chips.push({
        key: 'planId',
        label: `Plan: ${planOptions.find((o) => o.value === filters.planId)?.label ?? filters.planId}`,
      });
    }
    if (filters.subscriptionStatus) {
      chips.push({
        key: 'subscriptionStatus',
        label: `Subscription: ${SUBSCRIPTION_FILTER_OPTIONS.find((o) => o.value === filters.subscriptionStatus)?.label ?? filters.subscriptionStatus}`,
      });
    }
    if (filters.storage) {
      chips.push({
        key: 'storage',
        label: `Storage: ${STORAGE_FILTER_OPTIONS.find((o) => o.value === filters.storage)?.label ?? filters.storage}`,
      });
    }
    return chips;
  }, [filters, planOptions]);

  let emptyMessage = 'No usage data found';
  if (loading) emptyMessage = 'Loading usage…';
  else if (activeFilterChips.length > 0) emptyMessage = 'No organizations match these filters';

  return (
    <Box>
      <PageHeader
        title="Usage"
        subtitle="Storage, seats, and assets by organization"
        actions={<ViewToggle value={viewMode} onChange={setViewMode} />}
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
          placeholder="Search organization or plan"
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
          options={[...SUBSCRIPTION_FILTER_OPTIONS]}
          onChange={(value) => patchFilters({ subscriptionStatus: value })}
          minWidth={170}
        />
        <FilterSelect
          label="Storage used"
          value={filters.storage}
          options={[...STORAGE_FILTER_OPTIONS]}
          onChange={(value) => patchFilters({ storage: value })}
          minWidth={160}
        />
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

      <TableLoadingBar loading={loading} />

      {rows.length === 0 ? (
        <Panel>
          <EmptyState message={emptyMessage} />
        </Panel>
      ) : null}

      {rows.length > 0 && viewMode === 'list' ? (
        <Panel
          title={`${total} ${total === 1 ? 'organization' : 'organizations'}`}
          subtitle="Click a column header to sort"
        >
          <Box sx={{ overflowX: 'auto', opacity: loading ? 0.6 : 1, transition: 'opacity 0.15s ease' }}>
            <Table size="small" sx={platformTableSx}>
              <PlatformTableHead
                columns={COLUMNS}
                sortBy={sort.sortBy}
                sortDir={sort.sortDir}
                onSort={handleSort}
              />
              <TableBody>
                {rows.map((row) => {
                  const plan = row.currentPlan as { name?: string } | null;
                  const used = row.storageUsedBytes as string;
                  const quota = row.storageQuotaBytes as string | undefined;
                  const percent = formatPercent(used, quota);
                  return (
                    <TableRow key={String(row.id)} hover>
                      <TableCell>
                        <Typography sx={{ fontWeight: 600, fontSize: '0.875rem', color: cv.textPrimary }}>
                          {text(row.name)}
                        </Typography>
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
                          {plan?.name || text(row.planType)}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <StatusChip status={text(row.status, 'active')} />
                      </TableCell>
                      <TableCell>
                        <Typography
                          sx={{
                            fontSize: '0.8125rem',
                            fontWeight: 600,
                            color: cv.textPrimary,
                            fontVariantNumeric: 'tabular-nums',
                          }}
                        >
                          {formatBytes(used)}
                          {quota ? (
                            <Typography component="span" sx={{ color: cv.textMuted, fontWeight: 400 }}>
                              {' '}
                              / {formatBytes(quota)}
                            </Typography>
                          ) : null}
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
                      </TableCell>
                      <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                        {text(row.usersUsed)} / {text(row.maxUsers)}
                      </TableCell>
                      <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                        {text(row.assetsCount)}
                      </TableCell>
                      <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                        {text(row.workspacesCount)}
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
        </Panel>
      ) : null}

      {rows.length > 0 && viewMode === 'grid' ? (
        <>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                lg: 'repeat(3, 1fr)',
              },
              gap: 2,
              opacity: loading ? 0.6 : 1,
              transition: 'opacity 0.15s ease',
            }}
          >
            {rows.map((row) => (
              <UsageGridCard key={String(row.id)} row={row} />
            ))}
          </Box>
          <PlatformTablePagination
            count={total}
            page={pagination.page}
            rowsPerPage={pagination.rowsPerPage}
            onPageChange={pagination.onPageChange}
            onRowsPerPageChange={pagination.onRowsPerPageChange}
          />
        </>
      ) : null}
    </Box>
  );
}

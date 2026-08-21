import { useEffect, useMemo, useRef, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Typography,
  Tooltip,
  IconButton,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { fetchBillingOverview, fetchPlans, type PlatformPlan } from '../api/platformApi';
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
  StatCard,
  StatusChip,
  TableLoadingBar,
  type FilterOption,
  type PlatformTableColumn,
} from '../components/PlatformUi';
import { platformTableSx } from '../components/platformTableStyles';
import { usePlatformTablePagination } from '../hooks/usePlatformTablePagination';
import { usePlatformTableSort } from '../hooks/usePlatformTableSort';
import {
  SUBSCRIPTION_FILTER_OPTIONS,
  formatDate,
  text,
} from '../utils/platformListHelpers';
import { cv } from '../../theme/cssVars';

type BillingSortField = 'name' | 'plan' | 'subscriptionStatus' | 'users' | 'updatedAt';

const DESCENDING_FIRST: readonly BillingSortField[] = ['users', 'updatedAt'];

const COLUMNS: ReadonlyArray<PlatformTableColumn<BillingSortField>> = [
  { id: 'org', label: 'Organization', sortField: 'name' },
  { id: 'plan', label: 'Plan', sortField: 'plan' },
  { id: 'sub', label: 'Subscription', sortField: 'subscriptionStatus' },
  { id: 'stripe', label: 'Stripe customer' },
  { id: 'users', label: 'Users', sortField: 'users', align: 'right' },
  { id: 'updated', label: 'Updated', sortField: 'updatedAt' },
];

const STATUS_OPTIONS: ReadonlyArray<FilterOption> = [
  { value: '', label: 'All org statuses' },
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
];

type BillingFilters = {
  q: string;
  status: string;
  planId: string;
  subscriptionStatus: string;
};

const emptyFilters: BillingFilters = {
  q: '',
  status: '',
  planId: '',
  subscriptionStatus: '',
};

export function PlatformBillingSubscriptionsSection({ onRowClick }: { onRowClick?: (orgId: string) => void }) {
  const [filters, setFilters] = useState<BillingFilters>(emptyFilters);
  const [searchTerm, setSearchTerm] = useState('');
  const [billing, setBilling] = useState<Record<string, unknown> | null>(null);
  const [total, setTotal] = useState(0);
  const [loadedKey, setLoadedKey] = useState('');
  const [error, setError] = useState('');
  const [plans, setPlans] = useState<PlatformPlan[]>([]);
  const pagination = usePlatformTablePagination();
  const sort = usePlatformTableSort<BillingSortField>('updatedAt', 'desc', DESCENDING_FIRST);
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
    fetchBillingOverview(queryParams)
      .then((res) => {
        if (requestIdRef.current !== requestId) return;
        setBilling(res.billing);
        const nextTotal = Number(
          (res.billing as { total?: number } | null)?.total ??
            ((res.billing as { subscriptions?: unknown[] } | null)?.subscriptions?.length ?? 0),
        );
        setTotal(nextTotal);
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

  const patchFilters = (patch: Partial<BillingFilters>) => {
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

  const handleSort = (field: BillingSortField) => {
    sort.toggleSort(field);
    pagination.setPage(0);
  };

  const clearFilter = (key: string) => {
    if (key === 'q') {
      setSearchTerm('');
      patchFilters({ q: '' });
      return;
    }
    patchFilters({ [key]: '' } as Partial<BillingFilters>);
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
    return chips;
  }, [filters, planOptions]);

  const subscriptions = (billing?.subscriptions as Array<Record<string, unknown>>) || [];
  const mrr = Number(billing?.estimatedMrrCents || 0) / 100;

  let emptyMessage = 'No subscriptions found';
  if (loading) emptyMessage = 'Loading billing…';
  else if (activeFilterChips.length > 0) emptyMessage = 'No subscriptions match these filters';

  return (
    <Box>
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
          placeholder="Search org, plan, or Stripe ID"
          minWidth={280}
        />
        <FilterSelect
          label="Org status"
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
      </FilterBar>

      <ActiveFilterChips
        filters={activeFilterChips}
        onClear={clearFilter}
        onClearAll={clearAllFilters}
      />

      {error ? <Typography sx={{ color: cv.destructive, mb: 2 }}>{error}</Typography> : null}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 3 }}>
        <StatCard label="Estimated MRR" value={`$${mrr.toFixed(0)}`} />
        <StatCard label="Catalog plans" value={String(billing?.catalogPlanCount ?? '—')} />
      </Box>

      <Panel
        title={`${total} ${total === 1 ? 'subscription' : 'subscriptions'}`}
        subtitle="Click a column header to sort"
      >
        <TableLoadingBar loading={loading} />
        {subscriptions.length === 0 ? (
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
                  {subscriptions.map((row) => {
                    const plan = row.plan as { name?: string } | null;
                    const subscription =
                      typeof row.subscriptionStatus === 'string' && row.subscriptionStatus
                        ? row.subscriptionStatus.replaceAll('_', ' ')
                        : null;
                    return (
                      <TableRow 
                        key={String(row.id)} 
                        hover
                        onClick={() => onRowClick?.(String(row.id))}
                        sx={{ cursor: onRowClick ? 'pointer' : 'inherit' }}
                      >
                        <TableCell>
                          <Button
                            component={RouterLink}
                            to={`/platform/organizations/${row.id}`}
                            size="small"
                            sx={{ textTransform: 'none', px: 0, fontWeight: 600 }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {text(row.name)}
                          </Button>
                          <Typography sx={{ fontSize: '0.75rem', color: cv.textMuted }}>
                            {text(row.slug, '')}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0.5 }}>
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
                            {row.billingCycle && (
                              <Typography sx={{ fontSize: '0.7rem', color: cv.textMuted, textTransform: 'capitalize', pl: 0.5 }}>
                                {row.billingCycle as string}
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0.5 }}>
                            {subscription ? (
                              <StatusChip status={subscription} label={subscription} />
                            ) : (
                              '—'
                            )}
                            {row.scheduledDowngrade && (row.scheduledDowngrade as Record<string, unknown>).planName && (
                              <Typography sx={{ fontSize: '0.68rem', color: cv.textMuted, pl: 0.25 }}>
                                ↓ {(row.scheduledDowngrade as Record<string, unknown>).planName as string}
                                {(row.scheduledDowngrade as Record<string, unknown>).billingCycle
                                  ? ` · ${(row.scheduledDowngrade as Record<string, unknown>).billingCycle}`
                                  : ''}
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Typography
                              sx={{
                                fontSize: '0.75rem',
                                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                                color: cv.textMuted,
                              }}
                            >
                              {text(row.stripeCustomerId)}
                            </Typography>
                            {row.stripeCustomerId && typeof row.stripeCustomerId === 'string' && (
                              <Tooltip title="Copy ID">
                                <IconButton
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigator.clipboard.writeText(row.stripeCustomerId as string);
                                  }}
                                  sx={{ p: 0.5, color: cv.textMuted, '&:hover': { color: cv.text } }}
                                >
                                  <ContentCopyIcon sx={{ fontSize: '0.875rem' }} />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                          {text(row.userCount)}
                        </TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(row.updatedAt)}</TableCell>
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
    </Box>
  );
}

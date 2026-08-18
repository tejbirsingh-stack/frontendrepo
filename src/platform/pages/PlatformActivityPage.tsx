import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { fetchActivity, fetchOrganizations } from '../api/platformApi';
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
  TableLoadingBar,
  type FilterOption,
  type PlatformTableColumn,
} from '../components/PlatformUi';
import { platformTableSx } from '../components/platformTableStyles';
import { usePlatformTablePagination } from '../hooks/usePlatformTablePagination';
import { usePlatformTableSort } from '../hooks/usePlatformTableSort';
import {
  CREATED_FILTER_OPTIONS,
  applyCreatedParams,
  formatDateTime,
  text,
} from '../utils/platformListHelpers';
import { cv } from '../../theme/cssVars';

type ActivitySortField =
  | 'createdAt'
  | 'activityName'
  | 'activityType'
  | 'actorType'
  | 'userEmail'
  | 'organization';

const DESCENDING_FIRST: readonly ActivitySortField[] = ['createdAt'];

const COLUMNS: ReadonlyArray<PlatformTableColumn<ActivitySortField>> = [
  { id: 'when', label: 'When', sortField: 'createdAt' },
  { id: 'activity', label: 'Activity', sortField: 'activityName' },
  { id: 'actor', label: 'Actor', sortField: 'userEmail' },
  { id: 'org', label: 'Org', sortField: 'organization' },
  { id: 'type', label: 'Type', sortField: 'activityType' },
];

const TYPE_OPTIONS: ReadonlyArray<FilterOption> = [
  { value: '', label: 'All types' },
  { value: 'platform', label: 'Platform' },
  { value: 'billing', label: 'Billing' },
  { value: 'user', label: 'User' },
  { value: 'organization', label: 'Organization' },
];

const ACTOR_OPTIONS: ReadonlyArray<FilterOption> = [
  { value: '', label: 'All actors' },
  { value: 'platform_admin', label: 'Platform admin' },
  { value: 'user', label: 'User' },
  { value: 'system', label: 'System' },
  { value: 'cron', label: 'Cron' },
];

type ActivityFilters = {
  q: string;
  orgId: string;
  activityType: string;
  actorType: string;
  created: string;
  createdFrom: string;
  createdTo: string;
};

const emptyFilters: ActivityFilters = {
  q: '',
  orgId: '',
  activityType: '',
  actorType: '',
  created: '',
  createdFrom: '',
  createdTo: '',
};

export default function PlatformActivityPage() {
  const [filters, setFilters] = useState<ActivityFilters>(emptyFilters);
  const [searchTerm, setSearchTerm] = useState('');
  const [rows, setRows] = useState<Array<Record<string, unknown>>>([]);
  const [total, setTotal] = useState(0);
  const [loadedKey, setLoadedKey] = useState('');
  const [error, setError] = useState('');
  const [orgOptions, setOrgOptions] = useState<Array<{ id: string; name: string }>>([]);
  const pagination = usePlatformTablePagination();
  const sort = usePlatformTableSort<ActivitySortField>('createdAt', 'desc', DESCENDING_FIRST);
  const requestIdRef = useRef(0);

  const orgFilterOptions = useMemo<FilterOption[]>(
    () => [{ value: '', label: 'All organizations' }, ...orgOptions.map((o) => ({ value: o.id, label: o.name }))],
    [orgOptions],
  );

  const queryParams = useMemo(() => {
    const params: Record<string, string> = {
      limit: String(pagination.rowsPerPage),
      offset: String(pagination.page * pagination.rowsPerPage),
      sortBy: sort.sortBy,
      sortDir: sort.sortDir,
    };
    if (filters.q) params.q = filters.q;
    if (filters.orgId) params.orgId = filters.orgId;
    if (filters.activityType) params.activityType = filters.activityType;
    if (filters.actorType) params.actorType = filters.actorType;
    applyCreatedParams(params, filters.created, filters.createdFrom, filters.createdTo);
    return params;
  }, [filters, sort.sortBy, sort.sortDir, pagination.page, pagination.rowsPerPage]);

  const queryKey = useMemo(() => JSON.stringify(queryParams), [queryParams]);
  const loading = loadedKey !== queryKey;

  useEffect(() => {
    fetchOrganizations({ limit: '200' })
      .then((res) =>
        setOrgOptions(
          (res.organizations || []).map((org) => ({
            id: String(org.id),
            name: String(org.name),
          })),
        ),
      )
      .catch(() => setOrgOptions([]));
  }, []);

  useEffect(() => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    fetchActivity(queryParams)
      .then((res) => {
        if (requestIdRef.current !== requestId) return;
        setRows(res.activities);
        setTotal(Number((res as { total?: number }).total ?? res.activities.length));
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

  const patchFilters = (patch: Partial<ActivityFilters>) => {
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

  const handleSort = (field: ActivitySortField) => {
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
    patchFilters({ [key]: '' } as Partial<ActivityFilters>);
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setFilters(emptyFilters);
    pagination.setPage(0);
  };

  const activeFilterChips = useMemo(() => {
    const chips: Array<{ key: string; label: string }> = [];
    if (filters.q) chips.push({ key: 'q', label: `Search: ${filters.q}` });
    if (filters.orgId) {
      chips.push({
        key: 'orgId',
        label: `Org: ${orgFilterOptions.find((o) => o.value === filters.orgId)?.label ?? filters.orgId}`,
      });
    }
    if (filters.activityType) {
      chips.push({
        key: 'activityType',
        label: `Type: ${TYPE_OPTIONS.find((o) => o.value === filters.activityType)?.label ?? filters.activityType}`,
      });
    }
    if (filters.actorType) {
      chips.push({
        key: 'actorType',
        label: `Actor: ${ACTOR_OPTIONS.find((o) => o.value === filters.actorType)?.label ?? filters.actorType}`,
      });
    }
    if (filters.created === 'custom' && (filters.createdFrom || filters.createdTo)) {
      chips.push({
        key: 'created',
        label: `When: ${filters.createdFrom || 'any'} → ${filters.createdTo || 'today'}`,
      });
    } else if (filters.created) {
      chips.push({
        key: 'created',
        label: `When: ${CREATED_FILTER_OPTIONS.find((o) => o.value === filters.created)?.label ?? filters.created}`,
      });
    }
    return chips;
  }, [filters, orgFilterOptions]);

  let emptyMessage = 'No activity found';
  if (loading) emptyMessage = 'Loading activity…';
  else if (activeFilterChips.length > 0) emptyMessage = 'No activity matches these filters';

  return (
    <Box>
      <PageHeader title="Activity logs" subtitle="Platform-wide audit trail across organizations" />

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
          placeholder="Search activity, description, or email"
          minWidth={280}
        />
        <FilterSelect
          label="Organization"
          value={filters.orgId}
          options={orgFilterOptions}
          onChange={(value) => patchFilters({ orgId: value })}
          minWidth={180}
        />
        <FilterSelect
          label="Type"
          value={filters.activityType}
          options={TYPE_OPTIONS}
          onChange={(value) => patchFilters({ activityType: value })}
        />
        <FilterSelect
          label="Actor"
          value={filters.actorType}
          options={ACTOR_OPTIONS}
          onChange={(value) => patchFilters({ actorType: value })}
        />
        <FilterSelect
          label="When"
          value={filters.created}
          options={[...CREATED_FILTER_OPTIONS]}
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
              onChange={(e) => patchFilters({ createdFrom: e.target.value })}
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ minWidth: 150, '& .MuiInputBase-input': { fontSize: '0.8125rem' } }}
            />
            <TextField
              size="small"
              type="date"
              label="To"
              value={filters.createdTo}
              onChange={(e) => patchFilters({ createdTo: e.target.value })}
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

      {error ? <Typography sx={{ color: cv.destructive, mb: 2 }}>{error}</Typography> : null}

      <Panel
        title={`${total} ${total === 1 ? 'event' : 'events'}`}
        subtitle="Click a column header to sort"
      >
        <TableLoadingBar loading={loading} />
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
                  {rows.map((row) => {
                    const org = row.organization as { name?: string } | null;
                    return (
                      <TableRow key={String(row.id)} hover>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>
                          {formatDateTime(row.createdAt)}
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600, color: cv.textPrimary }}>
                            {text(row.activityName)}
                          </Typography>
                          {row.description ? (
                            <Typography sx={{ fontSize: '0.7rem', color: cv.textMuted }}>
                              {text(row.description)}
                            </Typography>
                          ) : null}
                        </TableCell>
                        <TableCell>{text(row.userEmail || row.actorType)}</TableCell>
                        <TableCell>{org?.name || '—'}</TableCell>
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
                            {text(row.activityType)}
                          </Box>
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
    </Box>
  );
}

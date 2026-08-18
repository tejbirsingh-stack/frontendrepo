import { useEffect, useMemo, useRef, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
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
import { fetchOrganizations, fetchPlatformWorkspaces } from '../api/platformApi';
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
  type FilterOption,
  type PlatformTableColumn,
} from '../components/PlatformUi';
import { platformTableSx } from '../components/platformTableStyles';
import { usePlatformTablePagination } from '../hooks/usePlatformTablePagination';
import { usePlatformTableSort } from '../hooks/usePlatformTableSort';
import {
  CREATED_FILTER_OPTIONS,
  applyCreatedParams,
  formatDate,
  text,
} from '../utils/platformListHelpers';
import { cv } from '../../theme/cssVars';

type WsSortField =
  | 'name'
  | 'organization'
  | 'members'
  | 'projects'
  | 'folders'
  | 'assets'
  | 'orgStatus'
  | 'createdAt';

const DESCENDING_FIRST: readonly WsSortField[] = [
  'members',
  'projects',
  'folders',
  'assets',
  'createdAt',
];

const COLUMNS: ReadonlyArray<PlatformTableColumn<WsSortField>> = [
  { id: 'workspace', label: 'Workspace', sortField: 'name' },
  { id: 'org', label: 'Organization', sortField: 'organization' },
  { id: 'members', label: 'Members', sortField: 'members', align: 'right' },
  { id: 'projects', label: 'Projects', sortField: 'projects', align: 'right' },
  { id: 'folders', label: 'Folders', sortField: 'folders', align: 'right' },
  { id: 'assets', label: 'Assets', sortField: 'assets', align: 'right' },
  { id: 'orgStatus', label: 'Org status', sortField: 'orgStatus' },
  { id: 'created', label: 'Created', sortField: 'createdAt' },
];

const ORG_STATUS_OPTIONS: ReadonlyArray<FilterOption> = [
  { value: '', label: 'Any org status' },
  { value: 'active', label: 'Active org' },
  { value: 'suspended', label: 'Suspended org' },
];

const VISIBILITY_OPTIONS: ReadonlyArray<FilterOption> = [
  { value: '', label: 'Any visibility' },
  { value: 'private', label: 'Private' },
  { value: 'public', label: 'Public' },
];

type WsFilters = {
  q: string;
  orgId: string;
  orgStatus: string;
  visibility: string;
  created: string;
  createdFrom: string;
  createdTo: string;
};

const emptyFilters: WsFilters = {
  q: '',
  orgId: '',
  orgStatus: '',
  visibility: '',
  created: '',
  createdFrom: '',
  createdTo: '',
};

export default function PlatformWorkspacesPage() {
  const [filters, setFilters] = useState<WsFilters>(emptyFilters);
  const [searchTerm, setSearchTerm] = useState('');
  const [rows, setRows] = useState<Array<Record<string, unknown>>>([]);
  const [total, setTotal] = useState(0);
  const [loadedKey, setLoadedKey] = useState('');
  const [error, setError] = useState('');
  const [orgOptions, setOrgOptions] = useState<Array<{ id: string; name: string }>>([]);
  const pagination = usePlatformTablePagination();
  const sort = usePlatformTableSort<WsSortField>('createdAt', 'desc', DESCENDING_FIRST);
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
    if (filters.orgStatus) params.orgStatus = filters.orgStatus;
    if (filters.visibility) params.visibility = filters.visibility;
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
    fetchPlatformWorkspaces(queryParams)
      .then((res) => {
        if (requestIdRef.current !== requestId) return;
        setRows(res.workspaces);
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

  const patchFilters = (patch: Partial<WsFilters>) => {
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

  const handleSort = (field: WsSortField) => {
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
    patchFilters({ [key]: '' } as Partial<WsFilters>);
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
    if (filters.orgStatus) {
      chips.push({
        key: 'orgStatus',
        label: ORG_STATUS_OPTIONS.find((o) => o.value === filters.orgStatus)?.label ?? filters.orgStatus,
      });
    }
    if (filters.visibility) {
      chips.push({
        key: 'visibility',
        label: `Visibility: ${filters.visibility}`,
      });
    }
    if (filters.created === 'custom' && (filters.createdFrom || filters.createdTo)) {
      chips.push({
        key: 'created',
        label: `Created: ${filters.createdFrom || 'any'} → ${filters.createdTo || 'today'}`,
      });
    } else if (filters.created) {
      chips.push({
        key: 'created',
        label: `Created: ${CREATED_FILTER_OPTIONS.find((o) => o.value === filters.created)?.label ?? filters.created}`,
      });
    }
    return chips;
  }, [filters, orgFilterOptions]);

  let emptyMessage = 'No workspaces found';
  if (loading) emptyMessage = 'Loading workspaces…';
  else if (activeFilterChips.length > 0) emptyMessage = 'No workspaces match these filters';

  return (
    <Box>
      <PageHeader
        title="Workspaces"
        subtitle="All tenant workspaces — projects, folders, members, and assets"
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
          placeholder="Search workspace, org, or description"
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
          label="Org status"
          value={filters.orgStatus}
          options={ORG_STATUS_OPTIONS}
          onChange={(value) => patchFilters({ orgStatus: value })}
          minWidth={150}
        />
        <FilterSelect
          label="Visibility"
          value={filters.visibility}
          options={VISIBILITY_OPTIONS}
          onChange={(value) => patchFilters({ visibility: value })}
        />
        <FilterSelect
          label="Created"
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

      {error ? (
        <Typography sx={{ color: cv.destructive, mb: 2 }} role="alert">
          {error}
        </Typography>
      ) : null}

      <Panel
        title={`${total} ${total === 1 ? 'workspace' : 'workspaces'}`}
        subtitle="Across all organizations — click a header to sort"
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
                  {rows.map((ws) => {
                    const org = ws.organization as
                      | { id?: string; name?: string; status?: string }
                      | null;
                    const count = ws._count as
                      | {
                          users?: number;
                          projects?: number;
                          folders?: number;
                          assets?: number;
                        }
                      | undefined;
                    return (
                      <TableRow key={String(ws.id)} hover>
                        <TableCell>
                          <Typography sx={{ fontWeight: 600, fontSize: '0.875rem', color: cv.textPrimary }}>
                            {text(ws.name)}
                          </Typography>
                          {ws.description ? (
                            <Typography sx={{ fontSize: '0.75rem', color: cv.textMuted }}>
                              {text(ws.description)}
                            </Typography>
                          ) : null}
                        </TableCell>
                        <TableCell>
                          {org?.id ? (
                            <Button
                              component={RouterLink}
                              to={`/platform/organizations/${org.id}`}
                              size="small"
                              sx={{ textTransform: 'none', px: 0 }}
                            >
                              {org.name}
                            </Button>
                          ) : (
                            '—'
                          )}
                        </TableCell>
                        <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                          {count?.users ?? 0}
                        </TableCell>
                        <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                          {count?.projects ?? 0}
                        </TableCell>
                        <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                          {count?.folders ?? 0}
                        </TableCell>
                        <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                          {count?.assets ?? 0}
                        </TableCell>
                        <TableCell>
                          <StatusChip status={text(org?.status, 'active')} />
                        </TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(ws.createdAt)}</TableCell>
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

import { useEffect, useMemo, useRef, useState } from 'react';
import ExcelJS from 'exceljs';
import DownloadIcon from '@mui/icons-material/Download';
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
import { fetchActivity, fetchOrganizations, fetchPlatformRoles } from '../api/platformApi';
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
  | 'description'
  | 'activityType'
  | 'actorType'
  | 'userRole'
  | 'userEmail'
  | 'organization';

const DESCENDING_FIRST: readonly ActivitySortField[] = ['createdAt'];

const COLUMNS: ReadonlyArray<PlatformTableColumn<ActivitySortField>> = [
  { id: 'user', label: 'User', sortField: 'userEmail' },
  { id: 'role', label: 'Role', sortField: 'userRole' },
  { id: 'org', label: 'Org', sortField: 'organization' },
  { id: 'activityName', label: 'Activity Name', sortField: 'activityName' },
  { id: 'description', label: 'Activity Details', sortField: 'description' },
  { id: 'type', label: 'Type', sortField: 'activityType' },
  { id: 'when', label: 'Time', sortField: 'createdAt' },
];

const TYPE_OPTIONS: ReadonlyArray<FilterOption> = [
  { value: '', label: 'All types' },
  { value: 'INFO', label: 'INFO' },
  { value: 'ERROR', label: 'ERROR' },
];

const ACTOR_OPTIONS: ReadonlyArray<FilterOption> = [
  { value: '', label: 'All actors' },
  { value: 'user', label: 'User' },
  { value: 'system', label: 'System' },
  { value: 'cron', label: 'Cron' },
];

type ActivityFilters = {
  q: string;
  orgId: string;
  userRole: string;
  activityType: string;
  actorType: string;
  created: string;
  createdFrom: string;
  createdTo: string;
};

const emptyFilters: ActivityFilters = {
  q: '',
  orgId: '',
  userRole: '',
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
  const [roles, setRoles] = useState<Array<{ id: string; name: string }>>([]);
  const pagination = usePlatformTablePagination();
  const sort = usePlatformTableSort<ActivitySortField>('createdAt', 'desc', DESCENDING_FIRST);
  const requestIdRef = useRef(0);

  const orgFilterOptions = useMemo<FilterOption[]>(
    () => [{ value: '', label: 'All organizations' }, ...orgOptions.map((o) => ({ value: o.id, label: o.name }))],
    [orgOptions],
  );

  const roleFilterOptions = useMemo<FilterOption[]>(
    () => [{ value: '', label: 'All roles' }, ...roles.map((r) => ({ value: r.name, label: r.name }))],
    [roles],
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
    if (filters.userRole) params.userRole = filters.userRole;
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

    fetchPlatformRoles({ includePlatformAdmin: 'true' })
      .then((res) => setRoles(res.roles || []))
      .catch(() => setRoles([]));
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
    if (filters.userRole) {
      chips.push({
        key: 'userRole',
        label: `Role: ${roleFilterOptions.find((o) => o.value === filters.userRole)?.label ?? filters.userRole}`,
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
  }, [filters, orgFilterOptions, roleFilterOptions]);

  const handleExport = async () => {
    if (total === 0) return;

    try {
      const res = await fetchActivity({ ...queryParams, limit: '10000', offset: '0' });
      const exportRows = res.activities || [];
      if (exportRows.length === 0) return;

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Activity Logs');

      worksheet.columns = [
        { header: 'User', key: 'user', width: 25 },
        { header: 'Email', key: 'email', width: 30 },
        { header: 'Role', key: 'role', width: 15 },
        { header: 'Org', key: 'org', width: 20 },
        { header: 'Activity Name', key: 'activityName', width: 25 },
        { header: 'Activity Details', key: 'description', width: 50 },
        { header: 'Type', key: 'type', width: 15 },
        { header: 'Time', key: 'time', width: 25 },
      ];

      const headerRow = worksheet.getRow(1);
      headerRow.height = 25;
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1976D2' },
      };
      headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

      for (const activity of exportRows) {
        worksheet.addRow({
          user: activity.userName || 'System',
          email: activity.userEmail || '',
          role: activity.userRole || '—',
          org: activity.organization?.name || '—',
          activityName: activity.activityName || '',
          description: activity.description || '',
          type: (activity.activityType || 'INFO').toUpperCase(),
          time: formatDateTime(activity.createdAt),
        });
      }

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) {
          row.height = 20;
          row.alignment = { vertical: 'middle', wrapText: true };
        }
      });

      worksheet.autoFilter = {
        from: 'A1',
        to: { row: 1, column: 8 },
      };

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `platform_activities_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export activities:', error);
    }
  };

  let emptyMessage = 'No activity found';
  if (loading) emptyMessage = 'Loading activity…';
  else if (activeFilterChips.length > 0) emptyMessage = 'No activity matches these filters';

  return (
    <Box>
      <PageHeader title="Activity logs" subtitle="Platform-wide audit trail across organizations" />

      <FilterBar
        actions={
          <Box sx={{ display: 'flex', gap: 1 }}>
            {activeFilterChips.length > 0 && (
              <Button onClick={clearAllFilters} size="small" sx={{ textTransform: 'none' }}>
                Reset filters
              </Button>
            )}
            <Button
              variant="outlined"
              size="small"
              startIcon={<DownloadIcon />}
              onClick={() => void handleExport()}
              disabled={total === 0 || loading}
              sx={{
                borderRadius: '6px',
                textTransform: 'none',
                borderColor: cv.border,
                color: cv.textPrimary,
                '&:hover': {
                  borderColor: cv.textSecondary,
                  backgroundColor: cv.surface,
                },
              }}
            >
              Export
            </Button>
          </Box>
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
          label="Role"
          value={filters.userRole}
          options={roleFilterOptions}
          onChange={(value) => patchFilters({ userRole: value })}
          minWidth={140}
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
                        <TableCell sx={{ minWidth: 160 }}>
                          {(() => {
                            const name = text(row.userName) || (row.userEmail ? text(row.userEmail) : text(row.actorType) || 'System');
                            const email = row.userName && row.userEmail && row.userName !== row.userEmail ? text(row.userEmail) : null;
                            return (
                              <>
                                <Typography sx={{ fontSize: '0.8125rem', fontWeight: 500, color: cv.textPrimary }}>
                                  {name}
                                </Typography>
                                {email ? (
                                  <Typography sx={{ mt: 0.25, fontSize: '0.75rem', color: cv.textMuted }}>
                                    {email}
                                  </Typography>
                                ) : null}
                              </>
                            );
                          })()}
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
                            }}
                          >
                            {text(row.userRole) || '—'}
                          </Box>
                        </TableCell>
                        <TableCell>{org?.name || '—'}</TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600, color: cv.textPrimary }}>
                            {text(row.activityName)}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ minWidth: 200, maxWidth: 360 }}>
                          <Typography
                            sx={{
                              fontSize: '0.8125rem',
                              color: row.description ? cv.textSecondary : cv.textMuted,
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }}
                          >
                            {text(row.description) || '—'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {(() => {
                            const rawType = String(row.activityType || 'INFO').toUpperCase();
                            const isError = rawType === 'ERROR';
                            return (
                              <Box
                                component="span"
                                sx={{
                                  display: 'inline-block',
                                  px: 1,
                                  py: 0.25,
                                  borderRadius: '6px',
                                  fontSize: '0.7rem',
                                  fontWeight: 600,
                                  textTransform: 'uppercase',
                                  ...(isError
                                    ? {
                                        backgroundColor: cv.destructiveSurface,
                                        color: cv.destructive,
                                        border: `1px solid ${cv.destructiveSurface}`,
                                      }
                                    : {
                                        backgroundColor: cv.blueGlow18,
                                        color: cv.brandBlue,
                                        border: `1px solid ${cv.border}`,
                                      }),
                                }}
                              >
                                {rawType}
                              </Box>
                            );
                          })()}
                        </TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>
                          {formatDateTime(row.createdAt)}
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

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Typography,
  Drawer,
  IconButton,
  Chip,
  Tooltip,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import { downloadCSV } from '../../utils/csvExport';
import { fetchPaymentLogs, fetchPaymentLogEvents, fetchPaymentLogOrgs } from '../api/platformApi';
import {
  ActiveFilterChips,
  EmptyState,
  FilterBar,
  FilterSelect,
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
import { formatDate, text, formatMoneyCents, CREATED_FILTER_OPTIONS, applyCreatedParams } from '../utils/platformListHelpers';
import { cv } from '../../theme/cssVars';
import Timeline from '@mui/lab/Timeline';
import TimelineItem, { timelineItemClasses } from '@mui/lab/TimelineItem';
import TimelineSeparator from '@mui/lab/TimelineSeparator';
import TimelineConnector from '@mui/lab/TimelineConnector';
import TimelineContent from '@mui/lab/TimelineContent';
import TimelineDot from '@mui/lab/TimelineDot';
import TimelineOppositeContent from '@mui/lab/TimelineOppositeContent';

type LogSortField = 'createdAt';

const COLUMNS: ReadonlyArray<PlatformTableColumn<LogSortField>> = [
  { id: 'org', label: 'Organization' },
  { id: 'amount', label: 'Amount', align: 'right' },
  { id: 'status', label: 'Status' },
  { id: 'stripe', label: 'Payment ID' },
  { id: 'date', label: 'Date', sortField: 'createdAt' },
];

const STATUS_OPTIONS: ReadonlyArray<FilterOption> = [
  { value: '', label: 'All statuses' },
  { value: 'succeeded', label: 'Succeeded' },
  { value: 'failed', label: 'Failed' },
  { value: 'pending', label: 'Pending' },
];

type LogFilters = {
  q: string;
  status: string;
  orgId: string;
  created: string;
};

const emptyFilters: LogFilters = {
  q: '',
  status: '',
  orgId: '',
  created: '',
};

export function PlatformBillingTransactionsSection({ defaultOrgId }: { defaultOrgId?: string }) {
  const [filters, setFilters] = useState<LogFilters>(() => ({
    ...emptyFilters,
    orgId: defaultOrgId || '',
  }));

  useEffect(() => {
    if (defaultOrgId) {
      setFilters((prev) => ({ ...prev, orgId: defaultOrgId }));
      // Optional: reset pagination when jumping to a new org
      // pagination.setPage(0);
    }
  }, [defaultOrgId]);
  const [searchTerm, setSearchTerm] = useState('');
  const [logs, setLogs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [failed30Days, setFailed30Days] = useState(0);
  const [loadedKey, setLoadedKey] = useState('');
  const [error, setError] = useState('');
  const pagination = usePlatformTablePagination();
  const sort = usePlatformTableSort<LogSortField>('createdAt', 'desc');
  const requestIdRef = useRef(0);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);

  const [orgs, setOrgs] = useState<any[]>([]);

  useEffect(() => {
    fetchPaymentLogOrgs()
      .then((res) => setOrgs(res.orgs || []))
      .catch(() => setOrgs([]));
  }, []);

  const orgOptions = useMemo<FilterOption[]>(
    () => [
      { value: '', label: 'All organizations' },
      ...orgs.map((o) => ({ value: o.id, label: o.name })),
    ],
    [orgs]
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
    if (filters.orgId) params.orgId = filters.orgId;
    if (filters.created) {
      applyCreatedParams(params, filters.created, '', '');
    }
    return params;
  }, [filters, sort.sortBy, sort.sortDir, pagination.page, pagination.rowsPerPage]);

  const queryKey = useMemo(() => JSON.stringify(queryParams), [queryParams]);
  const loading = loadedKey !== queryKey;

  useEffect(() => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    fetchPaymentLogs(queryParams)
      .then((res) => {
        if (requestIdRef.current !== requestId) return;
        setLogs(res.logs || []);
        setTotal(res.total || 0);
        setFailed30Days(res.failed30Days || 0);
        setError('');
      })
      .catch((err: Error) => {
        if (requestIdRef.current !== requestId) return;
        setError(err.message);
      })
      .finally(() => {
        if (requestIdRef.current === requestId) setLoadedKey(queryKey);
      });
  }, [queryKey]);

  const patchFilters = (patch: Partial<LogFilters>) => {
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
  }, [searchTerm]);

  const clearFilter = (key: string) => {
    if (key === 'q') {
      setSearchTerm('');
      patchFilters({ q: '' });
      return;
    }
    patchFilters({ [key]: '' } as Partial<LogFilters>);
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
    if (filters.orgId) {
      chips.push({
        key: 'orgId',
        label: `Org: ${orgOptions.find((o) => o.value === filters.orgId)?.label ?? filters.orgId}`,
      });
    }
    if (filters.created) {
      chips.push({
        key: 'created',
        label: `Date: ${CREATED_FILTER_OPTIONS.find((o) => o.value === filters.created)?.label ?? filters.created}`,
      });
    }
    return chips;
  }, [filters, orgOptions]);

  const openDrawer = (log: any) => {
    setSelectedLog(log);
    setDrawerOpen(true);
    setLoadingEvents(true);
    fetchPaymentLogEvents(log.id)
      .then((res) => {
        setEvents(res.events || []);
      })
      .catch((err) => {
        console.error(err);
        setEvents([]);
      })
      .finally(() => {
        setLoadingEvents(false);
      });
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setSelectedLog(null);
    setEvents([]);
  };

  let emptyMessage = 'No logs found';
  if (loading) emptyMessage = 'Loading logs…';
  else if (activeFilterChips.length > 0) emptyMessage = 'No logs match these filters';

  const handleExportCsv = () => {
    const stamp = new Date().toISOString().slice(0, 10);
    downloadCSV(
      `transactions-${stamp}`,
      ['Organization', 'Amount', 'Status', 'Payment ID', 'Date', 'Failure Reason'],
      logs.map((row) => [
        row.organization?.name || 'No Organization',
        row.amountCents ? (row.amountCents / 100).toFixed(2) : '0.00',
        row.status,
        row.stripePaymentIntentId || row.stripeSessionId || '',
        formatDate(row.createdAt),
        row.events?.[0]?.failureReason || '',
      ])
    );
  };

  return (
    <Box>
      <FilterBar
        actions={
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Button
              size="small"
              startIcon={<DownloadOutlinedIcon />}
              onClick={handleExportCsv}
              disabled={logs.length === 0}
              sx={{ textTransform: 'none', color: cv.textSecondary }}
            >
              Export to Excel
            </Button>
            {activeFilterChips.length > 0 && (
              <Button onClick={clearAllFilters} size="small" sx={{ textTransform: 'none' }}>
                Reset filters
              </Button>
            )}
          </Box>
        }
      >
        <SearchField
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search org, Stripe ID..."
          minWidth={280}
        />
        <FilterSelect
          label="Status"
          value={filters.status}
          options={STATUS_OPTIONS}
          onChange={(value) => patchFilters({ status: value })}
        />
        <FilterSelect
          label="Organization"
          value={filters.orgId}
          options={orgOptions}
          onChange={(value) => patchFilters({ orgId: value })}
        />
        <FilterSelect
          label="Date"
          value={filters.created}
          options={[...CREATED_FILTER_OPTIONS]}
          onChange={(value) => patchFilters({ created: value })}
        />
      </FilterBar>

      <ActiveFilterChips
        filters={activeFilterChips}
        onClear={clearFilter}
        onClearAll={clearAllFilters}
      />

      {error ? <Typography sx={{ color: cv.destructive, mb: 2 }}>{error}</Typography> : null}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 3 }}>
        <StatCard label="Total Transactions" value={String(total)} />
        <StatCard 
          label={filters.created ? "Failed Payments (Filtered Date)" : "Failed Payments (30 Days)"} 
          value={String(failed30Days)} 
        />
      </Box>

      <Panel
        title={`${total} ${total === 1 ? 'transaction' : 'transactions'}`}
        subtitle="Click a row to view event timeline"
      >
        <TableLoadingBar loading={loading} />
        {logs.length === 0 ? (
          <EmptyState message={emptyMessage} />
        ) : (
          <>
            <Box sx={{ overflowX: 'auto', opacity: loading ? 0.6 : 1, transition: 'opacity 0.15s ease' }}>
              <Table size="small" sx={platformTableSx}>
                <PlatformTableHead
                  columns={COLUMNS}
                  sortBy={sort.sortBy}
                  sortDir={sort.sortDir}
                  onSort={sort.toggleSort}
                />
                <TableBody>
                  {logs.map((row) => (
                    <TableRow 
                      key={String(row.id)} 
                      hover 
                      onClick={() => openDrawer(row)}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell>
                        <Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
                          {text(row.organization?.name, 'No Organization')}
                        </Typography>
                      </TableCell>
                      <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                        {row.amountCents ? formatMoneyCents(row.amountCents) : '—'}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0.5 }}>
                          <StatusChip status={row.status} label={row.status} />
                          {row.status?.toLowerCase() === 'failed' && row.events?.[0]?.failureReason && (
                            <Typography sx={{ 
                              fontSize: '0.68rem', 
                              color: cv.destructive, 
                              maxWidth: 240, 
                              lineHeight: 1.2,
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              wordBreak: 'break-word'
                            }}>
                              {row.events[0].failureReason}
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
                            {text(row.stripePaymentIntentId || row.stripeSessionId)}
                          </Typography>
                          {(row.stripePaymentIntentId || row.stripeSessionId) && (
                            <Tooltip title="Copy ID">
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigator.clipboard.writeText(row.stripePaymentIntentId || row.stripeSessionId);
                                }}
                                sx={{ p: 0.5, color: cv.textMuted, '&:hover': { color: cv.text } }}
                              >
                                <ContentCopyIcon sx={{ fontSize: '0.875rem' }} />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(row.createdAt)}</TableCell>
                    </TableRow>
                  ))}
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

      <Drawer anchor="right" open={drawerOpen} onClose={closeDrawer}>
        <Box sx={{ width: 450, p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Transaction Details
              </Typography>
              <Typography variant="body2" sx={{ color: cv.textMuted }}>
                {selectedLog?.id}
              </Typography>
            </Box>
            <IconButton onClick={closeDrawer} size="small">
              <CloseIcon />
            </IconButton>
          </Box>

          {selectedLog && (
            <Box sx={{ mb: 4, p: 2, background: cv.surfaceMuted, borderRadius: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, color: cv.textSecondary }}>Summary</Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Status</Typography>
                <StatusChip status={selectedLog.status} label={selectedLog.status} />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Amount</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {selectedLog.amountCents ? formatMoneyCents(selectedLog.amountCents) : '—'}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">Plan</Typography>
                <Typography variant="body2">{text(selectedLog.planName)}</Typography>
              </Box>
            </Box>
          )}

          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
            Event Timeline
          </Typography>

          {loadingEvents ? (
            <Typography variant="body2" sx={{ color: cv.textMuted }}>Loading events...</Typography>
          ) : events.length === 0 ? (
            <Typography variant="body2" sx={{ color: cv.textMuted }}>No events recorded for this transaction.</Typography>
          ) : (
            <Timeline
              sx={{
                [`& .${timelineItemClasses.root}:before`]: {
                  flex: 0,
                  padding: 0,
                },
                p: 0,
              }}
            >
              {events.map((event, i) => (
                <TimelineItem key={event.id}>
                  <TimelineSeparator>
                    <TimelineDot color={event.status.toLowerCase() === 'failed' ? 'error' : event.status.toLowerCase() === 'succeeded' ? 'success' : 'grey'} />
                    {i < events.length - 1 && <TimelineConnector />}
                  </TimelineSeparator>
                  <TimelineContent sx={{ pb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {event.eventType}
                      </Typography>
                      <Typography variant="caption" sx={{ color: cv.textMuted }}>
                        {new Date(event.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: cv.textSecondary, mb: 1 }}>
                      Status: {event.status}
                    </Typography>
                    {event.failureReason && (
                      <Box sx={{ p: 1.5, background: cv.destructiveSurface, borderRadius: 1, border: `1px solid ${cv.destructiveBorder}` }}>
                        <Typography variant="caption" sx={{ color: cv.destructive, fontWeight: 600, display: 'block', mb: 0.5 }}>
                          Failure Reason
                        </Typography>
                        <Typography variant="body2" sx={{ color: cv.destructive, wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                          {event.failureReason}
                        </Typography>
                      </Box>
                    )}
                  </TimelineContent>
                </TimelineItem>
              ))}
            </Timeline>
          )}
        </Box>
      </Drawer>
    </Box>
  );
}

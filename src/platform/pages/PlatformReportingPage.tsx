import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  FormGroup,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import {
  exportPlatformReports,
  fetchOrganizations,
  fetchPlans,
  fetchReportingSummary,
  type PlatformReportType,
} from '../api/platformApi';
import { PageHeader, Panel, StatCard, formatBytes } from '../components/PlatformUi';
import { downloadCSV } from '../../utils/csvExport';
import { cv } from '../../theme/cssVars';

const REPORT_OPTIONS: Array<{
  id: PlatformReportType;
  label: string;
  description: string;
}> = [
  {
    id: 'growth',
    label: 'Growth & conversion',
    description: 'New orgs, logins, plan mix, storage sold vs used',
  },
  {
    id: 'organizations',
    label: 'Organizations',
    description: 'Tenant directory with plan, seats, and storage',
  },
  {
    id: 'users',
    label: 'Users & roles',
    description: 'Accounts across organizations',
  },
  {
    id: 'usage',
    label: 'Usage & quotas',
    description: 'Storage utilization and seat consumption',
  },
  {
    id: 'activity',
    label: 'Activity',
    description: 'Platform-wide audit trail for the selected period',
  },
];

const PERIOD_OPTIONS = [
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
  { value: '365', label: 'Last 12 months' },
];

function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

function defaultRange(periodDays: number) {
  const to = new Date();
  const from = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);
  return { from: toDateInputValue(from), to: toDateInputValue(to) };
}

function cell(value: unknown) {
  if (value == null) return '';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return JSON.stringify(value);
}

function downloadGrowthCsv(
  growth: Record<string, unknown>,
  stamp: string,
) {
  const planConversion =
    (growth.planConversion as Array<{ planType: string; count: number }>) || [];

  downloadCSV(
    `noah-growth-${stamp}`,
    ['Metric', 'Value'],
    [
      ['Period days', cell(growth.periodDays)],
      ['From', cell(growth.from)],
      ['To', cell(growth.to)],
      ['New organizations', cell(growth.newOrganizations)],
      ['Login events', cell(growth.loginEvents)],
      ['Suspended organizations', cell(growth.suspendedOrganizations)],
      ['Storage used (bytes)', cell(growth.storageUsedBytes)],
      ['Storage sold (bytes)', cell(growth.storageQuotaBytes)],
      ...planConversion.map((row) => [`Plan: ${row.planType}`, row.count]),
    ],
  );
}

function downloadRowsCsv(
  filename: string,
  headers: string[],
  rows: Array<Record<string, unknown>>,
  keys: string[],
) {
  downloadCSV(
    filename,
    headers,
    rows.map((row) => keys.map((key) => cell(row[key]))),
  );
}

export default function PlatformReportingPage() {
  const initial = defaultRange(30);
  const [periodDays, setPeriodDays] = useState('30');
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);
  const [status, setStatus] = useState('');
  const [planType, setPlanType] = useState('');
  const [orgId, setOrgId] = useState('');
  const [selectedReports, setSelectedReports] = useState<PlatformReportType[]>([
    'growth',
    'organizations',
    'usage',
  ]);

  const [report, setReport] = useState<Record<string, unknown> | null>(null);
  const [orgOptions, setOrgOptions] = useState<Array<{ id: string; name: string }>>([]);
  const [planOptions, setPlanOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const filterParams = useMemo(() => {
    const params: Record<string, string> = {
      periodDays,
    };
    if (from) params.from = from;
    if (to) params.to = to;
    if (status) params.status = status;
    if (planType) params.planType = planType;
    if (orgId) params.orgId = orgId;
    return params;
  }, [periodDays, from, to, status, planType, orgId]);

  const loadSummary = () => {
    setLoading(true);
    setError('');
    fetchReportingSummary(filterParams)
      .then((res) => setReport(res.report))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadSummary();
    fetchOrganizations({ limit: '200' })
      .then((res) =>
        setOrgOptions(
          res.organizations.map((org) => ({
            id: String(org.id),
            name: String(org.name || org.slug || org.id),
          })),
        ),
      )
      .catch(() => setOrgOptions([]));
    fetchPlans()
      .then((res) =>
        setPlanOptions(
          res.plans.map((plan) => ({
            value: plan.id,
            label: plan.name,
          })),
        ),
      )
      .catch(() => setPlanOptions([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePeriodChange = (value: string) => {
    setPeriodDays(value);
    const range = defaultRange(Number(value) || 30);
    setFrom(range.from);
    setTo(range.to);
  };

  const toggleReport = (id: PlatformReportType) => {
    setSelectedReports((current) => {
      if (current.includes(id)) {
        if (current.length === 1) return current;
        return current.filter((item) => item !== id);
      }
      return [...current, id];
    });
  };

  const handleDownload = async () => {
    if (selectedReports.length === 0) return;
    setDownloading(true);
    setError('');
    try {
      const res = await exportPlatformReports({
        ...filterParams,
        reports: selectedReports.join(','),
      });
      const stamp = new Date().toISOString().slice(0, 10);
      const reports = res.reports || {};

      if (selectedReports.includes('growth') && reports.growth) {
        downloadGrowthCsv(reports.growth as Record<string, unknown>, stamp);
      }
      if (selectedReports.includes('organizations') && Array.isArray(reports.organizations)) {
        downloadRowsCsv(
          `noah-organizations-${stamp}`,
          [
            'ID',
            'Name',
            'Slug',
            'Status',
            'Plan type',
            'Plan name',
            'Users',
            'Workspaces',
            'Assets',
            'Storage used',
            'Storage quota',
            'Created at',
          ],
          reports.organizations as Array<Record<string, unknown>>,
          [
            'id',
            'name',
            'slug',
            'status',
            'planType',
            'planName',
            'users',
            'workspaces',
            'assets',
            'storageUsedBytes',
            'storageQuotaBytes',
            'createdAt',
          ],
        );
      }
      if (selectedReports.includes('users') && Array.isArray(reports.users)) {
        downloadRowsCsv(
          `noah-users-${stamp}`,
          [
            'ID',
            'Email',
            'Name',
            'Status',
            'Role',
            'Job title',
            'Organization',
            'Org slug',
            'Org status',
            'Plan type',
            'Last login',
            'Created at',
          ],
          reports.users as Array<Record<string, unknown>>,
          [
            'id',
            'email',
            'name',
            'status',
            'role',
            'jobTitle',
            'organization',
            'organizationSlug',
            'organizationStatus',
            'planType',
            'lastLoginAt',
            'createdAt',
          ],
        );
      }
      if (selectedReports.includes('usage') && Array.isArray(reports.usage)) {
        downloadRowsCsv(
          `noah-usage-${stamp}`,
          [
            'ID',
            'Name',
            'Slug',
            'Status',
            'Plan type',
            'Users used',
            'Max users',
            'Workspaces',
            'Assets',
            'Storage used',
            'Storage quota',
            'Utilization %',
          ],
          reports.usage as Array<Record<string, unknown>>,
          [
            'id',
            'name',
            'slug',
            'status',
            'planType',
            'usersUsed',
            'maxUsers',
            'workspaces',
            'assets',
            'storageUsedBytes',
            'storageQuotaBytes',
            'storageUtilizationPercent',
          ],
        );
      }
      if (selectedReports.includes('activity') && Array.isArray(reports.activity)) {
        downloadRowsCsv(
          `noah-activity-${stamp}`,
          [
            'ID',
            'When',
            'Activity',
            'Type',
            'Description',
            'Actor type',
            'User email',
            'Organization',
            'Org slug',
          ],
          reports.activity as Array<Record<string, unknown>>,
          [
            'id',
            'createdAt',
            'activityName',
            'activityType',
            'description',
            'actorType',
            'userEmail',
            'organization',
            'organizationSlug',
          ],
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download reports');
    } finally {
      setDownloading(false);
    }
  };

  const planConversion =
    (report?.planConversion as Array<{ planType: string; count: number }>) || [];

  const periodDaysValue =
    typeof report?.periodDays === 'number' || typeof report?.periodDays === 'string'
      ? String(report.periodDays)
      : '';
  const periodLabel = periodDaysValue ? `${periodDaysValue}-day` : 'Filtered';
  const reportCountLabel = selectedReports.length === 1 ? 'report' : 'reports';
  const downloadLabel = downloading
    ? 'Preparing…'
    : `Download ${selectedReports.length} ${reportCountLabel}`;
  const newOrgsValue =
    report?.newOrganizations == null ? '—' : String(report.newOrganizations as string | number);
  const loginEventsValue =
    report?.loginEvents == null ? '—' : String(report.loginEvents as string | number);

  return (
    <Box>
      <PageHeader
        title="Reporting"
        subtitle="Filter growth, conversion, and usage across tenants — download one or many CSV reports"
        actions={
          <Button
            variant="contained"
            startIcon={<DownloadOutlinedIcon />}
            onClick={() => void handleDownload()}
            disabled={downloading || selectedReports.length === 0}
            sx={{ textTransform: 'none' }}
          >
            {downloadLabel}
          </Button>
        }
      />

      {error ? (
        <Typography sx={{ color: cv.destructive, mb: 2 }} role="alert">
          {error}
        </Typography>
      ) : null}

      <Panel title="Filters" subtitle="Shared across preview and CSV downloads" sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 1.5, mb: 2, flexWrap: 'wrap' }}>
          <TextField
            select
            size="small"
            label="Period"
            value={periodDays}
            onChange={(e) => handlePeriodChange(e.target.value)}
            sx={{ minWidth: 160 }}
          >
            {PERIOD_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            size="small"
            type="date"
            label="From"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 150 }}
          />
          <TextField
            size="small"
            type="date"
            label="To"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 150 }}
          />
          <TextField
            select
            size="small"
            label="Org status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            sx={{ minWidth: 140 }}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="suspended">Suspended</MenuItem>
          </TextField>
          <TextField
            select
            size="small"
            label="Plan"
            value={planType}
            onChange={(e) => setPlanType(e.target.value)}
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="">All plans</MenuItem>
            {planOptions.map((plan) => (
              <MenuItem key={plan.value} value={plan.value}>
                {plan.label}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            size="small"
            label="Organization"
            value={orgId}
            onChange={(e) => setOrgId(e.target.value)}
            sx={{ minWidth: 200 }}
          >
            <MenuItem value="">All organizations</MenuItem>
            {orgOptions.map((org) => (
              <MenuItem key={org.id} value={org.id}>
                {org.name}
              </MenuItem>
            ))}
          </TextField>
          <Button
            variant="contained"
            onClick={loadSummary}
            disabled={loading}
            sx={{ textTransform: 'none' }}
          >
            {loading ? 'Loading…' : 'Apply filters'}
          </Button>
        </Box>

        <Typography sx={{ fontWeight: 600, mb: 1, fontSize: '0.875rem' }}>
          Reports to download
        </Typography>
        <FormGroup
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(3, 1fr)' },
            gap: 0.5,
          }}
        >
          {REPORT_OPTIONS.map((option) => (
            <FormControlLabel
              key={option.id}
              control={
                <Checkbox
                  checked={selectedReports.includes(option.id)}
                  onChange={() => toggleReport(option.id)}
                  size="small"
                />
              }
              label={
                <Box sx={{ py: 0.25 }}>
                  <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, lineHeight: 1.3 }}>
                    {option.label}
                  </Typography>
                  <Typography sx={{ fontSize: '0.75rem', color: cv.textMuted, lineHeight: 1.35 }}>
                    {option.description}
                  </Typography>
                </Box>
              }
              sx={{ alignItems: 'flex-start', m: 0, mr: 1 }}
            />
          ))}
        </FormGroup>
      </Panel>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(4, 1fr)' },
          gap: 2,
          mb: 3,
        }}
      >
        <StatCard label={`New orgs (${periodLabel})`} value={newOrgsValue} />
        <StatCard label={`Login events (${periodLabel})`} value={loginEventsValue} />
        <StatCard label="Storage used" value={formatBytes(report?.storageUsedBytes as string)} />
        <StatCard label="Storage sold" value={formatBytes(report?.storageQuotaBytes as string)} />
      </Box>

      <Panel title="Plan distribution" subtitle="Current tenant mix for the applied filters">
        {planConversion.length === 0 ? (
          <Typography sx={{ color: cv.textMuted, fontSize: '0.875rem' }}>
            No plan data for the current filters.
          </Typography>
        ) : (
          planConversion.map((row) => (
            <Box
              key={row.planType}
              sx={{ display: 'flex', justifyContent: 'space-between', py: 0.75 }}
            >
              <Typography sx={{ fontSize: '0.875rem' }}>{row.planType}</Typography>
              <Typography sx={{ fontSize: '0.875rem', fontWeight: 600 }}>{row.count}</Typography>
            </Box>
          ))
        )}
      </Panel>
    </Box>
  );
}

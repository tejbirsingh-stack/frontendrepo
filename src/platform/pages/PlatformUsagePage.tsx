import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import GridViewIcon from '@mui/icons-material/GridView';
import ViewListIcon from '@mui/icons-material/ViewList';
import { fetchUsageOverview } from '../api/platformApi';
import { RadialGauge } from '../components/PlatformCharts';
import {
  EmptyState,
  PageHeader,
  Panel,
  formatBytes,
  formatPercent,
} from '../components/PlatformUi';
import { cv } from '../../theme/cssVars';

type ViewMode = 'list' | 'grid';

type UsageRow = Record<string, unknown>;

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
  const planLabel = typeof row.planType === 'string' && row.planType ? row.planType : '—';

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
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 1,
          mb: 1.5,
        }}
      >
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
  const [q, setQ] = useState('');
  const [rows, setRows] = useState<UsageRow[]>([]);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  const load = () => {
    const params: Record<string, string> = {};
    if (q.trim()) params.q = q.trim();
    fetchUsageOverview(params)
      .then((res) => setRows(res.usage))
      .catch((err: Error) => setError(err.message));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Box>
      <PageHeader
        title="Usage"
        subtitle="Storage, seats, and assets by organization"
        actions={<ViewToggle value={viewMode} onChange={setViewMode} />}
      />
      <Box sx={{ display: 'flex', gap: 1.5, mb: 2, flexWrap: 'wrap' }}>
        <TextField
          size="small"
          placeholder="Search organization or plan"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') load();
          }}
          sx={{ minWidth: 260 }}
        />
        <Button variant="contained" onClick={load} sx={{ textTransform: 'none' }}>
          Search
        </Button>
      </Box>
      {error ? (
        <Typography sx={{ color: cv.destructive, mb: 2 }} role="alert">
          {error}
        </Typography>
      ) : null}

      {rows.length === 0 && !error ? (
        <Panel>
          <EmptyState message="No usage data found" />
        </Panel>
      ) : null}

      {rows.length > 0 && viewMode === 'list' ? (
        <Panel>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Organization</TableCell>
                <TableCell>Plan</TableCell>
                <TableCell>Storage</TableCell>
                <TableCell>Users</TableCell>
                <TableCell>Assets</TableCell>
                <TableCell>Workspaces</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={String(row.id)} hover>
                  <TableCell>
                    <Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
                      {String(row.name)}
                    </Typography>
                  </TableCell>
                  <TableCell>{String(row.planType)}</TableCell>
                  <TableCell>
                    {formatBytes(row.storageUsedBytes as string)} /{' '}
                    {formatBytes(row.storageQuotaBytes as string)}
                  </TableCell>
                  <TableCell>
                    {String(row.usersUsed)} / {String(row.maxUsers)}
                  </TableCell>
                  <TableCell>{String(row.assetsCount)}</TableCell>
                  <TableCell>{String(row.workspacesCount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Panel>
      ) : null}

      {rows.length > 0 && viewMode === 'grid' ? (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              lg: 'repeat(3, 1fr)',
            },
            gap: 2,
          }}
        >
          {rows.map((row) => (
            <UsageGridCard key={String(row.id)} row={row} />
          ))}
        </Box>
      ) : null}
    </Box>
  );
}

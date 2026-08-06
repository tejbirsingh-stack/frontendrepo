import { useEffect, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { fetchOrganizations } from '../api/platformApi';
import { PageHeader, Panel, formatBytes } from '../components/PlatformUi';
import { cv } from '../../theme/cssVars';

export default function PlatformOrganizationsPage() {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [rows, setRows] = useState<Array<Record<string, unknown>>>([]);
  const [error, setError] = useState('');

  const load = () => {
    const params: Record<string, string> = {};
    if (q.trim()) params.q = q.trim();
    if (status) params.status = status;
    fetchOrganizations(params)
      .then((res) => setRows(res.organizations))
      .catch((err: Error) => setError(err.message));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Box>
      <PageHeader title="Organizations" subtitle="All customer companies on NOAH" />
      <Box sx={{ display: 'flex', gap: 1.5, mb: 2, flexWrap: 'wrap' }}>
        <TextField
          size="small"
          placeholder="Search name or slug"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          sx={{ minWidth: 220 }}
        />
        <TextField
          select
          size="small"
          label="Status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          sx={{ minWidth: 140 }}
        >
          <MenuItem value="">All</MenuItem>
          <MenuItem value="active">Active</MenuItem>
          <MenuItem value="suspended">Suspended</MenuItem>
        </TextField>
        <Button variant="contained" onClick={load} sx={{ textTransform: 'none' }}>
          Search
        </Button>
      </Box>
      {error ? <Typography sx={{ color: cv.destructive, mb: 2 }}>{error}</Typography> : null}
      <Panel>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Plan</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Users</TableCell>
              <TableCell>Storage</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((org) => {
              const count = org._count as { users?: number } | undefined;
              return (
                <TableRow
                  key={String(org.id)}
                  hover
                  sx={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/platform/organizations/${org.id}`)}
                >
                  <TableCell>
                    <Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
                      {String(org.name)}
                    </Typography>
                    <Typography sx={{ fontSize: '0.75rem', color: cv.textMuted }}>
                      {String(org.slug)}
                    </Typography>
                  </TableCell>
                  <TableCell>{String(org.planType)}</TableCell>
                  <TableCell>{String(org.status || 'active')}</TableCell>
                  <TableCell>{count?.users ?? '—'}</TableCell>
                  <TableCell>{formatBytes(org.storageUsedBytes as string)}</TableCell>
                  <TableCell align="right">
                    <Button
                      component={RouterLink}
                      to={`/platform/organizations/${org.id}`}
                      size="small"
                      sx={{ textTransform: 'none' }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      Open
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Panel>
    </Box>
  );
}

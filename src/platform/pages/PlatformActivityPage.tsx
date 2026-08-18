import { useEffect, useState } from 'react';
import { Box, Button, TextField, Typography, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import { fetchActivity } from '../api/platformApi';
import { PageHeader, Panel, PlatformTablePagination } from '../components/PlatformUi';
import {
  usePaginatedRows,
  usePlatformTablePagination,
} from '../hooks/usePlatformTablePagination';
import { cv } from '../../theme/cssVars';

export default function PlatformActivityPage() {
  const [q, setQ] = useState('');
  const [rows, setRows] = useState<Array<Record<string, unknown>>>([]);
  const [error, setError] = useState('');
  const pagination = usePlatformTablePagination();

  const load = () => {
    const params: Record<string, string> = { limit: '500' };
    if (q.trim()) params.q = q.trim();
    fetchActivity(params)
      .then((res) => setRows(res.activities))
      .catch((err: Error) => setError(err.message));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const paginatedRows = usePaginatedRows(rows, pagination.page, pagination.rowsPerPage);

  return (
    <Box>
      <PageHeader title="Activity logs" subtitle="Platform-wide audit trail across organizations" />
      <Box sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
        <TextField
          size="small"
          placeholder="Search activity"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          sx={{ minWidth: 260 }}
        />
        <Button
          variant="contained"
          onClick={() => {
            pagination.resetPage();
            load();
          }}
          sx={{ textTransform: 'none' }}
        >
          Search
        </Button>
      </Box>
      {error ? <Typography sx={{ color: cv.destructive, mb: 2 }}>{error}</Typography> : null}
      <Panel>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>When</TableCell>
              <TableCell>Activity</TableCell>
              <TableCell>Actor</TableCell>
              <TableCell>Org</TableCell>
              <TableCell>Type</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedRows.map((row) => {
              const org = row.organization as { name?: string } | null;
              return (
                <TableRow key={String(row.id)}>
                  <TableCell>
                    {row.createdAt ? new Date(String(row.createdAt)).toLocaleString() : '—'}
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600 }}>
                      {String(row.activityName)}
                    </Typography>
                    <Typography sx={{ fontSize: '0.7rem', color: cv.textMuted }}>
                      {String(row.description || '')}
                    </Typography>
                  </TableCell>
                  <TableCell>{String(row.userEmail || row.actorType || '—')}</TableCell>
                  <TableCell>{org?.name || '—'}</TableCell>
                  <TableCell>{String(row.activityType || '—')}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        <PlatformTablePagination
          count={rows.length}
          page={pagination.page}
          rowsPerPage={pagination.rowsPerPage}
          onPageChange={pagination.onPageChange}
          onRowsPerPageChange={pagination.onRowsPerPageChange}
        />
      </Panel>
    </Box>
  );
}

import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { fetchPlatformWorkspaces } from '../api/platformApi';
import { EmptyState, PageHeader, Panel, PlatformTablePagination, StatusChip } from '../components/PlatformUi';
import { usePlatformTablePagination } from '../hooks/usePlatformTablePagination';
import { cv } from '../../theme/cssVars';

export default function PlatformWorkspacesPage() {
  const [q, setQ] = useState('');
  const [rows, setRows] = useState<Array<Record<string, unknown>>>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState('');
  const pagination = usePlatformTablePagination();

  const load = (page = pagination.page, rowsPerPage = pagination.rowsPerPage) => {
    const params: Record<string, string> = {
      limit: String(rowsPerPage),
      offset: String(page * rowsPerPage),
    };
    if (q.trim()) params.q = q.trim();
    fetchPlatformWorkspaces(params)
      .then((res) => {
        setRows(res.workspaces);
        setTotal(res.total);
      })
      .catch((err: Error) => setError(err.message));
  };

  useEffect(() => {
    load(pagination.page, pagination.rowsPerPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, pagination.rowsPerPage]);

  const search = () => {
    if (pagination.page === 0) {
      load(0, pagination.rowsPerPage);
    } else {
      pagination.resetPage();
    }
  };

  return (
    <Box>
      <PageHeader
        title="Workspaces"
        subtitle="All tenant workspaces — projects, folders, members, and assets"
      />
      <Box sx={{ display: 'flex', gap: 1.5, mb: 2, flexWrap: 'wrap' }}>
        <TextField
          size="small"
          placeholder="Search workspace name"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          sx={{ minWidth: 260 }}
        />
        <Button variant="contained" onClick={search} sx={{ textTransform: 'none' }}>
          Search
        </Button>
      </Box>
      {error ? (
        <Typography sx={{ color: cv.destructive, mb: 2 }} role="alert">
          {error}
        </Typography>
      ) : null}
      <Panel title={`${total} workspaces`} subtitle="Across all organizations">
        {rows.length === 0 ? (
          <EmptyState message="No workspaces found" />
        ) : (
          <>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Workspace</TableCell>
                  <TableCell>Organization</TableCell>
                  <TableCell>Members</TableCell>
                  <TableCell>Projects</TableCell>
                  <TableCell>Folders</TableCell>
                  <TableCell>Assets</TableCell>
                  <TableCell>Org status</TableCell>
                </TableRow>
              </TableHead>
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
                        <Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
                          {String(ws.name)}
                        </Typography>
                        {ws.description ? (
                          <Typography sx={{ fontSize: '0.75rem', color: cv.textMuted }}>
                            {String(ws.description)}
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
                      <TableCell>{count?.users ?? 0}</TableCell>
                      <TableCell>{count?.projects ?? 0}</TableCell>
                      <TableCell>{count?.folders ?? 0}</TableCell>
                      <TableCell>{count?.assets ?? 0}</TableCell>
                      <TableCell>
                        <StatusChip status={String(org?.status || 'active')} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
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

import { useEffect, useState } from 'react';
import { Box, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { fetchUsageOverview } from '../api/platformApi';
import { PageHeader, Panel, formatBytes } from '../components/PlatformUi';
import { cv } from '../../theme/cssVars';

export default function PlatformUsagePage() {
  const [rows, setRows] = useState<Array<Record<string, unknown>>>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUsageOverview()
      .then((res) => setRows(res.usage))
      .catch((err: Error) => setError(err.message));
  }, []);

  return (
    <Box>
      <PageHeader title="Usage" subtitle="Storage, seats, and assets by organization" />
      {error ? <Typography sx={{ color: cv.destructive, mb: 2 }}>{error}</Typography> : null}
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
              <TableRow key={String(row.id)}>
                <TableCell>{String(row.name)}</TableCell>
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
    </Box>
  );
}

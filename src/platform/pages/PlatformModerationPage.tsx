import { useEffect, useState } from 'react';
import { Box, Button, MenuItem, TextField, Typography, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import { fetchModerationFlags, updateModerationFlag } from '../api/platformApi';
import { PageHeader, Panel } from '../components/PlatformUi';
import { cv } from '../../theme/cssVars';

export default function PlatformModerationPage() {
  const [status, setStatus] = useState('');
  const [flags, setFlags] = useState<Array<Record<string, unknown>>>([]);
  const [error, setError] = useState('');

  const load = () =>
    fetchModerationFlags(status || undefined)
      .then((res) => setFlags(res.flags))
      .catch((err: Error) => setError(err.message));

  useEffect(() => {
    void load();
  }, [status]);

  return (
    <Box>
      <PageHeader title="Moderation" subtitle="Cross-org content flags and quarantine actions" />
      <TextField
        select
        size="small"
        label="Status"
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        sx={{ mb: 2, minWidth: 180 }}
      >
        <MenuItem value="">All</MenuItem>
        <MenuItem value="open">Open</MenuItem>
        <MenuItem value="quarantined">Quarantined</MenuItem>
        <MenuItem value="resolved">Resolved</MenuItem>
        <MenuItem value="dismissed">Dismissed</MenuItem>
      </TextField>
      {error ? <Typography sx={{ color: cv.destructive, mb: 2 }}>{error}</Typography> : null}
      <Panel>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Asset</TableCell>
              <TableCell>Org</TableCell>
              <TableCell>Reason</TableCell>
              <TableCell>Status</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {flags.map((flag) => {
              const asset = flag.asset as { title?: string; id?: string } | null;
              const org = flag.organization as { name?: string } | null;
              return (
                <TableRow key={String(flag.id)}>
                  <TableCell>{asset?.title || String(flag.assetId)}</TableCell>
                  <TableCell>{org?.name || '—'}</TableCell>
                  <TableCell>{String(flag.reason)}</TableCell>
                  <TableCell>{String(flag.status)}</TableCell>
                  <TableCell align="right">
                    <Button
                      size="small"
                      sx={{ textTransform: 'none' }}
                      onClick={() =>
                        void updateModerationFlag(String(flag.id), { status: 'quarantined' }).then(load)
                      }
                    >
                      Quarantine
                    </Button>
                    <Button
                      size="small"
                      sx={{ textTransform: 'none' }}
                      onClick={() =>
                        void updateModerationFlag(String(flag.id), { status: 'resolved' }).then(load)
                      }
                    >
                      Resolve
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

import { useState } from 'react';
import { Box, Button, TextField, Typography, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import { forceDeleteMedia, searchMedia } from '../api/platformApi';
import { PageHeader, Panel } from '../components/PlatformUi';
import { cv } from '../../theme/cssVars';

export default function PlatformMediaPage() {
  const [q, setQ] = useState('');
  const [assets, setAssets] = useState<Array<Record<string, unknown>>>([]);
  const [error, setError] = useState('');

  const search = () => {
    searchMedia(q.trim() ? { q: q.trim() } : {})
      .then((res) => setAssets(res.assets))
      .catch((err: Error) => setError(err.message));
  };

  return (
    <Box>
      <PageHeader title="Media matrix" subtitle="Search media across all organizations" />
      <Box sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
        <TextField
          size="small"
          placeholder="Title or asset id"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          sx={{ minWidth: 280 }}
        />
        <Button variant="contained" onClick={search} sx={{ textTransform: 'none' }}>
          Search
        </Button>
      </Box>
      {error ? <Typography sx={{ color: cv.destructive, mb: 2 }}>{error}</Typography> : null}
      <Panel>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Org</TableCell>
              <TableCell>Status</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {assets.map((asset) => {
              const org = asset.organization as { name?: string } | null;
              return (
                <TableRow key={String(asset.id)}>
                  <TableCell>{String(asset.title)}</TableCell>
                  <TableCell>{String(asset.type)}</TableCell>
                  <TableCell>{org?.name || '—'}</TableCell>
                  <TableCell>{String(asset.status)}</TableCell>
                  <TableCell align="right">
                    <Button
                      size="small"
                      color="error"
                      sx={{ textTransform: 'none' }}
                      onClick={() =>
                        void forceDeleteMedia(String(asset.id))
                          .then(search)
                          .catch((err: Error) => setError(err.message))
                      }
                    >
                      Force delete
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

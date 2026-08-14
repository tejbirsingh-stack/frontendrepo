import { useEffect, useState } from 'react';
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
import { fetchBillingOverview } from '../api/platformApi';
import { EmptyState, PageHeader, Panel, StatCard } from '../components/PlatformUi';
import { cv } from '../../theme/cssVars';

export default function PlatformBillingPage() {
  const [q, setQ] = useState('');
  const [billing, setBilling] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState('');

  const load = () => {
    const params: Record<string, string> = {};
    if (q.trim()) params.q = q.trim();
    fetchBillingOverview(params)
      .then((res) => setBilling(res.billing))
      .catch((err: Error) => setError(err.message));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const subscriptions = (billing?.subscriptions as Array<Record<string, unknown>>) || [];
  const mrr = Number(billing?.estimatedMrrCents || 0) / 100;

  return (
    <Box>
      <PageHeader title="Payment & billing" subtitle="Platform view of subscriptions across orgs" />
      <Box sx={{ display: 'flex', gap: 1.5, mb: 2, flexWrap: 'wrap' }}>
        <TextField
          size="small"
          placeholder="Search org, plan, or Stripe ID"
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
      {error ? <Typography sx={{ color: cv.destructive, mb: 2 }}>{error}</Typography> : null}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 3 }}>
        <StatCard label="Estimated MRR" value={`$${mrr.toFixed(0)}`} />
        <StatCard label="Catalog plans" value={String(billing?.catalogPlanCount ?? '—')} />
      </Box>
      <Panel>
        {subscriptions.length === 0 ? (
          <EmptyState message="No subscriptions found" />
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Organization</TableCell>
                <TableCell>Plan</TableCell>
                <TableCell>Subscription</TableCell>
                <TableCell>Stripe customer</TableCell>
                <TableCell>Users</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {subscriptions.map((row) => {
                const plan = row.plan as { name?: string } | null;
                return (
                  <TableRow key={String(row.id)}>
                    <TableCell>{String(row.name)}</TableCell>
                    <TableCell>{plan?.name || String(row.planType)}</TableCell>
                    <TableCell>{String(row.subscriptionStatus || '—')}</TableCell>
                    <TableCell>{String(row.stripeCustomerId || '—')}</TableCell>
                    <TableCell>{String(row.userCount ?? '—')}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Panel>
    </Box>
  );
}

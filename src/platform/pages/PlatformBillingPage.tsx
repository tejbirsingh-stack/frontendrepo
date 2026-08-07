import { useEffect, useState } from 'react';
import { Box, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { fetchBillingOverview } from '../api/platformApi';
import { PageHeader, Panel, StatCard } from '../components/PlatformUi';
import { cv } from '../../theme/cssVars';

export default function PlatformBillingPage() {
  const [billing, setBilling] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBillingOverview()
      .then((res) => setBilling(res.billing))
      .catch((err: Error) => setError(err.message));
  }, []);

  const subscriptions = (billing?.subscriptions as Array<Record<string, unknown>>) || [];
  const mrr = Number(billing?.estimatedMrrCents || 0) / 100;

  return (
    <Box>
      <PageHeader title="Payment & billing" subtitle="Platform view of subscriptions across orgs" />
      {error ? <Typography sx={{ color: cv.destructive, mb: 2 }}>{error}</Typography> : null}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 3 }}>
        <StatCard label="Estimated MRR" value={`$${mrr.toFixed(0)}`} />
        <StatCard label="Catalog plans" value={String(billing?.catalogPlanCount ?? '—')} />
      </Box>
      <Panel>
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
      </Panel>
    </Box>
  );
}

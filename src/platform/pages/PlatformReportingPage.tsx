import { useEffect, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { fetchReportingSummary } from '../api/platformApi';
import { PageHeader, Panel, StatCard, formatBytes } from '../components/PlatformUi';
import { cv } from '../../theme/cssVars';

export default function PlatformReportingPage() {
  const [report, setReport] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchReportingSummary()
      .then((res) => setReport(res.report))
      .catch((err: Error) => setError(err.message));
  }, []);

  const planConversion =
    (report?.planConversion as Array<{ planType: string; count: number }>) || [];

  return (
    <Box>
      <PageHeader title="Reporting" subtitle="30-day platform conversion and growth snapshot" />
      {error ? <Typography sx={{ color: cv.destructive, mb: 2 }}>{error}</Typography> : null}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(4, 1fr)' },
          gap: 2,
          mb: 3,
        }}
      >
        <StatCard label="New orgs (30d)" value={String(report?.newOrganizations ?? '—')} />
        <StatCard label="Login events (30d)" value={String(report?.loginEvents ?? '—')} />
        <StatCard label="Storage used" value={formatBytes(report?.storageUsedBytes as string)} />
        <StatCard label="Storage sold" value={formatBytes(report?.storageQuotaBytes as string)} />
      </Box>
      <Panel>
        <Typography sx={{ fontWeight: 600, mb: 1.5 }}>Plan distribution</Typography>
        {planConversion.map((row) => (
          <Box key={row.planType} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.75 }}>
            <Typography sx={{ fontSize: '0.875rem' }}>{row.planType}</Typography>
            <Typography sx={{ fontSize: '0.875rem', fontWeight: 600 }}>{row.count}</Typography>
          </Box>
        ))}
      </Panel>
    </Box>
  );
}

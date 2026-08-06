import { useEffect, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { fetchDashboardSummary } from '../api/platformApi';
import { PageHeader, Panel, StatCard, formatBytes } from '../components/PlatformUi';
import { cv } from '../../theme/cssVars';

export default function PlatformDashboardPage() {
  const [summary, setSummary] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardSummary()
      .then((res) => setSummary(res.summary))
      .catch((err: Error) => setError(err.message));
  }, []);

  const planMix = (summary?.planMix as Array<{ planType: string; count: number }>) || [];
  const recentOrgs = (summary?.recentOrgs as Array<Record<string, string>>) || [];
  const recentActivity = (summary?.recentActivity as Array<Record<string, string>>) || [];

  return (
    <Box>
      <PageHeader title="Dashboard" subtitle="Cross-org platform health for NOAH operators" />
      {error ? <Typography sx={{ color: cv.destructive, mb: 2 }}>{error}</Typography> : null}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(4, 1fr)' },
          gap: 2,
          mb: 3,
        }}
      >
        <StatCard label="Organizations" value={String(summary?.totalOrgs ?? '—')} />
        <StatCard label="Active orgs" value={String(summary?.activeOrgs ?? '—')} />
        <StatCard label="Users" value={String(summary?.totalUsers ?? '—')} />
        <StatCard
          label="Storage used"
          value={formatBytes(summary?.storageUsedBytes as string)}
        />
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 2 }}>
        <Panel>
          <Typography sx={{ fontWeight: 600, mb: 1.5 }}>Plan mix</Typography>
          {planMix.length === 0 ? (
            <Typography sx={{ color: cv.textMuted, fontSize: '0.875rem' }}>No data yet</Typography>
          ) : (
            planMix.map((row) => (
              <Box
                key={row.planType}
                sx={{ display: 'flex', justifyContent: 'space-between', py: 0.75 }}
              >
                <Typography sx={{ fontSize: '0.875rem' }}>{row.planType}</Typography>
                <Typography sx={{ fontSize: '0.875rem', fontWeight: 600 }}>{row.count}</Typography>
              </Box>
            ))
          )}
        </Panel>
        <Panel>
          <Typography sx={{ fontWeight: 600, mb: 1.5 }}>Recent organizations</Typography>
          {recentOrgs.map((org) => (
            <Box
              key={org.id}
              component={RouterLink}
              to={`/platform/organizations/${org.id}`}
              sx={{
                display: 'block',
                py: 0.75,
                textDecoration: 'none',
                color: cv.textPrimary,
                '&:hover': { color: cv.brandOrchid },
              }}
            >
              <Typography sx={{ fontSize: '0.875rem', fontWeight: 500 }}>{org.name}</Typography>
              <Typography sx={{ fontSize: '0.75rem', color: cv.textMuted }}>
                {org.planType} · {org.status}
              </Typography>
            </Box>
          ))}
        </Panel>
        <Panel>
          <Typography sx={{ fontWeight: 600, mb: 1.5 }}>Recent platform activity</Typography>
          {recentActivity.slice(0, 8).map((item) => (
            <Box key={String(item.id)} sx={{ py: 0.75 }}>
              <Typography sx={{ fontSize: '0.8125rem' }}>{item.activityName}</Typography>
              <Typography sx={{ fontSize: '0.7rem', color: cv.textMuted }}>
                {item.userEmail || item.actorType} ·{' '}
                {item.createdAt ? new Date(item.createdAt).toLocaleString() : ''}
              </Typography>
            </Box>
          ))}
        </Panel>
      </Box>
    </Box>
  );
}

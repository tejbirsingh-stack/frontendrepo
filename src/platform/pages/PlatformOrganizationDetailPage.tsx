import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Button,
  MenuItem,
  TextField,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@mui/material';
import { fetchOrganization, fetchPlans, patchOrganization, type PlatformPlan } from '../api/platformApi';
import { PageHeader, Panel, formatBytes } from '../components/PlatformUi';
import { cv } from '../../theme/cssVars';

export default function PlatformOrganizationDetailPage() {
  const { orgId = '' } = useParams();
  const [org, setOrg] = useState<Record<string, unknown> | null>(null);
  const [plans, setPlans] = useState<PlatformPlan[]>([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const reload = () =>
    fetchOrganization(orgId)
      .then((res) => setOrg(res.organization))
      .catch((err: Error) => setError(err.message));

  useEffect(() => {
    void reload();
    fetchPlans()
      .then((res) => setPlans(res.plans))
      .catch(() => undefined);
  }, [orgId]);

  const save = async (body: Record<string, unknown>) => {
    setSaving(true);
    setError('');
    try {
      const res = await patchOrganization(orgId, body);
      setOrg(res.organization);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (!org) {
    return <Typography sx={{ color: cv.textMuted }}>{error || 'Loading…'}</Typography>;
  }

  const workspaces = (org.workspaces as Array<Record<string, unknown>>) || [];
  const users = (org.users as Array<Record<string, unknown>>) || [];

  return (
    <Box>
      <PageHeader title={String(org.name)} subtitle={`${org.slug} · ${org.id}`} />
      {error ? <Typography sx={{ color: cv.destructive, mb: 2 }}>{error}</Typography> : null}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2, mb: 3 }}>
        <Panel>
          <Typography sx={{ fontWeight: 600, mb: 2 }}>Plan & quotas</Typography>
          <TextField
            select
            fullWidth
            size="small"
            label="Assigned plan"
            value={String(org.currentPlanId || '')}
            onChange={(e) => void save({ currentPlanId: e.target.value || null })}
            sx={{ mb: 2 }}
          >
            <MenuItem value="">None (manual planType)</MenuItem>
            {plans.map((p) => (
              <MenuItem key={p.id} value={p.id}>
                {p.name}
              </MenuItem>
            ))}
          </TextField>
          <Typography sx={{ fontSize: '0.875rem', mb: 1 }}>
            Plan type: <strong>{String(org.planType)}</strong>
          </Typography>
          <Typography sx={{ fontSize: '0.875rem', mb: 1 }}>
            Storage: {formatBytes(org.storageUsedBytes as string)} /{' '}
            {formatBytes(org.storageQuotaBytes as string)}
          </Typography>
          <Typography sx={{ fontSize: '0.875rem' }}>Max users: {String(org.maxUsers)}</Typography>
        </Panel>
        <Panel>
          <Typography sx={{ fontWeight: 600, mb: 2 }}>Status</Typography>
          <Typography sx={{ mb: 2, fontSize: '0.9rem' }}>
            Current: <strong>{String(org.status || 'active')}</strong>
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="contained"
              disabled={saving || org.status === 'active'}
              onClick={() => void save({ status: 'active' })}
              sx={{ textTransform: 'none' }}
            >
              Activate
            </Button>
            <Button
              variant="outlined"
              color="error"
              disabled={saving || org.status === 'suspended'}
              onClick={() => void save({ status: 'suspended' })}
              sx={{ textTransform: 'none' }}
            >
              Suspend
            </Button>
          </Box>
        </Panel>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 2 }}>
        <Panel>
          <Typography sx={{ fontWeight: 600, mb: 1.5 }}>Workspaces</Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Folders</TableCell>
                <TableCell>Projects</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {workspaces.map((ws) => {
                const count = ws._count as { folders?: number; projects?: number } | undefined;
                return (
                  <TableRow key={String(ws.id)}>
                    <TableCell>{String(ws.name)}</TableCell>
                    <TableCell>{count?.folders ?? 0}</TableCell>
                    <TableCell>{count?.projects ?? 0}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Panel>
        <Panel>
          <Typography sx={{ fontWeight: 600, mb: 1.5 }}>Users</Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((u) => {
                const role = u.roleRelation as { name?: string } | undefined;
                return (
                  <TableRow key={String(u.id)}>
                    <TableCell>{String(u.email)}</TableCell>
                    <TableCell>{role?.name || '—'}</TableCell>
                    <TableCell>{String(u.status)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Panel>
      </Box>
    </Box>
  );
}

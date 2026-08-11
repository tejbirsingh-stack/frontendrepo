import { useEffect, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import {
  createOrganization,
  fetchOrganizations,
  fetchPlans,
  type PlatformPlan,
} from '../api/platformApi';
import { EmptyState, PageHeader, Panel, StatusChip, formatBytes } from '../components/PlatformUi';
import { noahDialogSlotProps } from '../../constants/dialogStyles';
import { cv } from '../../theme/cssVars';

const emptyForm = {
  name: '',
  slug: '',
  planId: '',
  adminEmail: '',
  adminName: '',
};

export default function PlatformOrganizationsPage() {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [rows, setRows] = useState<Array<Record<string, unknown>>>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState('');
  const [plans, setPlans] = useState<PlatformPlan[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => {
    const params: Record<string, string> = {};
    if (q.trim()) params.q = q.trim();
    if (status) params.status = status;
    fetchOrganizations(params)
      .then((res) => {
        setRows(res.organizations);
        setTotal(res.total);
      })
      .catch((err: Error) => setError(err.message));
  };

  useEffect(() => {
    load();
    fetchPlans()
      .then((res) => setPlans(res.plans || []))
      .catch(() => setPlans([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCreate = () => {
    setForm(emptyForm);
    setFormError('');
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setForm(emptyForm);
    setFormError('');
    setSaving(false);
  };

  const save = async () => {
    setFormError('');
    if (!form.name.trim()) {
      setFormError('Organization name is required');
      return;
    }
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        name: form.name.trim(),
      };
      if (form.slug.trim()) body.slug = form.slug.trim();
      if (form.planId) body.planId = form.planId;
      if (form.adminEmail.trim()) {
        body.adminEmail = form.adminEmail.trim();
        if (form.adminName.trim()) body.adminName = form.adminName.trim();
      }
      await createOrganization(body);
      closeModal();
      load();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Create failed');
      setSaving(false);
    }
  };

  return (
    <Box>
      <PageHeader
        title="Organizations"
        subtitle="All customer tenants — plan, seats, storage, and account status"
        actions={
          <Button variant="contained" onClick={openCreate} sx={{ textTransform: 'none' }}>
            Add organization
          </Button>
        }
      />
      <Box sx={{ display: 'flex', gap: 1.5, mb: 2, flexWrap: 'wrap' }}>
        <TextField
          size="small"
          placeholder="Search name or slug"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          sx={{ minWidth: 220 }}
        />
        <TextField
          select
          size="small"
          label="Status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          sx={{ minWidth: 140 }}
        >
          <MenuItem value="">All</MenuItem>
          <MenuItem value="active">Active</MenuItem>
          <MenuItem value="suspended">Suspended</MenuItem>
        </TextField>
        <Button variant="contained" onClick={load} sx={{ textTransform: 'none' }}>
          Search
        </Button>
      </Box>
      {error ? (
        <Typography sx={{ color: cv.destructive, mb: 2 }} role="alert">
          {error}
        </Typography>
      ) : null}
      <Panel
        title={`${total} organizations`}
        subtitle="Click a row to manage Super Admin / Admin details"
      >
        {rows.length === 0 ? (
          <EmptyState message="No organizations found" />
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Organization</TableCell>
                <TableCell>Plan</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Users</TableCell>
                <TableCell>Workspaces</TableCell>
                <TableCell>Storage</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((org) => {
                const count = org._count as
                  | { users?: number; workspaces?: number }
                  | undefined;
                const plan = org.currentPlan as { name?: string } | null;
                return (
                  <TableRow
                    key={String(org.id)}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/platform/organizations/${org.id}`)}
                  >
                    <TableCell>
                      <Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
                        {String(org.name)}
                      </Typography>
                      <Typography sx={{ fontSize: '0.75rem', color: cv.textMuted }}>
                        {String(org.slug)}
                      </Typography>
                    </TableCell>
                    <TableCell>{plan?.name || String(org.planType)}</TableCell>
                    <TableCell>
                      <StatusChip status={String(org.status || 'active')} />
                    </TableCell>
                    <TableCell>{count?.users ?? '—'}</TableCell>
                    <TableCell>{count?.workspaces ?? '—'}</TableCell>
                    <TableCell>{formatBytes(org.storageUsedBytes as string)}</TableCell>
                    <TableCell align="right">
                      <Button
                        component={RouterLink}
                        to={`/platform/organizations/${org.id}`}
                        size="small"
                        sx={{ textTransform: 'none' }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        Manage
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Panel>

      <Dialog
        open={modalOpen}
        onClose={closeModal}
        fullWidth
        maxWidth="sm"
        aria-labelledby="create-org-dialog-title"
        slotProps={noahDialogSlotProps({ overflow: 'hidden' })}
      >
        <DialogTitle id="create-org-dialog-title" sx={{ fontWeight: 600, color: cv.textPrimary }}>
          Add organization
        </DialogTitle>
        <DialogContent sx={{ pt: '8px !important' }}>
          {formError ? (
            <Typography sx={{ color: cv.destructive, mb: 2 }} role="alert">
              {formError}
            </Typography>
          ) : null}
          <Box sx={{ display: 'grid', gap: 1.5 }}>
            <TextField
              label="Organization name"
              size="small"
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
            <TextField
              label="Slug (optional)"
              size="small"
              helperText="Leave blank to auto-generate from the name"
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
            />
            <TextField
              select
              label="Plan"
              size="small"
              value={form.planId}
              onChange={(e) => setForm((f) => ({ ...f, planId: e.target.value }))}
              helperText="Defaults to Free if left blank"
            >
              <MenuItem value="">Default (Free)</MenuItem>
              {plans.map((plan) => (
                <MenuItem key={plan.id} value={plan.id}>
                  {plan.name}
                </MenuItem>
              ))}
            </TextField>
            <Typography sx={{ fontSize: '0.8rem', color: cv.textMuted, mt: 0.5 }}>
              Optional Super Admin invite
            </Typography>
            <TextField
              label="Admin email"
              size="small"
              type="email"
              value={form.adminEmail}
              onChange={(e) => setForm((f) => ({ ...f, adminEmail: e.target.value }))}
            />
            <TextField
              label="Admin name"
              size="small"
              value={form.adminName}
              onChange={(e) => setForm((f) => ({ ...f, adminName: e.target.value }))}
              disabled={!form.adminEmail.trim()}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeModal} sx={{ textTransform: 'none' }} disabled={saving}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => void save()}
            sx={{ textTransform: 'none' }}
            disabled={saving}
          >
            {saving ? 'Creating…' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

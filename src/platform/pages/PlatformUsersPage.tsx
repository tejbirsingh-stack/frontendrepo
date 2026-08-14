import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
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
  fetchOrganizations,
  fetchPlatformRoles,
  fetchPlatformUsers,
  invitePlatformUser,
  patchPlatformUser,
} from '../api/platformApi';
import { EmptyState, PageHeader, Panel, StatusChip } from '../components/PlatformUi';
import { noahDialogSlotProps } from '../../constants/dialogStyles';
import { cv } from '../../theme/cssVars';

const emptyInvite = {
  email: '',
  name: '',
  orgId: '',
  roleId: '',
};

export default function PlatformUsersPage() {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [rows, setRows] = useState<Array<Record<string, unknown>>>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');
  const [orgOptions, setOrgOptions] = useState<Array<{ id: string; name: string }>>([]);
  const [roles, setRoles] = useState<Array<{ id: string; name: string }>>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [invite, setInvite] = useState(emptyInvite);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => {
    const params: Record<string, string> = {};
    if (q.trim()) params.q = q.trim();
    if (status) params.status = status;
    fetchPlatformUsers(params)
      .then((res) => {
        setRows(res.users);
        setTotal(res.total);
      })
      .catch((err: Error) => setError(err.message));
  };

  useEffect(() => {
    load();
    fetchOrganizations({ limit: '200' })
      .then((res) =>
        setOrgOptions(
          (res.organizations || []).map((org) => ({
            id: String(org.id),
            name: String(org.name),
          })),
        ),
      )
      .catch(() => setOrgOptions([]));
    fetchPlatformRoles()
      .then((res) => setRoles(res.roles || []))
      .catch(() => setRoles([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setUserStatus = async (userId: string, nextStatus: string) => {
    setBusyId(userId);
    setError('');
    try {
      await patchPlatformUser(userId, { status: nextStatus });
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setBusyId('');
    }
  };

  const openInvite = () => {
    setInvite(emptyInvite);
    setFormError('');
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setInvite(emptyInvite);
    setFormError('');
    setSaving(false);
  };

  const saveInvite = async () => {
    setFormError('');
    if (!invite.email.trim() || !invite.orgId || !invite.roleId) {
      setFormError('Email, organization, and role are required');
      return;
    }
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        email: invite.email.trim(),
        orgId: invite.orgId,
        roleId: invite.roleId,
      };
      if (invite.name.trim()) body.name = invite.name.trim();
      await invitePlatformUser(body);
      closeModal();
      load();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Invite failed');
      setSaving(false);
    }
  };

  return (
    <Box>
      <PageHeader
        title="Users & roles"
        subtitle="Cross-org people directory — Super Admin and Admin membership at a glance"
        actions={
          <Button variant="contained" onClick={openInvite} sx={{ textTransform: 'none' }}>
            Invite user
          </Button>
        }
      />
      <Box sx={{ display: 'flex', gap: 1.5, mb: 2, flexWrap: 'wrap' }}>
        <TextField
          size="small"
          placeholder="Search name or email"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          sx={{ minWidth: 240 }}
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
          <MenuItem value="inactive">Inactive</MenuItem>
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
      <Panel title={`${total} users`} subtitle="Platform-wide directory">
        {rows.length === 0 ? (
          <EmptyState message="No users found" />
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>Organization</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Last login</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((user) => {
                const org = user.organization as
                  | { id?: string; name?: string; slug?: string }
                  | null;
                const role = user.roleRelation as { name?: string } | null;
                return (
                  <TableRow key={String(user.id)} hover>
                    <TableCell>
                      <Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
                        {String(user.name || '—')}
                      </Typography>
                      <Typography sx={{ fontSize: '0.75rem', color: cv.textMuted }}>
                        {String(user.email)}
                      </Typography>
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
                    <TableCell>{role?.name || '—'}</TableCell>
                    <TableCell>
                      <StatusChip status={String(user.status)} />
                    </TableCell>
                    <TableCell>
                      {user.lastLoginAt
                        ? new Date(String(user.lastLoginAt)).toLocaleString()
                        : '—'}
                    </TableCell>
                    <TableCell align="right">
                      {user.status === 'active' ? (
                        <Button
                          size="small"
                          color="error"
                          disabled={busyId === String(user.id)}
                          sx={{ textTransform: 'none' }}
                          onClick={() => void setUserStatus(String(user.id), 'suspended')}
                        >
                          Suspend
                        </Button>
                      ) : (
                        <Button
                          size="small"
                          disabled={busyId === String(user.id)}
                          sx={{ textTransform: 'none' }}
                          onClick={() => void setUserStatus(String(user.id), 'active')}
                        >
                          Activate
                        </Button>
                      )}
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
        aria-labelledby="invite-user-dialog-title"
        slotProps={noahDialogSlotProps({ overflow: 'hidden' })}
      >
        <DialogTitle id="invite-user-dialog-title" sx={{ fontWeight: 600, color: cv.textPrimary }}>
          Invite user
        </DialogTitle>
        <DialogContent sx={{ pt: '8px !important' }}>
          {formError ? (
            <Typography sx={{ color: cv.destructive, mb: 2 }} role="alert">
              {formError}
            </Typography>
          ) : null}
          <Box sx={{ display: 'grid', gap: 1.5 }}>
            <TextField
              label="Email"
              size="small"
              type="email"
              required
              value={invite.email}
              onChange={(e) => setInvite((f) => ({ ...f, email: e.target.value }))}
            />
            <TextField
              label="Name (optional)"
              size="small"
              value={invite.name}
              onChange={(e) => setInvite((f) => ({ ...f, name: e.target.value }))}
            />
            <TextField
              select
              label="Organization"
              size="small"
              required
              value={invite.orgId}
              onChange={(e) => setInvite((f) => ({ ...f, orgId: e.target.value }))}
            >
              <MenuItem value="" disabled>
                Select organization
              </MenuItem>
              {orgOptions.map((org) => (
                <MenuItem key={org.id} value={org.id}>
                  {org.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Role"
              size="small"
              required
              value={invite.roleId}
              onChange={(e) => setInvite((f) => ({ ...f, roleId: e.target.value }))}
            >
              <MenuItem value="" disabled>
                Select role
              </MenuItem>
              {roles.map((role) => (
                <MenuItem key={role.id} value={role.id}>
                  {role.name}
                </MenuItem>
              ))}
            </TextField>
            <Typography sx={{ fontSize: '0.75rem', color: cv.textMuted }}>
              The user receives an email to set their password. Seat limits are enforced.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeModal} sx={{ textTransform: 'none' }} disabled={saving}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => void saveInvite()}
            sx={{ textTransform: 'none' }}
            disabled={saving}
          >
            {saving ? 'Inviting…' : 'Send invite'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Tab,
  Tabs,
  TextField,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Switch,
} from '@mui/material';
import {
  fetchOrganization,
  fetchPlans,
  patchOrganization,
  patchPlatformUser,
  patchPlatformWorkspace,
  type PlatformPlan,
} from '../api/platformApi';
import {
  EmptyState,
  MetricBar,
  PageHeader,
  Panel,
  PlatformTableHead,
  PlatformTablePagination,
  StatusChip,
  formatBytes,
  formatPercent,
} from '../components/PlatformUi';
import { platformTableSx } from '../components/platformTableStyles';
import {
  usePaginatedRows,
  usePlatformTablePagination,
} from '../hooks/usePlatformTablePagination';
import { cv } from '../../theme/cssVars';
import toast from 'react-hot-toast';

const tabSx = {
  minHeight: 42,
  mb: 2.5,
  borderBottom: `1px solid ${cv.divider}`,
  '& .MuiTab-root': {
    minHeight: 42,
    py: 0.5,
    px: 0,
    mr: 3,
    fontSize: '0.9rem',
    fontWeight: 500,
    color: cv.textSecondary,
    textTransform: 'none',
    minWidth: 'auto',
  },
  '& .Mui-selected': {
    color: `${cv.textPrimary} !important`,
  },
  '& .MuiTabs-indicator': {
    background: cv.brandOrchid,
    height: 2,
  },
};

export default function PlatformOrganizationDetailPage() {
  const { orgId = '' } = useParams();
  const [tab, setTab] = useState(0);
  const [org, setOrg] = useState<Record<string, unknown> | null>(null);
  const [plans, setPlans] = useState<PlatformPlan[]>([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [maxUsers, setMaxUsers] = useState('');
  const [storageQuota, setStorageQuota] = useState('');
  const [renameTarget, setRenameTarget] = useState<{ wsId: string; name: string } | null>(null);
  const [renameName, setRenameName] = useState('');
  const [renaming, setRenaming] = useState(false);

  const handleRename = async () => {
    if (!renameTarget || !renameName.trim()) return;
    setRenaming(true);
    try {
      await patchPlatformWorkspace(orgId, renameTarget.wsId, { name: renameName.trim() });
      toast.success('Workspace renamed successfully');
      setRenameTarget(null);
      await reload();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Rename failed');
    } finally {
      setRenaming(false);
    }
  };

  const reload = () =>
    fetchOrganization(orgId)
      .then((res) => {
        setOrg(res.organization);
        setMaxUsers(String(res.organization.maxUsers ?? ''));
        setStorageQuota(String(res.organization.storageQuotaBytes ?? ''));
      })
      .catch((err: Error) => setError(err.message));

  useEffect(() => {
    void reload();
    fetchPlans()
      .then((res) => setPlans(res.plans))
      .catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId]);

  const save = async (body: Record<string, unknown>, customSuccessMessage?: string) => {
    setSaving(true);
    setError('');
    try {
      await patchOrganization(orgId, body);
      // Re-fetch the full org (with workspaces, users, settings) so nothing is lost
      await reload();
      
      let msg = customSuccessMessage || 'Organization updated successfully';
      if (body.settings) msg = 'Share settings updated successfully';
      else if (body.status) msg = `Organization ${String(body.status)}`;
      else if (body.maxUsers || body.storageQuotaBytes) msg = 'Quotas updated successfully';
      else if (body.currentPlanId !== undefined) msg = 'Plan updated successfully';
      
      toast.success(msg);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Save failed';
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setSaving(false);
    }
  };

  const workspaces = useMemo(
    () => (org?.workspaces as Array<Record<string, unknown>>) || [],
    [org],
  );
  const users = useMemo(() => (org?.users as Array<Record<string, unknown>>) || [], [org]);
  const usersPagination = usePlatformTablePagination([orgId, tab === 1]);
  const workspacesPagination = usePlatformTablePagination([orgId, tab === 2]);
  const paginatedUsers = usePaginatedRows(
    users,
    usersPagination.page,
    usersPagination.rowsPerPage,
  );
  const paginatedWorkspaces = usePaginatedRows(
    workspaces,
    workspacesPagination.page,
    workspacesPagination.rowsPerPage,
  );
  const settings = (org?.settings as Record<string, unknown> | null) || null;
  const count = (org?._count as { users?: number; workspaces?: number; assets?: number }) || {};
  const plan = org?.currentPlan as { name?: string } | null;
  const storagePct = formatPercent(
    org?.storageUsedBytes as string,
    org?.storageQuotaBytes as string,
  );

  if (!org) {
    return <Typography sx={{ color: cv.textMuted }}>{error || 'Loading…'}</Typography>;
  }

  return (
    <Box>
      <PageHeader
        title={String(org.name)}
        subtitle={`${org.slug} · ${plan?.name || org.planType}`}
        actions={
          <>
            <StatusChip status={String(org.status || 'active')} />
            <Button
              component={RouterLink}
              to="/platform/organizations"
              variant="outlined"
              sx={{ textTransform: 'none' }}
            >
              All organizations
            </Button>
          </>
        }
      />
      {error ? (
        <Typography sx={{ color: cv.destructive, mb: 2 }} role="alert">
          {error}
        </Typography>
      ) : null}

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(4, 1fr)' },
          gap: 2,
          mb: 2,
        }}
      >
        <Panel>
          <Typography sx={{ fontSize: '0.75rem', color: cv.textMuted }}>Users</Typography>
          <Typography sx={{ fontSize: '1.25rem', fontWeight: 700, mt: 0.5 }}>
            {count.users ?? users.length} / {String(org.maxUsers)}
          </Typography>
        </Panel>
        <Panel>
          <Typography sx={{ fontSize: '0.75rem', color: cv.textMuted }}>Workspaces</Typography>
          <Typography sx={{ fontSize: '1.25rem', fontWeight: 700, mt: 0.5 }}>
            {count.workspaces ?? workspaces.length}
          </Typography>
        </Panel>
        <Panel>
          <Typography sx={{ fontSize: '0.75rem', color: cv.textMuted }}>Assets</Typography>
          <Typography sx={{ fontSize: '1.25rem', fontWeight: 700, mt: 0.5 }}>
            {count.assets ?? 0}
          </Typography>
        </Panel>
        <Panel>
          <Typography sx={{ fontSize: '0.75rem', color: cv.textMuted, mb: 1 }}>Storage</Typography>
          <MetricBar
            label={formatBytes(org.storageQuotaBytes as string)}
            usedLabel={`${formatBytes(org.storageUsedBytes as string)} (${storagePct}%)`}
            percent={storagePct}
          />
        </Panel>
      </Box>

      <Tabs value={tab} onChange={(_e, v) => setTab(v)} sx={tabSx} variant="scrollable">
        <Tab label="Overview" />
        <Tab label={`Users (${users.length})`} />
        <Tab label={`Workspaces (${workspaces.length})`} />
        <Tab label="Plan & billing" />
        <Tab label="Share settings" />
      </Tabs>

      {tab === 0 ? (
        <Panel title="Account status" subtitle="Activate or suspend this organization">
          <Typography sx={{ mb: 2, fontSize: '0.9rem' }}>
            Current: <strong>{String(org.status || 'active')}</strong>
            {org.subscriptionStatus ? ` · Billing: ${String(org.subscriptionStatus)}` : ''}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
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
      ) : null}

      {tab === 1 ? (
        <Panel title="Organization users" subtitle="Roles and account status for this tenant">
          {users.length === 0 ? (
            <EmptyState message="No users in this organization" />
          ) : (
            <>
              <Table size="small" sx={platformTableSx}>
                <PlatformTableHead
                  columns={[
                    { id: 'user', label: 'User' },
                    { id: 'role', label: 'Role' },
                    { id: 'status', label: 'Status' },
                    { id: 'mfa', label: 'MFA' },
                    { id: 'lastLogin', label: 'Last login' },
                    { id: 'actions', label: '', align: 'right' },
                  ]}
                />
                <TableBody>
                  {paginatedUsers.map((u) => {
                    const role = u.roleRelation as { name?: string } | undefined;
                    return (
                      <TableRow key={String(u.id)} hover>
                        <TableCell>
                          <Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
                            {String(u.name || '—')}
                          </Typography>
                          <Typography sx={{ fontSize: '0.75rem', color: cv.textMuted }}>
                            {String(u.email)}
                          </Typography>
                        </TableCell>
                        <TableCell>{role?.name || '—'}</TableCell>
                        <TableCell>
                          <StatusChip status={String(u.status)} />
                        </TableCell>
                        <TableCell>{u.mfaEnabled ? 'On' : 'Off'}</TableCell>
                        <TableCell>
                          {u.lastLoginAt
                            ? new Date(String(u.lastLoginAt)).toLocaleString()
                            : '—'}
                        </TableCell>
                        <TableCell align="right">
                          <Button
                            size="small"
                            sx={{ textTransform: 'none' }}
                            disabled={saving}
                            onClick={() =>
                              void patchPlatformUser(String(u.id), {
                                status: u.status === 'active' ? 'suspended' : 'active',
                              }).then(reload)
                            }
                          >
                            {u.status === 'active' ? 'Suspend' : 'Activate'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              <PlatformTablePagination
                count={users.length}
                page={usersPagination.page}
                rowsPerPage={usersPagination.rowsPerPage}
                onPageChange={usersPagination.onPageChange}
                onRowsPerPageChange={usersPagination.onRowsPerPageChange}
              />
            </>
          )}
        </Panel>
      ) : null}

      {tab === 2 ? (
        <Panel title="Workspaces & projects" subtitle="Tenant library structure">
          {workspaces.length === 0 ? (
            <EmptyState message="No workspaces yet" />
          ) : (
            <>
              <Table size="small" sx={platformTableSx}>
                <PlatformTableHead
                  columns={[
                    { id: 'workspace', label: 'Workspace' },
                    { id: 'members', label: 'Members' },
                    { id: 'folders', label: 'Folders' },
                    { id: 'projects', label: 'Projects' },
                    { id: 'rename', label: 'Rename', align: 'right' },
                  ]}
                />
                <TableBody>
                  {paginatedWorkspaces.map((ws) => {
                    const wsCount = ws._count as
                      | { folders?: number; projects?: number; users?: number }
                      | undefined;
                    return (
                      <TableRow key={String(ws.id)} hover>
                        <TableCell>
                          <Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
                            {String(ws.name)}
                          </Typography>
                          {ws.description ? (
                            <Typography sx={{ fontSize: '0.75rem', color: cv.textMuted }}>
                              {String(ws.description)}
                            </Typography>
                          ) : null}
                        </TableCell>
                        <TableCell>{wsCount?.users ?? 0}</TableCell>
                        <TableCell>{wsCount?.folders ?? 0}</TableCell>
                        <TableCell>{wsCount?.projects ?? 0}</TableCell>
                        <TableCell align="right">
                          <Button
                            size="small"
                            variant="outlined"
                            sx={{ textTransform: 'none', fontSize: '0.75rem' }}
                            disabled={saving}
                            onClick={() => {
                              setRenameTarget({ wsId: String(ws.id), name: String(ws.name) });
                              setRenameName(String(ws.name));
                            }}
                          >
                            Edit
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              <PlatformTablePagination
                count={workspaces.length}
                page={workspacesPagination.page}
                rowsPerPage={workspacesPagination.rowsPerPage}
                onPageChange={workspacesPagination.onPageChange}
                onRowsPerPageChange={workspacesPagination.onRowsPerPageChange}
              />
            </>
          )}
        </Panel>
      ) : null}

      {tab === 3 ? (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
          <Panel title="Assigned plan" subtitle="Catalog plan drives quotas">
            <TextField
              select
              fullWidth
              size="small"
              label="Plan"
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
            <Typography sx={{ fontSize: '0.875rem' }}>
              Subscription: <strong>{String(org.subscriptionStatus || '—')}</strong>
            </Typography>
          </Panel>

          <Panel title="Quotas" subtitle="Override seats and storage">
            <TextField
              fullWidth
              size="small"
              label="Max users"
              value={maxUsers}
              onChange={(e) => setMaxUsers(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              size="small"
              label="Storage quota (bytes)"
              value={storageQuota}
              onChange={(e) => setStorageQuota(e.target.value)}
              sx={{ mb: 2 }}
              helperText={`Currently ${formatBytes(org.storageUsedBytes as string)} used of ${formatBytes(org.storageQuotaBytes as string)}`}
            />
            <Button
              variant="contained"
              disabled={saving}
              sx={{ textTransform: 'none' }}
              onClick={() =>
                void save({
                  maxUsers: Number(maxUsers),
                  storageQuotaBytes: storageQuota,
                })
              }
            >
              Save quotas
            </Button>
          </Panel>
        </Box>
      ) : null}

      {tab === 4 ? (
        <Panel
          title="Share settings"
          subtitle="Org defaults normally managed by Super Admin / Admin"
        >
          {!settings ? (
            <EmptyState message="No organization settings record yet" />
          ) : (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                gap: 1.5,
              }}
            >
              {[
                { label: 'Require password', key: 'requirePasswordDefault', type: 'boolean' },
                { label: 'Allow comments', key: 'allowCommentsDefault', type: 'boolean' },
                { label: 'Download original', key: 'allowDownloadOriginalDefault', type: 'boolean' },
                { label: 'Download proxy', key: 'allowDownloadProxyDefault', type: 'boolean' },
                { label: 'Company watermark', key: 'showCompanyWatermarkDefault', type: 'boolean' },
                { label: 'Default expiry (days)', key: 'defaultExpiryDays', type: 'number' },
              ].map(({ label, key, type }) => {
                const val = (settings as Record<string, any>)[key];
                return (
                  <Box
                    key={key}
                    sx={{
                      p: 1.5,
                      borderRadius: 1.5,
                      border: `1px solid ${cv.border}`,
                      background: cv.surfaceMuted,
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 1,
                    }}
                  >
                    <Typography sx={{ fontSize: '0.85rem', color: cv.textPrimary, fontWeight: 500 }}>
                      {label}
                    </Typography>
                    {type === 'boolean' ? (
                      <Switch
                        checked={Boolean(val)}
                        disabled={saving}
                        onChange={(e) => void save({ settings: { [key]: e.target.checked } })}
                      />
                    ) : (
                      <TextField
                        select
                        size="small"
                        disabled={saving}
                        value={val ?? 30}
                        onChange={(e) => {
                          const num = Number(e.target.value);
                          if (!isNaN(num) && num !== val) {
                            void save({ settings: { [key]: num } });
                          }
                        }}
                        sx={{ minWidth: 120 }}
                      >
                        <MenuItem value={7}>7 days</MenuItem>
                        <MenuItem value={14}>14 days</MenuItem>
                        <MenuItem value={30}>30 days</MenuItem>
                        <MenuItem value={90}>90 days</MenuItem>
                      </TextField>
                    )}
                  </Box>
                );
              })}
            </Box>
          )}
        </Panel>
      ) : null}

      {/* Workspace rename dialog */}
      <Dialog open={Boolean(renameTarget)} onClose={() => setRenameTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Rename Workspace</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            size="small"
            label="Workspace name"
            value={renameName}
            onChange={(e) => setRenameName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') void handleRename(); }}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRenameTarget(null)} sx={{ textTransform: 'none' }}>Cancel</Button>
          <Button
            variant="contained"
            disabled={renaming || !renameName.trim() || renameName.trim() === renameTarget?.name}
            onClick={() => void handleRename()}
            sx={{ textTransform: 'none' }}
          >
            {renaming ? 'Saving…' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

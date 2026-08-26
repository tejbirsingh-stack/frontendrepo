import { useEffect, useMemo, useRef, useState } from 'react';
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
import toast from 'react-hot-toast';
import {
  ActiveFilterChips,
  EmptyState,
  FilterBar,
  FilterSelect,
  PageHeader,
  Panel,
  PlatformTableHead,
  PlatformTablePagination,
  SearchField,
  StatusChip,
  TableLoadingBar,
  type FilterOption,
  type PlatformTableColumn,
} from '../components/PlatformUi';
import { platformTableSx } from '../components/platformTableStyles';
import { usePlatformTablePagination } from '../hooks/usePlatformTablePagination';
import { usePlatformTableSort } from '../hooks/usePlatformTableSort';
import {
  CREATED_FILTER_OPTIONS,
  applyCreatedParams,
  formatDateTime,
  initialsOf,
  text,
} from '../utils/platformListHelpers';
import { noahDialogSlotProps } from '../../constants/dialogStyles';
import { selectInDialogMenuProps } from '../../constants/dropdownMenu';
import { cv } from '../../theme/cssVars';

const emptyInvite = {
  email: '',
  name: '',
  orgId: '',
  roleId: '',
};

type UserSortField =
  | 'name'
  | 'email'
  | 'organization'
  | 'role'
  | 'status'
  | 'lastLoginAt'
  | 'createdAt';

const DESCENDING_FIRST: readonly UserSortField[] = ['lastLoginAt', 'createdAt'];

const COLUMNS: ReadonlyArray<PlatformTableColumn<UserSortField>> = [
  { id: 'user', label: 'User', sortField: 'name' },
  { id: 'org', label: 'Organization', sortField: 'organization' },
  { id: 'role', label: 'Role', sortField: 'role' },
  { id: 'status', label: 'Status', sortField: 'status' },
  { id: 'mfa', label: 'MFA' },
  { id: 'lastLogin', label: 'Last login', sortField: 'lastLoginAt' },
  { id: 'actions', label: '', width: 110 },
];

const STATUS_OPTIONS: ReadonlyArray<FilterOption> = [
  { value: '', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'suspended', label: 'Suspended' },
];

const MFA_OPTIONS: ReadonlyArray<FilterOption> = [
  { value: '', label: 'Any MFA' },
  { value: 'on', label: 'MFA on' },
  { value: 'off', label: 'MFA off' },
];

const LOGIN_OPTIONS: ReadonlyArray<FilterOption> = [
  { value: '', label: 'Any login status' },
  { value: 'has_login', label: 'Has logged in' },
  { value: 'never', label: 'Never logged in' },
];

type UserFilters = {
  q: string;
  status: string;
  orgId: string;
  roleId: string;
  mfa: string;
  login: string;
  created: string;
  createdFrom: string;
  createdTo: string;
};

const emptyFilters: UserFilters = {
  q: '',
  status: '',
  orgId: '',
  roleId: '',
  mfa: '',
  login: '',
  created: '',
  createdFrom: '',
  createdTo: '',
};

export default function PlatformUsersPage() {
  const [filters, setFilters] = useState<UserFilters>(emptyFilters);
  const [searchTerm, setSearchTerm] = useState('');
  const [rows, setRows] = useState<Array<Record<string, unknown>>>([]);
  const [total, setTotal] = useState(0);
  const [loadedKey, setLoadedKey] = useState('');
  const [refreshToken, setRefreshToken] = useState(0);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');
  const [orgOptions, setOrgOptions] = useState<Array<{ id: string; name: string }>>([]);
  const [roles, setRoles] = useState<Array<{ id: string; name: string }>>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [invite, setInvite] = useState(emptyInvite);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const pagination = usePlatformTablePagination();
  const sort = usePlatformTableSort<UserSortField>('createdAt', 'desc', DESCENDING_FIRST);
  const requestIdRef = useRef(0);

  const orgFilterOptions = useMemo<FilterOption[]>(
    () => [{ value: '', label: 'All organizations' }, ...orgOptions.map((o) => ({ value: o.id, label: o.name }))],
    [orgOptions],
  );
  const roleFilterOptions = useMemo<FilterOption[]>(
    () => [{ value: '', label: 'All roles' }, ...roles.map((r) => ({ value: r.id, label: r.name }))],
    [roles],
  );

  const queryParams = useMemo(() => {
    const params: Record<string, string> = {
      limit: String(pagination.rowsPerPage),
      offset: String(pagination.page * pagination.rowsPerPage),
      sortBy: sort.sortBy,
      sortDir: sort.sortDir,
    };
    if (filters.q) params.q = filters.q;
    if (filters.status) params.status = filters.status;
    if (filters.orgId) params.orgId = filters.orgId;
    if (filters.roleId) params.roleId = filters.roleId;
    if (filters.mfa) params.mfa = filters.mfa;
    if (filters.login) params.login = filters.login;
    applyCreatedParams(params, filters.created, filters.createdFrom, filters.createdTo);
    return params;
  }, [filters, sort.sortBy, sort.sortDir, pagination.page, pagination.rowsPerPage]);

  const queryKey = useMemo(
    () => `${refreshToken}:${JSON.stringify(queryParams)}`,
    [queryParams, refreshToken],
  );
  const loading = loadedKey !== queryKey;

  useEffect(() => {
    fetchOrganizations({ limit: '200' })
      .then((res) =>
        setOrgOptions(
          (res.organizations || []).map((org) => ({
            id: String(org.id),
            name: String(org.name),
          })),
        ),
      )
      .catch((err) => { console.error('[PlatformUsers] fetchOrganizations failed:', err); setOrgOptions([]); });
    fetchPlatformRoles()
      .then((res) => { console.log('[PlatformUsers] roles response:', res); setRoles(res.roles || []); })
      .catch((err) => { console.error('[PlatformUsers] fetchPlatformRoles failed:', err); setRoles([]); });
  }, []);

  useEffect(() => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    fetchPlatformUsers(queryParams)
      .then((res) => {
        if (requestIdRef.current !== requestId) return;
        setRows(res.users);
        setTotal(res.total);
        setError('');
      })
      .catch((err: Error) => {
        if (requestIdRef.current !== requestId) return;
        setError(err.message);
      })
      .finally(() => {
        if (requestIdRef.current === requestId) setLoadedKey(queryKey);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryKey]);

  const patchFilters = (patch: Partial<UserFilters>) => {
    setFilters((current) => ({ ...current, ...patch }));
    pagination.setPage(0);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmed = searchTerm.trim();
      setFilters((current) => (current.q === trimmed ? current : { ...current, q: trimmed }));
      pagination.setPage(0);
    }, 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  const handleSort = (field: UserSortField) => {
    sort.toggleSort(field);
    pagination.setPage(0);
  };

  const clearFilter = (key: string) => {
    if (key === 'q') {
      setSearchTerm('');
      patchFilters({ q: '' });
      return;
    }
    if (key === 'created') {
      patchFilters({ created: '', createdFrom: '', createdTo: '' });
      return;
    }
    patchFilters({ [key]: '' } as Partial<UserFilters>);
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setFilters(emptyFilters);
    pagination.setPage(0);
  };

  const activeFilterChips = useMemo(() => {
    const chips: Array<{ key: string; label: string }> = [];
    if (filters.q) chips.push({ key: 'q', label: `Search: ${filters.q}` });
    if (filters.status) {
      chips.push({
        key: 'status',
        label: `Status: ${STATUS_OPTIONS.find((o) => o.value === filters.status)?.label ?? filters.status}`,
      });
    }
    if (filters.orgId) {
      chips.push({
        key: 'orgId',
        label: `Org: ${orgFilterOptions.find((o) => o.value === filters.orgId)?.label ?? filters.orgId}`,
      });
    }
    if (filters.roleId) {
      chips.push({
        key: 'roleId',
        label: `Role: ${roleFilterOptions.find((o) => o.value === filters.roleId)?.label ?? filters.roleId}`,
      });
    }
    if (filters.mfa) {
      chips.push({
        key: 'mfa',
        label: MFA_OPTIONS.find((o) => o.value === filters.mfa)?.label ?? filters.mfa,
      });
    }
    if (filters.login) {
      chips.push({
        key: 'login',
        label: LOGIN_OPTIONS.find((o) => o.value === filters.login)?.label ?? filters.login,
      });
    }
    if (filters.created === 'custom' && (filters.createdFrom || filters.createdTo)) {
      chips.push({
        key: 'created',
        label: `Created: ${filters.createdFrom || 'any'} → ${filters.createdTo || 'today'}`,
      });
    } else if (filters.created) {
      chips.push({
        key: 'created',
        label: `Created: ${CREATED_FILTER_OPTIONS.find((o) => o.value === filters.created)?.label ?? filters.created}`,
      });
    }
    return chips;
  }, [filters, orgFilterOptions, roleFilterOptions]);

  let emptyMessage = 'No users found';
  if (loading) emptyMessage = 'Loading users…';
  else if (activeFilterChips.length > 0) emptyMessage = 'No users match these filters';

  const setUserStatus = async (userId: string, nextStatus: string) => {
    setBusyId(userId);
    setError('');
    const loadingToastId = toast.loading(`${nextStatus === 'active' ? 'Activating' : 'Suspending'} user...`);
    try {
      await patchPlatformUser(userId, { status: nextStatus });
      toast.success(`User ${nextStatus === 'active' ? 'activated' : 'suspended'} successfully`, { id: loadingToastId });
      setRefreshToken((t) => t + 1);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Update failed';
      setError(msg);
      toast.error(msg, { id: loadingToastId });
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
    const loadingToastId = toast.loading('Sending invitation...');
    try {
      const body: Record<string, unknown> = {
        email: invite.email.trim(),
        orgId: invite.orgId,
        roleId: invite.roleId,
      };
      if (invite.name.trim()) body.name = invite.name.trim();
      await invitePlatformUser(body);
      toast.success('User invited successfully', { id: loadingToastId });
      closeModal();
      setRefreshToken((t) => t + 1);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invite failed';
      setFormError(msg);
      toast.error(msg, { id: loadingToastId });
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

      <FilterBar
        actions={
          activeFilterChips.length > 0 ? (
            <Button onClick={clearAllFilters} size="small" sx={{ textTransform: 'none' }}>
              Reset filters
            </Button>
          ) : null
        }
      >
        <SearchField
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search name, email, or job title"
          minWidth={280}
        />
        <FilterSelect
          label="Status"
          value={filters.status}
          options={STATUS_OPTIONS}
          onChange={(value) => patchFilters({ status: value })}
        />
        <FilterSelect
          label="Organization"
          value={filters.orgId}
          options={orgFilterOptions}
          onChange={(value) => patchFilters({ orgId: value })}
          minWidth={180}
        />
        <FilterSelect
          label="Role"
          value={filters.roleId}
          options={roleFilterOptions}
          onChange={(value) => patchFilters({ roleId: value })}
        />
        <FilterSelect
          label="MFA"
          value={filters.mfa}
          options={MFA_OPTIONS}
          onChange={(value) => patchFilters({ mfa: value })}
          minWidth={120}
        />
        <FilterSelect
          label="Login"
          value={filters.login}
          options={LOGIN_OPTIONS}
          onChange={(value) => patchFilters({ login: value })}
          minWidth={150}
        />
        <FilterSelect
          label="Created"
          value={filters.created}
          options={[...CREATED_FILTER_OPTIONS]}
          onChange={(value) =>
            patchFilters(
              value === 'custom' ? { created: value } : { created: value, createdFrom: '', createdTo: '' },
            )
          }
          minWidth={160}
        />
        {filters.created === 'custom' ? (
          <>
            <TextField
              size="small"
              type="date"
              label="From"
              value={filters.createdFrom}
              onChange={(e) => patchFilters({ createdFrom: e.target.value })}
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ minWidth: 150, '& .MuiInputBase-input': { fontSize: '0.8125rem' } }}
            />
            <TextField
              size="small"
              type="date"
              label="To"
              value={filters.createdTo}
              onChange={(e) => patchFilters({ createdTo: e.target.value })}
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ minWidth: 150, '& .MuiInputBase-input': { fontSize: '0.8125rem' } }}
            />
          </>
        ) : null}
      </FilterBar>

      <ActiveFilterChips
        filters={activeFilterChips}
        onClear={clearFilter}
        onClearAll={clearAllFilters}
      />

      {error ? (
        <Typography sx={{ color: cv.destructive, mb: 2 }} role="alert">
          {error}
        </Typography>
      ) : null}

      <Panel
        title={`${total} ${total === 1 ? 'user' : 'users'}`}
        subtitle="Click a column header to sort"
      >
        <TableLoadingBar loading={loading} />
        {rows.length === 0 ? (
          <EmptyState message={emptyMessage} />
        ) : (
          <>
            <Box sx={{ overflowX: 'auto', opacity: loading ? 0.6 : 1, transition: 'opacity 0.15s ease' }}>
              <Table size="small" sx={platformTableSx}>
                <PlatformTableHead
                  columns={COLUMNS}
                  sortBy={sort.sortBy}
                  sortDir={sort.sortDir}
                  onSort={handleSort}
                />
                <TableBody>
                  {rows.map((user) => {
                    const org = user.organization as
                      | { id?: string; name?: string; slug?: string }
                      | null;
                    const role = user.roleRelation as { name?: string } | null;
                    const name = text(user.name, '');
                    return (
                      <TableRow key={String(user.id)} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                            <Box
                              aria-hidden="true"
                              sx={{
                                width: 30,
                                height: 30,
                                flexShrink: 0,
                                borderRadius: '6px',
                                display: 'grid',
                                placeItems: 'center',
                                background: cv.purpleSurface,
                                border: `1px solid ${cv.purpleChipBorder}`,
                                color: cv.brandOrchid,
                                fontSize: '0.7rem',
                                fontWeight: 700,
                              }}
                            >
                              {initialsOf(name || text(user.email, '?')) || '—'}
                            </Box>
                            <Box sx={{ minWidth: 0 }}>
                              <Typography sx={{ fontWeight: 600, fontSize: '0.875rem', color: cv.textPrimary }}>
                                {name || '—'}
                              </Typography>
                              <Typography sx={{ fontSize: '0.75rem', color: cv.textMuted }}>
                                {text(user.email)}
                              </Typography>
                            </Box>
                          </Box>
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
                        <TableCell>
                          <Box
                            component="span"
                            sx={{
                              display: 'inline-block',
                              px: 1,
                              py: 0.25,
                              borderRadius: '6px',
                              border: `1px solid ${cv.border}`,
                              background: cv.surfaceMuted,
                              color: cv.textSecondary,
                              fontSize: '0.7rem',
                              fontWeight: 600,
                            }}
                          >
                            {role?.name || '—'}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <StatusChip status={text(user.status, 'active')} />
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: '0.8125rem', color: user.mfaEnabled ? cv.successText : cv.textMuted }}>
                            {user.mfaEnabled ? 'On' : 'Off'}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>
                          {formatDateTime(user.lastLoginAt)}
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
            </Box>
            <PlatformTablePagination
              count={total}
              page={pagination.page}
              rowsPerPage={pagination.rowsPerPage}
              onPageChange={pagination.onPageChange}
              onRowsPerPageChange={pagination.onRowsPerPageChange}
            />
          </>
        )}
      </Panel>

      <Dialog
        open={modalOpen}
        onClose={closeModal}
        fullWidth
        maxWidth="sm"
        aria-labelledby="invite-user-dialog-title"
        slotProps={noahDialogSlotProps()}
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
              SelectProps={{ MenuProps: selectInDialogMenuProps }}
            >
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
              SelectProps={{ MenuProps: selectInDialogMenuProps }}
            >
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

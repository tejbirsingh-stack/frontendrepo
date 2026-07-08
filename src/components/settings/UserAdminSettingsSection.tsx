import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import { cv } from '../../theme/cssVars';
import {
  Box,
  Button,
  Checkbox,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  ListItemText,
  MenuItem,
  Select,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { TeamMemberAvatarStack } from '../common/TeamMemberAvatarStack';
import SettingsAdminToolbar from './SettingsAdminToolbar';
import SettingsDataTable, {
  SettingsUserCell,
  StatusChip,
  type SettingsTableColumn,
} from './SettingsDataTable';
import SettingsTableFilterPanel from './SettingsTableFilterPanel';
import { SettingsSectionCard } from './SettingsSectionCard';
import { SettingsTableContainer } from './SettingsContentLayout';
import TruncatedText from '../TruncatedText';
import { USER_ROLES, type UserRole } from '../../constants/userRoles';
import { fetchRoles, registerRole } from '../../api/auth.service';
import type { RoleItem } from '../../api/types';
import {
  createInvitedUser,
  createUserGroup,
  MOCK_SETTINGS_USER_GROUPS,
  MOCK_SETTINGS_USERS,
  type SettingsUserGroup,
  type SettingsUserRow,
} from '../../data/mockSettingsData';
import { noahDialogSlotProps } from '../../constants/dialogStyles';
import { selectInDialogMenuProps } from '../../constants/dropdownMenu';
import {
  createDefaultFilterSelection,
  hasActiveFilterSelections,
  matchesSetFilter,
  toggleFilterValue,
} from '../../utils/settingsTableFilterUtils';

const tabSx = {
  minHeight: 40,
  mb: 2.5,
  borderBottom: `1px solid ${cv.divider}`,
  '& .MuiTab-root': {
    minHeight: 40,
    py: 0.5,
    px: 0,
    mr: 3,
    fontSize: '0.9375rem',
    fontWeight: 500,
    color: cv.textSecondary,
    textTransform: 'none',
    minWidth: 'auto',
  },
  '& .Mui-selected': {
    color: `${cv.textPrimary} !important`,
  },
  '& .MuiTabs-indicator': {
    background: cv.brandGradient,
    height: 2,
    borderRadius: '2px',
  },
};

const containedButtonSx = {
  textTransform: 'none' as const,
  borderRadius: '10px',
  background: cv.brandGradient,
  boxShadow: 'none',
  '&:hover': { boxShadow: 'none', opacity: 0.92 },
};

const dialogSelectSx = {
  borderRadius: '10px',
  fontSize: '0.875rem',
  color: cv.textPrimary,
  '& .MuiOutlinedInput-notchedOutline': { borderColor: cv.border },
  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: cv.surfaceActive },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: cv.borderFocus, borderWidth: 1 },
};

const tableTextSx = { fontSize: '0.875rem', color: cv.textPrimary };

function tableText(value: string) {
  return <TruncatedText text={value} sx={tableTextSx} />;
}

function AddUserDialog({
  open,
  onClose,
  onInvite,
  onSave,
  initialUser,
}: {
  open: boolean;
  onClose: () => void;
  onInvite: (email: string, role: UserRole) => void;
  onSave?: (email: string, role: UserRole) => void;
  initialUser?: { email: string; role: UserRole };
}) {
  const isEdit = Boolean(initialUser);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('Collaborator');
  const [rolesList, setRolesList] = useState<RoleItem[]>([]);
  const [roleId, setRoleId] = useState<string>('');
  const [emailError, setEmailError] = useState('');

  useEffect(() => {
    if (open) {
      fetchRoles()
        .then((data) => {
          setRolesList(data);
          if (data.length > 0) {
            if (initialUser) {
              const matched = data.find(
                (r) => r.name.toLowerCase() === initialUser.role.toLowerCase() || r.id === (initialUser as any).roleId
              );
              if (matched) {
                setRoleId(matched.id);
                setRole(matched.name as UserRole);
                return;
              }
            }
            setRoleId(data[0].id);
            setRole(data[0].name as UserRole);
          }
        })
        .catch((err) => console.error('Failed to fetch roles:', err));
    }
  }, [open, initialUser]);

  useEffect(() => {
    if (!open) {
      setEmail('');
      setRole('Collaborator');
      setRoleId('');
      setEmailError('');
      return;
    }
    if (initialUser) {
      setEmail(initialUser.email);
      setRole(initialUser.role);
      setEmailError('');
    }
  }, [open, initialUser]);

  const handleSubmit = async () => {
    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setEmailError('Enter a valid email address');
      return;
    }
    const finalRoleId = roleId || role;
    try {
      await registerRole({ email: trimmed, roleId: finalRoleId });
    } catch (err) {
      console.error('Error calling registerRole API:', err);
    }
    const selectedRoleName = rolesList.find((r) => r.id === finalRoleId)?.name || role;
    onInvite(trimmed, selectedRoleName as UserRole);
    onClose();
  };

  const handleSave = () => {
    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setEmailError('Enter a valid email address');
      return;
    }
    const finalRoleId = roleId || role;
    const selectedRoleName = rolesList.find((r) => r.id === finalRoleId)?.name || role;
    onSave?.(trimmed, selectedRoleName as UserRole);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      aria-labelledby="add-user-dialog-title"
      slotProps={noahDialogSlotProps()}
    >
      <DialogTitle
        id="add-user-dialog-title"
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pb: 1,
          fontWeight: 600,
          fontSize: '1.25rem',
          color: cv.textPrimary,
        }}
      >
        {isEdit ? 'Edit user' : 'Add users'}
        <IconButton aria-label="Close" onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          pt: '8px !important',
          backgroundColor: cv.dialogSurface,
          overflow: 'visible',
        }}
      >
        <TextField
          label="Email address"
          placeholder="name@company.com"
          fullWidth
          size="small"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            if (emailError) setEmailError('');
          }}
          error={Boolean(emailError)}
          helperText={emailError}
          disabled={isEdit}
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <FormControl fullWidth size="small">
          <InputLabel id="add-user-role-label" shrink>
            Role
          </InputLabel>
          <Select
            labelId="add-user-role-label"
            label="Role"
            value={roleId || role}
            onChange={(event: SelectChangeEvent) => {
              const val = event.target.value;
              setRoleId(val);
              const matchedRole = rolesList.find((r) => r.id === val);
              if (matchedRole) {
                setRole(matchedRole.name as UserRole);
              } else {
                setRole(val as UserRole);
              }
            }}
            MenuProps={selectInDialogMenuProps}
            sx={dialogSelectSx}
          >
            {rolesList.length > 0
              ? rolesList.map((roleOption) => (
                  <MenuItem
                    key={roleOption.id}
                    value={roleOption.id}
                    sx={{ fontSize: '0.875rem', color: cv.textPrimary }}
                  >
                    {roleOption.name}
                  </MenuItem>
                ))
              : USER_ROLES.map((roleOption) => (
                  <MenuItem
                    key={roleOption}
                    value={roleOption}
                    sx={{ fontSize: '0.875rem', color: cv.textPrimary }}
                  >
                    {roleOption}
                  </MenuItem>
                ))}
          </Select>
        </FormControl>
        <Typography sx={{ fontSize: '0.8125rem', color: cv.textSecondary }}>
          {isEdit
            ? 'Update the account role for this user.'
            : 'Invited users receive an email to join your account.'}
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, pt: 1, backgroundColor: cv.dialogSurface }}>
        <Button onClick={onClose} sx={{ textTransform: 'none', color: cv.textSecondary }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={isEdit ? handleSave : handleSubmit}
          sx={containedButtonSx}
        >
          {isEdit ? 'Save changes' : 'Send invite'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function UserGroupDialog({
  open,
  onClose,
  onSave,
  users,
  initialGroup,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (name: string, description: string, memberIds: string[]) => void;
  users: SettingsUserRow[];
  initialGroup?: SettingsUserGroup;
}) {
  const isEdit = Boolean(initialGroup);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [memberIds, setMemberIds] = useState<string[]>([]);
  const [nameError, setNameError] = useState('');

  useEffect(() => {
    if (!open) {
      setName('');
      setDescription('');
      setMemberIds([]);
      setNameError('');
      return;
    }
    if (initialGroup) {
      setName(initialGroup.name);
      setDescription(initialGroup.description);
      setMemberIds(initialGroup.memberIds);
      setNameError('');
    }
  }, [open, initialGroup]);

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError('Group name is required');
      return;
    }
    onSave(trimmed, description.trim(), memberIds);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      aria-labelledby="user-group-dialog-title"
      slotProps={noahDialogSlotProps()}
    >
      <DialogTitle
        id="user-group-dialog-title"
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pb: 1,
          fontWeight: 600,
          fontSize: '1.25rem',
          color: cv.textPrimary,
        }}
      >
        {isEdit ? 'Edit group' : 'Create group'}
        <IconButton aria-label="Close" onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          pt: '8px !important',
          backgroundColor: cv.dialogSurface,
          overflow: 'visible',
        }}
      >
        <TextField
          label="Group name"
          placeholder="e.g. Creative Team"
          fullWidth
          size="small"
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            if (nameError) setNameError('');
          }}
          error={Boolean(nameError)}
          helperText={nameError}
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <TextField
          label="Description"
          placeholder="What is this group used for?"
          fullWidth
          size="small"
          multiline
          minRows={2}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <FormControl fullWidth size="small">
          <InputLabel id="group-members-label" shrink>
            Members
          </InputLabel>
          <Select<string[]>
            labelId="group-members-label"
            label="Members"
            multiple
            value={memberIds}
            onChange={(event) => {
              const value = event.target.value;
              setMemberIds(typeof value === 'string' ? value.split(',') : value);
            }}
            MenuProps={selectInDialogMenuProps}
            sx={dialogSelectSx}
            renderValue={(selected) => {
              const names = users
                .filter((user) => selected.includes(user.id))
                .map((user) => user.name);
              return names.length > 0 ? names.join(', ') : 'Select members';
            }}
          >
            {users.map((user) => (
              <MenuItem key={user.id} value={user.id} sx={{ fontSize: '0.875rem', color: cv.textPrimary }}>
                <Checkbox checked={memberIds.includes(user.id)} size="small" sx={{ mr: 1 }} />
                <ListItemText
                  primary={user.name}
                  secondary={user.email}
                  slotProps={{
                    primary: { sx: { fontSize: '0.875rem' } },
                    secondary: { sx: { fontSize: '0.75rem' } },
                  }}
                />
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Typography sx={{ fontSize: '0.8125rem', color: cv.textSecondary }}>
          Groups make it easier to assign permissions and share media with the same people.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, pt: 1, backgroundColor: cv.dialogSurface }}>
        <Button onClick={onClose} sx={{ textTransform: 'none', color: cv.textSecondary }}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSubmit} sx={containedButtonSx}>
          {isEdit ? 'Save group' : 'Create group'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function PeopleTab({
  users,
  setUsers,
}: {
  users: SettingsUserRow[];
  setUsers: Dispatch<SetStateAction<SettingsUserRow[]>>;
}) {
  const [search, setSearch] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [editUserId, setEditUserId] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [roleFilter, setRoleFilter] = useState<Set<string>>(createDefaultFilterSelection);
  const [statusFilter, setStatusFilter] = useState<Set<string>>(createDefaultFilterSelection);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const hasActiveFilters = hasActiveFilterSelections(roleFilter, statusFilter);

  const rows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return users.filter((user) => {
      const matchesSearch =
        !query ||
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.role.toLowerCase().includes(query);
      const matchesRole = matchesSetFilter(user.role, roleFilter);
      const matchesStatus = matchesSetFilter(user.status, statusFilter);
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  const handleInvite = (email: string, role: UserRole) => {
    setUsers((current) => [...current, createInvitedUser(email, role)]);
  };

  const editUser = users.find((user) => user.id === editUserId);

  const handleSaveUser = (email: string, role: UserRole) => {
    if (!editUserId) return;
    setUsers((current) =>
      current.map((user) => (user.id === editUserId ? { ...user, email, role } : user)),
    );
    setSelectedIds(new Set());
  };

  const columns: SettingsTableColumn<SettingsUserRow>[] = [
    {
      id: 'user',
      label: 'User',
      width: '22%',
      render: (row) => (
        <SettingsUserCell
          name={row.name}
          initials={row.initials}
          isCurrentUser={row.isCurrentUser}
        />
      ),
    },
    { id: 'email', label: 'Email address', width: '24%', render: (row) => tableText(row.email) },
    { id: 'lastActive', label: 'Last active', width: '14%', render: (row) => row.lastActive },
    { id: 'joined', label: 'Joined on', width: '14%', render: (row) => row.joinedDate },
    { id: 'role', label: 'Account role', width: '14%', render: (row) => row.role },
    {
      id: 'status',
      label: 'Status',
      width: '12%',
      render: (row) => <StatusChip status={row.status} />,
    },
  ];

  return (
    <>
      <SettingsSectionCard
        title="People"
        description="Manage members across Super Admin, Admin, Editor, Collaborator, and Viewer roles."
      >
        <SettingsAdminToolbar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search people…"
          onFilter={() => setFilterOpen((open) => !open)}
          filterOpen={filterOpen}
          hasActiveFilters={hasActiveFilters}
          onExport={() => undefined}
          onAdd={() => setAddOpen(true)}
          addLabel="New user"
        />
        <Collapse in={filterOpen}>
          <Box sx={{ px: 2, pb: 1.5 }}>
            <SettingsTableFilterPanel
              groups={[
                {
                  id: 'role',
                  label: 'Account role',
                  options: [...USER_ROLES],
                  selected: roleFilter,
                  onToggle: (value) => setRoleFilter((current) => toggleFilterValue(current, value)),
                },
                {
                  id: 'status',
                  label: 'Status',
                  options: ['Active', 'Pending'],
                  selected: statusFilter,
                  onToggle: (value) => setStatusFilter((current) => toggleFilterValue(current, value)),
                },
              ]}
              onClearAll={() => {
                setRoleFilter(createDefaultFilterSelection());
                setStatusFilter(createDefaultFilterSelection());
              }}
            />
          </Box>
        </Collapse>
        {selectedIds.size > 0 ? (
          <Box
            sx={{
              px: 2,
              py: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              flexWrap: 'wrap',
              borderBottom: `1px solid ${cv.dividerSubtle}`,
            }}
          >
            <Button
              size="small"
              disabled={selectedIds.size !== 1}
              onClick={() => {
                const rowId = [...selectedIds][0];
                if (rowId) setEditUserId(rowId);
              }}
              sx={{ textTransform: 'none', color: cv.textPrimary, fontWeight: 500 }}
            >
              Edit
            </Button>
            <Button size="small" sx={{ textTransform: 'none', color: cv.textSecondary }}>
              Mark active
            </Button>
            <Button size="small" sx={{ textTransform: 'none', color: cv.textSecondary }}>
              Mark inactive
            </Button>
            <Button size="small" sx={{ textTransform: 'none', color: cv.destructive }}>
              Mark delete
            </Button>
          </Box>
        ) : null}
        <SettingsDataTable
          columns={columns}
          rows={rows}
          getRowId={(row) => row.id}
          selectable
          selectedRowIds={selectedIds}
          onSelectionChange={setSelectedIds}
        />
        {selectedIds.size > 0 ? (
          <Typography sx={{ px: 2, py: 1.25, fontSize: '0.75rem', color: cv.textMuted }}>
            {selectedIds.size} user{selectedIds.size === 1 ? '' : 's'} selected.
          </Typography>
        ) : null}
      </SettingsSectionCard>
      <AddUserDialog
        open={addOpen || Boolean(editUserId)}
        onClose={() => {
          setAddOpen(false);
          setEditUserId(null);
        }}
        onInvite={handleInvite}
        onSave={handleSaveUser}
        initialUser={editUser ? { email: editUser.email, role: editUser.role } : undefined}
      />
    </>
  );
}

function UserGroupsTab({
  users,
  groups,
  setGroups,
}: {
  users: SettingsUserRow[];
  groups: SettingsUserGroup[];
  setGroups: Dispatch<SetStateAction<SettingsUserGroup[]>>;
}) {
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editGroupId, setEditGroupId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const userById = useMemo(() => new Map(users.map((user) => [user.id, user])), [users]);

  const rows = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return groups;
    return groups.filter((group) => {
      const memberNames = group.memberIds
        .map((id) => userById.get(id)?.name ?? '')
        .join(' ')
        .toLowerCase();
      return (
        group.name.toLowerCase().includes(query) ||
        group.description.toLowerCase().includes(query) ||
        group.createdBy.toLowerCase().includes(query) ||
        memberNames.includes(query)
      );
    });
  }, [groups, search, userById]);

  const editGroup = groups.find((group) => group.id === editGroupId);

  const handleSaveGroup = (name: string, description: string, memberIds: string[]) => {
    if (editGroupId) {
      setGroups((current) =>
        current.map((group) =>
          group.id === editGroupId ? { ...group, name, description, memberIds } : group,
        ),
      );
      setSelectedIds(new Set());
      return;
    }
    setGroups((current) => [...current, createUserGroup(name, description, memberIds)]);
  };

  const handleDeleteSelected = () => {
    setGroups((current) => current.filter((group) => !selectedIds.has(group.id)));
    setSelectedIds(new Set());
  };

  const columns: SettingsTableColumn<SettingsUserGroup>[] = [
    {
      id: 'name',
      label: 'Group name',
      width: '20%',
      render: (row) => tableText(row.name),
    },
    {
      id: 'description',
      label: 'Description',
      width: '28%',
      render: (row) => tableText(row.description || '—'),
    },
    {
      id: 'members',
      label: 'Members',
      width: '18%',
      render: (row) => {
        const members = row.memberIds
          .map((id) => userById.get(id))
          .filter((user): user is SettingsUserRow => Boolean(user))
          .map((user) => ({
            id: user.id,
            name: user.name,
            initials: user.initials,
          }));
        return members.length > 0 ? (
          <TeamMemberAvatarStack members={members} max={4} borderColor={cv.dialogSurface} />
        ) : (
          <Typography sx={{ fontSize: '0.875rem', color: cv.textMuted }}>No members</Typography>
        );
      },
    },
    {
      id: 'count',
      label: 'Count',
      width: '10%',
      render: (row) => `${row.memberIds.length}`,
    },
    { id: 'created', label: 'Created', width: '14%', render: (row) => row.createdDate },
    { id: 'createdBy', label: 'Created by', width: '14%', render: (row) => tableText(row.createdBy) },
  ];

  return (
    <>
      <SettingsSectionCard
        title="User groups"
        description="Organize people into groups for faster sharing, permissions, and workspace access."
      >
        <SettingsAdminToolbar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search groups…"
          onExport={() => undefined}
          onAdd={() => setDialogOpen(true)}
          addLabel="New group"
        />
        {selectedIds.size > 0 ? (
          <Box
            sx={{
              px: 2,
              py: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              flexWrap: 'wrap',
              borderBottom: `1px solid ${cv.dividerSubtle}`,
            }}
          >
            <Button
              size="small"
              disabled={selectedIds.size !== 1}
              onClick={() => {
                const rowId = [...selectedIds][0];
                if (rowId) setEditGroupId(rowId);
              }}
              sx={{ textTransform: 'none', color: cv.textPrimary, fontWeight: 500 }}
            >
              Edit
            </Button>
            <Button
              size="small"
              onClick={handleDeleteSelected}
              sx={{ textTransform: 'none', color: cv.destructive }}
            >
              Delete
            </Button>
          </Box>
        ) : null}
        <SettingsDataTable
          columns={columns}
          rows={rows}
          getRowId={(row) => row.id}
          selectable
          selectedRowIds={selectedIds}
          onSelectionChange={setSelectedIds}
          emptyMessage="No groups yet. Create one to organize your team."
        />
        {selectedIds.size > 0 ? (
          <Typography sx={{ px: 2, py: 1.25, fontSize: '0.75rem', color: cv.textMuted }}>
            {selectedIds.size} group{selectedIds.size === 1 ? '' : 's'} selected.
          </Typography>
        ) : null}
      </SettingsSectionCard>
      <UserGroupDialog
        open={dialogOpen || Boolean(editGroupId)}
        onClose={() => {
          setDialogOpen(false);
          setEditGroupId(null);
        }}
        onSave={handleSaveGroup}
        users={users}
        initialGroup={editGroup}
      />
    </>
  );
}

export default function UserAdminSettingsSection() {
  const [activeTab, setActiveTab] = useState(0);
  const [users, setUsers] = useState<SettingsUserRow[]>(MOCK_SETTINGS_USERS);
  const [groups, setGroups] = useState<SettingsUserGroup[]>(MOCK_SETTINGS_USER_GROUPS);

  return (
    <SettingsTableContainer>
      <Box sx={{ width: '100%' }}>
        <Tabs value={activeTab} onChange={(_, value: number) => setActiveTab(value)} sx={tabSx}>
          <Tab label="People" />
          <Tab label="Users Group" />
        </Tabs>

        {activeTab === 0 ? (
          <PeopleTab users={users} setUsers={setUsers} />
        ) : (
          <UserGroupsTab users={users} groups={groups} setGroups={setGroups} />
        )}
      </Box>
    </SettingsTableContainer>
  );
}

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
  Avatar,
  Popover,
  List,
  ListItem,
  ListItemAvatar,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
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
import { ROLE_IDS, USER_ROLES, type UserRole } from '../../constants/userRoles';
import { fetchRoles, registerRole, fetchOrganizationUsers,} from '../../api/auth.service';
import { useAuth } from '../../auth/AuthContext';
import type { RoleItem } from '../../api/types';
import {
  createInvitedUser,
  type SettingsUserRow,
} from '../../data/mockSettingsData';
import { fetchUserGroups, createUserGroup as apiCreateUserGroup, updateUserGroup as apiUpdateUserGroup, deleteUserGroup as apiDeleteUserGroup, type UserGroup } from '../../api/userGroups.service';
import { downloadCSV } from '../../utils/csvExport';
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
  const { user } = useAuth();
  
  const filteredRolesList = useMemo(() => {
    if (user?.roleId === ROLE_IDS.ADMIN) {
      return rolesList.filter((r) => r.name !== 'Super Admin' && r.name !== 'Admin' && r.name !== 'System Admin');
    }
    return rolesList.filter((r) => r.name !== 'Super Admin');
  }, [rolesList, user]);

  const filteredUserRoles = useMemo(() => {
    if (user?.roleId === ROLE_IDS.ADMIN) {
      return USER_ROLES.filter((r) => r !== 'Super Admin' && r !== 'Admin');
    }
    return USER_ROLES.filter((r) => r !== 'Super Admin');
  }, [user]);

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
            {filteredRolesList.length > 0
              ? filteredRolesList.map((roleOption) => (
                  <MenuItem
                    key={roleOption.id}
                    value={roleOption.id}
                    sx={{ fontSize: '0.875rem', color: cv.textPrimary }}
                  >
                    {roleOption.name}
                  </MenuItem>
                ))
              : filteredUserRoles.map((roleOption) => (
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
  initialGroup?: UserGroup;
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
      setDescription(initialGroup.description || '');
      setMemberIds(initialGroup.members.map(m => m.user.id));
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
  const { user } = useAuth();
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
          onExport={() => {
            downloadCSV(
              'People',
              ['User', 'Email address', 'Last active', 'Joined on', 'Account role', 'Status'],
              rows.map((row) => [
                row.name,
                row.email,
                row.lastActive,
                row.joinedDate,
                row.role,
                row.status,
              ])
            );
          }}
          onAdd={() => setAddOpen(true)}
          addLabel="New user"
          exportDisabled={user?.role === 'Editor'}
          addDisabled={user?.role === 'Editor'}
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

function GroupMembersCell({ members, borderColor }: { members: { id: string; name: string; initials: string; email?: string }[]; borderColor: string }) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  if (members.length === 0) {
    return <Typography sx={{ fontSize: '0.875rem', color: cv.textMuted }}>No members</Typography>;
  }

  return (
    <>
      <Box onClick={(e) => { e.stopPropagation(); setAnchorEl(e.currentTarget); }} sx={{ cursor: 'pointer', display: 'inline-flex' }}>
        <TeamMemberAvatarStack members={members} max={4} borderColor={borderColor} />
      </Box>
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={(e) => {
          if (e && e.stopPropagation) e.stopPropagation();
          setAnchorEl(null);
        }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        PaperProps={{ sx: { mt: 1, borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', maxHeight: 300, minWidth: 200, bgcolor: cv.dialogSurface } }}
      >
        <List dense sx={{ p: 0 }}>
          {members.map(member => (
            <ListItem key={member.id}>
              <ListItemAvatar sx={{ minWidth: 40 }}>
                <Avatar sx={{ width: 28, height: 28, fontSize: '0.75rem', bgcolor: cv.brandGradient }}>{member.initials}</Avatar>
              </ListItemAvatar>
              <ListItemText 
                primary={member.name} 
                secondary={member.email}
                slotProps={{
                  primary: { sx: { fontSize: '0.875rem', color: cv.textPrimary } },
                  secondary: { sx: { fontSize: '0.75rem', color: cv.textSecondary } }
                }}
              />
            </ListItem>
          ))}
        </List>
      </Popover>
    </>
  );
}

function UserGroupsTab({
  users,
  groups,
  setGroups,
}: {
  users: SettingsUserRow[];
  groups: UserGroup[];
  setGroups: Dispatch<SetStateAction<UserGroup[]>>;
}) {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editGroupId, setEditGroupId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  const userById = useMemo(() => new Map(users.map((user) => [user.id, user])), [users]);

  const rows = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return groups;
    return groups.filter((group) => {
      const memberNames = group.members
        .map((m) => m.user.name)
        .join(' ')
        .toLowerCase();
      return (
        group.name.toLowerCase().includes(query) ||
        (group.description || '').toLowerCase().includes(query) ||
        (group.createdBy?.name || '').toLowerCase().includes(query) ||
        memberNames.includes(query)
      );
    });
  }, [groups, search, userById]);

  const editGroup = groups.find((group) => group.id === editGroupId);

  const handleSaveGroup = async (name: string, description: string, memberIds: string[]) => {
    setIsLoading(true);
    try {
      if (editGroupId) {
        const updated = await apiUpdateUserGroup(editGroupId, { name, description, memberIds });
        setGroups((current) => current.map((group) => (group.id === editGroupId ? updated : group)));
        setSelectedIds(new Set());
      } else {
        const created = await apiCreateUserGroup({ name, description, memberIds });
        setGroups((current) => [created, ...current]);
      }
    } catch (err) {
      console.error('Failed to save group:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSelected = async () => {
    setIsLoading(true);
    try {
      for (const id of Array.from(selectedIds)) {
        await apiDeleteUserGroup(id);
      }
      setGroups((current) => current.filter((group) => !selectedIds.has(group.id)));
      setSelectedIds(new Set());
    } catch (err) {
      console.error('Failed to delete groups:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const columns: SettingsTableColumn<UserGroup>[] = [
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
        const members = row.members
          .map((m) => m.user)
          .map((u) => {
             const userRow = userById.get(u.id);
             return {
               id: u.id,
               name: u.name,
               email: u.email,
               initials: userRow?.initials || u.name.slice(0, 2).toUpperCase()
             };
          });
        return <GroupMembersCell members={members} borderColor={cv.dialogSurface} />;
      },
    },
    {
      id: 'count',
      label: 'Count',
      width: '10%',
      render: (row) => `${row.members.length}`,
    },
    { id: 'created', label: 'Created', width: '12%', render: (row) => new Date(row.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) },
    { id: 'createdBy', label: 'Created by', width: '12%', render: (row) => tableText(row.createdBy?.name || 'System') },
    {
      id: 'actions',
      label: '',
      width: '4%',
      render: (row) => (
        <IconButton size="small" onClick={(e) => {
          e.stopPropagation();
          setEditGroupId(row.id);
        }}>
          <EditOutlinedIcon fontSize="small" />
        </IconButton>
      ),
    },
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
          onExport={() => {
            downloadCSV(
              'UserGroups',
              ['Group name', 'Description', 'Members', 'Count', 'Created', 'Created by'],
              rows.map((row) => [
                row.name,
                row.description || '',
                row.members.map(m => m.user.email ? `${m.user.name} (${m.user.email})` : m.user.name).join(', '),
                row.members.length,
                new Date(row.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                row.createdBy?.name || 'System',
              ])
            );
          }}
          onAdd={() => setDialogOpen(true)}
          addLabel="New group"
          exportDisabled={user?.role === 'Editor'}
          addDisabled={user?.role === 'Editor'}
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
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [users, setUsers] = useState<SettingsUserRow[]>([]);
  const [groups, setGroups] = useState<UserGroup[]>([]);

  useEffect(() => {
    let mounted = true;
    fetchOrganizationUsers()
      .then((apiUsers) => {
        if (!mounted || !apiUsers || !Array.isArray(apiUsers) || apiUsers.length === 0) return;

        const formatUserRoleLabel = (rawRole?: string): UserRole => {
          if (!rawRole) return 'Viewer';
          const normalized = rawRole.toLowerCase().trim().replace(/[_-]+/g, ' ');
          if (normalized === 'super admin' || normalized === 'superadmin') return 'Super Admin';
          if (normalized === 'admin') return 'Admin';
          if (normalized === 'collaborator') return 'Collaborator';
          if (normalized === 'editor') return 'Editor';
          if (normalized === 'viewer') return 'Viewer';
          return rawRole
            .split(/[._-]+/)
            .filter(Boolean)
            .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
            .join(' ') as UserRole;
        };

        const getRolePriority = (roleLabel: string): number => {
          const r = roleLabel.toLowerCase();
          if (r.includes('super')) return 1;
          if (r.includes('system')) return 2;
          if (r === 'admin') return 3;
          if (r === 'collaborator') return 4;
          if (r === 'editor') return 5;
          if (r === 'viewer') return 6;
          return 99;
        };

        const mappedUsers: SettingsUserRow[] = apiUsers.map((u) => {
          const name = u.name || u.email.split('@')[0];
          const initials = name
            .split(' ')
            .filter(Boolean)
            .map((part) => part[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);

          let lastActiveText = 'Never';
          if (u.lastActiveAt) {
            const date = new Date(u.lastActiveAt);
            const diffMinutes = Math.floor((Date.now() - date.getTime()) / (1000 * 60));
            if (diffMinutes <= 1) lastActiveText = 'Just now';
            else if (diffMinutes < 60) lastActiveText = `${diffMinutes} mins ago`;
            else if (diffMinutes < 1440) lastActiveText = `${Math.floor(diffMinutes / 60)} hours ago`;
            else lastActiveText = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
          } else if (u.lastLoginAt) {
            const date = new Date(u.lastLoginAt);
            lastActiveText = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
          }

          const joinedDate = u.createdAt
            ? new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            : '—';
          const isMe = Boolean(
            currentUser &&
            (u.id === currentUser.id ||
              (u.email && currentUser.email && u.email.toLowerCase() === currentUser.email.toLowerCase()))
          );
          return {
            id: u.id,
            name,
            initials: initials || 'U',
            email: u.email,
            lastActive: lastActiveText,
            joinedDate,
            role: formatUserRoleLabel((u.roleRelation && u.roleRelation.name) || u.role),
            roleId: u.roleId || u.roleRelation?.id,
            roleRelation: u.roleRelation,
            status: u.status === 'active' ? 'Active' : 'Pending',
            isCurrentUser: isMe,
          };
        });

        // Sort users by role order: Super Admin > System Admin > Admin > Collaborator > Editor > Viewer
        mappedUsers.sort((a, b) => {
          const priorityA = getRolePriority(a.role);
          const priorityB = getRolePriority(b.role);
          if (priorityA !== priorityB) return priorityA - priorityB;
          return a.name.localeCompare(b.name);
        });

        setUsers(mappedUsers);
      })
      .catch((err) => {
        console.error('Failed to fetch users from API:', err);
      });
    return () => {
      mounted = false;
    };
  }, [currentUser?.id, currentUser?.email]);

  useEffect(() => {
    let mounted = true;
    fetchUserGroups()
      .then((data) => {
        if (mounted) setGroups(data);
      })
      .catch((err) => {
        console.error('Failed to fetch user groups:', err);
      });
    return () => {
      mounted = false;
    };
  }, [currentUser?.id]);

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

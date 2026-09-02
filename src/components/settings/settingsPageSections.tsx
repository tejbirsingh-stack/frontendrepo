import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import ProjectDeleteFlowModal from '../modals/ProjectDeleteFlowModal';
import { getUsageSummary } from '../../api/usage.service';
import { downloadCSV } from '../../utils/csvExport';
import {
  getCompanyInfoRequest,
  updateCompanyInfoRequest,
  uploadCompanyLogoRequest,
  updateProfileRequest,
  uploadProfilePhotoRequest,
  getBrandingSettingsApi,
  updateBrandingSettingsApi,
  uploadBrandingHeaderRequest,
} from '../../api';
import { logoutAllSessions, fetchOrganizationUsers } from '../../api/auth.service';
import { fetchUserGroups } from '../../api/userGroups.service';
import { useAuth } from '../../auth/AuthContext';
import { useLocalizedDate } from '../../hooks/useLocalizedDate';
import { cv } from '../../theme/cssVars';
import { billingService } from '../../api/billing.service';
import ChoosePlanScreen from '../onboarding/ChoosePlanScreen';
import PaymentSuccessModal from './PaymentSuccessModal';
import CookiePreferencesDialog from './CookiePreferencesDialog';
import {
  Avatar,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  Menu,
  MenuItem,
  Select,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import UploadOutlinedIcon from '@mui/icons-material/UploadOutlined';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import PauseCircleOutlinedIcon from '@mui/icons-material/PauseCircleOutlined';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import SettingsAdminToolbar from './SettingsAdminToolbar';
import SettingsTableFilterPanel from './SettingsTableFilterPanel';
import WorkspaceTeamMembersCell from './WorkspaceTeamMembersCell';
import WorkspaceMembersDialog from './WorkspaceMembersDialog';
import { FolderTreeNode } from '../dashboard/MoveItemsModal';
import ProjectVisibilityPicker from './ProjectVisibilityPicker';
import InvitePeopleFields from './InvitePeopleFields';
import CreateWorkspaceModal, {
  type CreateWorkspaceFormData,
} from '../dashboard/CreateWorkspaceModal';
import { useDashboard } from '../../context/DashboardContext';
import { SettingsFormContainer, SettingsTableContainer } from './SettingsContentLayout';
import SettingsDataTable, {
  StatusChip,
  type SettingsTableColumn,
} from './SettingsDataTable';
import { SettingsRow, SettingsSectionCard } from './SettingsSectionCard';
import TruncatedText from '../TruncatedText';
import { getDynamicPlanDetails } from '../../utils/planHelper';
import { CURRENT_USER } from '../../constants/currentUser';
import { ROLE_IDS } from '../../constants/userRoles';
import {
  createProject,
  createSettingsWorkspace,
  MOCK_CUSTOM_FIELDS,
  MOCK_SETTINGS_PROJECTS,
  MOCK_SETTINGS_USER_GROUPS,
  MOCK_SETTINGS_WORKSPACES,
  MOCK_CURRENT_PLAN,
  MOCK_BRANDING_SETTINGS,
  DEFAULT_BRANDING_SETTINGS,
  DEFAULT_PRIVACY_SETTINGS,
  MOCK_PERSONAL_PROFILE,
  PROFILE_TIMEZONE_OPTIONS,
  resolveProfileTimezoneOption,
  resolveWorkspaceInvite,
  type BrandingSettingsData,
  type SettingsProjectRow,
  type ProjectVisibility,
  type WorkspaceMemberAccess,
  type WorkspaceMemberType,
  type WorkspaceInvitePayload,
} from '../../data/mockSettingsData';
import {
  createDefaultFilterSelection,
  hasActiveFilterSelections,
  matchesSetFilter,
  toggleFilterValue,
  toggleSingleFilterValue,
  uniqueSorted,
} from '../../utils/settingsTableFilterUtils';
import { getProjectShareLink } from '../../utils/projectShareLink';
import { noahDialogSlotProps } from '../../constants/dialogStyles';
import { textFieldSelectInDialogSlotProps, selectInDialogMenuProps } from '../../constants/dropdownMenu';

const outlineButtonSx = {
  borderColor: cv.border,
  color: cv.textPrimary,
  textTransform: 'none' as const,
  borderRadius: '10px',
  '&:hover': { borderColor: cv.borderFocus, backgroundColor: cv.surfaceHover },
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

function ProjectNameCell({ name }: { name: string }) {
  return <TruncatedText text={name} sx={{ fontSize: '0.875rem', color: cv.textPrimary }} />;
}

const containedButtonSx = {
  textTransform: 'none' as const,
  borderRadius: '10px',
  background: cv.brandGradient,
  boxShadow: 'none',
  '&:hover': { boxShadow: 'none', opacity: 0.92 },
};

function AddProjectDialog({
  open,
  onClose,
  onAdd,
  onSave,
  workspaces,
  initialProject,
  suggestedUsers,
  suggestedGroups,
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (
    name: string,
    workspace: string,
    inviteEmails: string[],
    inviteGroupIds: string[],
    visibility: ProjectVisibility,
    folderId: string | null,
    inviteAccess?: import('../../data/mockSettingsData').WorkspaceMemberAccess,
    inviteMemberType?: import('../../data/mockSettingsData').WorkspaceMemberType,
    sendInviteEmail?: boolean
  ) => Promise<void> | void;
  onSave?: (name: string, workspace: string, visibility: ProjectVisibility) => void;
  workspaces: { id: string; name: string }[];
  initialProject?: { name: string; workspace: string; visibility: ProjectVisibility };
  suggestedUsers: import('../../data/mockSettingsData').SettingsUserRow[];
  suggestedGroups?: import('../../data/mockSettingsData').SettingsUserGroup[];
}) {
  const isEdit = Boolean(initialProject);
  const [name, setName] = useState('');
  const [workspace, setWorkspace] = useState('');
  const [folderId, setFolderId] = useState('');
  const [folders, setFolders] = useState<any[]>([]);
  const [inviteEmails, setInviteEmails] = useState<string[]>([]);
  const [inviteGroupIds, setInviteGroupIds] = useState<string[]>([]);
  const [inviteMemberType, setInviteMemberType] = useState<WorkspaceMemberType>('Member');
  const [inviteAccess, setInviteAccess] = useState<WorkspaceMemberAccess>('Full Access');
  const [sendInviteEmail, setSendInviteEmail] = useState(false);
  const [visibility, setVisibility] = useState<ProjectVisibility>('public');
  const [nameError, setNameError] = useState('');

  const { rootFolders, foldersByParent } = useMemo(() => {
    const mappedFolders = folders.map(folder => ({
      id: folder.id,
      title: folder.name,
      folderColor: folder.color,
      parentFolderId: folder.parentId || null,
    })).sort((a, b) => a.title.localeCompare(b.title));

    const byParent: Record<string, any[]> = {};
    const roots: any[] = [];

    mappedFolders.forEach(f => {
      const pid = f.parentFolderId;
      if (pid) {
        if (!byParent[pid]) byParent[pid] = [];
        byParent[pid].push(f);
      } else {
        roots.push(f);
      }
    });

    mappedFolders.forEach(f => {
      const pid = f.parentFolderId;
      if (pid && !mappedFolders.find(p => p.id === pid)) {
        if (!roots.includes(f)) roots.push(f);
      }
    });

    return { rootFolders: roots, foldersByParent: byParent };
  }, [folders]);

  useEffect(() => {
    let mounted = true;
    if (workspace && open && !isEdit) {
      const selectedWorkspace = workspaces.find((w) => w.name === workspace);
      if (selectedWorkspace) {
        import('../../api/client').then(({ apiClient }) => {
          apiClient.get<any>(`/workspaces/find-all-data/${selectedWorkspace.id}`)
            .then(res => {
              if (mounted) {
                const data = (res as any) || {};
                setFolders(data.folders || []);
              }
            })
            .catch(() => { });
        });
      }
    }
    return () => { mounted = false; };
  }, [workspace, open, workspaces, isEdit]);

  useEffect(() => {
    if (!open) {
      setName('');
      setWorkspace(workspaces[0]?.name ?? '');
      setFolderId('');
      setInviteEmails([]);
      setInviteGroupIds([]);
      setInviteMemberType('Member');
      setInviteAccess('Full Access');
      setSendInviteEmail(false);
      setVisibility('public');
      setNameError('');
      return;
    }
    if (initialProject) {
      setName(initialProject.name);
      setWorkspace(initialProject.workspace);
      setVisibility(initialProject.visibility);
      setInviteEmails([]);
      setInviteGroupIds([]);
      setSendInviteEmail(false);
      setNameError('');
      return;
    }
    setWorkspace((current) => current || workspaces[0]?.name || '');
  }, [open, initialProject, workspaces]);

  const handleSubmit = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError('Project name is required');
      return;
    }
    if (!workspace) {
      return;
    }
    if (isEdit) {
      onSave?.(trimmed, workspace, visibility);
      onClose();
      return;
    }
    try {
      await onAdd(trimmed, workspace, inviteEmails, inviteGroupIds, visibility, folderId || null, inviteAccess, inviteMemberType, sendInviteEmail);
      onClose();
    } catch (e) {
      // Error handled by parent toast
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      aria-labelledby="add-project-dialog-title"
      slotProps={noahDialogSlotProps()}
    >
      <DialogTitle
        id="add-project-dialog-title"
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
        {isEdit ? 'Edit project' : 'Add new project'}
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
          overflowY: 'auto',
          maxHeight: 'calc(90vh - 120px)',
        }}
      >
        <TextField
          label="Project name"
          placeholder="e.g. Brand Reel Q1"
          fullWidth
          size="small"
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            if (nameError) setNameError('');
          }}
          error={Boolean(nameError)}
          helperText={nameError}
          autoFocus
        />
        <FormControl fullWidth size="small">
          <InputLabel id="add-project-workspace-label" shrink>
            Workspace
          </InputLabel>
          <Select
            labelId="add-project-workspace-label"
            label="Workspace"
            value={workspace}
            onChange={(event: SelectChangeEvent) => setWorkspace(event.target.value)}
            MenuProps={selectInDialogMenuProps}
            sx={dialogSelectSx}
          >
            {workspaces.map((option) => (
              <MenuItem key={option.id} value={option.name} sx={{ fontSize: '0.875rem', color: cv.textPrimary }}>
                {option.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        {!isEdit && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <InputLabel id="add-project-folder-label" shrink sx={{ fontSize: '0.875rem', mb: -0.5 }}>
              Folder
            </InputLabel>
            <Box sx={{ maxHeight: 200, overflowY: 'auto', border: `1px solid ${cv.border}`, borderRadius: '10px', p: 1 }}>
              <Box
                component="button"
                type="button"
                onClick={() => setFolderId('')}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  width: '100%',
                  textAlign: 'left',
                  border: folderId === '' ? `1px solid ${cv.purpleFocusBorder}` : '1px solid transparent',
                  borderRadius: '10px',
                  px: 1,
                  py: 0.5,
                  mb: 0.5,
                  cursor: 'pointer',
                  backgroundColor: folderId === '' ? cv.purpleSelectionSoft : 'transparent',
                  color: cv.textPrimary,
                  '&:hover': {
                    backgroundColor: folderId === '' ? cv.purpleSelectionHover : cv.surfaceHover,
                  },
                }}
              >
                <FolderOutlinedIcon sx={{ fontSize: 18, color: folderId === '' ? cv.brandMain : cv.textMuted, flexShrink: 0, ml: 0.5 }} />
                <Typography noWrap sx={{ fontSize: '0.875rem', fontWeight: folderId === '' ? 600 : 500, color: folderId === '' ? cv.textPrimary : cv.textMuted }}>
                  {(() => {
                    const now = new Date();
                    const currentYear = new Intl.DateTimeFormat('en-US', { year: 'numeric' }).format(now);
                    const currentMonth = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(now);
                    return `Default (${currentYear} / ${currentMonth})`;
                  })()}
                </Typography>
              </Box>
              {rootFolders.map((folder) => (
                <FolderTreeNode
                  key={folder.id}
                  folder={folder}
                  foldersByParent={foldersByParent}
                  selectedFolderId={folderId || null}
                  onSelect={(id) => setFolderId(id)}
                />
              ))}
            </Box>
          </Box>
        )}
        {!isEdit && (
          <ProjectVisibilityPicker
            value={visibility}
            onChange={(next) => {
              setVisibility(next);
              if (next === 'public') {
                setInviteEmails([]);
                setInviteGroupIds([]);
              }
            }}
          />
        )}
        {visibility === 'private' && !isEdit ? (
          <InvitePeopleFields
            emails={inviteEmails}
            onChange={setInviteEmails}
            groupIds={inviteGroupIds}
            onGroupIdsChange={setInviteGroupIds}
            showAccessControls
            memberType={inviteMemberType}
            onMemberTypeChange={setInviteMemberType}
            access={inviteAccess}
            onAccessChange={setInviteAccess}
            sendInviteEmail={sendInviteEmail}
            onSendInviteEmailChange={setSendInviteEmail}
            suggestedUsers={suggestedUsers}
            suggestedGroups={suggestedGroups}
            description="Private projects are invite-only. Add people or groups who should have access."
            onGuestSearch={async (query) => {
              try {
                const { apiClient } = await import('../../api/client');
                const res = await apiClient.get<any>(`/workspaces/search-guests?q=${encodeURIComponent(query)}`);
                return Array.isArray(res) ? res : [];
              } catch {
                return [];
              }
            }}
          />
        ) : null}
        <Typography sx={{ fontSize: '0.8125rem', color: cv.textSecondary }}>
          {isEdit
            ? 'Update project name and workspace.'
            : 'New projects start as active. You will be assigned as project admin.'}
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, pt: 1, backgroundColor: cv.dialogSurface }}>
        <Button onClick={onClose} sx={{ textTransform: 'none', color: cv.textSecondary }}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSubmit} sx={containedButtonSx}>
          {isEdit ? 'Save changes' : 'Create project'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export function PersonalSettingsSection() {
  const { user, refreshUser, logout } = useAuth();

  const [profile, setProfile] = useState({
    fullName: user?.name || '',
    timezone: resolveProfileTimezoneOption(user?.timezone),
    avatarUrl: user?.avatarUrl || ''
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveProfileConfirmOpen, setSaveProfileConfirmOpen] = useState(false);
  const [logoutAllConfirmOpen, setLogoutAllConfirmOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setProfile({
        fullName: user.name || '',
        timezone: resolveProfileTimezoneOption(user.timezone),
        avatarUrl: user.avatarUrl || ''
      });
    }
  }, [user]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveProfileConfirmOpen(false);
    try {
      await updateProfileRequest({ name: profile.fullName, timezone: profile.timezone });
      await refreshUser();
      toast.success('Personal info saved successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save personal info');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoutAll = async () => {
    setLogoutAllConfirmOpen(false);
    try {
      await logoutAllSessions();
      toast.success('All sessions revoked. Logging out...');
      setTimeout(() => {
        void logout();
        window.location.assign('/');
      }, 1000);
    } catch (err: any) {
      toast.error(err.message || 'Failed to revoke sessions');
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      toast.loading('Uploading photo...', { id: 'upload-photo' });
      const res = await uploadProfilePhotoRequest(file);
      if (res.success && res.avatarUrl) {
        setProfile((current) => ({ ...current, avatarUrl: res.avatarUrl }));
        toast.success('Photo uploaded successfully', { id: 'upload-photo' });
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload photo', { id: 'upload-photo' });
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <SettingsFormContainer>
      <SettingsSectionCard
        title="Personal Info"
        description="Profile picture, name, and timezone · Editable by the individual user."
      >
        <Box sx={{ px: 2, py: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Avatar
              src={profile.avatarUrl}
              alt={profile.fullName}
              sx={{
                width: 72,
                height: 72,
                fontSize: '1.25rem',
                fontWeight: 700,
                background: profile.avatarUrl ? undefined : cv.brandGradient,
              }}
            >
              {!profile.avatarUrl ? (profile.fullName || user?.email || 'U').charAt(0).toUpperCase() : null}
            </Avatar>
            <Box>
              <input
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                ref={fileInputRef}
                onChange={handleFileUpload}
              />
              <Button
                variant="outlined"
                size="small"
                startIcon={<UploadOutlinedIcon />}
                sx={outlineButtonSx}
                onClick={() => fileInputRef.current?.click()}
              >
                Upload photo
              </Button>
              <Typography sx={{ mt: 0.75, fontSize: '0.75rem', color: cv.textMuted }}>
                PNG or JPG. Shows initials when no image is uploaded.
              </Typography>
            </Box>
          </Box>
          <TextField
            label="Full name"
            value={profile.fullName}
            onChange={(event) => setProfile((current) => ({ ...current, fullName: event.target.value }))}
            fullWidth
            size="small"
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <FormControl fullWidth size="small">
            <InputLabel id="profile-timezone-label" shrink>
              Timezone
            </InputLabel>
            <Select
              labelId="profile-timezone-label"
              label="Timezone"
              value={resolveProfileTimezoneOption(profile.timezone)}
              onChange={(event: SelectChangeEvent) =>
                setProfile((current) => ({
                  ...current,
                  timezone: resolveProfileTimezoneOption(event.target.value),
                }))
              }
              sx={dialogSelectSx}
            >
              {PROFILE_TIMEZONE_OPTIONS.map((zone) => (
                <MenuItem key={zone.value} value={zone.value} sx={{ fontSize: '0.875rem', color: cv.textPrimary }}>
                  {zone.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Typography sx={{ fontSize: '0.75rem', color: cv.textMuted }}>
            System detected by default; user configurable.
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="contained" sx={containedButtonSx} onClick={() => setSaveProfileConfirmOpen(true)} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save personal info'}
            </Button>
          </Box>
        </Box>
      </SettingsSectionCard>

      <SettingsSectionCard title="Authentication" description="Login identity and session security.">
        <SettingsRow
          title="Email address"
          description={`${user?.email || CURRENT_USER.email} · Primary login identifier · Must be globally unique. Non-editable for standard users; managed by Super Admin.`}
          action={
            <Chip
              label="Read only"
              size="small"
              sx={{ backgroundColor: cv.insetHighlight, color: cv.textSecondary }}
            />
          }
        />
        <SettingsRow
          title="Log out of all active sessions"
          description="Triggers a security token reset across all logged-in devices."
          action={
            <Button variant="outlined" size="small" sx={outlineButtonSx} onClick={() => setLogoutAllConfirmOpen(true)}>
              Log out
            </Button>
          }
          showDivider={false}
        />
      </SettingsSectionCard>

      {/* Save Confirmation Dialog */}
      <Dialog
        open={saveProfileConfirmOpen}
        onClose={() => setSaveProfileConfirmOpen(false)}
        slotProps={noahDialogSlotProps()}
      >
        <DialogTitle>Confirm Changes</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: cv.textSecondary, fontSize: '0.875rem' }}>
            Are you sure you want to save these changes to your personal info? This will update your name and timezone across the platform.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setSaveProfileConfirmOpen(false)} sx={{ color: cv.textSecondary }}>
            Cancel
          </Button>
          <Button onClick={handleSave} variant="contained" sx={containedButtonSx}>
            Confirm Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Logout All Confirmation Dialog */}
      <Dialog
        open={logoutAllConfirmOpen}
        onClose={() => setLogoutAllConfirmOpen(false)}
        slotProps={noahDialogSlotProps()}
      >
        <DialogTitle sx={{ color: cv.destructive }}>Log Out of All Sessions</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: cv.textSecondary, fontSize: '0.875rem' }}>
            Are you sure you want to log out of all active sessions? This will instantly revoke access for all devices, including the one you are currently using. You will need to log back in.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setLogoutAllConfirmOpen(false)} sx={{ color: cv.textSecondary }}>
            Cancel
          </Button>
          <Button
            onClick={handleLogoutAll}
            variant="contained"
            sx={{
              bgcolor: cv.destructive,
              color: '#fff',
              '&:hover': { bgcolor: cv.destructiveStrong },
            }}
          >
            Confirm Logout
          </Button>
        </DialogActions>
      </Dialog>
    </SettingsFormContainer>
  );
}

export function PrivacySettingsSection() {
  const { user, refreshUser } = useAuth();
  const [isCookieDialogOpen, setIsCookieDialogOpen] = useState(false);
  
  const [privacy, setPrivacy] = useState({
    shareLinkActivity: user?.shareLinkActivityEnabled !== false
  });

  useEffect(() => {
    if (user) {
      setPrivacy({
        shareLinkActivity: user.shareLinkActivityEnabled !== false
      });
    }
  }, [user]);

  const handleToggle = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.checked;
    setPrivacy((current) => ({ ...current, shareLinkActivity: newValue }));
    
    try {
      await updateProfileRequest({ shareLinkActivityEnabled: newValue });
      await refreshUser();
      toast.success('Privacy settings updated');
    } catch (err: any) {
      // Revert on error
      setPrivacy((current) => ({ ...current, shareLinkActivity: !newValue }));
      toast.error(err.message || 'Failed to update privacy settings');
    }
  };

  return (
    <SettingsFormContainer>
      <SettingsSectionCard
        title="Privacy"
        description="Notification and data consent preferences · Configurable by the individual user."
      >
        <SettingsRow
          title="Share link activity"
          description="When on, asset creators receive a notification when you view or download their shared links."
          action={
            <Switch
              checked={privacy.shareLinkActivity}
              onChange={handleToggle}
              slotProps={{ input: { 'aria-label': 'Share link activity notifications' } }}
            />
          }
        />
        <SettingsRow
          title="Cookie preferences"
          description="Configure data tracking and consent settings under US privacy compliance."
          action={
            <Button
              variant="outlined"
              size="small"
              sx={outlineButtonSx}
              onClick={() => setIsCookieDialogOpen(true)}
            >
              Manage cookies
            </Button>
          }
          showDivider={false}
        />
      </SettingsSectionCard>
      <CookiePreferencesDialog
        open={isCookieDialogOpen}
        onClose={() => setIsCookieDialogOpen(false)}
      />
    </SettingsFormContainer>
  );
}

export function CompanySettingsSection() {
  const [org, setOrg] = useState<any>(null);
  const [name, setName] = useState('MTX B2B');
  const [website, setWebsite] = useState('https://mtxb2b.com');
  const [industry, setIndustry] = useState('Media & Technology');
  const [logoUrl, setLogoUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getCompanyInfoRequest('current');
        setOrg(data);
        setName(data.name || '');
        const meta = typeof data.metadata === 'string' ? JSON.parse(data.metadata) : (data.metadata || {});
        setWebsite(meta.website || '');
        setIndustry(meta.industry || '');
        setLogoUrl(meta.logoUrl || '');
      } catch (err) {
        toast.error('Failed to load company info');
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateCompanyInfoRequest({ name, website, industry, logoUrl });
      toast.success('Company info saved');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save company info');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      toast.loading('Uploading logo...', { id: 'upload-logo' });
      const res = await uploadCompanyLogoRequest(file, org?.id);
      if (res.success && res.logoUrl) {
        setLogoUrl(res.logoUrl);
        await updateCompanyInfoRequest({ logoUrl: res.logoUrl, logoKey: res.b2Key }); // Auto-save logo
        toast.success('Logo uploaded successfully', { id: 'upload-logo' });
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload logo', { id: 'upload-logo' });
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <SettingsFormContainer>
      <SettingsSectionCard title="Company Info" description="Organization details for your account.">
        <Box sx={{ px: 2, py: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <Avatar
              src={logoUrl}
              sx={{ width: 64, height: 64, background: logoUrl ? 'transparent' : cv.brandGradient }}
            >
              {!logoUrl ? name.charAt(0).toUpperCase() : null}
            </Avatar>
            <Box>
              <input
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                ref={fileInputRef}
                onChange={handleFileUpload}
              />
              <Button
                variant="outlined"
                size="small"
                startIcon={<UploadOutlinedIcon />}
                sx={outlineButtonSx}
                onClick={() => fileInputRef.current?.click()}
              >
                Upload company logo
              </Button>
              <Typography sx={{ mt: 0.75, fontSize: '0.75rem', color: cv.textMuted }}>
                PNG, JPG, or SVG. Used for branding on shared media links.
              </Typography>
            </Box>
          </Box>

          <TextField
            label="Company name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth size="small"
          />
          <TextField
            label="Company website"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            fullWidth size="small"
          />
          <TextField
            label="Industry"
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            fullWidth size="small"
          />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
            <Button variant="contained" sx={containedButtonSx} onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save company details'}
            </Button>
          </Box>
        </Box>
      </SettingsSectionCard>
    </SettingsFormContainer>
  );
}

export { default as UsageSettingsSection } from './UsageSettingsSection';

export function PlanSettingsSection() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const plan = useMemo(() => getDynamicPlanDetails(user), [user]);
  const [choosePlanOpen, setChoosePlanOpen] = useState(false);
  const [successModalDetails, setSuccessModalDetails] = useState<any>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');
    const success = params.get('success');
    if (success === 'true' && sessionId) {
      toast.loading('Confirming your payment...', { id: 'stripe-sync' });
      billingService
        .syncSession(sessionId)
        .then(async (res) => {
          await refreshUser();
          toast.success(res?.message || 'Subscription successfully updated!', { id: 'stripe-sync' });
          if (res?.checkoutDetails) {
            setSuccessModalDetails(res.checkoutDetails);
          }
        })
        .catch((err) => {
          console.error('[Stripe Sync Error]', err);
          toast.error(err?.message || 'Failed to sync subscription status', { id: 'stripe-sync' });
        })
        .finally(() => {
          const cleanUrl = window.location.pathname;
          window.history.replaceState({}, document.title, cleanUrl);
        });
    }
  }, [refreshUser]);

  const handleUpgradePlan = async (
    planId: string,
    billingCycle: 'annual' | 'monthly',
    priceId?: string,
    useSavedCard: boolean = true,
  ) => {
    try {
      let activePriceId = priceId;
      const normalizedId = planId.toLowerCase().trim();

      if (!activePriceId && normalizedId !== 'free') {
        const { fetchPublicCatalogPlans } = await import('../../platform/api/platformApi');
        const catalog = await fetchPublicCatalogPlans().catch(() => null);
        const match = catalog?.plans?.find(
          (p: any) => p.name?.toLowerCase() === normalizedId || p.id?.toLowerCase() === normalizedId
        );
        if (match) {
          activePriceId = billingCycle === 'annual' ? (match.yearlyPriceId || match.monthlyPriceId) : match.monthlyPriceId;
        }
        if (!activePriceId) {
          activePriceId = normalizedId;
        }
      }

      if (activePriceId) {
        toast.loading(useSavedCard ? 'Processing subscription upgrade...' : 'Opening payment page...', { id: 'stripe-checkout' });
        const res: any = await billingService.createCheckoutSession(activePriceId, useSavedCard);
        if (res?.directUpgrade) {
          await refreshUser();
          toast.success(res.message || 'Subscription successfully upgraded!', { id: 'stripe-checkout' });
          if (res?.checkoutDetails) {
            setSuccessModalDetails(res.checkoutDetails);
            setChoosePlanOpen(false);
          } else {
            navigate('/home/settings/accounts/billing');
          }
          return;
        }
        if (res?.url) {
          window.location.href = res.url;
          return;
        }
      }

      const { apiClient } = await import('../../api/client');
      const token = localStorage.getItem('token');
      const res = await apiClient.post<any>('/auth/upgrade-plan', { planId, billingCycle }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await refreshUser();
      toast.success((res as any)?.message || `Upgraded to ${planId.toUpperCase()} plan!`);
      setChoosePlanOpen(false);
    } catch (err: any) {
      console.error('Failed to upgrade plan:', err);
      const errMsg = err?.response?.data?.message || err?.message || 'Failed to upgrade plan';
      toast.error(errMsg, { id: 'stripe-checkout' });
    }
  };

  return (
    <>
      <SettingsFormContainer>
        {user?.organization?.subscriptionStatus === 'active' && (
          <Box
            sx={{
              p: 2,
              mb: 2.5,
              borderRadius: '14px',
              background: 'rgba(34, 197, 94, 0.08)',
              border: '1px solid rgba(34, 197, 94, 0.25)',
              display: 'flex',
              alignItems: 'center',
              gap: 1.75,
            }}
          >
            <CheckCircleOutlinedIcon sx={{ color: '#22c55e', fontSize: 26, flexShrink: 0 }} />
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#ffffff' }}>
                You are currently on the active {plan.planName} Plan
              </Typography>
              <Typography variant="body2" sx={{ color: cv.textMuted, fontSize: '0.8125rem', mt: 0.25 }}>
                Your subscription is active and set to renew on {plan.expiryDateFormatted}. You can switch tiers or manage billing details anytime.
              </Typography>
            </Box>
          </Box>
        )}

        <SettingsSectionCard
          title="Current Plan"
          description="Active tier, billing cycle term, and subscription line items."
          action={
            <Button
              variant="contained"
              onClick={() => setChoosePlanOpen(true)}
              sx={{
                background: cv.brandGradient,
                color: cv.textOnCta,
                textTransform: 'none',
                borderRadius: '10px',
                fontWeight: 600,
                px: 2.5,
                py: 0.75,
                boxShadow: cv.brandShadowSoft,
                '&:hover': {
                  background: cv.brandGradientHover,
                  boxShadow: cv.brandShadowStrong,
                },
              }}
            >
              Upgrade Plan
            </Button>
          }
        >
          <SettingsRow title="Plan name" description={plan.planName} />
          <SettingsRow title="Billing cycle" description={plan.billingTermLabel} />
          <SettingsRow title="Subscription expiry date" description={plan.expiryDateFormatted} />
          <SettingsRow title="Subtotal" description={plan.subtotal} />
          <SettingsRow
            title="Sales tax"
            description={`${plan.salesTaxPercent}% · ${plan.salesTaxAmount} (US state-level, based on billing address)`}
          />
          <SettingsRow title="Total" description={plan.total} showDivider={false} />
        </SettingsSectionCard>

        <SettingsSectionCard title="Line item details" description="Fetched dynamically from subscription terms.">
          <Box sx={{ px: 2, py: 1.5 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: cv.textMuted, borderColor: cv.border }}>Description</TableCell>
                  <TableCell sx={{ color: cv.textMuted, borderColor: cv.border }}>Quantity</TableCell>
                  <TableCell sx={{ color: cv.textMuted, borderColor: cv.border }}>Unit price</TableCell>
                  <TableCell align="right" sx={{ color: cv.textMuted, borderColor: cv.border }}>
                    Subtotal
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {plan.lineItems.map((item) => (
                  <TableRow key={item.description}>
                    <TableCell sx={{ color: cv.textPrimary, borderColor: cv.border }}>
                      {item.description}
                    </TableCell>
                    <TableCell sx={{ color: cv.textSecondary, borderColor: cv.border }}>
                      {item.quantity}
                    </TableCell>
                    <TableCell sx={{ color: cv.textSecondary, borderColor: cv.border }}>
                      {item.unitPrice}
                    </TableCell>
                    <TableCell align="right" sx={{ color: cv.textPrimary, borderColor: cv.border }}>
                      {item.subtotal}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        </SettingsSectionCard>
      </SettingsFormContainer>

      {/* Upgrade Plan Modal */}
      <Dialog
        fullScreen
        open={choosePlanOpen}
        onClose={() => setChoosePlanOpen(false)}
        sx={{
          '& .MuiDialog-paper': {
            background: cv.bg,
            color: cv.textPrimary,
          },
        }}
      >
        <Box sx={{ position: 'absolute', top: 20, right: 24, zIndex: 1200 }}>
          <IconButton
            onClick={() => setChoosePlanOpen(false)}
            sx={{
              color: cv.textSecondary,
              backgroundColor: cv.surfaceHover,
              border: `1px solid ${cv.border}`,
              '&:hover': { backgroundColor: cv.surfaceActive, color: cv.textPrimary },
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
        <ChoosePlanScreen onSelectPlan={handleUpgradePlan} currentPlanId={plan.planId} />
      </Dialog>

      {/* Payment Success Confirmation & Invoice Download Modal */}
      <PaymentSuccessModal
        open={Boolean(successModalDetails)}
        onClose={() => setSuccessModalDetails(null)}
        details={successModalDetails}
        onManageBilling={async () => {
          try {
            toast.loading('Opening Stripe Portal...', { id: 'portal-launch' });
            const res = await billingService.createPortalSession();
            toast.dismiss('portal-launch');
            if (res?.url) {
              window.open(res.url, '_blank', 'noopener,noreferrer');
            }
          } catch (err: any) {
            toast.error(err?.message || 'Failed to open billing portal', { id: 'portal-launch' });
          }
        }}
      />
    </>
  );
}

export function BrandingSettingsSection() {
  const [branding, setBranding] = useState<BrandingSettingsData>(MOCK_BRANDING_SETTINGS);
  const [initialBranding, setInitialBranding] = useState<BrandingSettingsData>(MOCK_BRANDING_SETTINGS);
  const [isDirty, setIsDirty] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingHeader, setIsUploadingHeader] = useState(false);
  const [previewLayout, setPreviewLayout] = useState<'grid' | 'list'>('grid');

  const logoInputRef = useRef<HTMLInputElement>(null);
  const headerInputRef = useRef<HTMLInputElement>(null);

  const loadBranding = async () => {
    setLoading(true);
    try {
      const res = await getBrandingSettingsApi();
      if (res?.success && res.branding) {
        const fetched: BrandingSettingsData = {
          accountName: res.branding.accountName || "User's Account",
          accountInitials: res.branding.accountInitials || 'UA',
          logoUrl: res.branding.logoUrl || undefined,
          logoKey: res.branding.logoKey || undefined,
          headerImageUrl: res.branding.headerImageUrl || undefined,
          headerImageKey: res.branding.headerImageKey || undefined,
          headerImageMaxMb: res.branding.headerImageMaxMb || 25,
          accentColor: res.branding.accentColor || '#5B53FF',
          reelBackgroundColor: res.branding.reelBackgroundColor || 'None',
          reelTitleColor: res.branding.reelTitleColor || 'None',
        };
        setBranding(fetched);
        setInitialBranding(fetched);
        setIsDirty(false);
      }
    } catch (err: any) {
      console.error('Failed to load branding settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBranding();
  }, []);

  const updateBranding = <K extends keyof BrandingSettingsData>(key: K, value: BrandingSettingsData[K]) => {
    setBranding((current) => ({ ...current, [key]: value }));
    setIsDirty(true);
  };

  const handleReset = () => {
    setBranding(DEFAULT_BRANDING_SETTINGS);
    setIsDirty(true);
  };

  const handleCancel = () => {
    setBranding(initialBranding);
    setIsDirty(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await updateBrandingSettingsApi({
        accountName: branding.accountName,
        accentColor: branding.accentColor,
        reelBackgroundColor: branding.reelBackgroundColor,
        reelTitleColor: branding.reelTitleColor,
      });
      if (res?.success) {
        toast.success('Branding settings saved to database.');
        setInitialBranding(branding);
        setIsDirty(false);
      }
    } catch (err: any) {
      console.error('Failed to save branding:', err);
      toast.error(err?.message || 'Failed to save branding settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingLogo(true);
    try {
      const res = await uploadCompanyLogoRequest(file);
      if (res?.success && res.logoUrl) {
        updateBranding('logoUrl', res.logoUrl);
        updateBranding('logoKey', res.b2Key);
        toast.success('Logo uploaded to B2 Storage successfully!');
      }
    } catch (err: any) {
      console.error('Logo upload error:', err);
      toast.error(err?.message || 'Failed to upload logo.');
    } finally {
      setIsUploadingLogo(false);
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  };

  const handleHeaderFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 25 * 1024 * 1024) {
      toast.error('Header image exceeds maximum 25 MB size limit.');
      return;
    }
    setIsUploadingHeader(true);
    try {
      const res = await uploadBrandingHeaderRequest(file);
      if (res?.success && res.headerImageUrl) {
        updateBranding('headerImageUrl', res.headerImageUrl);
        updateBranding('headerImageKey', res.b2Key);
        toast.success('Header image banner uploaded to B2 Storage!');
      }
    } catch (err: any) {
      console.error('Header image upload error:', err);
      toast.error(err?.message || 'Failed to upload header image.');
    } finally {
      setIsUploadingHeader(false);
      if (headerInputRef.current) headerInputRef.current.value = '';
    }
  };

  const previewBackground =
    branding.reelBackgroundColor === 'None' ? cv.bg : branding.reelBackgroundColor;
  const previewTitleColor = branding.reelTitleColor === 'None' ? cv.textPrimary : branding.reelTitleColor;

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress size={32} />
      </Box>
    );
  }

  return (
    <SettingsFormContainer>
      {/* Hidden file inputs for Logo and Header Banner */}
      <input
        type="file"
        ref={logoInputRef}
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleLogoFileChange}
      />
      <input
        type="file"
        ref={headerInputRef}
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleHeaderFileChange}
      />

      <SettingsSectionCard
        title="Account name branding"
        description="Read-only badge from primary account properties · Admin & Super Admin can edit account name."
      >
        <Box sx={{ px: 2, py: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
          {branding.logoUrl ? (
            <Avatar
              src={branding.logoUrl}
              sx={{ width: 56, height: 56, border: `1px solid ${cv.border}` }}
            />
          ) : (
            <Avatar
              sx={{
                width: 56,
                height: 56,
                fontSize: '1rem',
                fontWeight: 700,
                bgcolor: branding.accentColor,
                color: cv.textInverse,
              }}
            >
              {branding.accountInitials}
            </Avatar>
          )}
          <TextField
            label="Account name label"
            value={branding.accountName}
            onChange={(event) => updateBranding('accountName', event.target.value)}
            fullWidth
            size="small"
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Box>
      </SettingsSectionCard>

      <SettingsSectionCard
        title="Custom shares & presentation skinning"
        description="Theme parameters applied to newly generated external media share pointers."
      >
        <SettingsRow
          title="Logo upload"
          description={branding.logoUrl ? 'Custom logo uploaded' : 'Custom brand asset for share presentation.'}
          action={
            <Button
              variant="outlined"
              size="small"
              disabled={isUploadingLogo}
              onClick={() => logoInputRef.current?.click()}
              startIcon={isUploadingLogo ? <CircularProgress size={14} /> : <AddIcon />}
              sx={outlineButtonSx}
            >
              {isUploadingLogo ? 'Uploading...' : 'Upload'}
            </Button>
          }
        />
        <SettingsRow
          title="Header image upload"
          description={
            branding.headerImageUrl
              ? 'Header image banner uploaded'
              : `Banner thumbnail slot · maximum ${branding.headerImageMaxMb} MB`
          }
          action={
            <Button
              variant="outlined"
              size="small"
              disabled={isUploadingHeader}
              onClick={() => headerInputRef.current?.click()}
              startIcon={isUploadingHeader ? <CircularProgress size={14} /> : <UploadOutlinedIcon />}
              sx={outlineButtonSx}
            >
              {isUploadingHeader ? 'Uploading...' : 'Upload'}
            </Button>
          }
        />
        <Box sx={{ px: 2, py: 1.75, borderBottom: `1px solid ${cv.dividerSubtle}` }}>
          <TextField
            label="Accent color"
            value={branding.accentColor}
            onChange={(event) => updateBranding('accentColor', event.target.value)}
            fullWidth
            size="small"
            slotProps={{ inputLabel: { shrink: true } }}
            helperText="CSS hex format (e.g., #5B53FF)"
          />
        </Box>
        <Box sx={{ px: 2, py: 1.75, borderBottom: `1px solid ${cv.dividerSubtle}` }}>
          <TextField
            label="Reel background color"
            value={branding.reelBackgroundColor}
            onChange={(event) => updateBranding('reelBackgroundColor', event.target.value)}
            fullWidth
            size="small"
            slotProps={{ inputLabel: { shrink: true } }}
            helperText='Defaults to "None"'
          />
        </Box>
        <Box sx={{ px: 2, py: 1.75 }}>
          <TextField
            label="Reel title color"
            value={branding.reelTitleColor}
            onChange={(event) => updateBranding('reelTitleColor', event.target.value)}
            fullWidth
            size="small"
            slotProps={{ inputLabel: { shrink: true } }}
            helperText='Defaults to "None"'
          />
        </Box>
      </SettingsSectionCard>

      <SettingsSectionCard title="Preview window" description="Read-only sandbox reflecting configuration changes.">
        <Box sx={{ px: 2, py: 2 }}>
          <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
            <Button
              size="small"
              variant={previewLayout === 'grid' ? 'contained' : 'outlined'}
              onClick={() => setPreviewLayout('grid')}
              sx={previewLayout === 'grid' ? containedButtonSx : outlineButtonSx}
            >
              Grid layout
            </Button>
            <Button
              size="small"
              variant={previewLayout === 'list' ? 'contained' : 'outlined'}
              onClick={() => setPreviewLayout('list')}
              sx={previewLayout === 'list' ? containedButtonSx : outlineButtonSx}
            >
              List layout
            </Button>
          </Box>
          <Box
            sx={{
              borderRadius: '12px',
              border: `1px solid ${cv.border}`,
              backgroundColor: previewBackground,
              backgroundImage: branding.headerImageUrl ? `url(${branding.headerImageUrl})` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              p: 2,
              minHeight: 140,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
              {branding.logoUrl ? (
                <Box
                  component="img"
                  src={branding.logoUrl}
                  sx={{ width: 36, height: 36, borderRadius: '6px', objectFit: 'contain' }}
                />
              ) : null}
              <Typography sx={{ fontWeight: 600, color: previewTitleColor }}>
                {branding.accountName}
              </Typography>
            </Box>
            <Box
              sx={{
                display: previewLayout === 'grid' ? 'grid' : 'flex',
                gridTemplateColumns: previewLayout === 'grid' ? 'repeat(3, 1fr)' : undefined,
                flexDirection: previewLayout === 'list' ? 'column' : undefined,
                gap: 1,
              }}
            >
              {[1, 2, 3].map((item) => (
                <Box
                  key={item}
                  sx={{
                    height: previewLayout === 'grid' ? 48 : 32,
                    borderRadius: '8px',
                    backgroundColor: cv.insetHighlight,
                    border: `1px solid ${branding.accentColor}88`,
                  }}
                />
              ))}
            </Box>
          </Box>
        </Box>
      </SettingsSectionCard>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, flexWrap: 'wrap' }}>
        <Button
          onClick={handleReset}
          disabled={!isDirty || isSaving}
          sx={{ textTransform: 'none', color: cv.textSecondary }}
        >
          Reset to default
        </Button>
        <Button
          onClick={handleCancel}
          disabled={isSaving}
          sx={{ textTransform: 'none', color: cv.textSecondary }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={!isDirty || isSaving}
          sx={containedButtonSx}
        >
          {isSaving ? 'Saving...' : 'Save'}
        </Button>
      </Box>
    </SettingsFormContainer>
  );
}

interface ProjectRowActionsCellProps {
  row: SettingsProjectRow;
  showProjectColumn?: boolean;
  onEdit?: (id: string) => void;
  onDelete?: (ids: string[]) => void;
  onMarkActive?: (ids: string[]) => void;
  onMarkInactive?: (ids: string[]) => void;
}

function ProjectRowActionsCell({
  row,
  showProjectColumn = true,
  onEdit,
  onDelete,
  onMarkActive,
  onMarkInactive,
}: ProjectRowActionsCellProps) {
  const handleEditClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    onEdit?.(row.id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.([row.id]);
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
      <Tooltip title="Edit details">
        <IconButton
          size="small"
          onClick={handleEditClick}
          sx={{
            color: cv.textSecondary,
            p: 0.75,
            borderRadius: '8px',
            transition: 'all 0.15s ease',
            '&:hover': {
              color: cv.brandOrchid,
              backgroundColor: cv.purpleSurface || 'rgba(168, 85, 247, 0.12)',
            },
          }}
        >
          <EditOutlinedIcon sx={{ fontSize: '1.125rem' }} />
        </IconButton>
      </Tooltip>

      {!row.isDefault && onDelete && (
        <Tooltip title={`Delete ${showProjectColumn ? 'project' : 'workspace'}`}>
          <IconButton
            size="small"
            onClick={handleDelete}
            sx={{
              color: cv.textMuted || cv.textSecondary,
              p: 0.75,
              borderRadius: '8px',
              transition: 'all 0.15s ease',
              '&:hover': {
                color: cv.destructive || '#ef4444',
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
              },
            }}
          >
            <DeleteOutlineOutlinedIcon sx={{ fontSize: '1.125rem' }} />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );
}

function ProjectWorkspaceTable({
  title,
  description,
  rows,
  addLabel,
  showBulkActions = false,
  showProjectColumn = true,
  showTeamMembersColumn = false,
  onAdd,
  onEdit,
  onDelete,
  onMarkActive,
  onMarkInactive,
  onInviteTeamMembers,
  onExport,
}: {
  title: string;
  description: string;
  rows: SettingsProjectRow[];
  addLabel: string;
  showBulkActions?: boolean;
  showProjectColumn?: boolean;
  showTeamMembersColumn?: boolean;
  onAdd?: () => void;
  onEdit?: (rowId: string) => void;
  onDelete?: (ids: string[]) => void;
  onMarkActive?: (ids: string[]) => void;
  onMarkInactive?: (ids: string[]) => void;
  onInviteTeamMembers?: (workspaceId: string) => void;
  onExport?: (filteredRows: SettingsProjectRow[]) => void;
}) {
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filterOpen, setFilterOpen] = useState(false);
  const [appliedStatusFilter, setAppliedStatusFilter] = useState<Set<string>>(createDefaultFilterSelection);
  const [appliedWorkspaceFilter, setAppliedWorkspaceFilter] = useState<Set<string>>(createDefaultFilterSelection);

  const workspaceOptions = useMemo(
    () => uniqueSorted(rows.map((row) => row.workspace)),
    [rows],
  );

  const hasActiveFilters = hasActiveFilterSelections(appliedStatusFilter, appliedWorkspaceFilter);

  const handleApplyFilters = () => {
    setFilterOpen(false);
  };

  const handleClearAllFilters = () => {
    const defaultSel = createDefaultFilterSelection();
    setAppliedStatusFilter(defaultSel);
    setAppliedWorkspaceFilter(defaultSel);
  };

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesSearch =
        !query ||
        (showProjectColumn && row.project.toLowerCase().includes(query)) ||
        row.workspace.toLowerCase().includes(query) ||
        row.projectAdmin.toLowerCase().includes(query);
      const matchesStatus = matchesSetFilter(row.status, appliedStatusFilter);
      const matchesWorkspace = matchesSetFilter(row.workspace, appliedWorkspaceFilter);
      return matchesSearch && matchesStatus && matchesWorkspace;
    });
  }, [rows, search, showProjectColumn, appliedStatusFilter, appliedWorkspaceFilter]);

  const columns: SettingsTableColumn<SettingsProjectRow>[] = [
    ...(showProjectColumn
      ? [
        {
          id: 'project',
          label: 'Project',
          width: showTeamMembersColumn ? '14%' : '18%',
          render: (row: SettingsProjectRow) => (
            <ProjectNameCell name={row.project} />
          ),
        },
      ]
      : []),
    {
      id: 'workspace',
      label: 'Workspace',
      width: showProjectColumn
        ? showTeamMembersColumn
          ? '10%'
          : '16%'
        : showTeamMembersColumn
          ? '16%'
          : '22%',
      render: (row) => tableText(row.workspace),
    },
    {
      id: 'status',
      label: 'Status',
      width: showTeamMembersColumn ? (showProjectColumn ? '9%' : '9%') : '10%',
      render: (row) => <StatusChip status={row.status} />,
    },
    {
      id: 'updated',
      label: 'Last updated',
      width: showTeamMembersColumn ? (showProjectColumn ? '12%' : '12%') : '14%',
      render: (row) => row.lastUpdated,
    },
    {
      id: 'created',
      label: 'Creation date',
      width: showTeamMembersColumn ? (showProjectColumn ? '14%' : '14%') : '16%',
      render: (row) => row.creationDate,
    },
    {
      id: 'admin',
      label: showProjectColumn ? 'Project admin' : 'Workspace admin',
      width: showProjectColumn
        ? showTeamMembersColumn
          ? '15%'
          : '20%'
        : showTeamMembersColumn
          ? '16%'
          : '24%',
      render: (row) => tableText(row.projectAdmin),
    },
    ...(showTeamMembersColumn
      ? [
          {
            id: 'team',
            label: 'Team members',
            width: showProjectColumn ? '20%' : '24%',
            render: (row: SettingsProjectRow) => (
              <WorkspaceTeamMembersCell
                members={row.teamMembers ?? []}
                canInvite={true}
                visibility={showProjectColumn ? row.visibility : undefined}
                shareLink={
                  showProjectColumn && row.visibility === 'public'
                    ? getProjectShareLink(row.id, row.project)
                    : undefined
                }
                onInvite={() => onInviteTeamMembers?.(row.id)}
              />
            ),
          },
        ]
      : []),
    {
      id: 'actions',
      label: 'Actions',
      width: showProjectColumn ? '10%' : '12%',
      align: 'right' as const,
      render: (row: SettingsProjectRow) => (
        <ProjectRowActionsCell
          row={row}
          showProjectColumn={showProjectColumn}
          onEdit={onEdit}
          onDelete={onDelete}
          onMarkActive={onMarkActive}
          onMarkInactive={onMarkInactive}
        />
      ),
    },
  ];

  return (
    <SettingsTableContainer>
      <SettingsSectionCard title={title} description={description}>
        <SettingsAdminToolbar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search…"
          onFilter={() => setFilterOpen((open) => !open)}
          filterOpen={filterOpen}
          hasActiveFilters={hasActiveFilters}
          onExport={onExport ? () => onExport(filtered) : undefined}
          onAdd={onAdd}
          addLabel={addLabel}
        />
        {showBulkActions && selectedIds.size > 0 ? (
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
                if (rowId) onEdit?.(rowId);
              }}
              sx={{ textTransform: 'none', color: cv.textPrimary, fontWeight: 500 }}
            >
              Edit
            </Button>
          <Button
            size="small"
            onClick={() => {
              if (onMarkActive) onMarkActive(Array.from(selectedIds));
              setSelectedIds(new Set());
            }}
            sx={{ textTransform: 'none', color: cv.textSecondary }}
          >
            Mark active
          </Button>
          <Button
            size="small"
            onClick={() => {
              if (onMarkInactive) onMarkInactive(Array.from(selectedIds));
              setSelectedIds(new Set());
            }}
            sx={{ textTransform: 'none', color: cv.textSecondary }}
          >
            Mark inactive
          </Button>
          <Button 
            size="small" 
            sx={{ textTransform: 'none', color: cv.destructive }}
            onClick={() => {
              if (onDelete) onDelete(Array.from(selectedIds));
            }}
          >
            Mark delete
          </Button>
        </Box>
        ) : null}
        <Collapse in={filterOpen}>
          <Box sx={{ px: 2, pb: 1.5 }}>
            <SettingsTableFilterPanel
              groups={[
                {
                  id: 'status',
                  label: 'Status',
                  options: ['Active', 'Inactive'],
                  selected: appliedStatusFilter,
                  onToggle: (value) => setAppliedStatusFilter((current) => toggleSingleFilterValue(current, value)),
                },
                ...(showProjectColumn
                  ? [
                    {
                      id: 'workspace',
                      label: 'Workspace',
                      options: workspaceOptions,
                      selected: appliedWorkspaceFilter,
                      onToggle: (value: string) =>
                        setAppliedWorkspaceFilter((current) => toggleFilterValue(current, value)),
                    },
                  ]
                  : []),
              ]}
              onClearAll={handleClearAllFilters}
            />
          </Box>
        </Collapse>
        <SettingsDataTable
          columns={columns}
          rows={filtered}
          getRowId={(row) => row.id}
          selectable={showBulkActions}
          selectedRowIds={selectedIds}
          onSelectionChange={setSelectedIds}
        />
        {showBulkActions ? (
          <Typography sx={{ px: 2, py: 1.25, fontSize: '0.75rem', color: cv.textMuted }}>
            {selectedIds.size > 0
              ? `${selectedIds.size} row${selectedIds.size === 1 ? '' : 's'} selected.`
              : 'Use checkboxes to select one or more rows for bulk actions.'}
          </Typography>
        ) : null}
      </SettingsSectionCard>
    </SettingsTableContainer>
  );
}

interface DeleteProjectModalProps {
  open: boolean;
  projectId: string | null;
  projectName?: string;
  onClose: () => void;
  onConfirmDelete: (projectId: string, deleteFileIds: string[]) => Promise<void>;
}

function DeleteProjectModal({
  open,
  projectId,
  projectName = 'this project',
  onClose,
  onConfirmDelete,
}: DeleteProjectModalProps) {
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [linkedFiles, setLinkedFiles] = useState<{ id: string; title: string; type?: string }[]>([]);
  const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open || !projectId) {
      setLinkedFiles([]);
      setSelectedFileIds(new Set());
      return;
    }

    const fetchLinkedFiles = async () => {
      setLoadingFiles(true);
      try {
        const { apiClient } = await import('../../api/client');
        const token = localStorage.getItem('token');
        const res = await apiClient.get<any>(`/workspaces/project/sources/${projectId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const payload = res.data?.data || res.data || res;
        let mediaList = Array.isArray(payload?.media) ? payload.media : Array.isArray(payload) ? payload : [];

        if (mediaList.length === 0) {
          const fallbackRes = await apiClient.get<any>(`/workspaces/project/find-all-data/${projectId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const fallbackPayload = fallbackRes.data?.data || fallbackRes.data || fallbackRes;
          mediaList = Array.isArray(fallbackPayload?.media) ? fallbackPayload.media : Array.isArray(fallbackPayload) ? fallbackPayload : [];
        }

        const formatted = mediaList.map((m: any) => ({
          id: m.id,
          title: m.title || m.name || 'Untitled File',
          type: m.type || 'file',
        }));
        setLinkedFiles(formatted);
      } catch (err) {
        console.error('Failed to fetch linked files for project:', err);
      } finally {
        setLoadingFiles(false);
      }
    };

    fetchLinkedFiles();
  }, [open, projectId]);

  const allSelected = linkedFiles.length > 0 && selectedFileIds.size === linkedFiles.length;
  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedFileIds(new Set());
    } else {
      setSelectedFileIds(new Set(linkedFiles.map((f) => f.id)));
    }
  };

  const toggleFileSelect = (id: string) => {
    setSelectedFileIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!projectId) return;
    setSubmitting(true);
    try {
      await onConfirmDelete(projectId, Array.from(selectedFileIds));
      onClose();
    } catch (err) {
      console.error('Delete project failed:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: cv.surfaceElevated || '#1e1b2e',
          color: cv.textPrimary,
          backgroundImage: 'none',
          border: `1px solid ${cv.borderPrimary || cv.border}`,
          borderRadius: '16px',
        },
      }}
    >
      <DialogTitle sx={{ fontWeight: 600, fontSize: '1.125rem' }}>
        Delete Project: "{projectName}"
      </DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <Typography variant="body2" sx={{ color: cv.textSecondary, mb: 2 }}>
          Select any linked files you also want to mark for deletion. Unchecked files will remain active in your workspace with project tags unlinked.
        </Typography>

        {loadingFiles ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress size={28} />
          </Box>
        ) : linkedFiles.length === 0 ? (
          <Box sx={{ p: 2, bgcolor: cv.insetHighlight || 'rgba(255,255,255,0.03)', borderRadius: '10px' }}>
            <Typography variant="caption" sx={{ color: cv.textMuted }}>
              No linked files found in this project.
            </Typography>
          </Box>
        ) : (
          <Box sx={{ border: `1px solid ${cv.border}`, borderRadius: '12px', overflow: 'hidden' }}>
            <Box
              onClick={toggleSelectAll}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                p: 1.25,
                bgcolor: cv.surfaceRaised || 'rgba(255,255,255,0.04)',
                borderBottom: `1px solid ${cv.border}`,
                cursor: 'pointer',
              }}
            >
              <Checkbox size="small" checked={allSelected} indeterminate={selectedFileIds.size > 0 && !allSelected} />
              <Typography variant="caption" sx={{ fontWeight: 600, color: cv.textPrimary }}>
                Select all linked files ({selectedFileIds.size} / {linkedFiles.length} selected)
              </Typography>
            </Box>

            <Box sx={{ maxHeight: 220, overflowY: 'auto', p: 0.5 }}>
              {linkedFiles.map((file) => {
                const isChecked = selectedFileIds.has(file.id);
                return (
                  <Box
                    key={file.id}
                    onClick={() => toggleFileSelect(file.id)}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      p: 1,
                      px: 1.5,
                      borderRadius: '8px',
                      cursor: 'pointer',
                      '&:hover': { bgcolor: cv.surfaceHover || 'rgba(255,255,255,0.05)' },
                    }}
                  >
                    <Checkbox size="small" checked={isChecked} />
                    <InsertDriveFileOutlinedIcon fontSize="small" sx={{ color: cv.textMuted }} />
                    <Typography variant="body2" sx={{ color: cv.textPrimary, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {file.title}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2, pt: 1, gap: 1 }}>
        <Button onClick={onClose} disabled={submitting} sx={{ color: cv.textSecondary, textTransform: 'none' }}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={submitting}
          variant="contained"
          sx={{
            bgcolor: cv.destructive || '#ef4444',
            '&:hover': { bgcolor: '#b91c1c' },
            textTransform: 'none',
            borderRadius: '10px',
          }}
        >
          {submitting ? 'Deleting…' : selectedFileIds.size > 0 ? `Delete Project & ${selectedFileIds.size} Files` : 'Delete Project Only'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export function ProjectsAdminSettingsSection() {
  const { workspaces } = useDashboard();
  const [projects, setProjects] = useState<SettingsProjectRow[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [editProjectId, setEditProjectId] = useState<string | null>(null);
  const [inviteProjectId, setInviteProjectId] = useState<string | null>(null);
  const [deleteDialogIds, setDeleteDialogIds] = useState<string[]>([]);
  const [orgUsersList, setOrgUsersList] = useState<import('../../data/mockSettingsData').SettingsUserRow[]>([]);
  const [orgGroupsList, setOrgGroupsList] = useState<import('../../data/mockSettingsData').SettingsUserGroup[]>([]);
  const { formatDate } = useLocalizedDate();

  useEffect(() => {
    fetchOrganizationUsers()
      .then((users) => {
        const rows = users.map((u) => {
          const displayName = u.name || u.email.split('@')[0] || 'User';
          const initials = displayName.split(/\s+/).filter(Boolean).slice(0, 2).map((p: string) => p[0]?.toUpperCase() ?? '').join('') || u.email[0]?.toUpperCase() || 'U';
          return {
            id: u.id,
            name: displayName,
            initials,
            email: u.email,
            lastActive: u.lastActiveAt || u.lastLoginAt || 'Never',
            joinedDate: u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—',
            role: (u.roleRelation?.name || u.role || 'Collaborator') as import('../../data/mockSettingsData').SettingsUserRow['role'],
            roleId: u.roleId,
            roleRelation: u.roleRelation,
            status: (u.status?.toLowerCase() === 'active' ? 'Active' : 'Pending') as 'Active' | 'Pending',
            isOrganizationMember: true,
          };
        });
        setOrgUsersList(rows);
      })
      .catch((err) => console.error('Failed to fetch org users for share dialog:', err));

    const fetchGroups = async () => {
      try {
        const { apiClient } = await import('../../api/client');
        const token = localStorage.getItem('token');
        const res = await apiClient.get<any>('/user-groups', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = res.data || res;
        if (Array.isArray(data)) {
          const mappedGroups = data.map((g: any) => ({
            id: g.id,
            name: g.name || 'Unnamed Group',
            description: g.description || '',
            memberIds: Array.isArray(g.members) ? g.members.map((m: any) => m.userId || m.id) : [],
          }));
          setOrgGroupsList(mappedGroups);
        }
      } catch (err) {
        console.error('Failed to fetch org groups:', err);
      }
    };
    fetchGroups();
  }, []);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const { apiClient } = await import('../../api/client');
        const token = localStorage.getItem('token');
        const response = await apiClient.get<any>('/workspaces/project/find-all', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = Array.isArray(response) ? response : response.data;
        if (data && Array.isArray(data)) {
          const formatted = data.map((p: any) => {
            const today = formatDate(p.createdAt || Date.now(), {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            });
            const vis: ProjectVisibility = p.visibility?.toLowerCase() === 'private' ? 'private' : 'public';

            const userMembers: import('../../data/mockSettingsData').WorkspaceTeamMember[] = (p.users || []).map((pu: any) => {
              const uName = pu.user?.name || pu.user?.email || 'User';
              const initials = uName.split(/\s+/).filter(Boolean).slice(0, 2).map((part: string) => part[0]?.toUpperCase() ?? '').join('') || 'U';
              return {
                id: pu.userId || pu.id,
                name: uName,
                initials,
                email: pu.user?.email,
                avatarUrl: pu.user?.avatarUrl || undefined,
                access: (pu.accessLevel as import('../../data/mockSettingsData').WorkspaceMemberAccess) || 'Can view',
                memberType: (pu.memberType as import('../../data/mockSettingsData').WorkspaceMemberType) || 'Member',
                isCurrentUser: pu.userId === CURRENT_USER.id || 
                               pu.user?.email === CURRENT_USER.email || 
                               pu.user?.name === CURRENT_USER.name ||
                               pu.user?.name === 'Super Admin' ||
                               pu.user?.email === 'anil.jangra@mtxeurope.com',
              };
            });

            const groupMembers: import('../../data/mockSettingsData').WorkspaceTeamMember[] = (p.groups || []).map((pg: any) => {
              const gName = pg.group?.name || 'Group';
              const initials = gName.split(/\s+/).filter(Boolean).slice(0, 2).map((part: string) => part[0]?.toUpperCase() ?? '').join('') || 'G';
              return {
                id: pg.groupId || pg.id,
                name: gName,
                initials,
                access: (pg.accessLevel as import('../../data/mockSettingsData').WorkspaceMemberAccess) || 'Can view',
                memberType: 'Group' as const,
                isCurrentUser: false,
              };
            });

            const teamMembers = [...userMembers, ...groupMembers];
            if (teamMembers.length === 0) {
              teamMembers.push({
                id: `pm-admin-${p.id}`,
                name: CURRENT_USER.name,
                initials: CURRENT_USER.initials,
                access: 'Full Access',
                memberType: 'Member',
                isCurrentUser: true,
              });
            }

            return {
              id: p.id,
              project: p.name,
              workspace: p.workspace?.name || 'Unknown',
              status: p.status?.toLowerCase() === 'inactive' ? 'Inactive' : 'Active',
              lastUpdated: today,
              creationDate: today,
              storage: '0 MB',
              projectAdmin: p.createdBy?.name || p.createdBy?.email || CURRENT_USER.name,
              visibility: vis,
              isRestricted: vis === 'private',
              teamMembers,
            } as SettingsProjectRow;
          });
          setProjects(formatted);
        }
      } catch (err: any) {
        console.error("Failed to create project", err);
        const errorMsg = err?.response?.data?.message || err?.message || 'Failed to create project';
        toast.error(errorMsg);
      }
    };
    fetchProjects();
  }, []);

  const inviteProject = projects.find((project) => project.id === inviteProjectId);
  const editProject = projects.find((project) => project.id === editProjectId);

  const workspaceOptions = useMemo(() => workspaces.map((workspace) => workspace.name), [workspaces]);

  const handleAddProject = async (
    name: string,
    workspace: string,
    inviteEmails: string[],
    inviteGroupIds: string[],
    visibility: ProjectVisibility,
    folderId: string | null,
    inviteAccess?: import('../../data/mockSettingsData').WorkspaceMemberAccess,
    inviteMemberType?: import('../../data/mockSettingsData').WorkspaceMemberType,
    sendInviteEmail?: boolean
  ) => {
    try {
      const workspaceObj = workspaces.find((w) => w.name === workspace);
      if (!workspaceObj) {
        console.error("Workspace not found:", workspace);
        return;
      }

      const { apiClient } = await import('../../api/client');
      const token = localStorage.getItem('token');
      await apiClient.post(`/workspaces/project/add/${workspaceObj.id}`, {
        name,
        folderId,
        visibility,
        inviteEmails,
        inviteGroupIds,
        inviteAccess,
        inviteMemberType,
        sendInviteEmail,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setProjects((current) => [
        ...current,
        createProject(
          name,
          workspace,
          CURRENT_USER.name,
          inviteEmails,
          visibility,
          {
            id: `pm-admin-${Date.now()}`,
            name: CURRENT_USER.name,
            initials: CURRENT_USER.initials,
            email: CURRENT_USER.email,
            avatarUrl: CURRENT_USER.avatarUrl,
            access: 'Full Access',
            memberType: 'Member',
            isCurrentUser: true,
          },
          inviteGroupIds,
        ),
      ]);
    } catch (err: any) {
      console.error("Failed to add project to backend:", err);
      const errorMsg = err.response?.data?.message || err.message || "Failed to create project";
      toast.error(errorMsg);
      throw err;
    }
  };

  const handleSaveProject = async (name: string, workspace: string, visibility: ProjectVisibility) => {
    if (!editProjectId) return;
    const today = formatDate(Date.now(), {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    try {
      const workspaceObj = workspaces.find((w) => w.name === workspace);
      const { apiClient } = await import('../../api/client');
      const token = localStorage.getItem('token');
      const payload: any = { name };
      if (workspaceObj?.id) {
        payload.workspaceId = workspaceObj.id;
      }
      await apiClient.put(`/workspaces/project/update/${editProjectId}`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setProjects((current) =>
        current.map((project) =>
          project.id === editProjectId
            ? {
              ...project,
              project: name,
              workspace,
              visibility,
              isRestricted: visibility === 'private',
              lastUpdated: today,
            }
            : project,
        ),
      );
    } catch (err: any) {
      console.error("Failed to update project in backend:", err);
      const { toast } = await import('react-hot-toast');
      toast.error(err.response?.data?.message || "Failed to update project.");
    }
    setEditProjectId(null);
  };

  const handleDeleteProjectsConfirm = async (
    targetProjectId: string,
    isWholeProject: boolean,
    selectedFileIds: string[],
    selectedFolderIds: string[]
  ) => {
    try {
      const { apiClient } = await import('../../api/client');
      const token = localStorage.getItem('token');

      const res = await apiClient.post<any>(
        `/workspaces/project/delete/${targetProjectId}`,
        {
          isWholeProject,
          deleteFileIds: selectedFileIds,
          deleteFolderIds: selectedFolderIds,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Instantly remove project from Projects list view when deletion request is submitted
      setProjects((current) => current.filter((p) => p.id !== targetProjectId));

      const msg = res?.message || 'Project deletion request submitted for Super Admin review.';
      toast.success(msg);
    } catch (err: any) {
      console.error('Failed to delete project in backend:', err);
      toast.error(err?.message || err?.response?.data?.message || 'Failed to delete project.');
    }
    setDeleteDialogIds([]);
  };

  const handleInviteMember = async (payload: WorkspaceInvitePayload) => {
    if (!inviteProjectId) return false;

    try {
      const { apiClient } = await import('../../api/client');
      const token = localStorage.getItem('token');
      const res = await apiClient.post(
        `/workspaces/project/${inviteProjectId}/member`,
        {
          email: payload.email,
          memberType: payload.memberType,
          accessLevel: payload.access,
          groupId: payload.groupId,
          sendInviteEmail: payload.sendInviteEmail ?? false,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const data = res.data ?? res;

      const finalPayload = {
        ...payload,
        name: data.user?.name || payload.name,
        memberType: data.memberType || payload.memberType,
        userId: data.user?.id || payload.userId,
      };

      const target = projects.find((project) => project.id === inviteProjectId);
      const newMember = resolveWorkspaceInvite(finalPayload, target?.teamMembers ?? [], orgGroupsList);
      if (newMember) {
        setProjects((current) =>
          current.map((project) =>
            project.id === inviteProjectId
              ? { ...project, teamMembers: [...(project.teamMembers ?? []), newMember] }
              : project,
          ),
        );
      }
      toast.success(`${finalPayload.memberType || 'Member'} added to project successfully.`);
      return true;
    } catch (err: any) {
      console.error('Failed to add project member:', err);
      const status = err.status || err.response?.status;
      const data = err.details || err.response?.data;
      
      if (status === 404 && data?.notFound) {
         return 'NOT_FOUND';
      }
      if (status === 400 && data?.orgMemberInPublic) {
         return 'ORG_MEMBER_IN_PUBLIC';
      }
      toast.error(data?.message || err.message || 'Failed to add member to project.');
      return false;
    }
  };

  const handleUpdateMemberAccess = async (memberId: string, access: WorkspaceMemberAccess) => {
    if (!inviteProjectId) return;
    try {
      const { apiClient } = await import('../../api/client');
      const token = localStorage.getItem('token');
      await apiClient.put(
        `/workspaces/project/${inviteProjectId}/member/${memberId}`,
        { accessLevel: access },
        { headers: { Authorization: `Bearer ${token}` } },
      );
    } catch (err) {
      console.error('Failed to update project member access level in backend:', err);
    }

    setProjects((current) =>
      current.map((project) =>
        project.id === inviteProjectId
          ? {
            ...project,
            teamMembers: project.teamMembers?.map((member) =>
              member.id === memberId ? { ...member, access } : member,
            ),
          }
          : project,
      ),
    );
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!inviteProjectId) return;
    try {
      const { apiClient } = await import('../../api/client');
      const token = localStorage.getItem('token');
      await apiClient.delete(`/workspaces/project/${inviteProjectId}/member/${memberId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setProjects((current) =>
        current.map((project) =>
          project.id === inviteProjectId
            ? {
                ...project,
                teamMembers: project.teamMembers?.filter((member) => member.id !== memberId),
              }
            : project,
        ),
      );
    } catch (err) {
      console.error("Failed to remove project member in backend:", err);
    }
  };

  const handleRestrictedChange = (restricted: boolean) => {
    if (!inviteProjectId) return;
    setProjects((current) =>
      current.map((project) =>
        project.id === inviteProjectId ? { ...project, isRestricted: restricted } : project,
      ),
    );
  };

  const handleVisibilityChange = async (visibility: ProjectVisibility) => {
    if (!inviteProjectId) return;
    try {
      const targetProj = projects.find((p) => p.id === inviteProjectId);
      const { apiClient } = await import('../../api/client');
      const token = localStorage.getItem('token');
      await apiClient.put(`/workspaces/project/update/${inviteProjectId}`, {
        name: targetProj?.project,
        visibility
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setProjects((current) =>
        current.map((project) =>
          project.id === inviteProjectId
            ? { ...project, visibility, isRestricted: visibility === 'private' }
            : project,
        ),
      );
    } catch (err) {
      console.error("Failed to update project visibility:", err);
    }
  };

  const handleMarkActiveProjects = async (ids: string[]) => {
    try {
      const { apiClient } = await import('../../api/client');
      const token = localStorage.getItem('token');
      for (const id of ids) {
        await apiClient.put(`/workspaces/project/update/${id}`, { status: 'active' }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      setProjects((current) =>
        current.map((p) => (ids.includes(p.id) ? { ...p, status: 'Active' } : p)),
      );
      toast.success(`Marked ${ids.length} project${ids.length > 1 ? 's' : ''} as Active`);
    } catch (err: any) {
      console.error("Failed to mark projects active:", err);
      toast.error("Failed to update project status in backend.");
    }
  };

  const handleMarkInactiveProjects = async (ids: string[]) => {
    try {
      const { apiClient } = await import('../../api/client');
      const token = localStorage.getItem('token');
      for (const id of ids) {
        await apiClient.put(`/workspaces/project/update/${id}`, { status: 'inactive' }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      setProjects((current) =>
        current.map((p) => (ids.includes(p.id) ? { ...p, status: 'Inactive' } : p)),
      );
      toast.success(`Marked ${ids.length} project${ids.length > 1 ? 's' : ''} as Inactive`);
    } catch (err: any) {
      console.error("Failed to mark projects inactive:", err);
      toast.error("Failed to update project status in backend.");
    }
  };

  const handleExportProjects = (rowsToExport: SettingsProjectRow[]) => {
    downloadCSV(
      'Projects',
      ['Project', 'Workspace', 'Status', 'Last updated', 'Creation date', 'Project admin', 'Team members'],
      rowsToExport.map((row) => [
        row.project,
        row.workspace,
        row.status,
        row.lastUpdated,
        row.creationDate,
        row.projectAdmin,
        (row.teamMembers || []).map((m) => m.name).join('; '),
      ])
    );
  };

  return (
    <>
      <ProjectWorkspaceTable
        title="Projects"
        description="Manage projects across workspaces."
        rows={projects}
        addLabel="Add new project"
        showBulkActions={false}
        showTeamMembersColumn
        onAdd={async () => {
          try {
            const summary = await getUsageSummary();
            if (summary.projectsTotal != null && summary.projectsCount >= summary.projectsTotal) {
              toast.error(`Project limit (${summary.projectsTotal}) reached for your current plan. Please upgrade to create more projects.`);
              return;
            }
          } catch (e) {}
          setAddOpen(true);
        }}
        onEdit={setEditProjectId}
        onDelete={(ids) => setDeleteDialogIds(ids)}
        onMarkActive={handleMarkActiveProjects}
        onMarkInactive={handleMarkInactiveProjects}
        onInviteTeamMembers={setInviteProjectId}
        onExport={handleExportProjects}
      />
      <AddProjectDialog
        open={addOpen || Boolean(editProjectId)}
        onClose={() => {
          setAddOpen(false);
          setEditProjectId(null);
        }}
        onAdd={handleAddProject}
        onSave={handleSaveProject}
        workspaces={workspaces}
        initialProject={
          editProject
            ? {
              name: editProject.project,
              workspace: editProject.workspace,
              visibility: editProject.visibility ?? 'public',
            }
            : undefined
        }
        suggestedUsers={orgUsersList}
        suggestedGroups={orgGroupsList}
      />
      <ProjectDeleteFlowModal
        open={deleteDialogIds.length > 0}
        projectId={deleteDialogIds[0] || null}
        projectName={projects.find((p) => p.id === deleteDialogIds[0])?.project}
        onClose={() => setDeleteDialogIds([])}
        onConfirmDelete={handleDeleteProjectsConfirm}
      />
      <WorkspaceMembersDialog
        open={Boolean(inviteProjectId)}
        workspaceName={inviteProject?.project ?? 'project'}
        resourceId={inviteProjectId ?? undefined}
        members={inviteProject?.teamMembers ?? []}
        suggestedUsers={orgUsersList}
        suggestedGroups={orgGroupsList}
        isRestricted={inviteProject?.isRestricted ?? false}
        resourceType="project"
        visibility={inviteProject?.visibility ?? 'private'}
        onClose={() => setInviteProjectId(null)}
        onInvite={handleInviteMember}
        onUpdateMemberAccess={handleUpdateMemberAccess}
        onRemoveMember={handleRemoveMember}
        onRestrictedChange={handleRestrictedChange}
        onVisibilityChange={handleVisibilityChange}
      />
    </>
  );
}

export function WorkspacesAdminSettingsSection() {
  const { user: actualUser } = useAuth();
  const { createWorkspace } = useDashboard();
  const [workspaces, setWorkspaces] = useState<SettingsProjectRow[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [editWorkspaceId, setEditWorkspaceId] = useState<string | null>(null);
  const [inviteWorkspaceId, setInviteWorkspaceId] = useState<string | null>(null);
  const [orgUsersList, setOrgUsersList] = useState<import('../../data/mockSettingsData').SettingsUserRow[]>([]);
  const { formatDate } = useLocalizedDate();

  const [orgGroupsList, setOrgGroupsList] = useState<import('../../data/mockSettingsData').SettingsUserGroup[]>([]);

  useEffect(() => {
    fetchOrganizationUsers()
      .then((users) => {
        const rows = users.map((u) => {
          const displayName = u.name || u.email.split('@')[0] || 'User';
          const initials = displayName.split(/\s+/).filter(Boolean).slice(0, 2).map((p: string) => p[0]?.toUpperCase() ?? '').join('') || u.email[0]?.toUpperCase() || 'U';
          return {
            id: u.id,
            name: displayName,
            initials,
            email: u.email,
            lastActive: u.lastActiveAt || u.lastLoginAt || 'Never',
            joinedDate: u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—',
            role: (u.roleRelation?.name || u.role || 'Collaborator') as import('../../data/mockSettingsData').SettingsUserRow['role'],
            roleId: u.roleId,
            roleRelation: u.roleRelation,
            status: (u.status?.toLowerCase() === 'active' ? 'Active' : 'Pending') as 'Active' | 'Pending',
            isOrganizationMember: true,
          };
        });
        setOrgUsersList(rows);
      })
      .catch((err) => console.error('Failed to fetch org users for share dialog:', err));

    const fetchGroups = async () => {
      try {
        const { apiClient } = await import('../../api/client');
        const token = localStorage.getItem('token');
        const res = await apiClient.get<any>('/user-groups', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = res.data || res;
        if (Array.isArray(data)) {
          const mappedGroups = data.map((g: any) => ({
            id: g.id,
            name: g.name || 'Unnamed Group',
            description: g.description || '',
            memberIds: Array.isArray(g.members) ? g.members.map((m: any) => m.userId || m.id) : [],
          }));
          setOrgGroupsList(mappedGroups);
        }
      } catch (err) {
        console.error('Failed to fetch org groups:', err);
      }
    };
    fetchGroups();
  }, []);

  useEffect(() => {
    const fetchWorkspaces = async () => {
      try {
        const { apiClient } = await import('../../api/client');
        const token = localStorage.getItem('token');
        const response = await apiClient.get<any>('/workspaces/find-all?includeInactive=true', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = Array.isArray(response) ? response : response.data;
        if (data && Array.isArray(data)) {
          const formatted = data.map((w: any, index: number) => {
            const today = formatDate(w.createdAt || Date.now(), {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            });
              const isDefaultWorkspace = Boolean(w.isDefault || w.is_default || index === data.length - 1);
              const actualUserEmail = actualUser?.email || CURRENT_USER.email;
              const actualUserName = actualUser?.name || actualUserEmail.split('@')[0] || CURRENT_USER.name;
              const actualUserInitials = actualUserName.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2) || CURRENT_USER.initials;

              const mappedUsers = (w.users || [])
                .map((u: any) => {
                  const displayName = u.user.name || u.user.email.split('@')[0];
                  const inits = displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2) || 'U';
                  let memType = 'Member';
                  if (u.memberType === 'OWNER') memType = 'Owner';
                  else if (u.memberType === 'GUEST') memType = 'Guest';

                  return {
                    id: `wm-u-${u.user.id}`,
                    name: displayName,
                    initials: inits,
                    email: u.user.email,
                    access: u.accessLevelId === '10f1fe4a-f28f-4d76-a7c2-6175dfe04c9b' ? 'Full Access' : (u.accessLevelId === 'd321a6c5-c28a-4dc4-900e-4dc57fe276bf' ? 'Can edit' : 'Can view'),
                    memberType: memType,
                    isCurrentUser: u.user.email === actualUserEmail,
                  };
                });
                
              const mappedGroups = (w.groups || []).map((g: any) => ({
                  id: `wm-g-${g.group.id}`,
                  name: g.group.name,
                  initials: g.group.name.substring(0, 2).toUpperCase() || 'G',
                  groupId: g.group.id,
                  access: g.accessLevelId === '10f1fe4a-f28f-4d76-a7c2-6175dfe04c9b' ? 'Full Access' : (g.accessLevelId === 'd321a6c5-c28a-4dc4-900e-4dc57fe276bf' ? 'Can edit' : 'Can view'),
                  memberType: 'Group',
              }));

              return {
                id: w.id,
                workspace: w.name,
                status: w.status === 'Inactive' || w.status === 'inactive' ? 'Inactive' : 'Active',
                lastUpdated: today,
                creationDate: today,
                storage: '0 MB',
                projectAdmin: actualUser?.name || CURRENT_USER.name,
                visibility: String(w.visibility || '').toUpperCase() === 'PUBLIC' ? 'public' : 'private',
                isRestricted: String(w.visibility || '').toUpperCase() === 'PRIVATE',
                isDefault: isDefaultWorkspace,
                description: w.description || '',
                color: w.color || '',
                teamMembers: [...mappedUsers, ...mappedGroups]
              } as SettingsProjectRow;
          });
          setWorkspaces(formatted);
        }
      } catch (err) {
        console.error("Failed to load workspaces", err);
      }
    };
    fetchWorkspaces();
  }, []);

  const inviteWorkspace = workspaces.find((workspace) => workspace.id === inviteWorkspaceId);

  const editWorkspace = workspaces.find((workspace) => workspace.id === editWorkspaceId);

  const handleCreateWorkspace = (data: CreateWorkspaceFormData) => {
    createWorkspace(data);
    setWorkspaces((current) => [
      ...current,
      createSettingsWorkspace(
        data.name,
        actualUser?.name || CURRENT_USER.name,
        {
          id: `wm-admin-${Date.now()}`,
          name: actualUser?.name || CURRENT_USER.name,
          initials: actualUser?.name ? actualUser.name.substring(0, 2).toUpperCase() : CURRENT_USER.initials,
          email: actualUser?.email || CURRENT_USER.email,
          avatarUrl: actualUser?.avatarUrl || CURRENT_USER.avatarUrl,
          access: 'Full Access',
          memberType: 'Member',
          isCurrentUser: true,
        },
        data.inviteEmails ?? [],
        data.inviteGroupIds ?? [],
      ),
    ]);
  };

  const handleSaveWorkspace = async (data: CreateWorkspaceFormData) => {
    if (!editWorkspaceId) return;

    try {
      const { apiClient } = await import('../../api/client');
      const token = localStorage.getItem('token');
      await apiClient.post(
        `/workspaces/update/${editWorkspaceId}`,
        {
          name: data.name,
          description: data.description,
          color: data.color,
          status: data.status,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Workspace updated successfully.');
    } catch (error: any) {
      console.error('Failed to update workspace in backend:', error);
      toast.error(error?.response?.data?.message || 'Failed to update workspace.');
      return;
    }

    const today = formatDate(Date.now(), {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    setWorkspaces((current) =>
      current.map((workspace) => {
        if (workspace.id === editWorkspaceId) {
          const newEmails = (data.inviteEmails ?? []).map(email => createWorkspaceTeamMember(email, { memberType: data.memberType as any, access: data.accessLevel as any }));
          const newGroups = (data.inviteGroupIds ?? []).map(groupId => {
             const group = MOCK_SETTINGS_USER_GROUPS.find(g => g.id === groupId);
             return group ? createWorkspaceTeamMemberFromGroup(group, { access: data.accessLevel as any }) : null;
          }).filter(Boolean) as import('../../data/mockSettingsData').WorkspaceTeamMember[];
          
          return {
            ...workspace,
            workspace: data.name,
            description: data.description,
            color: data.color,
            status: data.status || workspace.status,
            lastUpdated: today,
            teamMembers: [...(workspace.teamMembers ?? []), ...newEmails, ...newGroups],
          };
        }
        return workspace;
      }),
    );
    setEditWorkspaceId(null);
  };

  const handleInviteMember = async (payload: WorkspaceInvitePayload) => {
    if (!inviteWorkspaceId) return false;

    try {
      const { apiClient } = await import('../../api/client');
      const token = localStorage.getItem('token');
      const res = await apiClient.post(`/workspaces/${inviteWorkspaceId}/member`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = res.data ?? res;

      const finalPayload = {
        ...payload,
        name: data.user?.name || payload.name,
        memberType: data.memberType || payload.memberType,
        userId: data.user?.id || payload.userId,
      };

      const target = workspaces.find((workspace) => workspace.id === inviteWorkspaceId);
      const newMember = resolveWorkspaceInvite(finalPayload, target?.teamMembers ?? [], orgGroupsList);
      
      if (newMember) {
        setWorkspaces((current) =>
          current.map((workspace) =>
            workspace.id === inviteWorkspaceId
              ? { ...workspace, teamMembers: [...(workspace.teamMembers ?? []), newMember] }
              : workspace,
          ),
        );
      }
      toast.success(`${finalPayload.memberType || 'Member'} added to workspace successfully.`);
      return true;
    } catch (err: any) {
      console.error('Failed to add workspace member:', err);
      const status = err.status || err.response?.status;
      const data = err.details || err.response?.data;
      
      if (status === 404 && data?.notFound) {
         return 'NOT_FOUND';
      }
      if (status === 400 && data?.orgMemberInPublic) {
         return 'ORG_MEMBER_IN_PUBLIC';
      }
      toast.error(data?.message || err.message || 'Failed to add member to workspace.');
      return false;
    }
  };

  const handleUpdateMemberAccess = (memberId: string, access: WorkspaceMemberAccess) => {
    if (!inviteWorkspaceId) return;

    // Optimistic UI update
    setWorkspaces((current) =>
      current.map((workspace) =>
        workspace.id === inviteWorkspaceId
          ? {
            ...workspace,
            teamMembers: workspace.teamMembers?.map((member) =>
              member.id === memberId ? { ...member, access } : member,
            ),
          }
          : workspace,
      ),
    );

    // Extract raw DB id from the frontend prefix (e.g. wm-u-1234 -> 1234)
    const rawMemberId = memberId.replace(/^wm-(u|g)-/, '');

    // Backend API Call
    import('../../api/client').then(({ apiClient }) => {
      const token = localStorage.getItem('token');
      apiClient.put(`/workspaces/${inviteWorkspaceId}/member/${rawMemberId}`, { accessLevel: access }, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(() => {
        toast.success('Workspace access updated.');
      }).catch((err) => {
        console.error('Failed to update workspace member access:', err);
        toast.error('Failed to update workspace access.');
      });
    });
  };

  const handleRemoveMember = (memberId: string) => {
    if (!inviteWorkspaceId) return;

    const targetWorkspace = workspaces.find((w) => w.id === inviteWorkspaceId);
    const memberToRemove = targetWorkspace?.teamMembers?.find(m => m.id === memberId);
    
    if (memberToRemove?.isCurrentUser || memberId.startsWith('wm-admin-')) {
      toast.error('Cannot remove the owner of the workspace.');
      return;
    }

    // Optimistic UI update
    setWorkspaces((current) =>
      current.map((workspace) =>
        workspace.id === inviteWorkspaceId
          ? {
            ...workspace,
            teamMembers: workspace.teamMembers?.filter((member) => member.id !== memberId),
          }
          : workspace,
      ),
    );

    // Extract raw DB id from the frontend prefix
    const rawMemberId = memberId.replace(/^wm-(u|g)-/, '');

    // Backend API Call
    import('../../api/client').then(({ apiClient }) => {
      const token = localStorage.getItem('token');
      apiClient.delete(`/workspaces/${inviteWorkspaceId}/member/${rawMemberId}`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(() => {
        toast.success('Member removed from workspace.');
      }).catch((err) => {
        console.error('Failed to remove workspace member:', err);
        toast.error('Failed to remove member from workspace.');
        // Revert on failure
        if (memberToRemove) {
          setWorkspaces((current) =>
            current.map((workspace) =>
              workspace.id === inviteWorkspaceId
                ? { ...workspace, teamMembers: [...(workspace.teamMembers ?? []), memberToRemove] }
                : workspace,
            ),
          );
        }
      });
    });
  };

  const handleRestrictedChange = (restricted: boolean) => {
    if (!inviteWorkspaceId) return;
    
    // Optimistic UI update
    setWorkspaces((current) =>
      current.map((workspace) =>
        workspace.id === inviteWorkspaceId ? { ...workspace, isRestricted: restricted } : workspace,
      ),
    );

    // Backend API Call
    const visibility = restricted ? 'private' : 'public';
    import('../../api/client').then(({ apiClient }) => {
      const token = localStorage.getItem('token');
      apiClient.post(`/workspaces/update/${inviteWorkspaceId}`, { visibility }, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(() => {
        toast.success(`Workspace is now ${restricted ? 'Restricted' : 'Public'}.`);
      }).catch((err) => {
        console.error('Failed to update workspace visibility:', err);
        toast.error('Failed to update workspace visibility.');
      });
    });
  };

  const [deleteConfirmStep, setDeleteConfirmStep] = useState<0 | 1 | 2>(0);
  const [targetDeleteWorkspaceIds, setTargetDeleteWorkspaceIds] = useState<string[]>([]);
  const [isDeletingWorkspace, setIsDeletingWorkspace] = useState(false);

  const targetWorkspaces = useMemo(() => {
    return workspaces.filter((w) => targetDeleteWorkspaceIds.includes(w.id));
  }, [workspaces, targetDeleteWorkspaceIds]);

  const handleDeleteWorkspace = (ids: string[]) => {
    const hasDefault = workspaces.some((w) => ids.includes(w.id) && w.isDefault);
    if (hasDefault) {
      toast.error('Default workspace created during organization registration cannot be deleted.');
      return;
    }
    setTargetDeleteWorkspaceIds(ids);
    setDeleteConfirmStep(1);
  };

  const handlePerformPermanentDelete = async () => {
    if (targetDeleteWorkspaceIds.length === 0) return;
    setIsDeletingWorkspace(true);
    try {
      const { apiClient } = await import('../../api/client');
      const token = localStorage.getItem('token');
      for (const id of targetDeleteWorkspaceIds) {
        await apiClient.delete(`/workspaces/delete/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      setWorkspaces((prev) => prev.filter((w) => !targetDeleteWorkspaceIds.includes(w.id)));
      toast.success('Workspace and all associated projects, folders, and files permanently deleted.');
      setDeleteConfirmStep(0);
      setTargetDeleteWorkspaceIds([]);
    } catch (err: any) {
      console.error('Failed to delete workspace:', err);
      toast.error(err?.response?.data?.message || err?.message || 'Failed to delete workspace.');
    } finally {
      setIsDeletingWorkspace(false);
    }
  };

  return (
    <>
      <ProjectWorkspaceTable
        title="Workspaces"
        description="Super Admin only — manage account workspaces."
        rows={workspaces}
        addLabel="Add new workspace"
        showBulkActions
        showProjectColumn={false}
        showTeamMembersColumn
        onAdd={async () => {
          try {
            const summary = await getUsageSummary();
            if (summary.workspacesTotal != null && summary.workspacesCount >= summary.workspacesTotal) {
              toast.error(`Workspace limit (${summary.workspacesTotal}) reached for your current plan. Please upgrade to create more workspaces.`);
              return;
            }
          } catch (e) {}
          setAddOpen(true);
        }}
        onEdit={setEditWorkspaceId}
        onDelete={handleDeleteWorkspace}
        onInviteTeamMembers={setInviteWorkspaceId}
        onMarkActive={async (ids) => {
          try {
            const { apiClient } = await import('../../api/client');
            const token = localStorage.getItem('token');
            for (const id of ids) {
              await apiClient.post(`/workspaces/update/${id}`, { status: 'active' }, { headers: { Authorization: `Bearer ${token}` } });
            }
            setWorkspaces((prev) =>
              prev.map((w) => (ids.includes(w.id) ? { ...w, status: 'Active' } : w))
            );
            toast.success('Workspace(s) marked as active.');
          } catch (e: any) {
            console.error('Failed to mark workspace active', e);
            toast.error(e?.response?.data?.message || 'Failed to mark workspace as active.');
          }
        }}
        onMarkInactive={async (ids) => {
          try {
            const { apiClient } = await import('../../api/client');
            const token = localStorage.getItem('token');
            for (const id of ids) {
              await apiClient.post(`/workspaces/update/${id}`, { status: 'inactive' }, { headers: { Authorization: `Bearer ${token}` } });
            }
            setWorkspaces((prev) =>
              prev.map((w) => (ids.includes(w.id) ? { ...w, status: 'Inactive' } : w))
            );
            toast.success('Workspace(s) marked as inactive.');
          } catch (e: any) {
            console.error('Failed to mark workspace inactive', e);
            toast.error(e?.response?.data?.message || 'Failed to mark workspace as inactive.');
          }
        }}
      />
      <CreateWorkspaceModal
        open={addOpen || Boolean(editWorkspaceId)}
        onClose={() => {
          setAddOpen(false);
          setEditWorkspaceId(null);
        }}
        onCreate={handleCreateWorkspace}
        onSave={handleSaveWorkspace}
        initialWorkspace={
          editWorkspace
            ? {
                name: editWorkspace.workspace,
                description: editWorkspace.description,
                color: editWorkspace.color,
                status: editWorkspace.status,
                isRestricted: editWorkspace.isRestricted,
                teamMembers: editWorkspace.teamMembers,
              }
            : undefined
        }
      />
      <WorkspaceMembersDialog
        open={Boolean(inviteWorkspaceId)}
        workspaceName={inviteWorkspace?.workspace ?? 'workspace'}
        resourceId={inviteWorkspaceId ?? undefined}
        members={inviteWorkspace?.teamMembers ?? []}
        suggestedUsers={orgUsersList}
        suggestedGroups={orgGroupsList}
        isRestricted={inviteWorkspace?.isRestricted ?? false}
        visibility={inviteWorkspace?.visibility ?? 'public'}
        onClose={() => setInviteWorkspaceId(null)}
        onInvite={handleInviteMember}
        onUpdateMemberAccess={handleUpdateMemberAccess}
        onRemoveMember={handleRemoveMember}
        onRestrictedChange={handleRestrictedChange}
      />

      {/* Step 1 Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmStep === 1}
        onClose={() => setDeleteConfirmStep(0)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: cv.surfaceElevated || '#1e192b',
            color: cv.textPrimary,
            backgroundImage: 'none',
            border: `1px solid ${cv.border || 'rgba(255, 255, 255, 0.12)'}`,
            borderRadius: '20px',
            boxShadow: '0 24px 64px rgba(0, 0, 0, 0.6)',
            p: 1,
          },
        }}
      >
        <Box sx={{ p: 2, position: 'relative' }}>
          <IconButton
            onClick={() => setDeleteConfirmStep(0)}
            sx={{
              position: 'absolute',
              right: 12,
              top: 12,
              color: cv.textMuted || 'rgba(255, 255, 255, 0.4)',
              '&:hover': { color: cv.textPrimary || '#ffffff', bgcolor: 'rgba(255, 255, 255, 0.08)' },
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>

          {/* Top Red Circular Icon Badge */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1, mb: 2 }}>
            <Box
              sx={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                bgcolor: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.28)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 20px rgba(239, 68, 68, 0.18)',
              }}
            >
              <DeleteOutlineOutlinedIcon sx={{ fontSize: 30, color: cv.destructive || '#ef4444' }} />
            </Box>
          </Box>

          <Typography
            variant="h6"
            align="center"
            sx={{ fontWeight: 700, fontSize: '1.2rem', color: cv.textPrimary, mb: 1, px: 2 }}
          >
            Are you sure you want to delete this workspace?
          </Typography>

          {targetWorkspaces.length > 0 && (
            <Typography
              variant="body2"
              align="center"
              sx={{ color: cv.textSecondary, fontSize: '0.9rem', mb: 2.5 }}
            >
              Workspace: <strong style={{ color: cv.textPrimary }}>{targetWorkspaces.map(w => w.workspace).join(', ')}</strong>
            </Typography>
          )}

          {/* Option Card Box */}
          <Box
            sx={{
              p: 2.5,
              borderRadius: '14px',
              bgcolor: 'rgba(168, 85, 247, 0.05)',
              border: `1px solid ${cv.border || 'rgba(168, 85, 247, 0.3)'}`,
              display: 'flex',
              gap: 1.5,
              mb: 3,
            }}
          >
            <Box
              sx={{
                width: 30,
                height: 30,
                borderRadius: '50%',
                border: '1px solid rgba(168, 85, 247, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                mt: 0.25,
                color: cv.brandOrchid || '#a855f7',
              }}
            >
              <InfoOutlinedIcon sx={{ fontSize: 18 }} />
            </Box>
            <Box>
              <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600, color: cv.textPrimary, mb: 0.5 }}>
                Important notice:
              </Typography>
              <Typography sx={{ fontSize: '0.8125rem', color: cv.textSecondary, lineHeight: 1.6 }}>
                Deleting this workspace will delete all projects, files, and folders contained inside it.
              </Typography>
            </Box>
          </Box>

          {/* Action Buttons Row */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5 }}>
            <Button
              variant="contained"
              onClick={() => setDeleteConfirmStep(0)}
              sx={{
                borderRadius: '10px',
                bgcolor: 'rgba(255, 255, 255, 0.08)',
                color: cv.textPrimary || '#ffffff',
                textTransform: 'none',
                fontWeight: 600,
                px: 3,
                py: 1,
                boxShadow: 'none',
                '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.15)', boxShadow: 'none' },
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              startIcon={<DeleteOutlineOutlinedIcon fontSize="small" />}
              onClick={() => setDeleteConfirmStep(2)}
              sx={{
                borderRadius: '10px',
                bgcolor: cv.destructive || '#ef4444',
                color: cv.textOnCta || '#ffffff',
                textTransform: 'none',
                fontWeight: 600,
                px: 3,
                py: 1,
                boxShadow: 'none',
                '&:hover': { bgcolor: cv.destructiveHover || '#dc2626', boxShadow: 'none' },
              }}
            >
              Yes, Proceed
            </Button>
          </Box>
        </Box>
      </Dialog>

      {/* Step 2 Warning Permanent Deletion Dialog */}
      <Dialog
        open={deleteConfirmStep === 2}
        onClose={() => !isDeletingWorkspace && setDeleteConfirmStep(0)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: cv.surfaceElevated || '#1e192b',
            color: cv.textPrimary,
            backgroundImage: 'none',
            border: `1px solid ${cv.border || 'rgba(255, 255, 255, 0.12)'}`,
            borderRadius: '20px',
            boxShadow: '0 24px 64px rgba(0, 0, 0, 0.6)',
            p: 1,
          },
        }}
      >
        <Box sx={{ p: 2, position: 'relative' }}>
          <IconButton
            disabled={isDeletingWorkspace}
            onClick={() => setDeleteConfirmStep(0)}
            sx={{
              position: 'absolute',
              right: 12,
              top: 12,
              color: cv.textMuted || 'rgba(255, 255, 255, 0.4)',
              '&:hover': { color: cv.textPrimary || '#ffffff', bgcolor: 'rgba(255, 255, 255, 0.08)' },
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>

          {/* Top Red Circular Warning Badge */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1, mb: 2 }}>
            <Box
              sx={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                bgcolor: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 24px rgba(239, 68, 68, 0.25)',
              }}
            >
              <WarningAmberOutlinedIcon sx={{ fontSize: 32, color: cv.destructive || '#ef4444' }} />
            </Box>
          </Box>

          <Typography
            variant="h6"
            align="center"
            sx={{ fontWeight: 700, fontSize: '1.2rem', color: cv.destructive || '#ef4444', mb: 1, px: 2 }}
          >
            Warning: Permanent Deletion
          </Typography>

          {targetWorkspaces.length > 0 && (
            <Typography
              variant="body2"
              align="center"
              sx={{ color: cv.textSecondary, fontSize: '0.9rem', mb: 2.5 }}
            >
              Workspace: <strong style={{ color: cv.textPrimary }}>{targetWorkspaces.map(w => w.workspace).join(', ')}</strong>
            </Typography>
          )}

          {/* Warning Details Card */}
          <Box
            sx={{
              p: 2.5,
              borderRadius: '14px',
              bgcolor: 'rgba(239, 68, 68, 0.08)',
              border: `1px solid rgba(239, 68, 68, 0.28)`,
              display: 'flex',
              gap: 1.5,
              mb: 3,
            }}
          >
            <Box
              sx={{
                width: 30,
                height: 30,
                borderRadius: '50%',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                mt: 0.25,
                color: cv.destructive || '#ef4444',
              }}
            >
              <WarningAmberOutlinedIcon sx={{ fontSize: 18 }} />
            </Box>
            <Box>
              <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: cv.textPrimary, mb: 0.5 }}>
                Once you delete this workspace:
              </Typography>
              <Typography sx={{ fontSize: '0.8125rem', color: cv.textSecondary, lineHeight: 1.6 }}>
                All projects, files, and folders inside it cannot be restored again. It will be permanently deleted from the database and Backblaze B2 cloud storage.
              </Typography>
            </Box>
          </Box>

          {/* Action Buttons Row */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5 }}>
            <Button
              disabled={isDeletingWorkspace}
              variant="contained"
              onClick={() => setDeleteConfirmStep(0)}
              sx={{
                borderRadius: '10px',
                bgcolor: 'rgba(255, 255, 255, 0.08)',
                color: cv.textPrimary || '#ffffff',
                textTransform: 'none',
                fontWeight: 600,
                px: 3,
                py: 1,
                boxShadow: 'none',
                '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.15)', boxShadow: 'none' },
              }}
            >
              Cancel
            </Button>
            <Button
              disabled={isDeletingWorkspace}
              variant="contained"
              startIcon={<DeleteOutlineOutlinedIcon fontSize="small" />}
              onClick={handlePerformPermanentDelete}
              sx={{
                borderRadius: '10px',
                bgcolor: cv.destructive || '#ef4444',
                color: cv.textOnCta || '#ffffff',
                textTransform: 'none',
                fontWeight: 600,
                px: 3,
                py: 1,
                boxShadow: 'none',
                '&:hover': { bgcolor: cv.destructiveHover || '#dc2626', boxShadow: 'none' },
              }}
            >
              {isDeletingWorkspace ? 'Deleting...' : 'Delete Permanently'}
            </Button>
          </Box>
        </Box>
      </Dialog>
    </>
  );
}

export function FieldsAdminSettingsSection() {
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const rows = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return MOCK_CUSTOM_FIELDS;
    return MOCK_CUSTOM_FIELDS.filter((field) => field.name.toLowerCase().includes(query));
  }, [search]);

  const columns: SettingsTableColumn<(typeof MOCK_CUSTOM_FIELDS)[number]>[] = [
    { id: 'name', label: 'Field name', width: '40%', render: (row) => tableText(row.name) },
    { id: 'type', label: 'Type', width: '25%', render: (row) => row.type },
    { id: 'applies', label: 'Applies to', width: '35%', render: (row) => row.appliesTo },
  ];

  return (
    <SettingsTableContainer>
      <SettingsSectionCard title="Fields" description="Custom metadata fields for your library.">
        <SettingsAdminToolbar
          searchValue={search}
          onSearchChange={setSearch}
          onAdd={() => undefined}
          addLabel="Add field"
        />
        <SettingsDataTable
          columns={columns}
          rows={rows}
          getRowId={(row) => row.id}
          selectable
          selectedRowIds={selectedIds}
          onSelectionChange={setSelectedIds}
        />
      </SettingsSectionCard>
    </SettingsTableContainer>
  );
}

export function SecurityAdminSettingsSection() {
  const [settings, setSettings] = useState<{
    ssoConfigured: boolean;
    ssoProvider: string;
    sessionTimeoutDays: number;
    contentSecurityPolicy: string;
  }>({
    ssoConfigured: false,
    ssoProvider: 'google',
    sessionTimeoutDays: 30,
    contentSecurityPolicy: '*.noahcloud.ai, localhost',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadGlobalSettings() {
      try {
        const { apiClient } = await import('../../api/client');
        const res = await apiClient.get<any>('/platform/security');
        if (isMounted && res?.settings) {
          setSettings({
            ssoConfigured: Boolean(res.settings.ssoConfigured),
            ssoProvider: res.settings.ssoProvider || 'google',
            sessionTimeoutDays: Number(res.settings.sessionTimeoutDays) || 30,
            contentSecurityPolicy: res.settings.contentSecurityPolicy || '*.noahcloud.ai, localhost',
          });
        }
      } catch (err) {
        console.error('Error fetching global security settings for super admin:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadGlobalSettings();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <SettingsFormContainer>
      <SettingsSectionCard
        title="Security (Read-Only)"
        description="Global authentication, sessions, and content security policy configured by Global Admin across all organizations."
      >
        <SettingsRow
          title="Single sign-on (SSO)"
          description={
            settings.ssoConfigured
              ? `Configured (True · ${settings.ssoProvider.toUpperCase()})`
              : 'Not configured (False)'
          }
          action={
            <Chip
              size="small"
              label="Managed by Global Admin"
              sx={{
                height: 26,
                fontSize: '0.7rem',
                fontWeight: 600,
                borderRadius: '6px',
                background: cv.purpleSurface,
                color: cv.brandOrchid,
                border: `1px solid ${cv.purpleChipBorder}`,
              }}
            />
          }
        />
        <SettingsRow
          title="Session timeout"
          description={`${settings.sessionTimeoutDays} days of inactivity`}
          action={
            <Chip
              size="small"
              label="Managed by Global Admin"
              sx={{
                height: 26,
                fontSize: '0.7rem',
                fontWeight: 600,
                borderRadius: '6px',
                background: cv.purpleSurface,
                color: cv.brandOrchid,
                border: `1px solid ${cv.purpleChipBorder}`,
              }}
            />
          }
        />
        <SettingsRow
          title="Content Security Policy"
          description={
            <Box sx={{ mt: 0.5 }}>
              <Typography sx={{ fontSize: '0.8125rem', color: cv.textMuted, mb: 0.5 }}>
                Allowed embed domain origins (Managed by Global Admin):
              </Typography>
              <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', maxWidth: { xs: '100%', sm: 420, md: 440 } }}>
                {(() => {
                  const raw = settings.contentSecurityPolicy || '';
                  let list: string[] = [];
                  try {
                    const parsed = JSON.parse(raw);
                    if (Array.isArray(parsed)) list = parsed;
                    else list = String(raw).split(',').map((s) => s.trim()).filter(Boolean);
                  } catch {
                    list = String(raw).split(',').map((s) => s.trim()).filter(Boolean);
                  }
                  return list.map((dom) => (
                    <Chip
                      key={dom}
                      size="small"
                      label={dom}
                      sx={{
                        height: 24,
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        borderRadius: '4px',
                        background: cv.purpleSurface,
                        color: cv.brandOrchid,
                        border: `1px solid ${cv.purpleChipBorder}`,
                      }}
                    />
                  ));
                })()}
              </Box>
            </Box>
          }
          action={
            <Chip
              size="small"
              label="Managed by Global Admin"
              sx={{
                height: 26,
                fontSize: '0.7rem',
                fontWeight: 600,
                borderRadius: '6px',
                background: cv.purpleSurface,
                color: cv.brandOrchid,
                border: `1px solid ${cv.purpleChipBorder}`,
              }}
            />
          }
          showDivider={false}
        />
      </SettingsSectionCard>
    </SettingsFormContainer>
  );
}

export function ShareSettingsSection() {
  const [requirePassword, setRequirePassword] = useState(false);
  const [allowComments, setAllowComments] = useState(false);
  const [allowDownloadOriginal, setAllowDownloadOriginal] = useState(true);
  const [allowDownloadProxy, setAllowDownloadProxy] = useState(true);
  const [showCompanyWatermark, setShowCompanyWatermark] = useState(true);
  const [linkExpiry, setLinkExpiry] = useState('30');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { apiClient } = await import('../../api/client');
        const token = localStorage.getItem('token');
        const response = await apiClient.get<any>('/organizations/share-settings', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = response.data || response;
        if (data) {
          if (typeof data.requirePasswordDefault === 'boolean') {
            setRequirePassword(data.requirePasswordDefault);
          }
          if (typeof data.allowCommentsDefault === 'boolean') {
            setAllowComments(data.allowCommentsDefault);
          }
          if (typeof data.allowDownloadOriginalDefault === 'boolean') {
            setAllowDownloadOriginal(data.allowDownloadOriginalDefault);
          }
          if (typeof data.allowDownloadProxyDefault === 'boolean') {
            setAllowDownloadProxy(data.allowDownloadProxyDefault);
          }
          if (typeof data.showCompanyWatermarkDefault === 'boolean') {
            setShowCompanyWatermark(data.showCompanyWatermarkDefault);
          }
          if (data.defaultExpiryDays) {
            setLinkExpiry(String(data.defaultExpiryDays));
          }
        }
      } catch (err) {
        console.error("Failed to load share settings", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const updateSetting = async (key: string, value: any) => {
    try {
      const { apiClient } = await import('../../api/client');
      const token = localStorage.getItem('token');
      await apiClient.patch('/organizations/share-settings', {
        [key]: value
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Settings updated');
    } catch (err) {
      console.error(`Failed to update ${key}`, err);
      toast.error('Failed to update settings');
    }
  };

  if (loading) return null;

  return (
    <SettingsFormContainer>
      <SettingsSectionCard
        title="Share Settings"
        description="Default share link options · Admin and Super Admin only"
      >
        <SettingsRow
          title="Require password"
          description="Protect new share links with a password by default."
          action={
            <Switch
              checked={requirePassword}
              onChange={(event) => {
                setRequirePassword(event.target.checked);
                updateSetting('requirePasswordDefault', event.target.checked);
              }}
              slotProps={{ input: { 'aria-label': 'Require password on share links' } }}
            />
          }
        />
        <SettingsRow
          title="Allow comments"
          description="Let viewers add comments on shared media."
          action={
            <Switch
              checked={allowComments}
              onChange={(event) => {
                setAllowComments(event.target.checked);
                updateSetting('allowCommentsDefault', event.target.checked);
              }}
              slotProps={{ input: { 'aria-label': 'Allow comments on share links' } }}
            />
          }
        />
        <SettingsRow
          title="Download original"
          description="Let viewers download the original high-resolution media."
          action={
            <Switch
              checked={allowDownloadOriginal}
              onChange={(event) => {
                setAllowDownloadOriginal(event.target.checked);
                updateSetting('allowDownloadOriginalDefault', event.target.checked);
              }}
              slotProps={{ input: { 'aria-label': 'Allow original downloads on share links' } }}
            />
          }
        />
        <SettingsRow
          title="Download proxy"
          description="Let viewers download the proxy (compressed) media."
          action={
            <Switch
              checked={allowDownloadProxy}
              onChange={(event) => {
                setAllowDownloadProxy(event.target.checked);
                updateSetting('allowDownloadProxyDefault', event.target.checked);
              }}
              slotProps={{ input: { 'aria-label': 'Allow proxy downloads on share links' } }}
            />
          }
        />
        <SettingsRow
          title="Show company watermark"
          description="Display your company logo watermark on shared media."
          action={
            <Switch
              checked={showCompanyWatermark}
              onChange={(event) => {
                setShowCompanyWatermark(event.target.checked);
                updateSetting('showCompanyWatermarkDefault', event.target.checked);
              }}
              slotProps={{ input: { 'aria-label': 'Show company watermark on share links' } }}
            />
          }
        />
        <SettingsRow
          title="Link expiry"
          description="Default expiration for new share links."
          action={
            <TextField
              select
              size="small"
              value={linkExpiry}
              onChange={(event) => {
                setLinkExpiry(event.target.value);
                updateSetting('defaultExpiryDays', parseInt(event.target.value, 10));
              }}
              sx={{ minWidth: 120 }}
              slotProps={textFieldSelectInDialogSlotProps}
            >
              {['7', '14', '30', '90'].map((days) => (
                <MenuItem key={days} value={days} sx={{ fontSize: '0.875rem', color: cv.textPrimary }}>
                  {days} days
                </MenuItem>
              ))}
            </TextField>
          }
          showDivider={false}
        />
      </SettingsSectionCard>
    </SettingsFormContainer>
  );
}

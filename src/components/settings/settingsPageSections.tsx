import { useEffect, useMemo, useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { getCompanyInfoRequest, updateCompanyInfoRequest, uploadCompanyLogoRequest, updateProfileRequest, uploadProfilePhotoRequest } from '../../api';
import { logoutAllSessions, fetchOrganizationUsers } from '../../api/auth.service';
import { fetchUserGroups } from '../../api/userGroups.service';
import { useAuth } from '../../auth/AuthContext';
import { useLocalizedDate } from '../../hooks/useLocalizedDate';
import { cv } from '../../theme/cssVars';
import {
  Avatar,
  Box,
  Button,
  Chip,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import UploadOutlinedIcon from '@mui/icons-material/UploadOutlined';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
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
import { CURRENT_USER } from '../../constants/currentUser';
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
    inviteMemberType?: import('../../data/mockSettingsData').WorkspaceMemberType
  ) => void;
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
            .catch(() => {});
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
      setNameError('');
      return;
    }
    setWorkspace((current) => current || workspaces[0]?.name || '');
  }, [open, initialProject, workspaces]);

  const handleSubmit = () => {
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
    onAdd(trimmed, workspace, inviteEmails, inviteGroupIds, visibility, folderId || null, inviteAccess, inviteMemberType);
    onClose();
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
              {rootFolders.length === 0 && (
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
                  <FolderOutlinedIcon sx={{ fontSize: 18, color: cv.textMuted, flexShrink: 0, ml: 1 }} />
                  <Typography noWrap sx={{ fontSize: '0.875rem', fontWeight: folderId === '' ? 600 : 500, color: cv.textMuted }}>
                    {(() => {
                      const now = new Date();
                      const currentYear = new Intl.DateTimeFormat('en-US', { year: 'numeric' }).format(now);
                      const currentMonth = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(now);
                      return `${currentYear} / ${currentMonth}`;
                    })()}
                  </Typography>
                </Box>
              )}
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
            suggestedUsers={suggestedUsers}
            suggestedGroups={suggestedGroups}
            description="Private projects are invite-only. Add people or groups who should have access."
          />
        ) : null}
        <Typography sx={{ fontSize: '0.8125rem', color: cv.textSecondary }}>
          {isEdit
            ? 'Update project details and visibility.'
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
  const { user, refreshUser } = useAuth();
  
  const [profile, setProfile] = useState({
    fullName: user?.name || '',
    timezone: user?.timezone || 'UTC',
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
        timezone: user.timezone || 'UTC',
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
        user?.logout?.(); // clear local token and redirect if logout is provided, else we rely on AuthContext unmounting
        window.location.reload(); 
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
              value={profile.timezone}
              onChange={(event: SelectChangeEvent) =>
                setProfile((current) => ({ ...current, timezone: event.target.value }))
              }
              sx={dialogSelectSx}
            >
              {PROFILE_TIMEZONE_OPTIONS.map((zone) => (
                <MenuItem key={zone} value={zone} sx={{ fontSize: '0.875rem', color: cv.textPrimary }}>
                  {zone}
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
        slotProps={noahDialogSlotProps}
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
        slotProps={noahDialogSlotProps}
      >
        <DialogTitle sx={{ color: cv.danger }}>Log Out of All Sessions</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: cv.textSecondary, fontSize: '0.875rem' }}>
            Are you sure you want to log out of all active sessions? This will instantly revoke access for all devices, including the one you are currently using. You will need to log back in.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setLogoutAllConfirmOpen(false)} sx={{ color: cv.textSecondary }}>
            Cancel
          </Button>
          <Button onClick={handleLogoutAll} variant="contained" sx={{ bgcolor: cv.danger, color: '#fff', '&:hover': { bgcolor: cv.dangerHover } }}>
            Confirm Logout
          </Button>
        </DialogActions>
      </Dialog>
    </SettingsFormContainer>
  );
}

export function PrivacySettingsSection() {
  const [privacy, setPrivacy] = useState(DEFAULT_PRIVACY_SETTINGS);

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
              onChange={(event) =>
                setPrivacy((current) => ({ ...current, shareLinkActivity: event.target.checked }))
              }
              slotProps={{ input: { 'aria-label': 'Share link activity notifications' } }}
            />
          }
        />
        <SettingsRow
          title="Cookie preferences"
          description="Configure data tracking and consent settings under US privacy compliance."
          action={
            <Button variant="outlined" size="small" sx={outlineButtonSx}>
              Manage cookies
            </Button>
          }
          showDivider={false}
        />
      </SettingsSectionCard>
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
  const plan = MOCK_CURRENT_PLAN;

  return (
    <SettingsFormContainer>
      <SettingsSectionCard
        title="Current Plan"
        description="Active tier, trial milestone, and subscription line items."
      >
        <SettingsRow title="Plan name" description={plan.planName} />
        <SettingsRow title="Free trial expiry" description={plan.freeTrialExpiry} />
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
  );
}

export function BrandingSettingsSection() {
  const [branding, setBranding] = useState<BrandingSettingsData>(MOCK_BRANDING_SETTINGS);
  const [isDirty, setIsDirty] = useState(false);
  const [previewLayout, setPreviewLayout] = useState<'grid' | 'list'>('grid');

  const updateBranding = <K extends keyof BrandingSettingsData>(key: K, value: BrandingSettingsData[K]) => {
    setBranding((current) => ({ ...current, [key]: value }));
    setIsDirty(true);
  };

  const handleReset = () => {
    setBranding(DEFAULT_BRANDING_SETTINGS);
    setIsDirty(true);
  };

  const handleCancel = () => {
    setBranding(MOCK_BRANDING_SETTINGS);
    setIsDirty(false);
  };

  const handleSave = () => {
    setIsDirty(false);
  };

  const previewBackground =
    branding.reelBackgroundColor === 'None' ? cv.bg : branding.reelBackgroundColor;
  const previewTitleColor = branding.reelTitleColor === 'None' ? cv.textPrimary : branding.reelTitleColor;

  return (
    <SettingsFormContainer>
      <SettingsSectionCard
        title="Account name branding"
        description="Read-only badge from primary account properties · Admin & Super Admin can edit account name."
      >
        <Box sx={{ px: 2, py: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
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
          description="Custom brand asset for share presentation."
          action={
            <Button variant="outlined" size="small" startIcon={<AddIcon />} sx={outlineButtonSx}>
              Upload
            </Button>
          }
        />
        <SettingsRow
          title="Header image upload"
          description={`Banner thumbnail slot · maximum ${branding.headerImageMaxMb} MB`}
          action={
            <Button variant="outlined" size="small" startIcon={<UploadOutlinedIcon />} sx={outlineButtonSx}>
              Upload
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
              p: 2,
              minHeight: 120,
            }}
          >
            <Typography sx={{ fontWeight: 600, color: previewTitleColor, mb: 1 }}>
              {branding.accountName}
            </Typography>
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
                    border: `1px solid ${branding.accentColor}44`,
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
          disabled={!isDirty}
          sx={{ textTransform: 'none', color: cv.textSecondary }}
        >
          Reset to default
        </Button>
        <Button onClick={handleCancel} sx={{ textTransform: 'none', color: cv.textSecondary }}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSave} disabled={!isDirty} sx={containedButtonSx}>
          Save
        </Button>
      </Box>
    </SettingsFormContainer>
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
  onInviteTeamMembers,
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
  onInviteTeamMembers?: (workspaceId: string) => void;
}) {
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filterOpen, setFilterOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<Set<string>>(createDefaultFilterSelection);
  const [workspaceFilter, setWorkspaceFilter] = useState<Set<string>>(createDefaultFilterSelection);

  const workspaceOptions = useMemo(
    () => uniqueSorted(rows.map((row) => row.workspace)),
    [rows],
  );

  const hasActiveFilters = hasActiveFilterSelections(statusFilter, workspaceFilter);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesSearch =
        !query ||
        (showProjectColumn && row.project.toLowerCase().includes(query)) ||
        row.workspace.toLowerCase().includes(query) ||
        row.projectAdmin.toLowerCase().includes(query);
      const matchesStatus = matchesSetFilter(row.status, statusFilter);
      const matchesWorkspace = matchesSetFilter(row.workspace, workspaceFilter);
      return matchesSearch && matchesStatus && matchesWorkspace;
    });
  }, [rows, search, showProjectColumn, statusFilter, workspaceFilter]);

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
      width: showTeamMembersColumn ? (showProjectColumn ? '12%' : '12%') : '14%',
      render: (row) => row.creationDate,
    },
    {
      id: 'storage',
      label: 'Storage',
      width: showTeamMembersColumn ? (showProjectColumn ? '8%' : '9%') : '10%',
      render: (row) => row.storage,
    },
    {
      id: 'admin',
      label: showProjectColumn ? 'Project admin' : 'Workspace admin',
      width: showProjectColumn
        ? showTeamMembersColumn
          ? '13%'
          : '18%'
        : showTeamMembersColumn
          ? '14%'
          : '22%',
      render: (row) => tableText(row.projectAdmin),
    },
    ...(showTeamMembersColumn
      ? [
          {
            id: 'team',
            label: 'Team members',
            width: showProjectColumn ? '22%' : '28%',
            render: (row: SettingsProjectRow) => (
              <WorkspaceTeamMembersCell
                members={row.teamMembers ?? []}
                canInvite={row.projectAdmin === CURRENT_USER.name}
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
        onExport={() => undefined}
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
          <Button size="small" sx={{ textTransform: 'none', color: cv.textSecondary }}>
            Mark active
          </Button>
          <Button size="small" sx={{ textTransform: 'none', color: cv.textSecondary }}>
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
                selected: statusFilter,
                onToggle: (value) => setStatusFilter((current) => toggleFilterValue(current, value)),
              },
              ...(showProjectColumn
                ? [
                    {
                      id: 'workspace',
                      label: 'Workspace',
                      options: workspaceOptions,
                      selected: workspaceFilter,
                      onToggle: (value: string) =>
                        setWorkspaceFilter((current) => toggleFilterValue(current, value)),
                    },
                  ]
                : []),
            ]}
            onClearAll={() => {
              setStatusFilter(createDefaultFilterSelection());
              setWorkspaceFilter(createDefaultFilterSelection());
            }}
          />
        </Box>
      </Collapse>
      <SettingsDataTable
          columns={columns}
          rows={filtered}
          getRowId={(row) => row.id}
          selectable
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

    fetchUserGroups()
      .then((groups) => {
        const mappedGroups = groups.map((g) => ({
          id: g.id,
          name: g.name,
          memberIds: g.members?.map((m) => m.userId) || [],
        }));
        setOrgGroupsList(mappedGroups);
      })
      .catch((err) => console.error('Failed to fetch org groups:', err));
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
            return {
              id: p.id,
              project: p.name,
              workspace: p.workspace?.name || 'Unknown',
              status: 'Active',
              lastUpdated: today,
              creationDate: today,
              storage: '0 MB', // mock for now
              projectAdmin: CURRENT_USER.name,
              visibility: 'public',
              isRestricted: false,
              teamMembers: [
                {
                  id: `pm-admin-${p.id}`,
                  name: CURRENT_USER.name,
                  initials: CURRENT_USER.initials,
                  access: 'Full Access',
                  memberType: 'Member',
                  isCurrentUser: true,
                }
              ]
            } as SettingsProjectRow;
          });
          setProjects(formatted);
        }
      } catch (err) {
        console.error("Failed to load projects", err);
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
    inviteMemberType?: import('../../data/mockSettingsData').WorkspaceMemberType
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
        inviteMemberType
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
    } catch (err) {
      console.error("Failed to add project to backend:", err);
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
      await apiClient.put(`/workspaces/project/update/${editProjectId}`, {
        name,
        workspaceId: workspaceObj?.id,
        visibility
      }, {
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
    } catch (err) {
      console.error("Failed to update project in backend:", err);
    }
    setEditProjectId(null);
  };

  const handleDeleteProjects = async () => {
    if (deleteDialogIds.length === 0) return;
    try {
      const { apiClient } = await import('../../api/client');
      const token = localStorage.getItem('token');
      
      // Delete projects sequentially
      for (const id of deleteDialogIds) {
        await apiClient.delete(`/workspaces/project/delete/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      setProjects((current) => current.filter((p) => !deleteDialogIds.includes(p.id)));
    } catch (err) {
      console.error("Failed to delete projects in backend:", err);
    }
    setDeleteDialogIds([]);
  };

  const handleInviteMember = (payload: WorkspaceInvitePayload) => {
    if (!inviteProjectId) return false;

    const target = projects.find((project) => project.id === inviteProjectId);
    const newMember = resolveWorkspaceInvite(payload, target?.teamMembers ?? []);
    if (!newMember) return false;

    setProjects((current) =>
      current.map((project) =>
        project.id === inviteProjectId
          ? { ...project, teamMembers: [...(project.teamMembers ?? []), newMember] }
          : project,
      ),
    );
    return true;
  };

  const handleUpdateMemberAccess = (memberId: string, access: WorkspaceMemberAccess) => {
    if (!inviteProjectId) return;
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

  const handleRemoveMember = (memberId: string) => {
    if (!inviteProjectId) return;
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
  };

  const handleRestrictedChange = (restricted: boolean) => {
    if (!inviteProjectId) return;
    setProjects((current) =>
      current.map((project) =>
        project.id === inviteProjectId ? { ...project, isRestricted: restricted } : project,
      ),
    );
  };

  const handleVisibilityChange = (visibility: ProjectVisibility) => {
    if (!inviteProjectId) return;
    setProjects((current) =>
      current.map((project) =>
        project.id === inviteProjectId
          ? { ...project, visibility, isRestricted: visibility === 'private' }
          : project,
      ),
    );
  };

  return (
    <>
      <ProjectWorkspaceTable
        title="Projects"
        description="Manage projects across workspaces."
        rows={projects}
        addLabel="Add new project"
        showBulkActions
        showTeamMembersColumn
        onAdd={() => setAddOpen(true)}
        onEdit={setEditProjectId}
        onDelete={(ids) => setDeleteDialogIds(ids)}
        onInviteTeamMembers={setInviteProjectId}
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
      <Dialog 
        open={deleteDialogIds.length > 0} 
        onClose={() => setDeleteDialogIds([])}
        PaperProps={{ sx: { bgcolor: cv.bgLayer, color: cv.textPrimary, backgroundImage: 'none', border: `1px solid ${cv.borderPrimary}` } }}
      >
        <DialogTitle sx={{ fontWeight: 600 }}>Delete Project{deleteDialogIds.length > 1 ? 's' : ''}</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ color: cv.textSecondary }}>
            Are you sure you want to delete {deleteDialogIds.length === 1 ? 'this project' : `these ${deleteDialogIds.length} projects`}? There can be folders or assets linked in it.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setDeleteDialogIds([])} sx={{ color: cv.textSecondary, textTransform: 'none' }}>
            Cancel
          </Button>
          <Button onClick={handleDeleteProjects} variant="contained" sx={{ bgcolor: cv.destructive, '&:hover': { bgcolor: '#b91c1c' }, textTransform: 'none' }}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
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
  const { createWorkspace } = useDashboard();
  const [workspaces, setWorkspaces] = useState<SettingsProjectRow[]>(MOCK_SETTINGS_WORKSPACES);
  const [addOpen, setAddOpen] = useState(false);
  const [editWorkspaceId, setEditWorkspaceId] = useState<string | null>(null);
  const [inviteWorkspaceId, setInviteWorkspaceId] = useState<string | null>(null);
  const [orgUsersList, setOrgUsersList] = useState<import('../../data/mockSettingsData').SettingsUserRow[]>([]);
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
  }, []);

  const inviteWorkspace = workspaces.find((workspace) => workspace.id === inviteWorkspaceId);

  const editWorkspace = workspaces.find((workspace) => workspace.id === editWorkspaceId);

  const handleCreateWorkspace = (data: CreateWorkspaceFormData) => {
    createWorkspace(data);
    setWorkspaces((current) => [
      ...current,
      createSettingsWorkspace(
        data.name,
        CURRENT_USER.name,
        {
          id: `wm-admin-${Date.now()}`,
          name: CURRENT_USER.name,
          initials: CURRENT_USER.initials,
          email: CURRENT_USER.email,
          avatarUrl: CURRENT_USER.avatarUrl,
          access: 'Full Access',
          memberType: 'Member',
          isCurrentUser: true,
        },
        data.inviteEmails ?? [],
        data.inviteGroupIds ?? [],
      ),
    ]);
  };

  const handleSaveWorkspace = (data: CreateWorkspaceFormData) => {
    if (!editWorkspaceId) return;
    const today = formatDate(Date.now(), {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    setWorkspaces((current) =>
      current.map((workspace) =>
        workspace.id === editWorkspaceId
          ? { ...workspace, workspace: data.name, lastUpdated: today }
          : workspace,
      ),
    );
    setEditWorkspaceId(null);
  };

  const handleInviteMember = (payload: WorkspaceInvitePayload) => {
    if (!inviteWorkspaceId) return false;

    const target = workspaces.find((workspace) => workspace.id === inviteWorkspaceId);
    const newMember = resolveWorkspaceInvite(payload, target?.teamMembers ?? []);
    if (!newMember) return false;

    setWorkspaces((current) =>
      current.map((workspace) =>
        workspace.id === inviteWorkspaceId
          ? { ...workspace, teamMembers: [...(workspace.teamMembers ?? []), newMember] }
          : workspace,
      ),
    );
    return true;
  };

  const handleUpdateMemberAccess = (memberId: string, access: WorkspaceMemberAccess) => {
    if (!inviteWorkspaceId) return;
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
  };

  const handleRemoveMember = (memberId: string) => {
    if (!inviteWorkspaceId) return;
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
  };

  const handleRestrictedChange = (restricted: boolean) => {
    if (!inviteWorkspaceId) return;
    setWorkspaces((current) =>
      current.map((workspace) =>
        workspace.id === inviteWorkspaceId ? { ...workspace, isRestricted: restricted } : workspace,
      ),
    );
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
        onAdd={() => setAddOpen(true)}
        onEdit={setEditWorkspaceId}
        onInviteTeamMembers={setInviteWorkspaceId}
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
          editWorkspace ? { name: editWorkspace.workspace } : undefined
        }
      />
      <WorkspaceMembersDialog
        open={Boolean(inviteWorkspaceId)}
        workspaceName={inviteWorkspace?.workspace ?? 'workspace'}
        resourceId={inviteWorkspaceId ?? undefined}
        members={inviteWorkspace?.teamMembers ?? []}
        suggestedUsers={orgUsersList}
        suggestedGroups={MOCK_SETTINGS_USER_GROUPS}
        isRestricted={inviteWorkspace?.isRestricted ?? false}
        onClose={() => setInviteWorkspaceId(null)}
        onInvite={handleInviteMember}
        onUpdateMemberAccess={handleUpdateMemberAccess}
        onRemoveMember={handleRemoveMember}
        onRestrictedChange={handleRestrictedChange}
      />
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
  return (
    <SettingsFormContainer>
    <SettingsSectionCard title="Security" description="Authentication, sessions, and content security.">
      <SettingsRow title="Single sign-on (SSO)" description="Not configured" action={<Button size="small" sx={outlineButtonSx} variant="outlined">Configure</Button>} />
      <SettingsRow title="Session timeout" description="30 days of inactivity" action={<Button size="small" sx={outlineButtonSx} variant="outlined">Edit</Button>} />
      <SettingsRow
        title="Content Security Policy"
        description="Restrict embedded media origins for share links."
        action={<Button size="small" sx={outlineButtonSx} variant="outlined">Manage</Button>}
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

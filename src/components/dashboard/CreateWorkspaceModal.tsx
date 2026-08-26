import { useEffect, useState } from 'react';
import { cv } from '../../theme/cssVars';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
  Switch,
} from '@mui/material';
import { DEFAULT_WORKSPACE_COLOR, WORKSPACE_COLORS } from '../../constants/workspaceColors';
import InvitePeopleFields from '../settings/InvitePeopleFields';
import CustomHexColorPickerButton from './CustomHexColorPickerButton';
import { MOCK_SETTINGS_USER_GROUPS } from '../../data/mockSettingsData';
import { fetchOrganizationUsers } from '../../api/auth.service';
import type { WorkspaceMemberAccess, WorkspaceMemberType } from '../../data/mockSettingsData';
import { TeamMemberAvatarStack } from '../common/TeamMemberAvatarStack';

export interface CreateWorkspaceFormData {
  name: string;
  description: string;
  color: string;
  inviteEmails?: string[];
  inviteGroupIds?: string[];
  memberType?: string;
  accessLevel?: string;
  isRestricted?: boolean;
  sendInviteEmail?: boolean;
}

interface CreateWorkspaceModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (data: CreateWorkspaceFormData) => void;
  onSave?: (data: CreateWorkspaceFormData) => void;
  initialWorkspace?: { 
    name: string; 
    description?: string; 
    color?: string;
    isRestricted?: boolean;
    teamMembers?: import('../../data/mockSettingsData').WorkspaceTeamMember[];
  };
}

const dialogPaperSx = {
  borderRadius: '20px',
  border: "1px solid var(--noah-border)",
  background: 'var(--noah-dialog-surface)',
  backdropFilter: 'blur(40px) saturate(180%)',
  boxShadow: cv.dialogShadow,
  maxWidth: 440,
};

export default function CreateWorkspaceModal({
  open,
  onClose,
  onCreate,
  onSave,
  initialWorkspace,
}: CreateWorkspaceModalProps) {
  const isEdit = Boolean(initialWorkspace);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(DEFAULT_WORKSPACE_COLOR);
  const [isRestricted, setIsRestricted] = useState(false);
  const [inviteEmails, setInviteEmails] = useState<string[]>([]);
  const [inviteGroupIds, setInviteGroupIds] = useState<string[]>([]);
  const [inviteMemberType, setInviteMemberType] = useState<WorkspaceMemberType>('Member');
  const [inviteAccess, setInviteAccess] = useState<string>('Full Access');
  const [inviteSendEmail, setInviteSendEmail] = useState(false);
  const [orgUsersList, setOrgUsersList] = useState<import('../../data/mockSettingsData').SettingsUserRow[]>([]);
  const [orgGroupsList, setOrgGroupsList] = useState<import('../../data/mockSettingsData').SettingsUserGroup[]>([]);

  useEffect(() => {
    if (!open) return;
    if (initialWorkspace) {
      setName(initialWorkspace.name);
      setDescription(initialWorkspace.description ?? '');
      setColor(initialWorkspace.color ?? DEFAULT_WORKSPACE_COLOR);
      setIsRestricted(initialWorkspace.isRestricted ?? false);
      setInviteEmails([]);
      setInviteGroupIds([]);
      return;
    }
    setName('');
    setDescription('');
    setColor(DEFAULT_WORKSPACE_COLOR);
    setIsRestricted(false);
    setInviteEmails([]);
    setInviteGroupIds([]);
    setInviteMemberType('Guest'); // always default to Guest for external invites
    setInviteAccess('Full Access');
    setInviteSendEmail(false);

    if (!isEdit) {
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
        .catch((err) => console.error('Failed to fetch org users for workspace creation:', err));

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
    }
  }, [open, initialWorkspace, isEdit]);

  // Backend guest search — validates users from another org
  const handleGuestSearch = async (query: string): Promise<import('../settings/InvitePeopleFields').GuestUserSuggestion[]> => {
    try {
      const { apiClient } = await import('../../api/client');
      const token = localStorage.getItem('token');
      const res = await (apiClient as any).get(
        `/workspaces/search-guests?q=${encodeURIComponent(query)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Backend returns { success, data: [...] }
      const outer = (res as any).data ?? res;
      const arr = Array.isArray(outer) ? outer : (Array.isArray(outer?.data) ? outer.data : []);
      return arr;
    } catch {
      return [];
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const payload = {
      name: name.trim(),
      description: description.trim(),
      color,
      inviteEmails,
      inviteGroupIds,
      memberType: inviteMemberType.toUpperCase(),
      accessLevel: inviteAccess,
      isRestricted,
      sendInviteEmail: inviteSendEmail,
    };
    if (isEdit) {
      onSave?.(payload);
    } else {
      onCreate(payload);
    }
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      slotProps={{
        paper: { sx: dialogPaperSx },
        backdrop: {
          sx: { backgroundColor: cv.backdropScrim, backdropFilter: 'blur(4px)' },
        },
      }}
    >
      <Box component="form" onSubmit={handleSubmit}>
        <DialogTitle
          sx={{
            pb: 1,
            fontWeight: 600,
            fontSize: '1.25rem',
            color: cv.textPrimary,
          }}
        >
          {isEdit ? 'Edit workspace' : 'Create workspace'}
        </DialogTitle>
        <DialogContent sx={{ pt: '8px !important' }}>
          <Typography variant="body2" sx={{ color: cv.textSecondary, mb: 3 }}>
            {isEdit
              ? 'Update workspace details for your team.'
              : 'Set up a new workspace for your team or project.'}
          </Typography>

          <TextField
            fullWidth
            label="Workspace name"
            placeholder="e.g. Marketing Team"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
            helperText={`${name.length}/100`}
            sx={{
              mb: 2.5,
              '& .MuiFormHelperText-root': {
                textAlign: 'right',
                color: cv.textMuted,
                fontSize: '0.75rem',
                mt: 0.5,
              },
            }}
            slotProps={{
              inputLabel: { shrink: true },
              htmlInput: { maxLength: 100 }
            }}
          />

          <TextField
            fullWidth
            label="Description"
            placeholder="What is this workspace for?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            multiline
            minRows={3}
            helperText={`${description.length}/500`}
            sx={{
              mb: 3,
              '& .MuiFormHelperText-root': {
                textAlign: 'right',
                color: cv.textMuted,
                fontSize: '0.75rem',
                mt: 0.5,
              },
            }}
            slotProps={{
              inputLabel: { shrink: true },
              htmlInput: { maxLength: 500 }
            }}
          />

          <Typography
            variant="caption"
            sx={{
              display: 'block',
              mb: 1.25,
              color: cv.textMuted,
              fontSize: '0.6875rem',
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}
          >
            Workspace color
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.25 }}>
            {WORKSPACE_COLORS.map((option) => {
              const isSelected = option.value === color;
              return (
                <Box
                  key={option.id}
                  component="button"
                  type="button"
                  aria-label={option.label}
                  title={option.label}
                  onClick={() => setColor(option.value)}
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    border: isSelected
                      ? `2px solid ${cv.textPrimary}`
                      : '2px solid transparent',
                    backgroundColor: option.value,
                    cursor: 'pointer',
                    p: 0,
                    outline: 'none',
                    transition: 'transform 0.15s ease',
                    '&:hover': { transform: 'scale(1.08)' },
                    '&:focus-visible': {
                      outline: `2px solid ${cv.borderFocus}`,
                      outlineOffset: 2,
                    },
                  }}
                />
              );
            })}
            <CustomHexColorPickerButton
              selectedColor={color}
              presetColors={WORKSPACE_COLORS.map((option) => option.value)}
              fallbackColor={DEFAULT_WORKSPACE_COLOR}
              size={32}
              onColorChange={setColor}
            />
          </Box>

          {/* Always show invite section — Guest-only for public, all types for private */}
          <Box sx={{ mt: 3 }}>
            <Box
              sx={{
                p: 1.5,
                mb: 3,
                borderRadius: '12px',
                border: `1px solid ${cv.border}`,
                backgroundColor: cv.surfaceSubtle,
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: 1.5,
              }}
            >
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: cv.textPrimary }}>
                  Make Restricted
                </Typography>
                <Typography sx={{ mt: 0.35, fontSize: '0.8125rem', color: cv.textSecondary, lineHeight: 1.5 }}>
                  Only people directly invited to the workspace can access, plus admins.
                </Typography>
              </Box>
              <Switch
                checked={isRestricted}
                disabled={isEdit} // Admin cannot change private/public in edit mode per user request
                onChange={(event) => {
                  setIsRestricted(event.target.checked);
                  // When switching to public, force Guest-only mode
                  if (!event.target.checked) setInviteMemberType('Guest');
                }}
                slotProps={{ input: { 'aria-label': 'Make workspace restricted' } }}
              />
            </Box>

            {isEdit && initialWorkspace?.teamMembers && initialWorkspace.teamMembers.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography
                  sx={{
                    fontSize: '0.6875rem',
                    fontWeight: 600,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    color: cv.textMuted,
                    mb: 1.25,
                  }}
                >
                  Existing team members
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <TeamMemberAvatarStack 
                    members={
                      isRestricted 
                        ? initialWorkspace.teamMembers 
                        : initialWorkspace.teamMembers.filter(m => m.memberType === 'Guest' || m.isCurrentUser) // keep guest and current admin
                    } 
                    max={10} 
                  />
                </Box>
              </Box>
            )}

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
                suggestedUsers={orgUsersList}
                suggestedGroups={orgGroupsList}
                onGuestSearch={handleGuestSearch}
                sendInviteEmail={inviteSendEmail}
                onSendInviteEmailChange={setInviteSendEmail}
                allowedTypes={isRestricted ? ['Member', 'Guest', 'Group'] : ['Guest']}
                description={isRestricted
                  ? 'Optional — invite people or groups to join this workspace.'
                  : 'Invite guests from other organizations to access this public workspace.'}
              />
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3, pt: 1, gap: 1 }}>
          <Button
            onClick={onClose}
            sx={{
              color: cv.textSecondary,
              borderRadius: '10px',
              '&:hover': { backgroundColor: cv.surfaceHover },
            }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={!name.trim()}
            sx={{
              borderRadius: '10px',
              px: 2.5,
              background: cv.brandGradient,
              boxShadow: cv.brandShadow,
              '&:hover': {
                background: cv.brandGradientHover,
              },
              '&.Mui-disabled': {
                background: cv.surfaceRaised,
                color: cv.textMuted,
              },
            }}
          >
            {isEdit ? 'Save changes' : 'Create workspace'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}

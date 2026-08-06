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
} from '@mui/material';
import { DEFAULT_WORKSPACE_COLOR, WORKSPACE_COLORS } from '../../constants/workspaceColors';
import InvitePeopleFields from '../settings/InvitePeopleFields';
import CustomHexColorPickerButton from './CustomHexColorPickerButton';
import { MOCK_SETTINGS_USER_GROUPS } from '../../data/mockSettingsData';
import { fetchOrganizationUsers } from '../../api/auth.service';
import type { WorkspaceMemberAccess, WorkspaceMemberType } from '../../data/mockSettingsData';

export interface CreateWorkspaceFormData {
  name: string;
  description: string;
  color: string;
  inviteEmails?: string[];
  inviteGroupIds?: string[];
}

interface CreateWorkspaceModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (data: CreateWorkspaceFormData) => void;
  onSave?: (data: CreateWorkspaceFormData) => void;
  initialWorkspace?: { name: string; description?: string; color?: string };
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
  const [inviteEmails, setInviteEmails] = useState<string[]>([]);
  const [inviteGroupIds, setInviteGroupIds] = useState<string[]>([]);
  const [inviteMemberType, setInviteMemberType] = useState<WorkspaceMemberType>('Member');
  const [inviteAccess, setInviteAccess] = useState<WorkspaceMemberAccess>('Full Access');
  const [orgUsersList, setOrgUsersList] = useState<import('../../data/mockSettingsData').SettingsUserRow[]>([]);

  useEffect(() => {
    if (!open) return;
    if (initialWorkspace) {
      setName(initialWorkspace.name);
      setDescription(initialWorkspace.description ?? '');
      setColor(initialWorkspace.color ?? DEFAULT_WORKSPACE_COLOR);
      setInviteEmails([]);
      setInviteGroupIds([]);
      return;
    }
    setName('');
    setDescription('');
    setColor(DEFAULT_WORKSPACE_COLOR);
    setInviteEmails([]);
    setInviteGroupIds([]);
    setInviteMemberType('Member');
    setInviteAccess('Full Access');

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
    }
  }, [open, initialWorkspace, isEdit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const payload = {
      name: name.trim(),
      description: description.trim(),
      color,
      inviteEmails,
      inviteGroupIds,
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

          {!isEdit ? (
          <Box sx={{ mt: 3 }}>
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
              suggestedGroups={MOCK_SETTINGS_USER_GROUPS}
              description="Optional — invite people or groups to join this workspace."
            />
          </Box>
          ) : null}
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

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { cv } from '../../theme/cssVars';
import {
  Avatar,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import LinkOutlinedIcon from '@mui/icons-material/LinkOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import { noahDialogSlotProps, noahNestedDialogSlotProps } from '../../constants/dialogStyles';
import { selectInDialogMenuProps } from '../../constants/dropdownMenu';
import { CURRENT_USER } from '../../constants/currentUser';
import ProjectVisibilityPicker from './ProjectVisibilityPicker';
import ShareLinksSection from '../media/ShareLinksSection';
import ShareLinksEmptyState from '../media/ShareLinksEmptyState';
import { copyProjectShareLink, getProjectShareLink, getWorkspaceShareLink } from '../../utils/projectShareLink';
import {
  TeamMemberAvatarStack,
} from '../common/TeamMemberAvatarStack';
import type {
  ProjectVisibility,
  SettingsUserGroup,
  WorkspaceInvitePayload,
  WorkspaceMemberAccess,
  WorkspaceMemberType,
  WorkspaceTeamMember,
} from '../../data/mockSettingsData';
import type { SettingsUserRow } from '../../data/mockSettingsData';
import { MOCK_SETTINGS_USER_GROUPS, MOCK_SETTINGS_GUEST_USERS } from '../../data/mockSettingsData';
import type { ShareLink } from '../../types/shareLink';
import {
  getMemberTypeManageSubtitle,
  isOrganizationEmail,
  isOrganizationUser,
  ORGANIZATION_EMAIL_DOMAIN,
} from '../../constants/memberTypeDetails';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type InviteTypeaheadOption =
  | { kind: 'user'; id: string; user: SettingsUserRow }
  | { kind: 'group'; id: string; group: SettingsUserGroup };

const ACCESS_OPTIONS: WorkspaceMemberAccess[] = ['Full Access', 'Can edit', 'Can view'];

const inlineAccessSelectSx = {
  fontSize: '0.8125rem',
  color: cv.textSecondary,
  minWidth: 108,
  '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
  '&:hover .MuiOutlinedInput-notchedOutline': { border: 'none' },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { border: 'none' },
  '& .MuiSelect-select': {
    py: 0.5,
    pl: 1.25,
    pr: '28px !important',
    borderLeft: `1px solid ${cv.border}`,
    display: 'flex',
    alignItems: 'center',
  },
};

const dialogSelectSx = {
  borderRadius: '10px',
  fontSize: '0.8125rem',
  color: cv.textPrimary,
  minWidth: 130,
  '& .MuiOutlinedInput-notchedOutline': { borderColor: cv.border },
  '& .MuiSelect-select': { py: 0.75 },
};

const containedButtonSx = {
  textTransform: 'none' as const,
  borderRadius: '10px',
  background: cv.brandGradient,
  boxShadow: 'none',
  '&:hover': { boxShadow: 'none', opacity: 0.92 },
  '&.Mui-disabled': {
    background: cv.surfaceRaised,
    color: cv.textMuted,
  },
};

const shareLinkPanelSx = {
  flexShrink: 0,
  width: { xs: '100%', md: '38%' },
  minWidth: { md: 260 },
  maxWidth: { md: 340 },
  px: 2.5,
  py: 2,
  borderBottom: { xs: `1px solid ${cv.divider}`, md: 'none' },
  borderRight: { md: `1px solid ${cv.divider}` },
  backgroundColor: { md: cv.panelTint },
};

const shareMainPanelSx = {
  flex: 1,
  minWidth: 0,
  px: 2.5,
  py: 2,
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
};

const shareDialogBodySx = {
  display: 'flex',
  flexDirection: { xs: 'column', md: 'row' },
  alignItems: 'stretch',
};

interface WorkspaceMembersDialogProps {
  open: boolean;
  workspaceName: string;
  members: WorkspaceTeamMember[];
  suggestedUsers: SettingsUserRow[];
  suggestedGroups?: SettingsUserGroup[];
  isRestricted?: boolean;
  resourceType?: 'workspace' | 'project';
  visibility?: ProjectVisibility;
  shareLinks?: ShareLink[];
  activeShareLinkId?: string | null;
  focusLinkNameCounter?: number;
  onNewShareLink?: (options: { name: string; visibility: ProjectVisibility }) => void;
  onShareLinkSelect?: (link: ShareLink) => void;
  onShareLinkDelete?: (link: ShareLink) => void;
  onShareLinkCopy?: (link: ShareLink) => void;
  onShareLinkNameChange?: (linkId: string, name: string) => void;
  onShareLinkSettingsSaved?: () => void;
  /** Resource id for invite-only modals (no share links panel) — enables header copy link. */
  resourceId?: string;
  onCopyLink?: () => void;
  onClose: () => void;
  onInvite: (payload: WorkspaceInvitePayload) => boolean;
  onUpdateMemberAccess: (memberId: string, access: WorkspaceMemberAccess) => void;
  onRemoveMember?: (memberId: string) => void;
  onRestrictedChange: (restricted: boolean) => void;
  onVisibilityChange?: (visibility: ProjectVisibility) => void;
}

function MemberAvatar({
  member,
  size = 28,
}: {
  member: Pick<WorkspaceTeamMember, 'initials' | 'avatarUrl' | 'name'>;
  size?: number;
}) {
  return (
    <Avatar
      src={member.avatarUrl}
      alt={member.name}
      sx={{
        width: size,
        height: size,
        fontSize: size <= 28 ? '0.6875rem' : '0.75rem',
        fontWeight: 700,
        bgcolor: cv.indigo,
      }}
    >
      {member.initials}
    </Avatar>
  );
}

export default function WorkspaceMembersDialog({
  open,
  workspaceName,
  members,
  suggestedUsers,
  suggestedGroups = MOCK_SETTINGS_USER_GROUPS,
  isRestricted = false,
  resourceType = 'workspace',
  visibility = 'private',
  shareLinks,
  activeShareLinkId,
  focusLinkNameCounter = 0,
  onNewShareLink,
  onShareLinkSelect,
  onShareLinkDelete,
  onShareLinkCopy,
  onShareLinkNameChange,
  onShareLinkSettingsSaved,
  resourceId,
  onCopyLink,
  onClose,
  onInvite,
  onUpdateMemberAccess,
  onRemoveMember,
  onRestrictedChange,
  onVisibilityChange,
}: WorkspaceMembersDialogProps) {
  const [query, setQuery] = useState('');
  const [access, setAccess] = useState<WorkspaceMemberAccess>('Full Access');
  const [error, setError] = useState('');
  const [typeaheadOpen, setTypeaheadOpen] = useState(false);
  const [pendingGuestInvite, setPendingGuestInvite] = useState<{
    email: string;
    name?: string;
  } | null>(null);
  const [pendingMemberRemove, setPendingMemberRemove] = useState<WorkspaceTeamMember | null>(null);
  const [pendingShareLinkDelete, setPendingShareLinkDelete] = useState<ShareLink | null>(null);
  const [shareLinkCopied, setShareLinkCopied] = useState(false);
  const [linkNameInput, setLinkNameInput] = useState('');
  const [isEditingShareLink, setIsEditingShareLink] = useState(false);
  const [draftVisibility, setDraftVisibility] = useState<ProjectVisibility>('public');
  const linkNameInputRef = useRef<HTMLInputElement>(null);

  const isProject = resourceType === 'project';
  const showShareLinks = isProject && shareLinks !== undefined;
  const effectiveVisibility = showShareLinks ? draftVisibility : visibility;
  const isPublicProject = isProject && effectiveVisibility === 'public';
  const dialogTitle = isPublicProject ? `Share ${workspaceName}` : `Add to ${workspaceName}`;

  const showMemberInvitePanel = !isPublicProject;
  const hasShareLinks = (shareLinks?.length ?? 0) > 0;

  const activeShareLink = useMemo(
    () => shareLinks?.find((link) => link.id === activeShareLinkId),
    [shareLinks, activeShareLinkId],
  );

  const inviteCopyLinkUrl = useMemo(() => {
    if (!resourceId || showShareLinks) return undefined;
    if (resourceType === 'project') {
      return getProjectShareLink(resourceId, workspaceName);
    }
    if (resourceType === 'workspace') {
      return getWorkspaceShareLink(resourceId, workspaceName);
    }
    return undefined;
  }, [resourceId, resourceType, showShareLinks, workspaceName]);

  const copyableLinkUrl = showShareLinks ? activeShareLink?.url : inviteCopyLinkUrl;
  const showCopyLinkButton = Boolean(copyableLinkUrl);

  useEffect(() => {
    if (!open || isEditingShareLink) return;
    setLinkNameInput(activeShareLink?.name ?? '');
    setDraftVisibility(activeShareLink?.visibility ?? visibility);
  }, [open, activeShareLinkId, activeShareLink?.name, activeShareLink?.visibility, isEditingShareLink, visibility]);

  useEffect(() => {
    if (!open || focusLinkNameCounter <= 0 || !activeShareLink) return;
    setLinkNameInput(activeShareLink.name);
    setDraftVisibility(activeShareLink.visibility);
    setIsEditingShareLink(true);
    const input = linkNameInputRef.current;
    if (!input) return;
    input.focus();
    input.select();
  }, [open, focusLinkNameCounter, activeShareLinkId, activeShareLink]);

  useEffect(() => {
    setShareLinkCopied(false);
  }, [activeShareLinkId]);

  useEffect(() => {
    if (!open) {
      setQuery('');
      setAccess('Full Access');
      setError('');
      setTypeaheadOpen(false);
      setPendingGuestInvite(null);
      setPendingMemberRemove(null);
      setPendingShareLinkDelete(null);
      setShareLinkCopied(false);
      setIsEditingShareLink(false);
    }
  }, [open]);

  const memberEmails = useMemo(
    () => new Set(members.map((member) => member.email?.toLowerCase()).filter(Boolean) as string[]),
    [members],
  );

  const memberGroupIds = useMemo(
    () => new Set(members.map((member) => member.groupId).filter(Boolean) as string[]),
    [members],
  );

  const organizationUsers = useMemo(
    () => suggestedUsers.filter(isOrganizationUser),
    [suggestedUsers],
  );

  const guestUsers = useMemo(() => {
    const externalFromDirectory = suggestedUsers.filter((user) => !isOrganizationUser(user));
    const seen = new Set<string>();
    return [...externalFromDirectory, ...MOCK_SETTINGS_GUEST_USERS].filter((user) => {
      const key = user.email.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [suggestedUsers]);

  const allInviteUsers = useMemo(() => {
    const seen = new Set<string>();
    return [...organizationUsers, ...guestUsers].filter((user) => {
      const key = user.email.toLowerCase();
      if (seen.has(key) || memberEmails.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [organizationUsers, guestUsers, memberEmails]);

  const typeaheadOptions = useMemo((): InviteTypeaheadOption[] => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return [];

    const userOptions = allInviteUsers
      .filter(
        (user) =>
          user.name.toLowerCase().includes(normalizedQuery) ||
          user.email.toLowerCase().includes(normalizedQuery),
      )
      .slice(0, 5)
      .map((user) => ({ kind: 'user' as const, id: `user-${user.id}`, user }));

    const groupOptions = suggestedGroups
      .filter((group) => !memberGroupIds.has(group.id))
      .filter(
        (group) =>
          group.name.toLowerCase().includes(normalizedQuery) ||
          group.description.toLowerCase().includes(normalizedQuery),
      )
      .slice(0, 3)
      .map((group) => ({ kind: 'group' as const, id: `group-${group.id}`, group }));

    return [...userOptions, ...groupOptions];
  }, [query, allInviteUsers, suggestedGroups, memberGroupIds]);

  const showTypeahead = typeaheadOpen && query.trim().length > 0 && typeaheadOptions.length > 0;

  const canAdd = query.trim().length > 0;

  const resolveMemberType = (email: string): WorkspaceMemberType => {
    const normalizedEmail = email.toLowerCase();
    const isOrgInvite =
      isOrganizationEmail(normalizedEmail) ||
      organizationUsers.some((user) => user.email.toLowerCase() === normalizedEmail);
    return isOrgInvite ? 'Member' : 'Guest';
  };

  const inviteGroup = (group: SettingsUserGroup) => {
    const success = onInvite({
      groupId: group.id,
      groupName: group.name,
      memberType: 'Group',
      access,
    });

    if (!success) {
      setError('This group has already been added.');
      return false;
    }

    setQuery('');
    setError('');
    setTypeaheadOpen(false);
    return true;
  };

  const inviteUser = (email: string, name: string | undefined, memberType: WorkspaceMemberType) => {
    const success = onInvite({
      email,
      name,
      memberType,
      access,
    });

    if (!success) {
      setError('This person is already a member.');
      return false;
    }

    setQuery('');
    setError('');
    setTypeaheadOpen(false);
    return true;
  };

  const isExternalEmail = (email: string) => resolveMemberType(email) === 'Guest';

  const beginGuestInvite = (email: string, name?: string) => {
    setPendingGuestInvite({ email, name });
  };

  const confirmGuestInvite = () => {
    if (!pendingGuestInvite) return;
    inviteUser(pendingGuestInvite.email, pendingGuestInvite.name, 'Guest');
    setPendingGuestInvite(null);
  };

  const handleAdd = () => {
    const trimmed = query.trim();
    if (!trimmed) {
      setError('Enter a name, email, or group.');
      return;
    }

    const matchedGroup = suggestedGroups.find(
      (group) =>
        !memberGroupIds.has(group.id) && group.name.toLowerCase() === trimmed.toLowerCase(),
    );
    if (matchedGroup) {
      inviteGroup(matchedGroup);
      return;
    }

    const matchedUser = allInviteUsers.find(
      (user) =>
        user.email.toLowerCase() === trimmed.toLowerCase() ||
        user.name.toLowerCase() === trimmed.toLowerCase(),
    );
    if (matchedUser) {
      if (!isOrganizationUser(matchedUser)) {
        beginGuestInvite(matchedUser.email, matchedUser.name);
        return;
      }
      inviteUser(matchedUser.email, matchedUser.name, 'Member');
      return;
    }

    if (!EMAIL_PATTERN.test(trimmed)) {
      setError('Enter a valid email or choose a person or group from the list.');
      return;
    }

    const email = trimmed.toLowerCase();
    if (isExternalEmail(email)) {
      beginGuestInvite(email);
      return;
    }

    inviteUser(email, undefined, 'Member');
  };

  const handleInviteKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleAdd();
    }
    if (event.key === 'Escape') {
      setTypeaheadOpen(false);
    }
  };

  const handleSelectTypeaheadOption = (option: InviteTypeaheadOption) => {
    if (option.kind === 'group') {
      inviteGroup(option.group);
      return;
    }

    if (!isOrganizationUser(option.user)) {
      beginGuestInvite(option.user.email, option.user.name);
      return;
    }

    inviteUser(option.user.email, option.user.name, 'Member');
  };

  const handleInviteInputBlur = () => {
    window.setTimeout(() => setTypeaheadOpen(false), 120);
  };

  const handleVisibilityChange = (nextVisibility: ProjectVisibility) => {
    onVisibilityChange?.(nextVisibility);
    if (nextVisibility === 'public') {
      setError('');
    }
  };

  const handleShareLinkSelectInternal = (link: ShareLink) => {
    if (isEditingShareLink && link.id !== activeShareLinkId) {
      setIsEditingShareLink(false);
    }
    onShareLinkSelect?.(link);
  };

  const handleShareLinkEdit = (link: ShareLink) => {
    onShareLinkSelect?.(link);
    setLinkNameInput(link.name);
    setDraftVisibility(link.visibility);
    setIsEditingShareLink(true);
    window.setTimeout(() => {
      linkNameInputRef.current?.focus();
      linkNameInputRef.current?.select();
    }, 0);
  };

  const handleCancelShareLinkEdit = () => {
    setLinkNameInput(activeShareLink?.name ?? '');
    setDraftVisibility(activeShareLink?.visibility ?? visibility);
    setIsEditingShareLink(false);
  };

  const handleDraftVisibilityChange = (nextVisibility: ProjectVisibility) => {
    setDraftVisibility(nextVisibility);
    onVisibilityChange?.(nextVisibility);
  };

  const handleShareLinkNameBlur = () => {
    setIsEditingShareLink(false);
  };

  const handleShare = async () => {
    let didSave = false;

    if (showShareLinks && activeShareLinkId) {
      const trimmedName = linkNameInput.trim();
      if (trimmedName && trimmedName !== activeShareLink?.name) {
        onShareLinkNameChange?.(activeShareLinkId, trimmedName);
        didSave = true;
      }

      const currentVisibility = activeShareLink?.visibility ?? visibility;
      if (draftVisibility !== currentVisibility) {
        onVisibilityChange?.(draftVisibility);
        didSave = true;
      }

      if (activeShareLink?.url) {
        const copied = await copyProjectShareLink(activeShareLink.url);
        if (copied) {
          onShareLinkCopy?.(activeShareLink);
        }
      }

      if (didSave) {
        onShareLinkSettingsSaved?.();
      }
    }

    setIsEditingShareLink(false);
    onClose();
  };

  const handleCreateShareLink = () => {
    if (!onNewShareLink) return;
    const trimmed = linkNameInput.trim();
    const isCustomName = Boolean(isEditingShareLink && trimmed && trimmed !== activeShareLink?.name);
    const nextVisibility = isEditingShareLink ? draftVisibility : visibility;
    setIsEditingShareLink(false);
    onNewShareLink({
      name: isCustomName ? trimmed : '',
      visibility: nextVisibility,
    });
  };

  const editingShareLinkId = isEditingShareLink ? activeShareLinkId : null;

  const shareLinkSettingsSection =
    showShareLinks && activeShareLinkId ? (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <TextField
          inputRef={linkNameInputRef}
          fullWidth
          size="small"
          label="Link name"
          placeholder="e.g. client-review"
          value={linkNameInput}
          onChange={(event) => setLinkNameInput(event.target.value)}
          onBlur={handleShareLinkNameBlur}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              void handleShare();
            }
            if (event.key === 'Escape') {
              handleCancelShareLinkEdit();
              linkNameInputRef.current?.blur();
            }
          }}
        />
        <ProjectVisibilityPicker
          value={draftVisibility}
          onChange={handleDraftVisibilityChange}
          publicDescription="Anyone with the link can view this project."
          privateDescription="Only you and invited members can access this project."
        />
      </Box>
    ) : null;

  const visibilitySection =
    isProject && onVisibilityChange && !showShareLinks ? (
    <ProjectVisibilityPicker
      value={visibility}
      onChange={handleVisibilityChange}
      publicDescription="Anyone with the link can view this project."
      privateDescription="Only you and invited members can access this project."
    />
  ) : null;

  const beginMemberRemove = (member: WorkspaceTeamMember) => {
    if (!onRemoveMember) return;
    setPendingMemberRemove(member);
  };

  const confirmMemberRemove = () => {
    if (!pendingMemberRemove || !onRemoveMember) return;
    onRemoveMember(pendingMemberRemove.id);
    setPendingMemberRemove(null);
  };

  const beginShareLinkDelete = (link: ShareLink) => {
    if (!onShareLinkDelete) return;
    setPendingShareLinkDelete(link);
  };

  const confirmShareLinkDelete = () => {
    if (!pendingShareLinkDelete || !onShareLinkDelete) return;
    onShareLinkDelete(pendingShareLinkDelete);
    setPendingShareLinkDelete(null);
  };

  const shareLinksPanel = showShareLinks ? (
    <ShareLinksSection
      shareLinks={shareLinks}
      activeShareLinkId={activeShareLinkId}
      editingShareLinkId={editingShareLinkId}
      onNewShareLink={handleCreateShareLink}
      onShareLinkSelect={handleShareLinkSelectInternal}
      onShareLinkEdit={handleShareLinkEdit}
      onShareLinkDelete={beginShareLinkDelete}
      onShareLinkCopy={onShareLinkCopy}
      scrollable
    />
  ) : null;

  const handleMemberAccessChange = (member: WorkspaceTeamMember, value: string) => {
    onUpdateMemberAccess(member.id, value as WorkspaceMemberAccess);
  };

  const inviteFormSection = showMemberInvitePanel ? (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
      <Box sx={{ position: 'relative', flex: 1, minWidth: 0 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Name, email, or group"
          value={query}
          onChange={(event) => {
            const value = event.target.value;
            setQuery(value);
            setTypeaheadOpen(true);
            if (error) setError('');

            const trimmed = value.trim();
            if (EMAIL_PATTERN.test(trimmed) && isExternalEmail(trimmed)) {
              beginGuestInvite(trimmed.toLowerCase());
            } else {
              setPendingGuestInvite(null);
            }
          }}
          onFocus={() => setTypeaheadOpen(true)}
          onBlur={handleInviteInputBlur}
          onKeyDown={handleInviteKeyDown}
          error={Boolean(error)}
          helperText={error || 'Type to search people and groups, or enter an email to invite.'}
          autoFocus={!showShareLinks}
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end" sx={{ ml: 0, height: '100%' }}>
                  <Select
                    value={access}
                    onChange={(event: SelectChangeEvent) =>
                      setAccess(event.target.value as WorkspaceMemberAccess)
                    }
                    MenuProps={selectInDialogMenuProps}
                    size="small"
                    sx={inlineAccessSelectSx}
                    aria-label="Access level"
                  >
                    {ACCESS_OPTIONS.map((option) => (
                      <MenuItem key={option} value={option} sx={{ fontSize: '0.875rem' }}>
                        {option}
                      </MenuItem>
                    ))}
                  </Select>
                </InputAdornment>
              ),
            },
          }}
        />

        {showTypeahead ? (
          <Box
            role="listbox"
            aria-label="Invite suggestions"
            sx={{
              position: 'absolute',
              top: 'calc(100% + 4px)',
              left: 0,
              right: 0,
              zIndex: 2,
              borderRadius: '10px',
              border: `1px solid ${cv.border}`,
              backgroundColor: cv.dialogSurface,
              boxShadow: '0 12px 32px rgba(0, 0, 0, 0.35)',
              overflow: 'hidden',
              maxHeight: 240,
              overflowY: 'auto',
            }}
          >
            {typeaheadOptions.map((option) =>
              option.kind === 'group' ? (
                <Box
                  key={option.id}
                  component="button"
                  type="button"
                  role="option"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => handleSelectTypeaheadOption(option)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.25,
                    width: '100%',
                    border: 'none',
                    px: 1.25,
                    py: 1,
                    cursor: 'pointer',
                    textAlign: 'left',
                    backgroundColor: 'transparent',
                    '&:hover': { backgroundColor: cv.surfaceHover },
                  }}
                >
                  <Box
                    sx={{
                      width: 28,
                      height: 28,
                      borderRadius: '8px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: cv.indigoSurface,
                      flexShrink: 0,
                    }}
                  >
                    <GroupsOutlinedIcon sx={{ fontSize: 16, color: cv.indigoLight }} />
                  </Box>
                  <Box sx={{ minWidth: 0, flex: 1, overflow: 'hidden' }}>
                    <Typography
                      sx={{
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        color: cv.textPrimary,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {option.group.name}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: '0.75rem',
                        color: cv.textMuted,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {option.group.description}
                    </Typography>
                  </Box>
                </Box>
              ) : (
                <Box
                  key={option.id}
                  component="button"
                  type="button"
                  role="option"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => handleSelectTypeaheadOption(option)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.25,
                    width: '100%',
                    border: 'none',
                    px: 1.25,
                    py: 1,
                    cursor: 'pointer',
                    textAlign: 'left',
                    backgroundColor: 'transparent',
                    '&:hover': { backgroundColor: cv.surfaceHover },
                  }}
                >
                  <MemberAvatar
                    member={{
                      initials: option.user.initials,
                      avatarUrl: option.user.isCurrentUser ? CURRENT_USER.avatarUrl : undefined,
                      name: option.user.name,
                    }}
                  />
                  <Box sx={{ minWidth: 0, flex: 1, overflow: 'hidden' }}>
                    <Typography
                      sx={{
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        color: cv.textPrimary,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {option.user.name}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: '0.75rem',
                        color: cv.textMuted,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {option.user.email}
                    </Typography>
                  </Box>
                </Box>
              ),
            )}
          </Box>
        ) : null}
      </Box>

      <Button
        variant="contained"
        disabled={!canAdd}
        onClick={handleAdd}
        sx={{
          ...containedButtonSx,
          flexShrink: 0,
          minWidth: 88,
          height: 40,
          px: 2,
        }}
      >
        Invite
      </Button>
    </Box>
  ) : null;

  const directAccessSection = showMemberInvitePanel ? (
    <>
      {!isProject ? (
        <Box
          sx={{
            p: 1.5,
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
            onChange={(event) => onRestrictedChange(event.target.checked)}
            slotProps={{ input: { 'aria-label': 'Make workspace restricted' } }}
          />
        </Box>
      ) : null}

      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          overflowY: showShareLinks ? { md: 'auto' } : undefined,
          maxHeight: showShareLinks ? { md: 280 } : undefined,
        }}
      >
        <Typography
          sx={{
            mb: 1,
            fontSize: '0.6875rem',
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: cv.textMuted,
          }}
        >
          Direct access
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {members.map((member) => {
            const memberGroup = member.groupId
              ? suggestedGroups.find((group) => group.id === member.groupId)
              : undefined;
            const memberSubtitle = getMemberTypeManageSubtitle(member, memberGroup);
            const memberTypeLabel =
              member.memberType === 'Group'
                ? 'Group'
                : member.memberType === 'Guest'
                  ? 'Guest'
                  : 'Member';
            const isCurrentMember =
              member.isCurrentUser || member.email?.toLowerCase() === CURRENT_USER.email.toLowerCase();

            return (
            <Box
              key={member.id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 1.5,
                px: 1,
                py: 1,
                borderRadius: '10px',
                '&:hover': { backgroundColor: cv.surfaceHover },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0 }}>
                <MemberAvatar member={member} />
                <Box sx={{ minWidth: 0 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
                    <Typography sx={{ fontSize: '0.875rem', fontWeight: 500, color: cv.textPrimary }}>
                      {member.name}
                      {member.isCurrentUser || member.email === CURRENT_USER.email ? ' (you)' : ''}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: '0.6875rem',
                        fontWeight: 600,
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                        color: cv.textMuted,
                        px: 0.65,
                        py: 0.15,
                        borderRadius: '6px',
                        border: `1px solid ${cv.border}`,
                        backgroundColor: cv.surfaceMuted,
                      }}
                    >
                      {memberTypeLabel}
                    </Typography>
                  </Box>
                  {member.email ? (
                    <Typography sx={{ fontSize: '0.75rem', color: cv.textMuted }}>
                      {member.email}
                    </Typography>
                  ) : null}
                  <Typography sx={{ fontSize: '0.75rem', color: cv.textSecondary, mt: 0.15 }}>
                    {memberSubtitle}
                    {member.memberType === 'Group' && memberGroup
                      ? ` · ${memberGroup.memberIds.length} member${memberGroup.memberIds.length === 1 ? '' : 's'}`
                      : ''}
                  </Typography>
                </Box>
              </Box>
              <FormControl size="small">
                <InputLabel id={`access-${member.id}`} shrink>
                  Access
                </InputLabel>
                <Select
                  labelId={`access-${member.id}`}
                  label="Access"
                  value={member.access ?? 'Full Access'}
                  onChange={(event: SelectChangeEvent) =>
                    handleMemberAccessChange(member, event.target.value)
                  }
                  MenuProps={selectInDialogMenuProps}
                  sx={{ ...dialogSelectSx, minWidth: 140 }}
                >
                  {ACCESS_OPTIONS.map((option) => (
                    <MenuItem key={option} value={option} sx={{ fontSize: '0.875rem' }}>
                      {option}
                    </MenuItem>
                  ))}
                  {onRemoveMember && !isCurrentMember ? (
                    <>
                      <Divider sx={{ my: 0.5, borderColor: cv.divider }} />
                      <MenuItem
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => beginMemberRemove(member)}
                        sx={{ fontSize: '0.875rem', color: cv.destructive }}
                      >
                        Remove
                      </MenuItem>
                    </>
                  ) : null}
                </Select>
              </FormControl>
            </Box>
            );
          })}
        </Box>
      </Box>
    </>
  ) : null;

  const memberAccessPanel = showMemberInvitePanel ? (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {inviteFormSection}
      {directAccessSection}
    </Box>
  ) : null;

  const footerMembersSummary =
    showMemberInvitePanel ? (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0 }}>
        <TeamMemberAvatarStack members={members} borderColor={cv.dialogSurface} />
        <Typography sx={{ fontSize: '0.875rem', color: cv.textPrimary }}>
          {members.length} Member{members.length === 1 ? '' : 's'}
        </Typography>
      </Box>
    ) : null;

  const dialogFooter = (
    <Box
      sx={{
        borderTop: `1px solid ${cv.divider}`,
        px: 2.5,
        py: 1.5,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 2,
      }}
    >
      {footerMembersSummary ?? <Box />}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
        <Button onClick={onClose} sx={{ textTransform: 'none', color: cv.textSecondary }}>
          Cancel
        </Button>
        <Button variant="contained" onClick={() => void handleShare()} sx={containedButtonSx}>
          Done
        </Button>
      </Box>
    </Box>
  );

  const handleCopyActiveShareLink = async () => {
    if (!copyableLinkUrl) return;
    const copied = await copyProjectShareLink(copyableLinkUrl);
    if (!copied) return;
    if (showShareLinks && activeShareLink) {
      onShareLinkCopy?.(activeShareLink);
    } else {
      onCopyLink?.();
    }
    setShareLinkCopied(true);
    window.setTimeout(() => setShareLinkCopied(false), 2000);
  };

  const dialogHeader = (
    <Box
      sx={{
        px: 2.5,
        pt: 2.5,
        pb: 1.5,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: showShareLinks || showCopyLinkButton ? `1px solid ${cv.divider}` : 'none',
      }}
    >
      <Typography
        id="workspace-members-dialog-title"
        sx={{ fontWeight: 600, fontSize: '1.125rem', color: cv.textPrimary }}
      >
        {dialogTitle}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
        {showCopyLinkButton ? (
          <Button
            size="small"
            startIcon={
              shareLinkCopied ? undefined : <LinkOutlinedIcon sx={{ fontSize: 16 }} />
            }
            onClick={() => void handleCopyActiveShareLink()}
            sx={{
              textTransform: 'none',
              fontWeight: 500,
              fontSize: '0.8125rem',
              color: shareLinkCopied ? cv.purpleLight : cv.textSecondary,
              borderRadius: '8px',
              px: 1.25,
              py: 0.5,
              minWidth: 'auto',
              '&:hover': {
                color: cv.textPrimary,
                backgroundColor: cv.surfaceHover,
              },
            }}
          >
            {shareLinkCopied ? 'Link Copied!' : 'Copy link'}
          </Button>
        ) : null}
        <IconButton aria-label="Close" onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </Box>
    </Box>
  );

  const dialogContent = showShareLinks ? (
    <>
      {dialogHeader}
      {!hasShareLinks ? (
        <Box sx={{ px: 2.5, py: 2 }}>
          <ShareLinksEmptyState onNewShareLink={handleCreateShareLink} />
        </Box>
      ) : (
        <Box sx={{ ...shareDialogBodySx, minHeight: { md: showMemberInvitePanel ? 460 : 260 } }}>
          <Box sx={shareLinkPanelSx}>{shareLinksPanel}</Box>
          <Box sx={shareMainPanelSx}>
            {shareLinkSettingsSection}
            {memberAccessPanel}
          </Box>
        </Box>
      )}
      {hasShareLinks ? dialogFooter : null}
    </>
  ) : (
    <>
      {dialogHeader}
      <Box sx={{ px: 2.5, py: 2, pb: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {visibilitySection}
        {memberAccessPanel}
      </Box>
      {dialogFooter}
    </>
  );

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        fullWidth
        maxWidth={showShareLinks ? 'md' : 'sm'}
        aria-labelledby="workspace-members-dialog-title"
        slotProps={noahDialogSlotProps({ overflow: 'visible' })}
      >
        <Box sx={{ backgroundColor: cv.dialogSurface }}>{dialogContent}</Box>
      </Dialog>

      <Dialog
        open={Boolean(pendingGuestInvite)}
        onClose={() => setPendingGuestInvite(null)}
        maxWidth="xs"
        fullWidth
        aria-labelledby="guest-invite-warning-title"
        slotProps={noahNestedDialogSlotProps()}
      >
        <DialogTitle id="guest-invite-warning-title" sx={{ color: cv.textPrimary, fontWeight: 600 }}>
          Outside organization
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: cv.textSecondary, fontSize: '0.9375rem', lineHeight: 1.55 }}>
            {pendingGuestInvite?.name ? (
              <>
                <Box component="span" sx={{ color: cv.textPrimary, fontWeight: 600 }}>
                  {pendingGuestInvite.name}
                </Box>{' '}
                ({pendingGuestInvite.email})
              </>
            ) : (
              <Box component="span" sx={{ color: cv.textPrimary, fontWeight: 600 }}>
                {pendingGuestInvite?.email}
              </Box>
            )}{' '}
            is outside your organization ({ORGANIZATION_EMAIL_DOMAIN}). They will be invited as a guest.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, pt: 0, gap: 1 }}>
          <Button
            onClick={() => setPendingGuestInvite(null)}
            sx={{ textTransform: 'none', color: cv.textSecondary }}
          >
            Cancel
          </Button>
          <Button variant="contained" onClick={confirmGuestInvite} sx={containedButtonSx}>
            Continue
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(pendingMemberRemove)}
        onClose={() => setPendingMemberRemove(null)}
        maxWidth="xs"
        fullWidth
        aria-labelledby="member-remove-confirm-title"
        slotProps={noahNestedDialogSlotProps()}
      >
        <DialogTitle id="member-remove-confirm-title" sx={{ color: cv.textPrimary, fontWeight: 600 }}>
          Remove access?
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: cv.textSecondary, fontSize: '0.9375rem', lineHeight: 1.55 }}>
            Remove{' '}
            <Box component="span" sx={{ color: cv.textPrimary, fontWeight: 600 }}>
              {pendingMemberRemove?.name}
            </Box>
            {pendingMemberRemove?.email ? ` (${pendingMemberRemove.email})` : ''} from{' '}
            <Box component="span" sx={{ color: cv.textPrimary, fontWeight: 600 }}>
              {workspaceName}
            </Box>
            ? They will lose access to this {isProject ? 'project' : 'workspace'}.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, pt: 0, gap: 1 }}>
          <Button
            onClick={() => setPendingMemberRemove(null)}
            sx={{ textTransform: 'none', color: cv.textSecondary }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={confirmMemberRemove}
            sx={{
              textTransform: 'none',
              borderRadius: '10px',
              backgroundColor: cv.destructive,
              boxShadow: 'none',
              '&:hover': { backgroundColor: cv.destructiveStrong, boxShadow: 'none' },
            }}
          >
            Remove
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(pendingShareLinkDelete)}
        onClose={() => setPendingShareLinkDelete(null)}
        maxWidth="xs"
        fullWidth
        aria-labelledby="share-link-delete-confirm-title"
        slotProps={noahNestedDialogSlotProps()}
      >
        <DialogTitle id="share-link-delete-confirm-title" sx={{ color: cv.textPrimary, fontWeight: 600 }}>
          Delete share link?
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: cv.textSecondary, fontSize: '0.9375rem', lineHeight: 1.55 }}>
            Delete{' '}
            <Box component="span" sx={{ color: cv.textPrimary, fontWeight: 600 }}>
              {pendingShareLinkDelete?.name}
            </Box>
            ? Anyone using this link will lose access immediately.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, pt: 0, gap: 1 }}>
          <Button
            onClick={() => setPendingShareLinkDelete(null)}
            sx={{ textTransform: 'none', color: cv.textSecondary }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={confirmShareLinkDelete}
            sx={{
              textTransform: 'none',
              borderRadius: '10px',
              backgroundColor: cv.destructive,
              boxShadow: 'none',
              '&:hover': { backgroundColor: cv.destructiveStrong, boxShadow: 'none' },
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

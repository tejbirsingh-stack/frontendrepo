import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { cv } from '../../theme/cssVars';
import {
  Avatar,
  Box,
  Button,
  Checkbox,
  Chip,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';
import AutorenewOutlinedIcon from '@mui/icons-material/AutorenewOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import SendOutlinedIcon from '@mui/icons-material/SendOutlined';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import CircularProgress from '@mui/material/CircularProgress';
import { useLocalizedDate } from '../../hooks/useLocalizedDate';
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
  createShareLinkApi,
  getShareLinksApi,
  deleteShareLinkApi,
  type BackendShareLink,
} from '../../api/share.service';
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

// Dynamic options fetched from API

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
  onShareLinkPermissionsChange?: (linkId: string, permissions: any) => void;
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
  onShareLinkPermissionsChange,
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
  const { formatDateTime } = useLocalizedDate();
  const [query, setQuery] = useState('');
  const [access, setAccess] = useState<WorkspaceMemberAccess>('Can view');
  const [error, setError] = useState('');
  const [sendInviteEmail, setSendInviteEmail] = useState(true);
  const [typeaheadOpen, setTypeaheadOpen] = useState(false);
  // External email — single recipient for secure share
  const [pendingExternalEmail, setPendingExternalEmail] = useState<string | null>(null);
  const [pendingExternalName, setPendingExternalName] = useState<string | undefined>(undefined);
  const [pendingExternalUserId, setPendingExternalUserId] = useState<string | undefined>(undefined);
  // Real API share links state
  const [apiShareLinks, setApiShareLinks] = useState<BackendShareLink[]>([]);
  const [isSubmittingInvite, setIsSubmittingInvite] = useState(false);
  // Secure share dialog state
  const [secureShareOpen, setSecureShareOpen] = useState(false);
  const [shareExpiry, setShareExpiry] = useState<'7' | '15' | '30' | 'custom'>('7');
  const [shareCustomDate, setShareCustomDate] = useState('');
  const [sharePermComment, setSharePermComment] = useState(false);
  const [sharePermDownload, setSharePermDownload] = useState(false);
  const [sharePermDownloadProxy, setSharePermDownloadProxy] = useState(false);
  const [sharePermWatermark, setSharePermWatermark] = useState(true);
  const [shareRequirePassword, setShareRequirePassword] = useState(false);
  const [sharePassword, setSharePassword] = useState('');
  const [sharePasswordVisible, setSharePasswordVisible] = useState(false);
  const [sharePasswordCopied, setSharePasswordCopied] = useState(false);
  
  // Organization Share Settings State for locking UI
  const [orgShareSettings, setOrgShareSettings] = useState<any>(null);

  const [accessOptions, setAccessOptions] = useState<any[]>([]);
  useEffect(() => {
    const fetchAccessLevels = async () => {
      try {
        const { apiClient } = await import('../../api/client');
        const token = localStorage.getItem('token');
        const res = await (apiClient as any).get('/workspaces/access-levels', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const rawData = res?.data || res;
        const data = Array.isArray(rawData) ? rawData : (rawData?.data || []);
        if (Array.isArray(data)) {
          setAccessOptions(data);
          const defaultCanView = data.find((o: any) => o.name === 'CAN_VIEW' || o.title === 'Can View');
          if (defaultCanView) {
            setAccess((current) => {
              if (!current || current === 'Can view' || current === 'Can View' || current === 'Viewer') {
                return defaultCanView.id as WorkspaceMemberAccess;
              }
              return current;
            });
          }
        }
      } catch (err) {
        console.error('Failed to fetch access levels:', err);
      }
    };
    if (open) {
      fetchAccessLevels();
    }
  }, [open]);

  const [selectedVisibility, setSelectedVisibility] = useState<ProjectVisibility>(visibility);
  const [showVisibilityConfirm, setShowVisibilityConfirm] = useState(false);

  useEffect(() => {
    if (open) {
      setSelectedVisibility(visibility);
    }
  }, [open, visibility]);

  useEffect(() => {
    if (secureShareOpen) {
      import('../../api/client').then(({ apiClient }) => {
        apiClient.get<any>('/organizations/share-settings')
          .then(res => {
            const settings = res.data || res;
            setOrgShareSettings(settings);
            
            if (settings.defaultExpiryDays) {
              const daysStr = String(settings.defaultExpiryDays);
              if (['7', '15', '30'].includes(daysStr)) {
                setShareExpiry(daysStr as any);
              } else {
                setShareExpiry('custom');
              }
            }
            if (settings.requirePasswordDefault !== undefined) {
              setShareRequirePassword(settings.requirePasswordDefault);
            }
            if (settings.allowCommentsDefault !== undefined) {
              setSharePermComment(settings.allowCommentsDefault);
            }
            if (settings.allowDownloadOriginalDefault !== undefined) {
              setSharePermDownload(settings.allowDownloadOriginalDefault);
            }
            if (settings.allowDownloadProxyDefault !== undefined) {
              setSharePermDownloadProxy(settings.allowDownloadProxyDefault);
            }
            if (settings.showCompanyWatermarkDefault !== undefined) {
              setSharePermWatermark(settings.showCompanyWatermarkDefault);
            }
          })
          .catch(err => console.error("Failed to load share settings", err));
      });
    } else {
      setOrgShareSettings(null); // clear when closed
    }
  }, [secureShareOpen]);

  // Legacy state
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
  const hasShareLinks = (shareLinks?.length ?? 0) > 0 || (apiShareLinks?.length ?? 0) > 0;
  const activeShareLink = useMemo(
    () => shareLinks?.find((link) => link.id === activeShareLinkId),
    [shareLinks, activeShareLinkId],
  );

  const activeAssetId = resourceId || activeShareLink?.assetId || (shareLinks && shareLinks[0]?.assetId);

  // Fetch real DB share links when dialog opens or asset changes
  const fetchBackendShareLinks = async () => {
    const targetAssetId = activeAssetId || resourceId;
    if (!targetAssetId) return;
    try {
      const res: any = await getShareLinksApi(targetAssetId);
      const linksArray = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
      setApiShareLinks(linksArray);
    } catch (err) {
      console.error('Failed to fetch backend share links:', err);
    }
  };

  useEffect(() => {
    if (open) {
      void fetchBackendShareLinks();
    }
  }, [open, activeAssetId, resourceId]);

  // Extract non-expired guest invites for listing below org members
  const guestInvitesList = useMemo(() => {
    const now = new Date();
    const list: Array<{
      id: string;
      email: string;
      expiresAt?: string;
      permissions: any;
      hasPassword: boolean;
      linkId: string;
    }> = [];

    const processLink = (link: any) => {
      if (!link) return;
      if (link.expiresAt && new Date(link.expiresAt) <= now) return;
      if (link.revokedAt) return;

      if (Array.isArray(link.recipients) && link.recipients.length > 0) {
        link.recipients.forEach((r: any) => {
          const email = typeof r === 'string' ? r : r?.email;
          if (email && !list.some((item) => item.email.toLowerCase() === email.toLowerCase())) {
            list.push({
              id: r.id || `${link.id}-${email}`,
              email: email,
              expiresAt: link.expiresAt,
              permissions: link.permissions,
              hasPassword: Boolean(link.hasPassword || link.passwordHash),
              linkId: link.id,
            });
          }
        });
      } else if (link.mode === 'email' || link.recipientEmail || link.email) {
        const email = link.recipientEmail || link.email || 'Guest (External)';
        if (!list.some((item) => item.email.toLowerCase() === email.toLowerCase())) {
          list.push({
            id: link.id,
            email: email,
            expiresAt: link.expiresAt,
            permissions: link.permissions,
            hasPassword: Boolean(link.hasPassword || link.passwordHash),
            linkId: link.id,
          });
        }
      }
    };

    apiShareLinks.forEach(processLink);
    if (Array.isArray(shareLinks)) {
      shareLinks.forEach(processLink);
    }

    return list;
  }, [apiShareLinks, shareLinks]);

  // Filter out individual email share links from general share links list (left panel)
  const visibleShareLinks = useMemo(() => {
    return (shareLinks || []).filter((link) => link.mode !== 'email');
  }, [shareLinks]);

  // Filter direct access members so guests are exclusively listed in guestInvitesList section below
  const directAccessOrgMembers = useMemo(() => {
    return members.filter((member) => {
      if (
        member.email &&
        guestInvitesList.some((g) => g.email.toLowerCase() === member.email?.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [members, guestInvitesList]);

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
  const showCopyLinkButton = false;

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
      setAccess('Can view');
      setError('');
      setSendInviteEmail(false);
      setTypeaheadOpen(false);
      setPendingExternalEmail(null);
      setPendingExternalName(undefined);
      setPendingExternalUserId(undefined);
      setSecureShareOpen(false);
      setShareExpiry('7');
      setShareCustomDate('');
      setSharePermComment(false);
      setSharePermDownload(false);
      setSharePermDownloadProxy(false);
      setShareRequirePassword(false);
      setSharePassword('');
      setSharePasswordVisible(false);
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
    return [...externalFromDirectory].filter((user) => {
      const key = user.email.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [suggestedUsers]);

  // --- Live API Search State ---
  const [searchResults, setSearchResults] = useState<InviteTypeaheadOption[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // resourceId is the workspaceId passed in — used for the search API
  const workspaceSearchId = resourceId;

  // Debounced live search — only fires for private workspaces
  useEffect(() => {
    const trimmed = query.trim();

    // Public workspace: no recommendations at all
    if (!isRestricted && effectiveVisibility !== 'private') {
      setSearchResults([]);
      return;
    }

    if (!trimmed || !workspaceSearchId) {
      setSearchResults([]);
      return;
    }

    const delay = window.setTimeout(async () => {
      setIsSearching(true);
      try {
        const { apiClient } = await import('../../api/client');
        const token = localStorage.getItem('token');
        const res = await (apiClient as any).get(
          `/workspaces/${workspaceSearchId}/member/search?q=${encodeURIComponent(trimmed)}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = res?.data ?? res;

        const userOptions: InviteTypeaheadOption[] = (data.users || [])
          .filter((u: any) => !memberEmails.has(u.email?.toLowerCase()))
          .slice(0, 5)
          .map((u: any) => ({
            kind: 'user' as const,
            id: `user-${u.id}`,
            user: {
              id: u.id,
              name: u.name,
              email: u.email,
              initials: (u.name || u.email)
                .split(/\s+/).filter(Boolean).slice(0, 2)
                .map((p: string) => p[0]?.toUpperCase() ?? '')
                .join('') || u.email[0]?.toUpperCase() || 'U',
              lastActive: '',
              joinedDate: '',
              role: 'Collaborator' as any,
              status: 'Active' as any,
              isOrganizationMember: true,
            }
          }));

        const groupOptions: InviteTypeaheadOption[] = (data.groups || [])
          .filter((g: any) => !memberGroupIds.has(g.id))
          .slice(0, 3)
          .map((g: any) => ({
            kind: 'group' as const,
            id: `group-${g.id}`,
            group: { id: g.id, name: g.name, description: g.description || '', memberIds: [] }
          }));

        setSearchResults([...userOptions, ...groupOptions]);
      } catch (err) {
        console.error('Member search failed:', err);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => window.clearTimeout(delay);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, workspaceSearchId, isRestricted, effectiveVisibility]);

  // Clear results when dialog closes
  useEffect(() => {
    if (!open) setSearchResults([]);
  }, [open]);

  const showTypeahead = typeaheadOpen && searchResults.length > 0;

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
      sendInviteEmail,
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

  const inviteUser = (email: string, name: string | undefined, memberType: WorkspaceMemberType, userId?: string) => {
    const success = onInvite({
      userId,
      email,
      name,
      memberType,
      access,
      sendInviteEmail,
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

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
    const arr = Array.from(crypto.getRandomValues(new Uint8Array(16)));
    return arr.map((b) => chars[b % chars.length]).join('');
  };

  const openSecureShare = (email: string, name?: string, userId?: string) => {
    setPendingExternalEmail(email);
    setPendingExternalName(name);
    setPendingExternalUserId(userId);
    setQuery('');
    setError('');
    setTypeaheadOpen(false);
    setSecureShareOpen(true);
  };

  const handleAdd = async () => {
    const trimmed = query.trim();
    if (!trimmed) {
      setError('Enter a name, email, or group.');
      return;
    }

    const matchedGroup = (isRestricted ? suggestedGroups : []).find(
      (group) =>
        !memberGroupIds.has(group.id) && group.name.toLowerCase() === trimmed.toLowerCase(),
    );
    if (matchedGroup) {
      inviteGroup(matchedGroup);
      return;
    }

    const matchedUser = suggestedUsers.find(
      (user) =>
        user.email.toLowerCase() === trimmed.toLowerCase() ||
        user.name.toLowerCase() === trimmed.toLowerCase(),
    );
    if (matchedUser) {
      const memberType = isOrganizationUser(matchedUser) ? 'Member' : 'Guest';
      if (!(isRestricted || effectiveVisibility === 'private') && memberType === 'Member') {
        setError('Organization members already have access to this public workspace.');
        return;
      }
      if (memberType === 'Guest') {
        openSecureShare(matchedUser.email, matchedUser.name, matchedUser.id);
        return;
      }
      inviteUser(matchedUser.email, matchedUser.name, memberType, matchedUser.id);
      return;
    }

    if (!EMAIL_PATTERN.test(trimmed)) {
      setError('Enter a valid email or choose a person or group from the list.');
      return;
    }

    const email = trimmed.toLowerCase();
    const memberType = resolveMemberType(email);
    if (!(isRestricted || effectiveVisibility === 'private') && memberType === 'Member') {
      setError('Organization members already have access to this public workspace.');
      return;
    }
    if (memberType === 'Guest') {
      try {
        const { apiClient } = await import('../../api/client');
        const token = localStorage.getItem('token');
        const response = await (apiClient as any).get(`/workspaces/validate-guest?email=${encodeURIComponent(email)}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = response.data ?? response;
        if (data?.valid === false && data?.reason?.includes('already a member of your organization')) {
          setError(data.reason);
          return;
        }
        openSecureShare(email, data?.user?.name, data?.user?.id);
        return;
      } catch (err) {
        // Fallback below
      }
      openSecureShare(email);
      return;
    }
    inviteUser(email, undefined, memberType);
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

    // All search results come from the same org (private workspace only), so always 'Member'
    const memberType: WorkspaceMemberType = option.user.isOrganizationMember ? 'Member' : 'Guest';
    inviteUser(option.user.email, option.user.name, memberType, option.user.id.replace('user-', ''));
  };

  const handleInviteInputBlur = () => {
    window.setTimeout(() => setTypeaheadOpen(false), 120);
  };

  const handleVisibilityChange = (nextVisibility: ProjectVisibility) => {
    setSelectedVisibility(nextVisibility);
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
  };

  const handleShareLinkNameBlur = () => {
    setIsEditingShareLink(false);
  };

  const confirmVisibilityChange = () => {
    onVisibilityChange?.(selectedVisibility);
    setShowVisibilityConfirm(false);
    setIsEditingShareLink(false);
    onClose();
  };

  const handleShare = async () => {
    if (isProject && selectedVisibility !== visibility) {
      setShowVisibilityConfirm(true);
      return;
    }

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
    
    // If they typed a name different from the currently selected link,
    // they intended to use it for the NEW link they are creating.
    const isCustomName = Boolean(trimmed && trimmed !== activeShareLink?.name);
    
    const nextVisibility = isCustomName ? draftVisibility : visibility;
    
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
        <FormControlLabel
          sx={{ mt: -1 }}
          control={
            <Switch
              size="small"
              checked={activeShareLink?.permissions?.watermark !== false}
              disabled={Boolean(orgShareSettings?.lockShowCompanyWatermark)}
              onChange={(e) => {
                if (activeShareLinkId && onShareLinkPermissionsChange) {
                  onShareLinkPermissionsChange(activeShareLinkId, {
                    ...activeShareLink?.permissions,
                    watermark: e.target.checked
                  });
                }
              }}
            />
          }
          label={<Typography sx={{ fontSize: '0.875rem', color: cv.textPrimary }}>Show company watermark</Typography>}
        />
      </Box>
    ) : null;

  const visibilitySection =
    isProject && onVisibilityChange && !showShareLinks ? (
    <ProjectVisibilityPicker
      value={selectedVisibility}
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

  const isPrivateMode = draftVisibility === 'private';

  const shareLinksPanel = showShareLinks ? (
    <ShareLinksSection
      shareLinks={visibleShareLinks}
      activeShareLinkId={activeShareLinkId}
      editingShareLinkId={editingShareLinkId}
      onNewShareLink={handleCreateShareLink}
      onShareLinkSelect={handleShareLinkSelectInternal}
      onShareLinkEdit={handleShareLinkEdit}
      onShareLinkDelete={beginShareLinkDelete}
      onShareLinkCopy={onShareLinkCopy}
      disabled={isPrivateMode}
      scrollable
    />
  ) : null;

  const handleMemberAccessChange = (member: WorkspaceTeamMember, value: string) => {
    // value is the option UUID — resolve it to the name/title for role mapping downstream
    const option = accessOptions.find((o) => o.id === value);
    const resolvedAccess = (option?.name || option?.title || value) as WorkspaceMemberAccess;
    onUpdateMemberAccess(member.id, resolvedAccess);
  };

  const inviteFormSection = (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
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
            }}
            onFocus={() => setTypeaheadOpen(true)}
            onBlur={handleInviteInputBlur}
            onKeyDown={handleInviteKeyDown}
            error={Boolean(error)}
            helperText={
              error
                ? error
                : (!isRestricted && effectiveVisibility !== 'private')
                  ? 'This is a public workspace — enter an external email address to invite someone from outside your organization.'
                  : 'Type to search org members and groups, or enter an email to invite.'
            }
            autoFocus={!showShareLinks}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end" sx={{ ml: 0, height: '100%' }}>
                    <Select
                      value={
                        accessOptions.find(
                          (o) =>
                            o.id === access ||
                            o.name === access ||
                            o.title === access ||
                            (o.name === 'FULL_ACCESS' &&
                              (access === 'Full Access' || access === 'Admin' || access === '10f1fe4a-f28f-4d76-a7c2-6175dfe04c9b')) ||
                            (o.name === 'CAN_EDIT' &&
                              (access === 'Can edit' || access === 'Can Edit' || access === 'Editor' || access === 'd321a6c5-c28a-4dc4-900e-4dc57fe276bf')) ||
                            (o.name === 'CAN_VIEW' &&
                              (access === 'Can view' || access === 'Can View' || access === 'Viewer' || access === 'eef95f55-9cf3-490a-bf4c-0af6292c191d'))
                        )?.id ??
                        accessOptions.find((o) => o.name === 'CAN_VIEW' || o.title === 'Can View')?.id ??
                        (accessOptions[0]?.id || '')
                      }
                      onChange={(event: SelectChangeEvent) =>
                        setAccess(event.target.value as WorkspaceMemberAccess)
                      }
                      MenuProps={selectInDialogMenuProps}
                      size="small"
                      sx={inlineAccessSelectSx}
                      aria-label="Access level"
                    >
                      {accessOptions.map((option) => (
                        <MenuItem key={option.id} value={option.id} sx={{ fontSize: '0.875rem' }}>
                          {option.title || option.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </InputAdornment>
                ),
              },
            }}
          />

          {showTypeahead || (typeaheadOpen && isSearching && query.trim().length > 0) ? (
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
              {isSearching ? (
                <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={14} sx={{ color: cv.textMuted }} />
                  <Typography sx={{ fontSize: '0.8125rem', color: cv.textMuted }}>Searching…</Typography>
                </Box>
              ) : null}
              {searchResults.map((option) =>
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
    </Box>
  );

  const directAccessSection = (
    <>
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
          {/* 1. Render Organization Members */}
          {directAccessOrgMembers.map((member) => {
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
              {isCurrentMember || member.memberType === 'Owner' ? (
                <Typography
                  sx={{
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    color: cv.textSecondary,
                    px: 1.5,
                    py: 0.5,
                  }}
                >
                  Owner
                </Typography>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  {member.memberType === 'Guest' ? (
                    <Typography
                      sx={{
                        fontSize: '0.8125rem',
                        fontWeight: 500,
                        color: cv.textSecondary,
                        px: 1.5,
                        py: 0.5,
                        borderRadius: '8px',
                        backgroundColor: cv.surfaceMuted,
                        border: `1px solid ${cv.border}`,
                      }}
                    >
                      Guest Access
                    </Typography>
                  ) : (
                    <FormControl size="small">
                      <InputLabel id={`access-${member.id}`} shrink>
                        Access
                      </InputLabel>
                      <Select
                        labelId={`access-${member.id}`}
                        label="Access"
                        value={
                          accessOptions.find(
                            (o) =>
                              o.id === member.access ||
                              o.name === member.access ||
                              o.title === member.access ||
                              (o.name === 'FULL_ACCESS' &&
                                (member.access === 'Full Access' || member.access === 'Admin' || member.access === '10f1fe4a-f28f-4d76-a7c2-6175dfe04c9b')) ||
                              (o.name === 'CAN_EDIT' &&
                                (member.access === 'Can edit' || member.access === 'Can Edit' || member.access === 'Editor' || member.access === 'd321a6c5-c28a-4dc4-900e-4dc57fe276bf')) ||
                              (o.name === 'CAN_VIEW' &&
                                (member.access === 'Can view' || member.access === 'Can View' || member.access === 'Viewer' || member.access === 'eef95f55-9cf3-490a-bf4c-0af6292c191d'))
                          )?.id ??
                          accessOptions.find((o) => o.name === 'CAN_VIEW' || o.title === 'Can View')?.id ??
                          ''
                        }
                        onChange={(event: SelectChangeEvent) =>
                          handleMemberAccessChange(member, event.target.value)
                        }
                        MenuProps={selectInDialogMenuProps}
                        sx={{ ...dialogSelectSx, minWidth: 140 }}
                      >
                        {accessOptions.map((option) => (
                          <MenuItem key={option.id} value={option.id} sx={{ fontSize: '0.875rem' }}>
                            {option.title || option.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                  {onRemoveMember && !isCurrentMember && member.memberType !== 'Owner' ? (
                    <IconButton
                      size="small"
                      onClick={() => beginMemberRemove(member)}
                      sx={{
                        color: cv.textMuted,
                        '&:hover': { color: cv.destructive, backgroundColor: 'rgba(239, 68, 68, 0.1)' },
                      }}
                      title="Remove access"
                      aria-label="Remove access"
                    >
                      <DeleteOutlineOutlinedIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  ) : null}
                </Box>
              )}
            </Box>
            );
          })}

          {/* 2. Render Invited Guest Users Below Organization Members */}
          {guestInvitesList.map((item) => {
            const formattedExpires = item.expiresAt
              ? formatDateTime(item.expiresAt, {
                  month: 'numeric',
                  day: 'numeric',
                  year: 'numeric',
                }, {
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : 'Never';

            const perms = item.permissions || {};
            const permList: string[] = [];
            if (perms.view) permList.push('View');
            if (perms.comment) permList.push('Comment');
            if (perms.download || perms.downloadProxy) permList.push('Download');
            const permsString = permList.join(' • ') || 'View';

            return (
              <Box
                key={`guest-invite-${item.id}`}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 1.5,
                  px: 1.25,
                  py: 1,
                  borderRadius: '10px',
                  backgroundColor: cv.surfaceSubtle,
                  border: `1px solid ${cv.border}`,
                  '&:hover': { backgroundColor: cv.surfaceHover },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0 }}>
                  <Avatar
                    sx={{
                      width: 32,
                      height: 32,
                      fontSize: '0.8125rem',
                      fontWeight: 700,
                      bgcolor: cv.brandPurple,
                      color: '#fff',
                    }}
                  >
                    {item.email[0]?.toUpperCase() || 'G'}
                  </Avatar>
                  <Box sx={{ minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
                      <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: cv.textPrimary }}>
                        {item.email}
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: '0.625rem',
                          fontWeight: 700,
                          letterSpacing: '0.04em',
                          textTransform: 'uppercase',
                          color: cv.indigoLight,
                          px: 0.65,
                          py: 0.15,
                          borderRadius: '6px',
                          border: `1px solid ${cv.brandPurple}`,
                          backgroundColor: cv.indigoSurface,
                        }}
                      >
                        Guest
                      </Typography>
                    </Box>
                    <Typography sx={{ fontSize: '0.75rem', color: cv.textMuted, mt: 0.25 }}>
                      Permissions: <strong>{permsString}</strong> · Exp at: {formattedExpires} {item.hasPassword ? '· 🔒 Password' : ''}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
                  <IconButton
                    size="small"
                    onClick={() => {
                      setPendingShareLinkDelete({ id: item.linkId, name: item.email } as any);
                    }}
                    sx={{
                      color: cv.textMuted,
                      '&:hover': { color: cv.destructive, backgroundColor: 'rgba(239, 68, 68, 0.1)' },
                    }}
                    title="Revoke guest access"
                    aria-label="Revoke guest access"
                  >
                    <DeleteOutlineOutlinedIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Box>
              </Box>
            );
          })}
        </Box>
      </Box>
    </>
  );

  const memberAccessPanel = (
    <Collapse in={showMemberInvitePanel}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {inviteFormSection}
        {directAccessSection}
      </Box>
    </Collapse>
  );

  const footerMembersSummary = (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0 }}>
      {selectedVisibility !== 'public' ? (
        <TeamMemberAvatarStack members={members} borderColor={cv.dialogSurface} />
      ) : null}
      <Typography sx={{ fontSize: '0.875rem', color: cv.textPrimary }}>
        {members.length} Member{members.length === 1 ? '' : 's'}
      </Typography>
    </Box>
  );

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
        <Button variant="contained" onClick={() => void handleShare()} sx={containedButtonSx}>
          Close
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
          <ShareLinksEmptyState onNewShareLink={isPrivateMode ? undefined : handleCreateShareLink} />
        </Box>
      ) : (
        <Box sx={{ ...shareDialogBodySx, minHeight: { md: 460 } }}>
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

      {/* ── Secure External Share Dialog ── */}
      <Dialog
        open={secureShareOpen}
        onClose={() => setSecureShareOpen(false)}
        maxWidth="xs"
        fullWidth
        aria-labelledby="secure-share-dialog-title"
        slotProps={noahNestedDialogSlotProps()}
      >
        <DialogTitle
          id="secure-share-dialog-title"
          sx={{ color: cv.textPrimary, fontWeight: 600, pb: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}
        >
          <SendOutlinedIcon sx={{ fontSize: 20, color: cv.brandPurple }} />
          Share with external recipients
        </DialogTitle>
        <DialogContent sx={{ pt: '12px !important', display: 'flex', flexDirection: 'column', gap: 2.5 }}>

          {/* Recipient */}
          {pendingExternalEmail ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1, borderRadius: '10px', backgroundColor: cv.indigoSurface }}>
              <SendOutlinedIcon sx={{ fontSize: 16, color: cv.indigoLight, flexShrink: 0 }} />
              <Typography sx={{ fontSize: '0.875rem', color: cv.indigoLight, fontWeight: 500, wordBreak: 'break-all' }}>
                {pendingExternalEmail}
              </Typography>
            </Box>
          ) : null}

          {/* Expiry */}
          <Box>
            <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600, color: cv.textSecondary, mb: 1 }}>
              EXPIRY
            </Typography>
            <ToggleButtonGroup
              value={shareExpiry}
              exclusive
              onChange={(_e, val) => { if (val) setShareExpiry(val as typeof shareExpiry); }}
              size="small"
              disabled={Boolean(orgShareSettings?.defaultExpiryDays)}
              sx={{ flexWrap: 'wrap', gap: 0.5 }}
            >
              {(['7', '15', '30', 'custom'] as const).map((opt) => (
                <ToggleButton
                  key={opt}
                  value={opt}
                  sx={{
                    textTransform: 'none',
                    fontSize: '0.8125rem',
                    borderRadius: '8px !important',
                    border: `1px solid ${cv.border} !important`,
                    px: 1.5,
                    '&.Mui-selected': {
                      backgroundColor: cv.indigoSurface,
                      color: cv.indigoLight,
                      borderColor: `${cv.brandPurple} !important`,
                    },
                  }}
                >
                  {opt === 'custom' ? 'Custom' : `${opt} days`}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
            <Collapse in={shareExpiry === 'custom'}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="Custom expiry date"
                value={shareCustomDate}
                onChange={(e) => setShareCustomDate(e.target.value)}
                inputProps={{ min: new Date(Date.now() + 86400000).toISOString().split('T')[0] }}
                slotProps={{ inputLabel: { shrink: true } }}
                sx={{ mt: 1.5 }}
              />
            </Collapse>
          </Box>

          {/* Permissions */}
          <Box>
            <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600, color: cv.textSecondary, mb: 0.5 }}>
              PERMISSIONS
            </Typography>
            <FormControlLabel
              control={<Checkbox checked disabled size="small" />}
              label={<Typography sx={{ fontSize: '0.875rem', color: cv.textPrimary }}>View (always on)</Typography>}
            />
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <FormControlLabel
                control={
                  <Checkbox
                    size="small"
                    checked={sharePermComment}
                    onChange={(e) => setSharePermComment(e.target.checked)}
                    disabled={Boolean(orgShareSettings?.lockAllowComments)}
                  />
                }
                label={<Typography sx={{ fontSize: '0.875rem', color: cv.textPrimary }}>Comment</Typography>}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    size="small"
                    checked={sharePermDownload}
                    onChange={(e) => setSharePermDownload(e.target.checked)}
                    disabled={Boolean(orgShareSettings?.lockAllowDownloadOriginal)}
                  />
                }
                label={<Typography sx={{ fontSize: '0.875rem', color: cv.textPrimary }}>Download original</Typography>}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    size="small"
                    checked={sharePermDownloadProxy}
                    onChange={(e) => setSharePermDownloadProxy(e.target.checked)}
                    disabled={Boolean(orgShareSettings?.lockAllowDownloadProxy)}
                  />
                }
                label={<Typography sx={{ fontSize: '0.875rem', color: cv.textPrimary }}>Download proxy</Typography>}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    size="small"
                    checked={sharePermWatermark}
                    onChange={(e) => setSharePermWatermark(e.target.checked)}
                    disabled={Boolean(orgShareSettings?.lockShowCompanyWatermark)}
                  />
                }
                label={<Typography sx={{ fontSize: '0.875rem', color: cv.textPrimary }}>Show company watermark</Typography>}
              />
            </Box>
          </Box>

          {/* Password */}
          <Box>
            <FormControlLabel
              control={
                <Switch
                  size="small"
                  checked={shareRequirePassword}
                  disabled={Boolean(orgShareSettings?.lockRequirePassword)}
                  onChange={(e) => {
                    setShareRequirePassword(e.target.checked);
                    if (!e.target.checked) setSharePassword('');
                  }}
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <LockOutlinedIcon sx={{ fontSize: 16, color: cv.textSecondary }} />
                  <Typography sx={{ fontSize: '0.875rem', fontWeight: 500, color: cv.textPrimary }}>
                    Require password
                  </Typography>
                </Box>
              }
            />
            <Collapse in={shareRequirePassword}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Password"
                  type={sharePasswordVisible ? 'text' : 'password'}
                  value={sharePassword}
                  onChange={(e) => setSharePassword(e.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
                <Tooltip title={sharePasswordVisible ? 'Hide' : 'Show'}>
                  <IconButton
                    size="small"
                    onClick={() => setSharePasswordVisible((v) => !v)}
                  >
                    {sharePasswordVisible
                      ? <VisibilityOffOutlinedIcon sx={{ fontSize: 18 }} />
                      : <VisibilityOutlinedIcon sx={{ fontSize: 18 }} />}
                  </IconButton>
                </Tooltip>
                <Tooltip title="Generate random password">
                  <IconButton
                    size="small"
                    onClick={() => { setSharePassword(generatePassword()); setSharePasswordVisible(true); }}
                  >
                    <AutorenewOutlinedIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Tooltip>
                <Tooltip title={sharePasswordCopied ? 'Copied!' : 'Copy password'}>
                  <IconButton
                    size="small"
                    disabled={!sharePassword}
                    onClick={() => {
                      void navigator.clipboard.writeText(sharePassword);
                      setSharePasswordCopied(true);
                      window.setTimeout(() => setSharePasswordCopied(false), 2000);
                    }}
                  >
                    <ContentCopyOutlinedIcon sx={{ fontSize: 18, color: sharePasswordCopied ? cv.brandPurple : undefined }} />
                  </IconButton>
                </Tooltip>
              </Box>
              <Typography sx={{ mt: 0.75, fontSize: '0.75rem', color: cv.textMuted, lineHeight: 1.4 }}>
                Share this password separately — it will not be included in the invite email.
              </Typography>
            </Collapse>
          </Box>

        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, pt: 0, gap: 1 }}>
          <Button
            onClick={() => setSecureShareOpen(false)}
            sx={{ textTransform: 'none', color: cv.textSecondary }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={isSubmittingInvite || !pendingExternalEmail || (shareRequirePassword && !sharePassword) || (shareExpiry === 'custom' && !shareCustomDate)}
            onClick={async () => {
              if (!pendingExternalEmail) return;
              setIsSubmittingInvite(true);
              const config = {
                mode: 'email' as const,
                email: pendingExternalEmail,
                visibility: shareRequirePassword ? ('private' as const) : ('public' as const),
                expiresInDays: shareExpiry !== 'custom' ? Number(shareExpiry) : undefined,
                expiresAt: shareExpiry === 'custom' ? shareCustomDate : undefined,
                permissions: {
                  view: true as const,
                  comment: sharePermComment,
                  download: sharePermDownload,
                  downloadProxy: sharePermDownloadProxy,
                  watermark: sharePermWatermark,
                },
                password: shareRequirePassword ? sharePassword : undefined,
              };

              try {
                if (activeAssetId) {
                  await createShareLinkApi(activeAssetId, config);
                  await fetchBackendShareLinks();
                }
                onInvite({
                  userId: pendingExternalUserId,
                  email: pendingExternalEmail,
                  name: pendingExternalName,
                  memberType: 'Guest',
                  access: 'Can view',
                });
              } catch (err) {
                console.error('Failed to create secure share link:', err);
              } finally {
                setIsSubmittingInvite(false);
              }

              setPendingExternalEmail(null);
              setPendingExternalName(undefined);
              setPendingExternalUserId(undefined);
              setSecureShareOpen(false);
            }}
            sx={containedButtonSx}
          >
            <SendOutlinedIcon sx={{ fontSize: 16, mr: 0.75 }} />
            {isSubmittingInvite ? 'Sending...' : 'Send Invite'}
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

      <Dialog
        open={showVisibilityConfirm}
        onClose={() => setShowVisibilityConfirm(false)}
        maxWidth="xs"
        fullWidth
        aria-labelledby="visibility-confirm-title"
        slotProps={noahNestedDialogSlotProps()}
      >
        <DialogTitle id="visibility-confirm-title" sx={{ color: cv.textPrimary, fontWeight: 600 }}>
          Update project visibility?
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: cv.textSecondary, fontSize: '0.9375rem', lineHeight: 1.55 }}>
            {selectedVisibility === 'public'
              ? 'Are you sure you want to change project visibility to Public? All members in this workspace will be able to view and access this project.'
              : 'Are you sure you want to change project visibility to Private? Only invited members will be able to access this project.'}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, pt: 0, gap: 1 }}>
          <Button
            onClick={() => setShowVisibilityConfirm(false)}
            sx={{ textTransform: 'none', color: cv.textSecondary }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={confirmVisibilityChange}
            sx={containedButtonSx}
          >
            Update
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

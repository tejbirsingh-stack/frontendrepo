import { useMemo, useState, useEffect, useRef } from 'react';
import { cv } from '../../theme/cssVars';
import {
  Box,
  Button,
  Checkbox,
  Chip,
  FormControl,
  FormControlLabel,
  IconButton,
  MenuItem,
  Select,
  TextField,
  Tooltip,
  Typography,
  Avatar,
  Paper,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import MemberTypeToggle from './MemberTypeToggle';
import {
  findUserGroupByName,
  MOCK_SETTINGS_USER_GROUPS,
  type SettingsUserGroup,
  type SettingsUserRow,
  type WorkspaceMemberAccess,
  type WorkspaceMemberType,
} from '../../data/mockSettingsData';
import { selectInDialogMenuProps } from '../../constants/dropdownMenu';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ACCESS_OPTIONS: WorkspaceMemberAccess[] = ['Full Access', 'Can edit', 'Can view'];

const dialogSelectSx = {
  borderRadius: '10px',
  fontSize: '0.8125rem',
  color: cv.textPrimary,
  minWidth: 130,
  '& .MuiOutlinedInput-notchedOutline': { borderColor: cv.border },
  '& .MuiSelect-select': { py: 0.75 },
};

export interface GuestUserSuggestion {
  id: string;
  name: string;
  email: string;
  orgName?: string | null;
  avatarUrl?: string | null;
}

interface InvitePeopleFieldsProps {
  emails: string[];
  onChange: (emails: string[]) => void;
  groupIds?: string[];
  onGroupIdsChange?: (groupIds: string[]) => void;
  description?: string;
  showAccessControls?: boolean;
  memberType?: WorkspaceMemberType;
  onMemberTypeChange?: (memberType: WorkspaceMemberType) => void;
  access?: WorkspaceMemberAccess;
  onAccessChange?: (access: WorkspaceMemberAccess) => void;
  suggestedUsers?: SettingsUserRow[];
  suggestedGroups?: SettingsUserGroup[];
  onGuestSearch?: (query: string) => Promise<GuestUserSuggestion[]>;
  sendInviteEmail?: boolean;
  onSendInviteEmailChange?: (send: boolean) => void;
}

export default function InvitePeopleFields({
  emails,
  onChange,
  groupIds = [],
  onGroupIdsChange,
  description = 'Optional — teammates will receive an email invite.',
  showAccessControls = false,
  memberType = 'Member',
  onMemberTypeChange,
  access = 'Full Access',
  onAccessChange,
  suggestedUsers = [],
  suggestedGroups = MOCK_SETTINGS_USER_GROUPS,
  onGuestSearch,
  sendInviteEmail = false,
  onSendInviteEmailChange,
}: InvitePeopleFieldsProps) {
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [isGuestSearching, setIsGuestSearching] = useState(false);

  const isGroupMode = memberType === 'Group';
  const isGuestMode = memberType === 'Guest';
  const isMemberMode = memberType === 'Member';

  // User suggestions shown only in Member mode
  const userSuggestions = useMemo(() => {
    if (!isMemberMode) return [];
    const normalized = input.trim().toLowerCase();
    const selectedEmails = new Set(emails.map((email) => email.toLowerCase()));
    return suggestedUsers
      .filter((user) => !selectedEmails.has(user.email.toLowerCase()))
      .filter((user) => {
        if (!normalized) return false; // only show when typing
        return (
          user.name.toLowerCase().includes(normalized) ||
          user.email.toLowerCase().includes(normalized)
        );
      })
      .slice(0, 5);
  }, [emails, input, suggestedUsers, isMemberMode]);

  // Group suggestions shown only in Group mode
  const groupSuggestions = useMemo(() => {
    if (!isGroupMode) return [];
    const normalized = input.trim().toLowerCase();
    const selectedIds = new Set(groupIds);
    return suggestedGroups
      .filter((group) => !selectedIds.has(group.id))
      .filter((group) => {
        if (!normalized) return false; // only show when typing
        return group.name.toLowerCase().includes(normalized);
      })
      .slice(0, 5);
  }, [groupIds, input, suggestedGroups, isGroupMode]);

  const handleAdd = async () => {
    const trimmed = input.trim();
    if (!trimmed) {
      if (isGroupMode) setError('Enter a group name');
      else if (isMemberMode) setError('Select a member from suggestions');
      else setError('Enter an email address');
      return;
    }

    // GROUP mode: must match an existing group
    if (isGroupMode) {
      const group = findUserGroupByName(trimmed, suggestedGroups);
      if (!group) {
        setError('Select an existing group from the suggestions.');
        return;
      }
      if (groupIds.includes(group.id)) {
        setError('This group has already been added');
        return;
      }
      onGroupIdsChange?.([...groupIds, group.id]);
      setInput('');
      setError('');
      return;
    }

    // MEMBER mode: must match a known workspace user
    if (isMemberMode) {
      const matched = suggestedUsers.find(
        (user) =>
          user.email.toLowerCase() === trimmed.toLowerCase() ||
          user.name.toLowerCase() === trimmed.toLowerCase(),
      );
      if (!matched) {
        setError('Select a member from the suggestions below.');
        return;
      }
      const email = matched.email.toLowerCase();
      if (emails.some((entry) => entry.toLowerCase() === email)) {
        setError('This member has already been added');
        return;
      }
      onChange([...emails, email]);
      setInput('');
      setError('');
      return;
    }

    // GUEST mode: validate entered email exists in platform outside this organization
    if (isGuestMode) {
      const emailLower = trimmed.toLowerCase();
      if (!EMAIL_PATTERN.test(emailLower)) {
        setError('Enter a valid email address');
        return;
      }
      if (emails.some((entry) => entry.toLowerCase() === emailLower)) {
        setError('This guest has already been added');
        return;
      }

      if (onGuestSearch) {
        setIsGuestSearching(true);
        try {
          const results = await onGuestSearch(emailLower);
          const matchedGuest = results.find(
            (u) => u.email.toLowerCase() === emailLower
          );
          if (!matchedGuest) {
            setError('User does not exist on the platform or belongs to your organization.');
            setIsGuestSearching(false);
            return;
          }
          onChange([...emails, matchedGuest.email.toLowerCase()]);
          setInput('');
          setError('');
        } catch {
          setError('Failed to validate guest email.');
        } finally {
          setIsGuestSearching(false);
        }
      } else {
        onChange([...emails, emailLower]);
        setInput('');
        setError('');
      }
    }
  };

  const handleRemoveEmail = (emailToRemove: string) => {
    onChange(emails.filter((email) => email !== emailToRemove));
  };

  const handleRemoveGroup = (groupId: string) => {
    onGroupIdsChange?.(groupIds.filter((id) => id !== groupId));
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      void handleAdd();
    }
  };

  const inputLabel = isGroupMode ? 'Group name' : isMemberMode ? 'Member name or email' : 'Guest email';
  const inputPlaceholder = isGroupMode ? 'e.g. Creative Team' : isMemberMode ? 'Search members...' : 'Enter guest email...';

  return (
    <Box sx={{ position: 'relative' }}>
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
        Invite people
      </Typography>

      <Box
        sx={{
          borderRadius: '12px',
          border: `1px solid ${cv.border}`,
          backgroundColor: cv.surfaceSubtle,
          p: 1.5,
        }}
      >
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
          <TextField
            fullWidth
            size="small"
            label={inputLabel}
            placeholder={inputPlaceholder}
            value={input}
            onChange={(event) => {
              setInput(event.target.value);
              if (error) setError('');
            }}
            onKeyDown={handleKeyDown}
            error={Boolean(error)}
            helperText={error}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <Button
            type="button"
            variant="outlined"
            onClick={() => void handleAdd()}
            disabled={isGuestSearching}
            startIcon={<AddIcon sx={{ fontSize: 18 }} />}
            sx={{
              mt: 0.25,
              flexShrink: 0,
              height: 40,
              textTransform: 'none',
              borderRadius: '10px',
              borderColor: cv.border,
              color: cv.textPrimary,
              whiteSpace: 'nowrap',
              '&:hover': { borderColor: cv.borderFocus, backgroundColor: cv.surfaceHover },
            }}
          >
            {isGuestSearching ? 'Validating...' : 'Add'}
          </Button>
        </Box>

        {showAccessControls ? (
          <Box
            sx={{
              mt: 1.25,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 1,
              flexWrap: 'wrap',
            }}
          >
            <MemberTypeToggle
              value={memberType}
              onChange={(nextType) => {
                onMemberTypeChange?.(nextType);
                setInput('');
                setError('');
              }}
            />
            <FormControl size="small">
              <Select
                value={access}
                onChange={(event: SelectChangeEvent) =>
                  onAccessChange?.(event.target.value as WorkspaceMemberAccess)
                }
                MenuProps={selectInDialogMenuProps}
                sx={dialogSelectSx}
              >
                {ACCESS_OPTIONS.map((option) => (
                  <MenuItem key={option} value={option} sx={{ fontSize: '0.875rem' }}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        ) : null}

        <Box sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={sendInviteEmail}
                onChange={(e) => onSendInviteEmailChange?.(e.target.checked)}
                size="small"
                sx={{
                  color: cv.textMuted,
                  p: 0.5,
                  mr: 0.5,
                  '&.Mui-checked': {
                    color: cv.brandMain,
                  },
                }}
              />
            }
            label={
              <Typography sx={{ fontSize: '0.8125rem', color: cv.textSecondary }}>
                Send invitation email
              </Typography>
            }
            sx={{ ml: 0, mr: 0, userSelect: 'none' }}
          />
        </Box>
      </Box>

      {/* Floating Suggestions Dropdown */}
      {input.trim() && (
        (isMemberMode && userSuggestions.length > 0) ||
        (isGroupMode && groupSuggestions.length > 0)
      ) ? (
        <Paper
          elevation={8}
          sx={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            mt: 0.5,
            zIndex: 1400,
            maxHeight: 220,
            overflowY: 'auto',
            bgcolor: cv.elevatedSurface,
            borderRadius: '10px',
            border: `1px solid ${cv.border}`,
            boxShadow: cv.popoverShadow,
            p: 0.75,
          }}
        >
          {!isGroupMode && !isGuestMode && userSuggestions.length > 0 ? (
            <Box>
              <Typography
                sx={{
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: cv.textMuted,
                  mb: 0.75,
                  px: 1,
                }}
              >
                Suggested
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                {userSuggestions.map((user) => (
                  <Box
                    key={user.id}
                    component="button"
                    type="button"
                    onClick={() => {
                      // Clicking suggestion immediately adds the member
                      const email = user.email.toLowerCase();
                      if (!emails.some((e) => e.toLowerCase() === email)) {
                        onChange([...emails, email]);
                      }
                      setInput('');
                      setError('');
                    }}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      width: '100%',
                      border: 'none',
                      borderRadius: '8px',
                      px: 1,
                      py: 1,
                      cursor: 'pointer',
                      textAlign: 'left',
                      backgroundColor: 'transparent',
                      '&:hover': { backgroundColor: cv.surfaceHover },
                    }}
                  >
                    <Avatar sx={{ width: 32, height: 32, fontSize: '0.875rem', bgcolor: cv.brandMain, color: '#fff' }}>
                      {user.name ? user.name[0]?.toUpperCase() : user.email[0]?.toUpperCase()}
                    </Avatar>
                    <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                      <Typography sx={{ fontSize: '0.875rem', fontWeight: 500, color: cv.textPrimary, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {user.name}
                      </Typography>
                      <Typography sx={{ fontSize: '0.75rem', color: cv.textMuted, mt: 0.25, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {user.email}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          ) : null}

          {isGroupMode && groupSuggestions.length > 0 ? (
            <Box>
              <Typography
                sx={{
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: cv.textMuted,
                  mb: 0.75,
                  px: 1,
                }}
              >
                Suggested groups
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                {groupSuggestions.map((group) => (
                  <Box
                    key={group.id}
                    component="button"
                    type="button"
                    onClick={() => {
                      // Clicking suggestion immediately adds the group
                      if (!groupIds.includes(group.id)) {
                        onGroupIdsChange?.([...groupIds, group.id]);
                      }
                      setInput('');
                      setError('');
                    }}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      width: '100%',
                      border: 'none',
                      borderRadius: '8px',
                      px: 1,
                      py: 1,
                      cursor: 'pointer',
                      textAlign: 'left',
                      backgroundColor: 'transparent',
                      '&:hover': { backgroundColor: cv.surfaceHover },
                    }}
                  >
                    <Avatar sx={{ width: 32, height: 32, bgcolor: cv.surfaceHighlight, color: cv.textSecondary }}>
                      <GroupsOutlinedIcon sx={{ fontSize: 20 }} />
                    </Avatar>
                    <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                      <Typography sx={{ fontSize: '0.875rem', fontWeight: 500, color: cv.textPrimary, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {group.name}
                      </Typography>
                      <Typography sx={{ fontSize: '0.75rem', color: cv.textMuted, mt: 0.25, lineHeight: 1.2 }}>
                        {group.memberIds.length} member{group.memberIds.length === 1 ? '' : 's'}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          ) : null}
        </Paper>
      ) : null}


      {(emails.length > 0 || groupIds.length > 0) ? (
        <Box sx={{ mt: 1.75 }}>
          <Typography
            sx={{
              fontSize: '0.6875rem',
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: cv.textMuted,
              mb: 0.75,
            }}
          >
            Direct Access
          </Typography>
          <Box
            sx={{
              borderRadius: '10px',
              border: `1px solid ${cv.border}`,
              overflow: 'hidden',
              maxHeight: 116, // ~2 rows at ~58px each
              overflowY: 'auto',
            }}
          >
          {emails.map((email, idx) => {
            const user = suggestedUsers.find(
              (u) => u.email.toLowerCase() === email.toLowerCase()
            );
            const displayName = user?.name || email.split('@')[0];
            const initials = displayName[0]?.toUpperCase() || 'U';
            return (
              <Box
                key={email}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  px: 1.5,
                  py: 1,
                  borderBottom: idx < emails.length - 1 || groupIds.length > 0 ? `1px solid ${cv.border}` : 'none',
                  '&:hover': { backgroundColor: cv.surfaceHover },
                  transition: 'background 0.15s',
                }}
              >
                <Avatar sx={{ width: 30, height: 30, fontSize: '0.8rem', bgcolor: cv.brandMain, color: '#fff', flexShrink: 0 }}>
                  {initials}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontSize: '0.875rem', fontWeight: 500, color: cv.textPrimary, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {displayName}
                  </Typography>
                  <Typography sx={{ fontSize: '0.75rem', color: cv.textMuted, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {email}
                  </Typography>
                </Box>
                <Tooltip title="Remove">
                  <IconButton
                    size="small"
                    onClick={() => handleRemoveEmail(email)}
                    sx={{ color: cv.textMuted, '&:hover': { color: cv.textPrimary, backgroundColor: cv.surfaceActive } }}
                  >
                    <CloseIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>
              </Box>
            );
          })}
          {groupIds.map((groupId, idx) => {
            const group = suggestedGroups.find((entry) => entry.id === groupId);
            return (
              <Box
                key={groupId}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  px: 1.5,
                  py: 1,
                  borderBottom: idx < groupIds.length - 1 ? `1px solid ${cv.border}` : 'none',
                  '&:hover': { backgroundColor: cv.surfaceHover },
                  transition: 'background 0.15s',
                }}
              >
                <Avatar sx={{ width: 30, height: 30, bgcolor: cv.indigoSurface, color: cv.textSecondary, flexShrink: 0 }}>
                  <GroupsOutlinedIcon sx={{ fontSize: 18 }} />
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontSize: '0.875rem', fontWeight: 500, color: cv.textPrimary, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {group?.name ?? groupId}
                  </Typography>
                  <Typography sx={{ fontSize: '0.75rem', color: cv.textMuted, lineHeight: 1.2 }}>
                    {group ? `${group.memberIds.length} member${group.memberIds.length === 1 ? '' : 's'}` : 'Group'}
                  </Typography>
                </Box>
                <Tooltip title="Remove">
                  <IconButton
                    size="small"
                    onClick={() => handleRemoveGroup(groupId)}
                    sx={{ color: cv.textMuted, '&:hover': { color: cv.textPrimary, backgroundColor: cv.surfaceActive } }}
                  >
                    <CloseIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>
              </Box>
            );
          })}
          </Box>
        </Box>
      ) : null}

      {description ? (
        <Typography sx={{ mt: 1.25, fontSize: '0.8125rem', color: cv.textSecondary }}>
          {description}
        </Typography>
      ) : null}
    </Box>
  );
}

import { useMemo, useState } from 'react';
import { cv } from '../../theme/cssVars';
import {
  Box,
  Button,
  Chip,
  FormControl,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
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
}: InvitePeopleFieldsProps) {
  const [input, setInput] = useState('');
  const [error, setError] = useState('');

  const isGroupMode = memberType === 'Group';

  const userSuggestions = useMemo(() => {
    const normalized = input.trim().toLowerCase();
    const selectedEmails = new Set(emails.map((email) => email.toLowerCase()));
    return suggestedUsers
      .filter((user) => !selectedEmails.has(user.email.toLowerCase()))
      .filter((user) => {
        if (!normalized) return true;
        return (
          user.name.toLowerCase().includes(normalized) ||
          user.email.toLowerCase().includes(normalized)
        );
      })
      .slice(0, 4);
  }, [emails, input, suggestedUsers]);

  const groupSuggestions = useMemo(() => {
    const normalized = input.trim().toLowerCase();
    const selectedIds = new Set(groupIds);
    return suggestedGroups
      .filter((group) => !selectedIds.has(group.id))
      .filter((group) => {
        if (!normalized) return true;
        return group.name.toLowerCase().includes(normalized);
      })
      .slice(0, 4);
  }, [groupIds, input, suggestedGroups]);

  const handleAdd = () => {
    const trimmed = input.trim();
    if (!trimmed) {
      setError(isGroupMode ? 'Enter a group name' : 'Enter a name or email address');
      return;
    }

    if (isGroupMode) {
      const group = findUserGroupByName(trimmed, suggestedGroups);
      if (!group) {
        setError('Select an existing group or pick a suggestion below.');
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

    const emailMatch = trimmed.match(EMAIL_PATTERN);
    const suggested = suggestedUsers.find(
      (user) =>
        user.email.toLowerCase() === trimmed.toLowerCase() ||
        user.name.toLowerCase() === trimmed.toLowerCase(),
    );
    const email = emailMatch ? trimmed.toLowerCase() : suggested?.email;

    if (!email || !EMAIL_PATTERN.test(email)) {
      setError('Enter a valid email or select a suggested person.');
      return;
    }
    if (emails.some((entry) => entry.toLowerCase() === email.toLowerCase())) {
      setError('This email has already been added');
      return;
    }

    onChange([...emails, email]);
    setInput('');
    setError('');
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
      handleAdd();
    }
  };

  const inputLabel = isGroupMode ? 'Group name' : 'Name or email';
  const inputPlaceholder = isGroupMode ? 'e.g. Creative Team' : 'name@company.com';

  return (
    <Box>
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
            onClick={handleAdd}
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
            Add
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
      </Box>

      {!isGroupMode && userSuggestions.length > 0 && input.trim() ? (
        <Box sx={{ mt: 1.25 }}>
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
            Suggested
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            {userSuggestions.map((user) => (
              <Box
                key={user.id}
                component="button"
                type="button"
                onClick={() => {
                  setInput(user.email);
                  setError('');
                }}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  width: '100%',
                  border: 'none',
                  borderRadius: '10px',
                  px: 1,
                  py: 0.75,
                  cursor: 'pointer',
                  textAlign: 'left',
                  backgroundColor: 'transparent',
                  '&:hover': { backgroundColor: cv.surfaceHover },
                }}
              >
                <Typography sx={{ fontSize: '0.875rem', fontWeight: 500, color: cv.textPrimary }}>
                  {user.name}
                </Typography>
                <Typography sx={{ fontSize: '0.75rem', color: cv.textMuted }}>{user.email}</Typography>
              </Box>
            ))}
          </Box>
        </Box>
      ) : null}

      {isGroupMode && groupSuggestions.length > 0 && input.trim() ? (
        <Box sx={{ mt: 1.25 }}>
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
            Suggested groups
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            {groupSuggestions.map((group) => (
              <Box
                key={group.id}
                component="button"
                type="button"
                onClick={() => {
                  setInput(group.name);
                  setError('');
                }}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  width: '100%',
                  border: 'none',
                  borderRadius: '10px',
                  px: 1,
                  py: 0.75,
                  cursor: 'pointer',
                  textAlign: 'left',
                  backgroundColor: 'transparent',
                  '&:hover': { backgroundColor: cv.surfaceHover },
                }}
              >
                <GroupsOutlinedIcon sx={{ fontSize: 18, color: cv.textSecondary }} />
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontSize: '0.875rem', fontWeight: 500, color: cv.textPrimary }}>
                    {group.name}
                  </Typography>
                  <Typography sx={{ fontSize: '0.75rem', color: cv.textMuted }}>
                    {group.memberIds.length} member{group.memberIds.length === 1 ? '' : 's'}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      ) : null}

      {emails.length > 0 || groupIds.length > 0 ? (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mt: 1.5 }}>
          {emails.map((email) => (
            <Chip
              key={email}
              label={email}
              size="small"
              onDelete={() => handleRemoveEmail(email)}
              sx={{
                height: 28,
                fontSize: '0.8125rem',
                color: cv.textPrimary,
                backgroundColor: cv.insetHighlight,
                border: `1px solid ${cv.border}`,
                '& .MuiChip-deleteIcon': {
                  color: cv.textMuted,
                  '&:hover': { color: cv.textPrimary },
                },
              }}
            />
          ))}
          {groupIds.map((groupId) => {
            const group = suggestedGroups.find((entry) => entry.id === groupId);
            return (
              <Chip
                key={groupId}
                icon={<GroupsOutlinedIcon sx={{ fontSize: '16px !important' }} />}
                label={group?.name ?? groupId}
                size="small"
                onDelete={() => handleRemoveGroup(groupId)}
                sx={{
                  height: 28,
                  fontSize: '0.8125rem',
                  color: cv.textPrimary,
                  backgroundColor: cv.indigoSurface,
                  border: `1px solid ${cv.border}`,
                  '& .MuiChip-deleteIcon': {
                    color: cv.textMuted,
                    '&:hover': { color: cv.textPrimary },
                  },
                }}
              />
            );
          })}
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

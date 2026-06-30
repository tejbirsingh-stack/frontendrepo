import type { MouseEvent } from 'react';
import { cv, avatarStackColors } from '../../theme/cssVars';
import { Avatar, Box, IconButton, Tooltip } from '@mui/material';
import PersonAddOutlinedIcon from '@mui/icons-material/PersonAddOutlined';

const AVATAR_COLORS = avatarStackColors;
const AVATAR_OVERLAP = '-16px';
const AVATAR_MAX = 4;

export interface AvatarStackMember {
  id: string;
  name: string;
  initials: string;
  avatarUrl?: string;
}

function memberAvatarSx(index: number, borderColor?: string) {
  return {
    width: 28,
    height: 28,
    fontSize: '0.6875rem',
    fontWeight: 700,
    border: `2px solid ${borderColor ?? cv.bg}`,
    bgcolor: AVATAR_COLORS[index % AVATAR_COLORS.length],
  };
}

export function TeamMemberAvatarStack({
  members,
  max = AVATAR_MAX,
  borderColor = cv.bg,
}: {
  members: AvatarStackMember[];
  max?: number;
  borderColor?: string;
}) {
  const visibleCount = Math.max(max - 1, 1);
  const visibleMembers = members.slice(0, visibleCount);
  const surplus = members.length - visibleCount;

  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center' }}>
      {visibleMembers.map((member, index) => (
        <Tooltip key={member.id} title={member.name} arrow>
          <Avatar
            src={member.avatarUrl}
            alt={member.name}
            sx={{
              ...(member.avatarUrl
                ? { ...memberAvatarSx(index, borderColor), bgcolor: undefined }
                : memberAvatarSx(index, borderColor)),
              position: 'relative',
              zIndex: index + 1,
              marginLeft: index > 0 ? AVATAR_OVERLAP : 0,
            }}
          >
            {member.initials}
          </Avatar>
        </Tooltip>
      ))}
      {surplus > 0 ? (
        <Avatar
          aria-label={`${surplus} more members`}
          sx={{
            ...memberAvatarSx(visibleMembers.length, borderColor),
            position: 'relative',
            zIndex: visibleMembers.length + 1,
            marginLeft: visibleMembers.length > 0 ? AVATAR_OVERLAP : 0,
            fontSize: '0.625rem',
            fontWeight: 600,
            color: cv.textPrimary,
            bgcolor: cv.avatarSurplusBg,
          }}
        >
          +{surplus}
        </Avatar>
      ) : null}
    </Box>
  );
}

export function InviteTeamMemberButton({
  onClick,
  disabled = false,
}: {
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
}) {
  return (
    <Tooltip title="Invite team member" arrow>
      <span>
        <IconButton
          size="small"
          aria-label="Invite team member"
          disabled={disabled}
          onClick={onClick}
          sx={{
            width: 28,
            height: 28,
            border: `1px dashed ${cv.border}`,
            color: cv.textSecondary,
            '&:hover': {
              color: cv.textPrimary,
              borderColor: cv.borderFocus,
              backgroundColor: cv.surfaceHover,
            },
          }}
        >
          <PersonAddOutlinedIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </span>
    </Tooltip>
  );
}

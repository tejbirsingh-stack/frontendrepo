import { useState } from 'react';
import { cv } from '../../theme/cssVars';
import { Box, IconButton, Tooltip } from '@mui/material';
import LinkOutlinedIcon from '@mui/icons-material/LinkOutlined';
import type { ProjectVisibility, WorkspaceTeamMember } from '../../data/mockSettingsData';
import { copyProjectShareLink } from '../../utils/projectShareLink';
import {
  InviteTeamMemberButton,
  TeamMemberAvatarStack,
} from '../common/TeamMemberAvatarStack';

interface WorkspaceTeamMembersCellProps {
  members: WorkspaceTeamMember[];
  canInvite: boolean;
  visibility?: ProjectVisibility;
  shareLink?: string;
  onInvite?: () => void;
}

export default function WorkspaceTeamMembersCell({
  members,
  canInvite,
  visibility,
  shareLink,
  onInvite,
}: WorkspaceTeamMembersCellProps) {
  const isPublic = visibility === 'public';

  return (
    <Box
      sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}
      onClick={(event) => event.stopPropagation()}
    >
      {!isPublic && members.length > 0 ? (
        <TeamMemberAvatarStack members={members} />
      ) : null}
      {canInvite ? <InviteTeamMemberButton onClick={onInvite} /> : null}
    </Box>
  );
}

function CopyLinkButton({ shareLink }: { shareLink: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const success = await copyProjectShareLink(shareLink);
    if (!success) return;
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Tooltip title={copied ? 'Link copied' : 'Copy project link'} arrow>
      <IconButton
        size="small"
        aria-label="Copy project link"
        onClick={handleCopy}
        sx={{
          width: 28,
          height: 28,
          border: `1px solid ${copied ? cv.purpleSelectionBorder : cv.border}`,
          color: copied ? cv.purpleLight : cv.textSecondary,
          backgroundColor: copied ? cv.purpleSelectionSoft : 'transparent',
          '&:hover': {
            color: cv.textPrimary,
            borderColor: cv.borderFocus,
            backgroundColor: cv.surfaceHover,
          },
        }}
      >
        <LinkOutlinedIcon sx={{ fontSize: 16 }} />
      </IconButton>
    </Tooltip>
  );
}

function TypographyMuted({ children }: { children: React.ReactNode }) {
  return (
    <Box component="span" sx={{ fontSize: '0.8125rem', color: cv.textMuted }}>
      {children}
    </Box>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { cv } from '../../theme/cssVars';
import { Avatar, Box, Button, Popover, Tooltip, Typography } from '@mui/material';
import InvitePeopleModal from './InvitePeopleModal';
import { TeamMemberAvatarStack, type AvatarStackMember } from '../common/TeamMemberAvatarStack';
import type { MediaCollaborator } from '../../types/mediaCollaborator';
import {
  createCollaboratorFromInvite,
  formatJoinedNames,
} from '../../utils/mediaCollaboratorStorage';

const popoverSurfaceSx = {
  width: 292,
  p: 1.5,
  borderRadius: '16px',
  border: "1px solid var(--noah-border)",
  background: 'var(--noah-drawer-surface)',
  backdropFilter: 'blur(24px) saturate(160%)',
  WebkitBackdropFilter: 'blur(24px) saturate(160%)',
  boxShadow: cv.popoverShadow,
};

interface PeopleCollaboratorsPopoverProps {
  collaborators: MediaCollaborator[];
  onCollaboratorsChange: (collaborators: MediaCollaborator[]) => void;
  onInvited?: (name: string) => void;
}

function toStackMembers(collaborators: MediaCollaborator[]): AvatarStackMember[] {
  return collaborators.map((person) => ({
    id: person.id,
    name: person.name,
    initials: person.initials,
    avatarUrl: person.avatarUrl,
  }));
}

function CollaboratorAvatar({
  person,
  size,
  highlighted = false,
}: {
  person: MediaCollaborator;
  size: number;
  highlighted?: boolean;
}) {
  return (
    <Avatar
      src={person.avatarUrl}
      alt=""
      sx={{
        width: size,
        height: size,
        fontSize: size <= 24 ? '0.625rem' : '0.75rem',
        fontWeight: 700,
        border: highlighted
          ? `2px solid ${cv.purpleSelectionRing}`
          : '2px solid var(--noah-bg)',
        boxShadow: highlighted ? cv.focusRingPurple2 : 'none',
        background: person.avatarUrl
          ? undefined
          : person.avatarColor ?? cv.brandGradient,
        color: cv.textPrimary,
      }}
    >
      {!person.avatarUrl ? person.initials : null}
    </Avatar>
  );
}

export default function PeopleCollaboratorsPopover({
  collaborators,
  onCollaboratorsChange,
  onInvited,
}: PeopleCollaboratorsPopoverProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);

  const open = Boolean(anchorEl);
  const joinedLabel = useMemo(() => formatJoinedNames(collaborators), [collaborators]);
  const stackMembers = useMemo(() => toStackMembers(collaborators), [collaborators]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setAnchorEl(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  const handleInvite = (name: string, email: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    if (collaborators.some((person) => person.email.toLowerCase() === normalizedEmail)) {
      return false;
    }

    onCollaboratorsChange([...collaborators, createCollaboratorFromInvite(name, email)]);
    onInvited?.(name.trim());
    return true;
  };

  return (
    <>
      <Tooltip title="View collaborators" arrow placement="bottom">
        <Box
          component="button"
          type="button"
          aria-label={`${collaborators.length} people collaborating. Open people menu.`}
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={(event) => setAnchorEl(event.currentTarget)}
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            p: 0,
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            color: 'inherit',
          }}
        >
          <TeamMemberAvatarStack members={stackMembers} borderColor={cv.bg} />
        </Box>
      </Tooltip>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: { sx: popoverSurfaceSx, elevation: 0 },
        }}
      >
        <Typography sx={{ fontSize: '1.125rem', fontWeight: 600, color: cv.textPrimary, mb: 1.5 }}>
          People
        </Typography>

        <Button
          fullWidth
          onClick={() => {
            setInviteModalOpen(true);
            setAnchorEl(null);
          }}
          sx={{
            mb: 1.25,
            py: 1.15,
            borderRadius: '999px',
            textTransform: 'none',
            fontSize: '0.9375rem',
            fontWeight: 600,
            color: cv.linkChipText,
            backgroundColor: cv.linkChipBg,
            boxShadow: 'none',
            '&:hover': {
              backgroundColor: cv.linkChipBgHover,
              boxShadow: 'none',
            },
          }}
        >
          Add people
        </Button>

        <Box
          sx={{
            p: 1.25,
            borderRadius: '14px',
            backgroundColor: cv.glassBackground,
            border: `1px solid ${cv.border}`,
          }}
        >
          <Typography sx={{ fontSize: '0.9375rem', fontWeight: 600, color: cv.textPrimary, mb: 0.75 }}>
            {collaborators.length} joined
          </Typography>
          <Typography
            noWrap
            sx={{
              fontSize: '0.8125rem',
              color: cv.textMuted,
              mb: 1.25,
            }}
          >
            {joinedLabel}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            {collaborators.map((person) => (
              <CollaboratorAvatar
                key={person.id}
                person={person}
                size={34}
                highlighted={person.isCurrentUser}
              />
            ))}
          </Box>
        </Box>
      </Popover>

      <InvitePeopleModal
        open={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        onInvite={handleInvite}
      />
    </>
  );
}

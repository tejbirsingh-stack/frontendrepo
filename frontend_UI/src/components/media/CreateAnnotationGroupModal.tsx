import { useEffect, useMemo, useState } from 'react';
import { cv } from '../../theme/cssVars';
import {
  Avatar,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from '@mui/material';
import type { MediaCollaborator } from '../../types/mediaCollaborator';

interface CreateAnnotationGroupModalProps {
  open: boolean;
  onClose: () => void;
  collaborators: MediaCollaborator[];
  onCreate: (name: string, memberIds: string[]) => void;
  onAddCollaborator?: (name: string, email: string) => MediaCollaborator | null;
}

const dialogPaperSx = {
  borderRadius: '20px',
  border: '1px solid var(--noah-border)',
  background: 'var(--noah-dialog-surface)',
  backdropFilter: 'blur(40px) saturate(180%)',
  boxShadow: cv.dialogShadow,
  maxWidth: 480,
};

function CollaboratorRow({
  person,
  selected,
  onToggle,
}: {
  person: MediaCollaborator;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <Box
      component="label"
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.25,
        px: 1,
        py: 0.85,
        borderRadius: '10px',
        cursor: 'pointer',
        '&:hover': { backgroundColor: cv.surfaceHover },
      }}
    >
      <Checkbox
        checked={selected}
        onChange={onToggle}
        size="small"
        sx={{
          p: 0.25,
          color: cv.textMuted,
          '&.Mui-checked': { color: cv.brandPurple },
        }}
      />
      <Avatar
        src={person.avatarUrl}
        alt=""
        sx={{
          width: 32,
          height: 32,
          fontSize: '0.75rem',
          fontWeight: 700,
          background: person.avatarUrl
            ? undefined
            : person.avatarColor ?? cv.brandGradient,
        }}
      >
        {!person.avatarUrl ? person.initials : null}
      </Avatar>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography
          sx={{
            fontSize: '0.875rem',
            fontWeight: 600,
            color: cv.textPrimary,
            lineHeight: 1.3,
          }}
        >
          {person.name}
          {person.isCurrentUser ? ' (you)' : ''}
        </Typography>
        <Typography
          noWrap
          sx={{ fontSize: '0.75rem', color: cv.textMuted, lineHeight: 1.3 }}
        >
          {person.email}
        </Typography>
      </Box>
    </Box>
  );
}

export default function CreateAnnotationGroupModal({
  open,
  onClose,
  collaborators,
  onCreate,
  onAddCollaborator,
}: CreateAnnotationGroupModalProps) {
  const [name, setName] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [addMemberError, setAddMemberError] = useState('');

  const currentUserId = useMemo(
    () => collaborators.find((person) => person.isCurrentUser)?.id,
    [collaborators],
  );

  useEffect(() => {
    if (!open) return;
    setName('');
    setSelectedMemberIds(currentUserId ? [currentUserId] : []);
    setError('');
    setShowAddMember(false);
    setNewMemberName('');
    setNewMemberEmail('');
    setAddMemberError('');
  }, [open, currentUserId]);

  const toggleMember = (memberId: string) => {
    setSelectedMemberIds((current) =>
      current.includes(memberId)
        ? current.filter((id) => id !== memberId)
        : [...current, memberId],
    );
    if (error) setError('');
  };

  const handleAddMember = () => {
    const trimmedName = newMemberName.trim();
    const trimmedEmail = newMemberEmail.trim();

    if (!trimmedName || !trimmedEmail) {
      setAddMemberError('Name and email are required.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setAddMemberError('Enter a valid email address.');
      return;
    }

    const collaborator = onAddCollaborator?.(trimmedName, trimmedEmail);
    if (!collaborator) {
      setAddMemberError('Could not add this person.');
      return;
    }

    setSelectedMemberIds((current) =>
      current.includes(collaborator.id) ? current : [...current, collaborator.id],
    );
    setNewMemberName('');
    setNewMemberEmail('');
    setAddMemberError('');
    setShowAddMember(false);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = name.trim();

    if (!trimmed) {
      setError('Group name is required.');
      return;
    }

    if (selectedMemberIds.length === 0) {
      setError('Select at least one group member.');
      return;
    }

    onCreate(trimmed, selectedMemberIds);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      aria-labelledby="create-annotation-group-title"
      slotProps={{
        paper: { sx: dialogPaperSx },
        backdrop: {
          sx: { backgroundColor: cv.backdropScrim, backdropFilter: 'blur(4px)' },
        },
      }}
    >
      <Box component="form" onSubmit={handleSubmit}>
        <DialogTitle
          id="create-annotation-group-title"
          sx={{ fontSize: '1.125rem', fontWeight: 600, color: cv.textPrimary, pb: 0.5 }}
        >
          Create group
        </DialogTitle>
        <DialogContent sx={{ pt: '4px !important' }}>
          <TextField
            autoFocus
            fullWidth
            size="small"
            label="Group name"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              if (error) setError('');
            }}
            error={Boolean(error) && !name.trim()}
            sx={{ mb: 2 }}
          />

          <Typography
            sx={{
              fontSize: '0.8125rem',
              fontWeight: 600,
              color: cv.textSecondary,
              mb: 0.75,
            }}
          >
            Group members
          </Typography>

          <Box
            sx={{
              maxHeight: 220,
              overflowY: 'auto',
              mb: 1.5,
              borderRadius: '12px',
              border: `1px solid ${cv.border}`,
              backgroundColor: cv.surface,
            }}
          >
            {collaborators.length === 0 ? (
              <Typography sx={{ px: 1.5, py: 2, fontSize: '0.8125rem', color: cv.textMuted }}>
                No collaborators on this file yet.
              </Typography>
            ) : (
              collaborators.map((person) => (
                <CollaboratorRow
                  key={person.id}
                  person={person}
                  selected={selectedMemberIds.includes(person.id)}
                  onToggle={() => toggleMember(person.id)}
                />
              ))
            )}
          </Box>

          {showAddMember ? (
            <Box
              sx={{
                p: 1.5,
                mb: 1.5,
                borderRadius: '12px',
                border: `1px solid ${cv.border}`,
                backgroundColor: cv.surfaceMuted,
              }}
            >
              <TextField
                fullWidth
                size="small"
                label="Full name"
                value={newMemberName}
                onChange={(event) => {
                  setNewMemberName(event.target.value);
                  setAddMemberError('');
                }}
                sx={{ mb: 1.5 }}
              />
              <TextField
                fullWidth
                size="small"
                label="Email address"
                type="email"
                value={newMemberEmail}
                onChange={(event) => {
                  setNewMemberEmail(event.target.value);
                  setAddMemberError('');
                }}
                sx={{ mb: 1 }}
              />
              {addMemberError ? (
                <Typography sx={{ mb: 1, fontSize: '0.8125rem', color: cv.destructive }}>
                  {addMemberError}
                </Typography>
              ) : null}
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  type="button"
                  size="small"
                  onClick={() => {
                    setShowAddMember(false);
                    setNewMemberName('');
                    setNewMemberEmail('');
                    setAddMemberError('');
                  }}
                  sx={{ textTransform: 'none', color: cv.textSecondary }}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="small"
                  variant="contained"
                  onClick={handleAddMember}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    background: cv.brandGradient,
                    boxShadow: 'none',
                    '&:hover': { boxShadow: 'none', filter: 'brightness(1.05)' },
                  }}
                >
                  Add member
                </Button>
              </Box>
            </Box>
          ) : (
            <Button
              type="button"
              onClick={() => setShowAddMember(true)}
              sx={{
                mb: 1,
                px: 0,
                minWidth: 0,
                textTransform: 'none',
                fontWeight: 500,
                fontSize: '0.8125rem',
                color: cv.brandPurple,
                '&:hover': { backgroundColor: 'transparent', color: cv.purpleLight },
              }}
            >
              + Add someone new
            </Button>
          )}

          {error ? (
            <Typography sx={{ fontSize: '0.8125rem', color: cv.destructive }}>{error}</Typography>
          ) : (
            <Typography sx={{ fontSize: '0.8125rem', color: cv.textMuted }}>
              Only people in this group can see annotations shared with it.
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={onClose} sx={{ textTransform: 'none', color: cv.textSecondary }}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={!name.trim() || selectedMemberIds.length === 0}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              background: cv.brandGradient,
              boxShadow: 'none',
              '&:hover': { boxShadow: 'none', filter: 'brightness(1.05)' },
            }}
          >
            Create group
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}

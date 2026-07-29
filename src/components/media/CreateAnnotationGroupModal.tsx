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
import type { AnnotationAccessGroup } from '../../types/annotationVisibility';

interface CreateAnnotationGroupModalProps {
  open: boolean;
  onClose: () => void;
  collaborators: MediaCollaborator[];
  onCreate: (name: string, memberIds: string[]) => void;
  onAddCollaborator?: (name: string, email: string) => MediaCollaborator | null;
  groupToEdit?: AnnotationAccessGroup;
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
  groupToEdit,
}: CreateAnnotationGroupModalProps) {
  const [name, setName] = useState(groupToEdit?.name || '');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [error, setError] = useState('');

  const currentUserId = useMemo(
    () => collaborators.find((person) => person.isCurrentUser)?.id,
    [collaborators],
  );

  useEffect(() => {
    if (!open) return;
    
    if (groupToEdit) {
      setName(groupToEdit.name);
      setSelectedMemberIds(groupToEdit.memberIds);
    } else {
      setName('');
      setSelectedMemberIds(currentUserId ? [currentUserId] : []);
    }
    
    setError('');
  }, [open, currentUserId, groupToEdit]);

  const toggleMember = (memberId: string) => {
    setSelectedMemberIds((current) =>
      current.includes(memberId)
        ? current.filter((id) => id !== memberId)
        : [...current, memberId],
    );
    if (error) setError('');
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = name.trim();

    if (!trimmed) {
      setError('Group name is required.');
      return;
    }

    if (trimmed.length > 50) {
      setError('Group name cannot exceed 50 characters.');
      return;
    }

    if (!/^[a-zA-Z0-9 \-_]+$/.test(trimmed)) {
      setError('Group name can only contain letters, numbers, spaces, hyphens, and underscores.');
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
          {groupToEdit ? 'Edit group' : 'Create group'}
        </DialogTitle>
        <DialogContent sx={{ pt: '4px !important' }}>
          <TextField
            autoFocus
            fullWidth
            size="small"
            label="Group name"
            value={name}
            onChange={(event) => {
              const value = event.target.value;
              setName(value);
              if (value.length > 50) {
                setError('Group name cannot exceed 50 characters.');
              } else if (value.trim() && !/^[a-zA-Z0-9 \-_]+$/.test(value.trim())) {
                setError('Group name can only contain letters, numbers, spaces, hyphens, and underscores.');
              } else {
                setError('');
              }
            }}
            error={Boolean(error) && (error.includes('Group name') || error.includes('characters') || error.includes('required'))}
            helperText={error && (error.includes('Group name') || error.includes('characters') || error.includes('required')) ? error : undefined}
            inputProps={{ maxLength: 50 }}
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



          {error && !error.includes('Group name') && !error.includes('characters') && !error.includes('required') ? (
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
            disabled={!name.trim() || selectedMemberIds.length === 0 || Boolean(error)}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              background: cv.brandGradient,
              boxShadow: 'none',
              '&:hover': { boxShadow: 'none', filter: 'brightness(1.05)' },
            }}
          >
            {groupToEdit ? 'Save changes' : 'Create group'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}

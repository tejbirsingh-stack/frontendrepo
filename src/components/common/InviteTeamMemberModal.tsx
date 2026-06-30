import { useEffect, useState } from 'react';
import { cv } from '../../theme/cssVars';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { noahDialogSlotProps } from '../../constants/dialogStyles';
import { selectInDialogMenuProps } from '../../constants/dropdownMenu';
import { USER_ROLES, type UserRole } from '../../constants/userRoles';
import InvitePeopleFields from '../settings/InvitePeopleFields';

export interface InviteTeamMemberPayload {
  emails: string[];
  role: UserRole;
  message?: string;
}

interface InviteTeamMemberModalProps {
  open: boolean;
  onClose: () => void;
  onInvite: (payload: InviteTeamMemberPayload) => boolean | void;
  existingEmails?: string[];
  title?: string;
  description?: string;
}

const dialogSelectSx = {
  borderRadius: '10px',
  fontSize: '0.8125rem',
  color: cv.textPrimary,
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

export default function InviteTeamMemberModal({
  open,
  onClose,
  onInvite,
  existingEmails = [],
  title = 'Invite team member',
  description = 'Invited teammates receive an email to join your workspace.',
}: InviteTeamMemberModalProps) {
  const [emails, setEmails] = useState<string[]>([]);
  const [role, setRole] = useState<UserRole>('Collaborator');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const normalizedExisting = new Set(existingEmails.map((email) => email.toLowerCase()));

  useEffect(() => {
    if (!open) return;
    setEmails([]);
    setRole('Collaborator');
    setMessage('');
    setError('');
  }, [open]);

  const handleSubmit = () => {
    if (emails.length === 0) {
      setError('Add at least one email address.');
      return;
    }

    const alreadyMember = emails.find((email) => normalizedExisting.has(email.toLowerCase()));
    if (alreadyMember) {
      setError(`${alreadyMember} is already a team member.`);
      return;
    }

    const success = onInvite({
      emails,
      role,
      message: message.trim() || undefined,
    });

    if (success === false) return;
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      aria-labelledby="invite-team-member-title"
      slotProps={noahDialogSlotProps({ maxWidth: 480 })}
    >
      <DialogTitle
        id="invite-team-member-title"
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pb: 1,
          fontWeight: 600,
          fontSize: '1.25rem',
          color: cv.textPrimary,
        }}
      >
        {title}
        <IconButton aria-label="Close" onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          pt: '8px !important',
          backgroundColor: cv.dialogSurface,
          overflow: 'visible',
        }}
      >
        <Typography sx={{ fontSize: '0.875rem', color: cv.textSecondary, lineHeight: 1.5 }}>
          {description}
        </Typography>

        <InvitePeopleFields
          emails={emails}
          onChange={(nextEmails) => {
            setEmails(nextEmails);
            if (error) setError('');
          }}
          description=""
        />

        <FormControl fullWidth size="small">
          <InputLabel id="invite-team-member-role-label" shrink>
            Role
          </InputLabel>
          <Select
            labelId="invite-team-member-role-label"
            label="Role"
            value={role}
            onChange={(event: SelectChangeEvent) => setRole(event.target.value as UserRole)}
            MenuProps={selectInDialogMenuProps}
            sx={dialogSelectSx}
          >
            {USER_ROLES.map((roleOption) => (
              <MenuItem
                key={roleOption}
                value={roleOption}
                sx={{ fontSize: '0.875rem', color: cv.textPrimary }}
              >
                {roleOption}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          fullWidth
          size="small"
          multiline
          minRows={2}
          label="Message (optional)"
          placeholder="Add a personal note to your invite"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
        />

        {error ? (
          <Typography sx={{ fontSize: '0.8125rem', color: cv.destructive }}>{error}</Typography>
        ) : null}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5, pt: 1, gap: 1, backgroundColor: cv.dialogSurface }}>
        <Button onClick={onClose} sx={{ textTransform: 'none', color: cv.textSecondary }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={emails.length === 0}
          sx={containedButtonSx}
        >
          Send invite{emails.length > 1 ? 's' : ''}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

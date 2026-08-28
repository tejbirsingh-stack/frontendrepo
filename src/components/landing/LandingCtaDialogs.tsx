import { useEffect, useId, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  Grow,
  IconButton,
  Link,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import { checkEmailRequest } from '../../api/auth.service';
import { submitDemoRequest } from '../../platform/api/platformApi';
import { noahDialogBackdropSx, noahDialogPaperSx, noahDialogSlotProps } from '../../constants/dialogStyles';
import { cv } from '../../theme/cssVars';
import { validateBusinessEmail } from '../../utils/authValidation';
import { DISPLAY_FONT, TEAM_SIZE_OPTIONS } from './landingContent';

function restorePageScroll() {
  const html = document.documentElement;
  const body = document.body;
  html.style.removeProperty('overflow');
  html.style.removeProperty('padding-right');
  body.style.removeProperty('overflow');
  body.style.removeProperty('padding-right');
  body.classList.remove('mui-fixed');
}

const DIALOG_DURATION = { enter: 420, exit: 280 };

type ModalKind = 'demo' | 'trial' | null;

const primaryCtaSx = {
  height: 48,
  minHeight: 48,
  background: cv.brandGradient,
  color: cv.textOnCta,
  fontWeight: 600,
  boxShadow: 'none',
  '&:hover': { background: cv.brandGradientHover, boxShadow: cv.brandShadow },
} as const;

const fieldSx = {
  '& .MuiOutlinedInput-root': {
    backgroundColor: cv.surfaceMuted,
  },
};

function DialogShell({
  open,
  title,
  description,
  titleId,
  descId,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  description?: string;
  titleId: string;
  descId: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const dialogSlots = noahDialogSlotProps({ overflow: 'hidden' });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      scroll="paper"
      hideBackdrop={false}
      slots={{ transition: Grow }}
      transitionDuration={DIALOG_DURATION}
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
      slotProps={{
        ...dialogSlots,
        paper: {
          sx: {
            ...noahDialogPaperSx,
            overflow: 'hidden',
          },
        },
        backdrop: {
          timeout: DIALOG_DURATION,
          sx: {
            ...noahDialogBackdropSx,
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
          },
        },
        transition: { onExited: restorePageScroll },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 2,
          px: { xs: 2.5, sm: 3.5 },
          pt: 2.5,
          pb: 1,
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography
            id={titleId}
            component="h2"
            sx={{
              fontFamily: DISPLAY_FONT,
              fontSize: { xs: '1.5rem', sm: '1.75rem' },
              fontWeight: 600,
              letterSpacing: '-0.03em',
              lineHeight: 1.2,
            }}
          >
            {title}
          </Typography>
          {description ? (
            <Typography
              id={descId}
              sx={{ color: cv.textSecondary, mt: 0.75, fontSize: '0.9375rem', lineHeight: 1.5 }}
            >
              {description}
            </Typography>
          ) : null}
        </Box>
        <IconButton
          onClick={onClose}
          aria-label="Close dialog"
          sx={{
            color: cv.textSecondary,
            minWidth: 44,
            minHeight: 44,
            '&:hover': { color: cv.textPrimary, backgroundColor: cv.surfaceHover },
          }}
        >
          <CloseIcon />
        </IconButton>
      </Box>
      <DialogContent sx={{ px: { xs: 2.5, sm: 3.5 }, pb: 3.5, pt: 1.5 }}>{children}</DialogContent>
    </Dialog>
  );
}

function TrialForm({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const firstId = useId();
  const lastId = useId();
  const emailId = useId();
  const companyId = useId();
  const errorId = useId();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (!firstName.trim()) {
      setError('First name is required.');
      return;
    }
    if (!lastName.trim()) {
      setError('Last name is required.');
      return;
    }
    const emailError = validateBusinessEmail(email);
    if (emailError) {
      setError(emailError);
      return;
    }

    setBusy(true);
    try {
      const normalizedEmail = email.trim().toLowerCase();
      await checkEmailRequest(normalizedEmail);
      navigate('/signup', {
        state: {
          email: normalizedEmail,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          companyWebsite: company.trim(),
          fromTrial: true,
        },
      });
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number; data?: { exists?: boolean; message?: string } }; message?: string };
      if (axiosErr.response?.status === 409 || axiosErr.response?.data?.exists) {
        setError('This email is already registered. Sign in to continue.');
      } else {
        setError(axiosErr.response?.data?.message || axiosErr.message || 'Could not start your trial.');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <Box component="form" onSubmit={(e) => void handleSubmit(e)} noValidate>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
        <TextField
          id={firstId}
          label="First name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          required
          autoComplete="given-name"
          slotProps={{ htmlInput: { maxLength: 50 } }}
          sx={fieldSx}
        />
        <TextField
          id={lastId}
          label="Last name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          required
          autoComplete="family-name"
          slotProps={{ htmlInput: { maxLength: 50 } }}
          sx={fieldSx}
        />
      </Box>
      <TextField
        id={emailId}
        label="Work email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        fullWidth
        autoComplete="email"
        helperText="Use your company email — personal inboxes are not accepted."
        sx={{ ...fieldSx, mt: 1.5 }}
      />
      <TextField
        id={companyId}
        label="Company"
        value={company}
        onChange={(e) => setCompany(e.target.value)}
        fullWidth
        autoComplete="organization"
        slotProps={{ htmlInput: { maxLength: 200 } }}
        sx={{ ...fieldSx, mt: 1.5 }}
      />
      {error ? (
        <Typography id={errorId} role="alert" sx={{ color: cv.destructive, mt: 1.5, fontSize: '0.875rem' }}>
          {error}{' '}
          {error.includes('already registered') ? (
            <Link component={RouterLink} to="/login" sx={{ color: cv.brandOrchid, fontWeight: 600 }}>
              Sign in
            </Link>
          ) : null}
        </Typography>
      ) : null}
      <Button
        type="submit"
        fullWidth
        variant="contained"
        disabled={busy}
        aria-busy={busy}
        sx={{
          mt: 2.5,
          ...primaryCtaSx,
        }}
      >
        {busy ? <CircularProgress size={22} sx={{ color: cv.textOnCta }} /> : 'Create my workspace'}
      </Button>
      <Typography sx={{ mt: 1.5, textAlign: 'center', color: cv.textMuted, fontSize: '0.8125rem' }}>
        Already have an account?{' '}
        <Link component={RouterLink} to="/login" onClick={onClose} sx={{ color: cv.textPrimary, fontWeight: 600 }}>
          Sign in
        </Link>
      </Typography>
    </Box>
  );
}

function DemoForm({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [teamSize, setTeamSize] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const nameId = useId();
  const emailId = useId();
  const companyId = useId();
  const teamId = useId();
  const messageId = useId();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }

    setBusy(true);
    try {
      await submitDemoRequest({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        company: company.trim(),
        teamSize,
        message: message.trim(),
      });
      setSent(true);
    } catch (err: unknown) {
      const axiosErr = err as { message?: string };
      setError(axiosErr.message || 'Could not send your request. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  if (sent) {
    return (
      <Box sx={{ textAlign: 'center', py: 2 }} role="status" aria-live="polite">
        <CheckCircleOutlinedIcon sx={{ fontSize: 48, color: cv.success, mb: 1.5 }} aria-hidden />
        <Typography sx={{ fontWeight: 700, fontSize: '1.125rem', mb: 0.75 }}>Request received</Typography>
        <Typography sx={{ color: cv.textSecondary, fontSize: '0.9375rem', lineHeight: 1.6, mb: 3 }}>
          Thanks {name.trim().split(' ')[0] || 'there'}. A NOAH specialist will reach out to schedule a walkthrough of
          the library, review, and sharing workflow.
        </Typography>
        <Button
          onClick={onClose}
          variant="contained"
          sx={primaryCtaSx}
        >
          Back to NOAH
        </Button>
      </Box>
    );
  }

  return (
    <Box component="form" onSubmit={(e) => void handleSubmit(e)} noValidate>
      <TextField
        id={nameId}
        label="Full name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        fullWidth
        autoComplete="name"
        slotProps={{ htmlInput: { maxLength: 120 } }}
        sx={fieldSx}
      />
      <TextField
        id={emailId}
        label="Work email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        fullWidth
        autoComplete="email"
        sx={{ ...fieldSx, mt: 1.5 }}
      />
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5, mt: 1.5 }}>
        <TextField
          id={companyId}
          label="Company"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          autoComplete="organization"
          slotProps={{ htmlInput: { maxLength: 200 } }}
          sx={fieldSx}
        />
        <TextField
          id={teamId}
          label="Team size"
          type="number"
          value={teamSize}
          onChange={(e) => setTeamSize(e.target.value)}
          placeholder="1"
          slotProps={{ htmlInput: { min: 1, max: 100000, step: 1 } }}
          sx={fieldSx}
        />
      </Box>
      <TextField
        id={messageId}
        label="What should we show you?"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        fullWidth
        multiline
        minRows={3}
        slotProps={{ htmlInput: { maxLength: 2000 } }}
        sx={{ ...fieldSx, mt: 1.5 }}
      />
      {error ? (
        <Typography role="alert" sx={{ color: cv.destructive, mt: 1.5, fontSize: '0.875rem' }}>
          {error}
        </Typography>
      ) : null}
      <Button
        type="submit"
        fullWidth
        variant="contained"
        disabled={busy}
        aria-busy={busy}
        sx={{
          mt: 2.5,
          ...primaryCtaSx,
        }}
      >
        {busy ? <CircularProgress size={22} sx={{ color: cv.textOnCta }} /> : 'Request a demo'}
      </Button>
    </Box>
  );
}

export default function LandingCtaDialogs({
  open,
  onClose,
}: {
  open: ModalKind;
  onClose: () => void;
}) {
  const trialTitleId = useId();
  const trialDescId = useId();
  const demoTitleId = useId();
  const demoDescId = useId();

  const [kind, setKind] = useState<'demo' | 'trial'>('trial');

  useEffect(() => {
    if (open) setKind(open);
  }, [open]);

  const handleClose = () => {
    onClose();
    window.setTimeout(restorePageScroll, 0);
    window.setTimeout(restorePageScroll, 300);
  };

  const isTrial = kind === 'trial';

  return (
    <DialogShell
      open={Boolean(open)}
      onClose={handleClose}
      title={isTrial ? 'Start your free trial' : 'Book a demo'}
      description={
        isTrial
          ? 'Create a workspace in minutes. Review, share, and organize media with your team — no credit card to begin.'
          : 'Tell us about your library and we will walk you through ingest, timeline review, sharing, and admin controls.'
      }
      titleId={isTrial ? trialTitleId : demoTitleId}
      descId={isTrial ? trialDescId : demoDescId}
    >
      {isTrial ? (
        <TrialForm key="trial" onClose={handleClose} />
      ) : (
        <DemoForm key="demo" onClose={handleClose} />
      )}
    </DialogShell>
  );
}

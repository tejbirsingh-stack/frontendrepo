import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Box, Typography, keyframes } from '@mui/material';
import { toast } from 'react-hot-toast';
import { useAuth } from '../auth/AuthContext';
import { persistSession } from '../auth/authStorage';
import {
  fetchCurrentUserRequest,
  mapAuthUserDtoToSessionUser,
} from '../api/auth.service';
import { useUploadManager } from '../context/UploadManagerContext';
import { loadFilesFromIDB, clearFilesFromIDB } from '../utils/signupFileStore';
import LiquidBackground from '../components/LiquidBackground';
import WaveBackground from '../components/WaveBackground';
import NoahLogo, { AUTH_LOGO_PARENT_SX, AUTH_LOGO_SX } from '../components/NoahLogo';
import NoahMascot from '../components/NoahMascot';
import { cv } from '../theme/cssVars';

// ── Constants (mirrored from SignUpPage) ─────────────────────────────────────
const PREPARING_SCREEN_MS = 8000;
const PREPARING_STEP_MS = 2000;

const PREPARING_STATUS_LINES = [
  'Setting up your workspace...',
  'Preparing your media library...',
  'Warming up video & audio tools...',
  'Your workspace is ready!',
] as const;

const statusFadeIn = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
`;

/** Mounted at /signup/complete after successful Stripe payment. Authenticates the user and syncs the plan. */
export default function SignupCompletePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setSession } = useAuth();
  const { enqueueFiles } = useUploadManager();
  const [preparingStep, setPreparingStep] = useState(0);
  const [statusMessage, setStatusMessage] = useState('Activating your subscription...');

  useEffect(() => {
    let cancelled = false;

    async function activate() {
      const params = new URLSearchParams(location.search);
      const sessionId = params.get('session_id'); // Stripe appends this to the success URL

      // ── Read pending auth token ───────────────────────────────────────────
      const pendingRaw = sessionStorage.getItem('signup_pending_auth');
      if (!pendingRaw) {
        // No pending auth — likely a direct navigation or stale session.
        navigate('/signup', { replace: true });
        return;
      }

      let token: string;
      let savedResponse: any;
      try {
        const parsed = JSON.parse(pendingRaw);
        token = parsed.token;
        savedResponse = parsed.response;
      } catch {
        navigate('/signup', { replace: true });
        return;
      }

      if (!token) {
        navigate('/signup', { replace: true });
        return;
      }

      // ── Start preparing animation ─────────────────────────────────────────
      PREPARING_STATUS_LINES.forEach((_, index) => {
        window.setTimeout(() => {
          if (!cancelled) setPreparingStep(index);
        }, index * PREPARING_STEP_MS);
      });

      // Authenticate the user
      localStorage.setItem('accessToken', token);
      localStorage.setItem('token', token);
      const mappedUser = mapAuthUserDtoToSessionUser(savedResponse?.user || savedResponse);
      setSession(token, mappedUser);
      persistSession(token, mappedUser);

      try {
        setStatusMessage('Activating your subscription...');

        // Sync the Stripe checkout session to upgrade plan in DB
        if (sessionId) {
          try {
            const { billingService } = await import('../api/billing.service');
            await billingService.syncSession(sessionId);
          } catch (syncErr) {
            console.warn('[SignupComplete] Stripe sync-session failed:', syncErr);
            // Non-fatal — the webhook should handle it
          }
        }

        // Fetch the latest user profile (with upgraded plan)
        try {
          const currentUserDto = await fetchCurrentUserRequest();
          if (currentUserDto) {
            const updatedUser = mapAuthUserDtoToSessionUser(currentUserDto);
            setSession(token, updatedUser);
            persistSession(token, updatedUser);
          }
        } catch (fetchErr) {
          console.warn('[SignupComplete] Failed to fetch updated user profile:', fetchErr);
        }

        // Enqueue files from IndexedDB
        try {
          const files = await loadFilesFromIDB();
          if (files && files.length > 0) {
            const targetWorkspaceId =
              savedResponse?.workspace?.id ||
              savedResponse?.user?.workspace?.id ||
              savedResponse?.user?.orgId;
            void enqueueFiles(files, { ownerType: 'WORKSPACE', ownerId: targetWorkspaceId });
            await clearFilesFromIDB();
          }
        } catch (fileErr) {
          console.warn('[SignupComplete] Could not restore signup files from IndexedDB:', fileErr);
        }

        // Clean up sessionStorage
        sessionStorage.removeItem('signup_pending_auth');
        sessionStorage.removeItem('signup_pending_data');

        toast.success('Welcome! Your subscription is active.', { duration: 4000 });
        setStatusMessage('Your workspace is ready!');
      } catch (err: any) {
        console.error('[SignupComplete] Post-payment activation error:', err);
        toast.error(
          'Your payment was received but account setup encountered an issue. ' +
            'Please contact support if your plan is not updated.',
          { duration: 8000 }
        );
      }

      // Wait for animation then navigate
      window.setTimeout(() => {
        if (!cancelled) navigate('/home', { replace: true });
      }, PREPARING_SCREEN_MS);
    }

    void activate();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100%',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        px: { xs: 3, sm: 5, md: 8, lg: 12 },
        py: { xs: 6, md: 8 },
      }}
    >
      <LiquidBackground />
      <WaveBackground />
      <NoahMascot
        pose="walk"
        preset="authCompanion"
        side="right"
        sx={{
          display: { xs: 'none', md: 'block' },
          position: 'fixed',
          right: { md: 32, lg: 64 },
          bottom: { md: 80 },
          left: 'auto',
          width: 320,
          zIndex: 0,
        }}
      />

      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          maxWidth: 1200,
          mx: 'auto',
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1.1fr 0.9fr' },
          gap: { xs: 6, md: 8 },
          alignItems: 'center',
        }}
      >
        <Box>
          <Box sx={{ ...AUTH_LOGO_PARENT_SX, justifyContent: 'flex-start', mb: { xs: 3, md: 4 } }}>
            <NoahLogo align="left" animated={false} showGlow={false} sx={AUTH_LOGO_SX} />
          </Box>
          <Typography
            sx={{
              color: cv.textPrimary,
              fontWeight: 700,
              fontSize: { xs: '2rem', sm: '2.75rem', md: '3.25rem' },
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
              maxWidth: 520,
            }}
          >
            A library worthy of
            <br />
            your beautiful work.
          </Typography>
        </Box>

        <Box
          sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2, md: 2.5 }, pl: { md: 2 } }}
          aria-live="polite"
        >
          <Typography
            sx={{ color: cv.textMuted, fontSize: '0.875rem', fontWeight: 500, mb: 0.5, opacity: 0.7 }}
          >
            {statusMessage}
          </Typography>

          {PREPARING_STATUS_LINES.map((line, index) => {
            const isActive = index === preparingStep;
            const isPast = index < preparingStep;
            const isVisible = index <= preparingStep;

            return (
              <Typography
                key={line}
                sx={{
                  color: cv.textPrimary,
                  fontSize: { xs: '1rem', md: '1.125rem' },
                  fontWeight: isActive ? 600 : 400,
                  opacity: !isVisible ? 0 : isActive ? 1 : isPast ? 0.45 : 0.28,
                  transform: isVisible ? 'none' : 'translateY(8px)',
                  transition: 'opacity 0.45s ease, transform 0.45s ease, font-weight 0.2s ease',
                  animation: isActive ? `${statusFadeIn} 0.45s ease` : 'none',
                  minHeight: '1.5em',
                }}
              >
                {line}
              </Typography>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
}

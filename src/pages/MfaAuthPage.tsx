import { useState, useEffect } from 'react';
import { cv } from '../theme/cssVars';
import { useLocation, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  TextField,
  Typography,
  Link
} from '@mui/material';
import GlassCard from '../components/GlassCard';
import LiquidBackground from '../components/LiquidBackground';
import WaveBackground from '../components/WaveBackground';
import NoahLogo from '../components/NoahLogo';
import { loginUser } from '../api/auth.service';

export default function MfaAuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mfaCode, setMfaCode] = useState('');
  const [error, setError] = useState('');

  const state = location.state as { email?: string; password?: string; requiresMfa?: boolean; from?: string } | null;

  // Protect the route
  useEffect(() => {
    if (!state || !state.requiresMfa || !state.email || !state.password) {
      navigate('/', { replace: true });
    }
  }, [state, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!state?.email || !state?.password) return;

    setError('');

    const redirectPath = state?.from || '/home';

    try {
      // Use the custom loginUser function to hit the real API directly
      const response = await loginUser({ 
        email: state.email, 
        password: state.password, 
        mfaCode: mfaCode 
      });
      
      // Manually set the session in localStorage so the app recognizes the user
      const token = response.accessToken || response.token;
      if (token) {
        localStorage.setItem('noah_session_token', token);
      }
      
      // Force a full page reload to the redirect path so AuthContext picks up the new localStorage values
      window.location.href = redirectPath;
    } catch (submitError: any) {
      console.error(submitError);
      setError(submitError.response?.data?.message || submitError.message || 'Unable to verify code.');
    }
  };

  // If redirecting, don't render the form
  if (!state || !state.requiresMfa || !state.email) {
    return null;
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: { xs: 2, sm: 3, md: 4 },
        position: 'relative',
      }}
    >
      <LiquidBackground />
      <WaveBackground />

      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          maxWidth: 440,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <NoahLogo />

        <GlassCard
          glow
          sx={{
            width: '100%',
          }}
        >
          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{
              p: { xs: 3, sm: 4 },
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Typography
              variant="h4"
              sx={{
                fontWeight: 600,
                mb: 1,
                fontSize: { xs: '1.5rem', sm: '1.75rem' },
              }}
            >
              Authentication Required
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: cv.textSecondary, mb: 4, fontSize: '0.9375rem' }}
            >
              An authentication code has been sent to <strong>{state.email}</strong>.
            </Typography>

            <TextField
              fullWidth
              label="Authentication Code"
              type="text"
              placeholder="Enter 6-digit code"
              value={mfaCode}
              onChange={(e) => setMfaCode(e.target.value)}
              sx={{ mb: 3 }}
              slotProps={{
                inputLabel: { shrink: true },
              }}
              autoFocus
            />

            {error ? (
              <Typography sx={{ mb: 2, fontSize: '0.8125rem', color: cv.destructive }}>
                {error}
              </Typography>
            ) : null}

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={!mfaCode}
              sx={{
                py: 1.5,
                mb: 3,
                background: cv.brandGradient,
                boxShadow: cv.loginBrandShadow,
                '&:hover': {
                  background: cv.brandGradientHover,
                  boxShadow: cv.loginBrandShadowHover,
                },
              }}
            >
              Verify Code
            </Button>

            <Typography
              variant="body2"
              sx={{
                textAlign: 'center',
                color: cv.textSecondary,
              }}
            >
              <Link
                component={RouterLink}
                to="/"
                underline="hover"
                sx={{
                  color: cv.textPrimary,
                  fontWeight: 500,
                  '&:hover': { color: cv.brandBlue },
                }}
              >
                Back to Login
              </Link>
            </Typography>
          </Box>
        </GlassCard>
      </Box>
    </Box>
  );
}

import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  Link,
  TextField,
  Typography,
} from '@mui/material';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import GlassCard from '../components/GlassCard';
import LiquidBackground from '../components/LiquidBackground';
import WaveBackground from '../components/WaveBackground';
import NoahLogo, { AUTH_LOGO_PARENT_SX, AUTH_LOGO_SX } from '../components/NoahLogo';
import { cv } from '../theme/cssVars';
import { useForcedDarkTheme } from '../context/ThemePreferenceContext';
import { validateEmail } from '../utils/authValidation';
import { forgotPasswordRequest } from '../api/auth.service';

export default function ForgotPasswordPage() {
  useForcedDarkTheme();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Please enter your email address.');
      return;
    }

    const emailError = validateEmail(trimmedEmail);
    if (emailError) {
      setError(emailError);
      return;
    }

    setLoading(true);
    try {
      const res = await forgotPasswordRequest(trimmedEmail);
      setSuccessMessage(
        res?.message || 'If an account exists with this email, a password reset link has been sent.'
      );
      setSubmitted(true);
    } catch (err: any) {
      console.error('Forgot password request error:', err);
      const apiMessage = err.response?.data?.message || err.message;
      setError(apiMessage || 'Failed to process request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
          maxWidth: 640,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Box sx={AUTH_LOGO_PARENT_SX}>
          <NoahLogo to="/" ariaLabel="Back to NOAH Cloud home" sx={AUTH_LOGO_SX} showGlow={false} animated={false} />
        </Box>

        <GlassCard glow sx={{ width: '100%', maxWidth: 440 }}>
          {submitted ? (
            <Box
              sx={{
                p: { xs: 4, sm: 5 },
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
              }}
            >
              <CheckCircleOutlinedIcon sx={{ fontSize: 64, color: cv.success, mb: 2 }} />
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 1.5, color: cv.textPrimary }}>
                Reset Link Sent
              </Typography>
              <Typography variant="body2" sx={{ color: cv.textSecondary, mb: 3.5, lineHeight: 1.6 }}>
                {successMessage}
              </Typography>
              <Button
                component={RouterLink}
                to="/login"
                variant="contained"
                fullWidth
                sx={{
                  py: 1.5,
                  background: cv.brandGradient,
                  boxShadow: cv.loginBrandShadow,
                  '&:hover': {
                    background: cv.brandGradientHover,
                    boxShadow: cv.loginBrandShadowHover,
                  },
                }}
              >
                Back to Sign in
              </Button>
            </Box>
          ) : (
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
                Forgot Password?
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: cv.textSecondary, mb: 3.5, fontSize: '0.9375rem', lineHeight: 1.5 }}
              >
                Enter your registered email address and we will send you a link to reset your password.
              </Typography>

              <TextField
                fullWidth
                label="Email Address"
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError('');
                }}
                autoComplete="email"
                disabled={loading}
                sx={{ mb: 3 }}
                slotProps={{
                  inputLabel: { shrink: true },
                }}
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
                disabled={loading}
                sx={{
                  py: 1.5,
                  mb: 2.5,
                  background: cv.brandGradient,
                  boxShadow: cv.loginBrandShadow,
                  '&:hover': {
                    background: cv.brandGradientHover,
                    boxShadow: cv.loginBrandShadowHover,
                  },
                }}
              >
                {loading ? 'Sending Reset Link...' : 'Send Reset Link'}
              </Button>

              <Typography
                variant="body2"
                sx={{
                  textAlign: 'center',
                  color: cv.textSecondary,
                }}
              >
                Remembered your password?{' '}
                <Link
                  component={RouterLink}
                  to="/login"
                  underline="hover"
                  sx={{
                    color: cv.textPrimary,
                    fontWeight: 500,
                    '&:hover': { color: cv.brandBlue },
                  }}
                >
                  Sign in
                </Link>
              </Typography>
            </Box>
          )}
        </GlassCard>
      </Box>
    </Box>
  );
}

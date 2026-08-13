import { useState } from 'react';
import { useNavigate, useSearchParams, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  IconButton,
  InputAdornment,
  Link,
  TextField,
  Typography,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import GlassCard from '../components/GlassCard';
import LiquidBackground from '../components/LiquidBackground';
import WaveBackground from '../components/WaveBackground';
import NoahLogo, { AUTH_LOGO_PARENT_SX, AUTH_LOGO_SX } from '../components/NoahLogo';
import { cv } from '../theme/cssVars';
import { useForcedDarkTheme } from '../context/ThemePreferenceContext';
import { validatePassword } from '../utils/authValidation';
import { resetPasswordRequest } from '../api/auth.service';

export default function ResetPasswordPage() {
  useForcedDarkTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('Missing token in URL. Please use the exact setup link from your invitation email.');
      return;
    }

    if (!name.trim()) {
      setError('Please enter your full name.');
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await resetPasswordRequest({
        token,
        name: name.trim(),
        password,
        newPassword: password,
      });

      setSuccessMessage('Your account setup is complete! You can now sign in with your new credentials.');
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 3000);
    } catch (err: any) {
      console.error('Account setup error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to complete account setup. The link may have expired.');
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
          <NoahLogo sx={AUTH_LOGO_SX} showGlow={false} animated={false} />
        </Box>

        <GlassCard glow sx={{ width: '100%', maxWidth: 460 }}>
          {successMessage ? (
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
                Account Setup Complete
              </Typography>
              <Typography variant="body2" sx={{ color: cv.textSecondary, mb: 3 }}>
                {successMessage}
              </Typography>
              <Button
                variant="contained"
                fullWidth
                onClick={() => navigate('/login', { replace: true })}
                sx={{
                  py: 1.5,
                  background: cv.brandGradient,
                  boxShadow: cv.loginBrandShadow,
                }}
              >
                Go to Sign In
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
                Set up your account
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: cv.textSecondary, mb: 3, fontSize: '0.9375rem' }}
              >
                Please provide your full name and choose a secure password to activate your account.
              </Typography>

              {!token && (
                <Typography sx={{ mb: 2, fontSize: '0.8125rem', color: cv.destructive }}>
                  Warning: No setup token found in URL. Please click the link from your email.
                </Typography>
              )}

              <TextField
                fullWidth
                label="Full Name"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                sx={{ mb: 2.5 }}
                slotProps={{
                  inputLabel: { shrink: true },
                }}
              />

              <TextField
                fullWidth
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Password 8–16 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                sx={{ mb: 2.5 }}
                slotProps={{
                  inputLabel: { shrink: true },
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                          onClick={() => setShowPassword((prev) => !prev)}
                          edge="end"
                          sx={{ color: cv.textMuted }}
                        >
                          {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />

              <TextField
                fullWidth
                label="Confirm password"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                sx={{ mb: 3 }}
                slotProps={{
                  inputLabel: { shrink: true },
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                          onClick={() => setShowConfirmPassword((prev) => !prev)}
                          edge="end"
                          sx={{ color: cv.textMuted }}
                        >
                          {showConfirmPassword ? (
                            <VisibilityOff fontSize="small" />
                          ) : (
                            <Visibility fontSize="small" />
                          )}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
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
                disabled={loading || !token}
                sx={{
                  py: 1.5,
                  mb: 2,
                  background: cv.brandGradient,
                  boxShadow: cv.loginBrandShadow,
                  '&:hover': {
                    background: cv.brandGradientHover,
                    boxShadow: cv.loginBrandShadowHover,
                  },
                }}
              >
                {loading ? 'Saving to Database & HubSpot...' : 'Save & Activate Account'}
              </Button>

              <Typography
                variant="body2"
                sx={{
                  mt: 2,
                  textAlign: 'center',
                  color: cv.textSecondary,
                }}
              >
                Already set up?{' '}
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

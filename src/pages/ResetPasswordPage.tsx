import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import ErrorOutlinedIcon from '@mui/icons-material/ErrorOutlined';
import GlassCard from '../components/GlassCard';
import LiquidBackground from '../components/LiquidBackground';
import WaveBackground from '../components/WaveBackground';
import NoahLogo, { AUTH_LOGO_PARENT_SX, AUTH_LOGO_SX } from '../components/NoahLogo';
import { cv } from '../theme/cssVars';
import { useForcedDarkTheme } from '../context/ThemePreferenceContext';
import { validatePassword } from '../utils/authValidation';
import { resetPasswordRequest, validateResetTokenRequest } from '../api/auth.service';

export default function ResetPasswordPage() {
  useForcedDarkTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const mode = searchParams.get('type') || searchParams.get('mode') || '';
  const [isInvite, setIsInvite] = useState(mode === 'invite' || mode === 'setup');

  const [validatingToken, setValidatingToken] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [validationError, setValidationError] = useState('');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Validate token on mount
  useEffect(() => {
    let isMounted = true;
    async function checkToken() {
      if (!token) {
        if (isMounted) {
          setValidationError(
            isInvite
              ? 'This setup link is invalid or has expired. Please request a new invite link from your administrator.'
              : 'This password reset link is invalid or has expired. Please request a new reset link.',
          );
          setTokenValid(false);
          setValidatingToken(false);
        }
        return;
      }

      try {
        const res = await validateResetTokenRequest(token);
        if (isMounted) {
          if (res?.valid) {
            setTokenValid(true);
            if (res.isInvite || (res as any).userStatus === 'inactive' || (res as any).userStatus === 'pending') {
              setIsInvite(true);
            }
          } else {
            setTokenValid(false);
            setValidationError(
              res?.message ||
                (isInvite
                  ? 'This setup link is invalid or has expired. Please request a new invite link from your administrator.'
                  : 'This password reset link is invalid or has expired. Please request a new reset link.'),
            );
          }
        }
      } catch (err: any) {
        if (isMounted) {
          console.error('Reset token validation error:', err);
          setTokenValid(false);
          setValidationError(
            err.response?.data?.message ||
              (isInvite
                ? 'This setup link is invalid or has expired. Please request a new invite link from your administrator.'
                : 'This password reset link is invalid or has expired. Please request a new reset link.'),
          );
        }
      } finally {
        if (isMounted) {
          setValidatingToken(false);
        }
      }
    }

    checkToken();
    return () => {
      isMounted = false;
    };
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    if (!tokenValid) {
      setSubmitError('Invalid or expired token.');
      return;
    }

    const passError = validatePassword(password);
    if (passError) {
      setSubmitError(passError);
      return;
    }

    if (password !== confirmPassword) {
      setSubmitError('Password and confirm password must match');
      return;
    }

    setSubmitting(true);
    try {
      await resetPasswordRequest({
        token,
        password,
        confirmPassword,
      });

      setSuccess(true);
    } catch (err: any) {
      console.error('Reset password error:', err);
      setSubmitError(
        err.response?.data?.message ||
          err.message ||
          (isInvite ? 'Failed to set password.' : 'Failed to update password. Please try requesting a new reset link.'),
      );
    } finally {
      setSubmitting(false);
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

        <GlassCard glow sx={{ width: '100%', maxWidth: 460 }}>
          {validatingToken ? (
            <Box
              sx={{
                p: { xs: 5, sm: 6 },
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
              }}
            >
              <CircularProgress size={48} sx={{ color: cv.brandBlue, mb: 2 }} />
              <Typography variant="body1" sx={{ color: cv.textSecondary }}>
                Validating security token...
              </Typography>
            </Box>
          ) : !tokenValid ? (
            <Box
              sx={{
                p: { xs: 4, sm: 5 },
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
              }}
            >
              <ErrorOutlinedIcon sx={{ fontSize: 64, color: cv.destructive, mb: 2 }} />
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 1.5, color: cv.textPrimary }}>
                Invalid or Expired Link
              </Typography>
              <Typography variant="body2" sx={{ color: cv.textSecondary, mb: 3.5, lineHeight: 1.6 }}>
                {validationError ||
                  (isInvite
                    ? 'This setup link is invalid or has expired. Please request a new invite link.'
                    : 'This password reset link is invalid or has expired. Please request a new reset link.')}
              </Typography>
              <Button
                component={RouterLink}
                to={isInvite ? '/login' : '/forgot-password'}
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
                {isInvite ? 'Go to Login' : 'Request New Reset Link'}
              </Button>
            </Box>
          ) : success ? (
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
                {isInvite ? 'Account Activated!' : 'Password Updated'}
              </Typography>
              <Typography variant="body2" sx={{ color: cv.textSecondary, mb: 3.5, fontSize: '0.9375rem' }}>
                {isInvite
                  ? 'Your password has been set successfully and your account is active. You can now log in.'
                  : 'Password updated successfully.'}
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
                Go to Login
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
                {isInvite ? 'Set Up Your Password' : 'Reset Your Password'}
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: cv.textSecondary, mb: 3.5, fontSize: '0.9375rem' }}
              >
                {isInvite
                  ? 'Create a secure password to activate your new Noah Cloud account.'
                  : 'Create a new secure password for your Noah Cloud account.'}
              </Typography>

              <TextField
                fullWidth
                label="New Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="New Password (min 8 chars, 1 upper, 1 lower, 1 number)"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (submitError) setSubmitError('');
                }}
                autoComplete="new-password"
                disabled={submitting}
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
                label="Confirm Password"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm New Password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (submitError) setSubmitError('');
                }}
                autoComplete="new-password"
                disabled={submitting}
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

              {submitError ? (
                <Typography sx={{ mb: 2, fontSize: '0.8125rem', color: cv.destructive }}>
                  {submitError}
                </Typography>
              ) : null}

              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={submitting}
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
                {submitting
                  ? isInvite
                    ? 'Activating Account...'
                    : 'Updating Password...'
                  : isInvite
                  ? 'Set Password & Activate Account'
                  : 'Update Password'}
              </Button>
            </Box>
          )}
        </GlassCard>
      </Box>
    </Box>
  );
}

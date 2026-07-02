import { useState } from 'react';
import { cv } from '../theme/cssVars';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Checkbox,
  Divider,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Link,
  TextField,
  Typography,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import GoogleIcon from '@mui/icons-material/Google';
import GlassCard from '../components/GlassCard';
import LiquidBackground from '../components/LiquidBackground';
import WaveBackground from '../components/WaveBackground';
import NoahLogo from '../components/NoahLogo';
import LoginDemoAccountsBubble from '../components/demo/LoginDemoAccountsBubble';
import { useAuth } from '../auth/AuthContext';
import { loginUser, loginWithGoogle } from '../api/auth.service';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const redirectPath =
      typeof location.state === 'object' &&
      location.state !== null &&
      'from' in location.state &&
      typeof (location.state as { from?: unknown }).from === 'string'
        ? (location.state as { from: string }).from
        : '/home';

    try {
      // Use the custom loginUser function to hit the real API directly
      const response = await loginUser({ email, password });
      
      // Manually set the session in localStorage so the app recognizes the user
      const token = response.accessToken || response.token;
      if (token) {
        localStorage.setItem('noah_session_token', token);
        localStorage.setItem('noah_session_user', JSON.stringify(response.user));
      }
      
      // Force a full page reload to the redirect path so AuthContext picks up the new localStorage values
      window.location.href = redirectPath;
    } catch (submitError: any) {
      console.error(submitError);
      setError(submitError.response?.data?.message || submitError.message || 'Unable to sign in.');
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "967923512322-0oullb620hh9se1ff0prs8stvbspi829.apps.googleusercontent.com";

    const redirectPath =
      typeof location.state === 'object' &&
      location.state !== null &&
      'from' in location.state &&
      typeof (location.state as { from?: unknown }).from === 'string'
        ? (location.state as { from: string }).from
        : '/home';

    // Helper function to dynamically load Google Identity Services SDK
    const loadGoogleScript = (): Promise<any> => {
      return new Promise((resolve) => {
        if ((window as any).google?.accounts?.oauth2) {
          resolve((window as any).google);
          return;
        }
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = () => resolve((window as any).google);
        document.head.appendChild(script);
      });
    };

    try {
      const google = await loadGoogleScript();

      const client = google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
        callback: async (tokenResponse: any) => {
          if (!tokenResponse || !tokenResponse.access_token) {
            setError('Google login cancelled or failed.');
            return;
          }
          try {
            // Send token to backend /auth/loging-google
            const response = await loginWithGoogle(tokenResponse.access_token);
            const token = response.accessToken || response.token;
            if (token) {
              localStorage.setItem('noah_session_token', token);
              localStorage.setItem('noah_session_user', JSON.stringify(response.user));
            }
            window.location.href = redirectPath;
          } catch (submitError: any) {
            console.error(submitError);
            setError(submitError.response?.data?.message || submitError.message || 'Google Login Failed.');
          }
        },
      });

      // Open the Google login popup window
      client.requestAccessToken();
    } catch (err: any) {
      console.error('Failed to load Google SDK:', err);
      setError('Could not initialize Google Login service.');
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
              Welcome back
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: cv.textSecondary, mb: 4, fontSize: '0.9375rem' }}
            >
              Continue with one of the following options
            </Typography>

            <TextField
              fullWidth
              label="Email"
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
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
              autoComplete="current-password"
              sx={{ mb: 2 }}
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

            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 3,
              }}
            >
              <FormControlLabel
                control={
                  <Checkbox
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    size="small"
                  />
                }
                label={
                  <Typography variant="body2" sx={{ color: cv.textSecondary }}>
                    Remember me
                  </Typography>
                }
              />
              <Link
                href="#"
                underline="hover"
                sx={{
                  color: cv.textSecondary,
                  fontSize: '0.875rem',
                  '&:hover': { color: cv.brandBlue },
                }}
              >
                Forgot Password?
              </Link>
            </Box>

            {error ? (
              <Typography sx={{ mb: 2, fontSize: '0.8125rem', color: cv.destructive }}>
                {error}
              </Typography>
            ) : null}

            <Button
              type="submit"
              fullWidth
              variant="contained"
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
              Sign in
            </Button>

            <Divider
              sx={{
                my: 2,
                '&::before, &::after': { borderColor: cv.border },
                color: cv.textMuted,
                fontSize: '0.8125rem',
              }}
            >
              or
            </Divider>

            <Button
              fullWidth
              variant="outlined"
              onClick={handleGoogleLogin}
              startIcon={<GoogleIcon />}
              sx={{
                py: 1.5,
                borderColor: cv.border,
                color: cv.textPrimary,
                backgroundColor: 'var(--noah-footer-tint)',
                '&:hover': {
                  borderColor: cv.borderStrong,
                  backgroundColor: cv.surfaceHover,
                },
              }}
            >
              Continue with Google
            </Button>

            <Typography
              variant="body2"
              sx={{
                mt: 4,
                textAlign: 'center',
                color: cv.textSecondary,
              }}
            >
              Don&apos;t have an account?{' '}
              <Link
                component={RouterLink}
                to="/signup"
                state={location.state}
                underline="hover"
                sx={{
                  color: cv.textPrimary,
                  fontWeight: 500,
                  '&:hover': { color: cv.brandBlue },
                }}
              >
                Sign up
              </Link>
            </Typography>
          </Box>
        </GlassCard>
      </Box>

      {/* Demo-only accounts bubble — delete with LoginDemoAccountsBubble.tsx */}
      <LoginDemoAccountsBubble
        onFillCredentials={({ email: demoEmail, password: demoPassword }) => {
          setEmail(demoEmail);
          setPassword(demoPassword);
          setError('');
        }}
      />
    </Box>
  );
}

import { useState, useEffect } from 'react';
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
import { useMsal } from "@azure/msal-react";
import MicrosoftIcon from '@mui/icons-material/Window'; // Basic Windows/Microsoft Icon
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import GoogleIcon from '@mui/icons-material/Google';
import GlassCard from '../components/GlassCard';
import LiquidBackground from '../components/LiquidBackground';
import WaveBackground from '../components/WaveBackground';
import NoahMascot from '../components/NoahMascot';
import LoginDemoAccountsBubble from '../components/demo/LoginDemoAccountsBubble';
import { useAuth } from '../auth/AuthContext';
import { getPostAuthRedirect } from '../auth/paths';
import { fetchGlobalSecuritySettings } from '../platform/api/platformApi';

function redirectFromState(state: unknown): string {
  if (typeof state === 'object' && state !== null && 'from' in state) {
    return getPostAuthRedirect((state as { from?: unknown }).from);
  }
  return getPostAuthRedirect();
}

export default function LoginPage() {
  const { instance } = useMsal();
  const { login, loginGoogle, loginMicrosoft } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');

  const [ssoConfigured, setSsoConfigured] = useState<boolean>(true);
  const [ssoProvider, setSsoProvider] = useState<string>('google, microsoft');

  useEffect(() => {
    fetchGlobalSecuritySettings()
      .then((res) => {
        if (res?.settings) {
          setSsoConfigured(Boolean(res.settings.ssoConfigured));
          setSsoProvider(res.settings.ssoProvider || 'google, microsoft');
        }
      })
      .catch((err) => console.error('Failed to fetch security settings for login:', err));
  }, []);

  useEffect(() => {
    const state = location.state as { email?: string } | null;
    if (state?.email && typeof state.email === 'string') {
      setEmail(state.email);
    }
  }, [location.state]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const redirectPath = redirectFromState(location.state);

    try {
      await login({
        email,
        password,
        rememberMe,
      });

      navigate(redirectPath);
    } catch (submitError: any) {
      console.error(submitError);

      // If the backend says MFA is required, transition to the MFA step
      if (submitError.response?.data?.requiresMfa || submitError.details?.requiresMfa || submitError.requiresMfa) {
        navigate('/mfaAuth', { state: { email, password, requiresMfa: true, from: redirectPath } });
      } else {
        setError(submitError.response?.data?.message || submitError.message || 'Unable to sign in.');
      }
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "967923512322-0oullb620hh9se1ff0prs8stvbspi829.apps.googleusercontent.com";

    const redirectPath = redirectFromState(location.state);

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
            await loginGoogle(tokenResponse.access_token, false, { mode: 'login', isSignUp: false });
            navigate(redirectPath);
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

  // Add this inside the component to handle the redirect back from Microsoft
  useEffect(() => {
    // Only process the redirect promise if we explicitly initiated it
    if (sessionStorage.getItem('msal_redirecting') === 'true') {
      instance.handleRedirectPromise()
        .then((response) => {
          sessionStorage.removeItem('msal_redirecting');
          const authMode = sessionStorage.getItem('msal_auth_mode');
          sessionStorage.removeItem('msal_auth_mode');
          const isSignUp = authMode === 'signup';

          if (response && response.idToken) {
            const redirectPath = redirectFromState(location.state);

            return loginMicrosoft(response.idToken, false, {
              mode: isSignUp ? 'signup' : 'login',
              isSignUp,
            }).then(() => navigate(redirectPath));
          }
        })
        .catch((err: any) => {
          sessionStorage.removeItem('msal_redirecting');
          sessionStorage.removeItem('msal_auth_mode');
          console.error(err);
          setError(err.response?.data?.message || err.message || 'Microsoft Login Failed.');
        });
    }
  }, [instance, loginMicrosoft, navigate, location.state]);

  const handleMicrosoftLogin = async () => {
    setError('');
    try {
      sessionStorage.setItem('msal_redirecting', 'true');
      sessionStorage.setItem('msal_auth_mode', 'login');
      await instance.loginRedirect({
        scopes: ['User.Read', 'profile', 'email', 'openid'],
        redirectUri: window.location.origin,
        prompt: 'select_account',
      });
    } catch (err: any) {
      sessionStorage.removeItem('msal_redirecting');
      sessionStorage.removeItem('msal_auth_mode');
      console.error(err);
      setError(err.response?.data?.message || err.message || 'Microsoft Login Failed.');
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
        overflow: 'visible',
      }}
    >
      <LiquidBackground />
      <WaveBackground />

      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          maxWidth: { xs: 640, sm: 920 },
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          overflow: 'visible',
        }}
      >
        <Box
          component={RouterLink}
          to="/"
          aria-label="Back to NOAH Cloud home"
          className="login-auth-logo-wrapper"
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            maxWidth: { xs: 300, sm: 380 },
            height: { xs: 100, sm: 140 },
            mb: 3,
            textDecoration: 'none',
            cursor: 'pointer',
          }}
        >
          <Box
            component="img"
            src="/noah-logo.png"
            alt="NOAH CLOUD"
            className="login-auth-logo"
            sx={{
              width: '100%',
              maxWidth: '100%',
              height: '100%',
              maxHeight: 28,
              objectFit: 'contain',
              objectPosition: 'center',
              transform: 'scale(2.2)',
              transformOrigin: 'center center',
              mixBlendMode: 'lighten',
              filter: 'drop-shadow(0 4px 24px rgba(168, 85, 247, 0.7))',
            }}
          />
        </Box>

        <Box
          sx={{
            position: 'relative',
            width: '100%',
            maxWidth: 440,
            overflow: 'visible',
          }}
        >
          <NoahMascot pose="wave" preset="authCompanion" />
          <GlassCard
            glow
            sx={{
              position: 'relative',
              zIndex: 1,
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
                    onChange={(e) => {
                      setRememberMe(e.target.checked);
                      if (error) setError('');
                    }}
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
                component={RouterLink}
                to="/forgot-password"
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

            {ssoConfigured ? (
              <>
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

                <Box sx={{ display: 'flex', gap: 2, width: '100%' }}>
                  {ssoProvider.toLowerCase().includes('google') && (
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
                      Google
                    </Button>
                  )}

                  {ssoProvider.toLowerCase().includes('microsoft') && (
                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={handleMicrosoftLogin}
                      startIcon={<MicrosoftIcon />}
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
                      Microsoft
                    </Button>
                  )}
                </Box>
              </>
            ) : null}

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
              {' · '}
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
                Back to home
              </Link>
            </Typography>
          </Box>
        </GlassCard>
        </Box>
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

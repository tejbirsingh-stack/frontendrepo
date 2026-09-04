import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, TextField, Typography } from '@mui/material';
import GlassCard from '../../components/GlassCard';
import LiquidBackground from '../../components/LiquidBackground';
import WaveBackground from '../../components/WaveBackground';
import NoahMascot from '../../components/NoahMascot';
import NoahLogo, { AUTH_LOGO_PARENT_SX, AUTH_LOGO_SX } from '../../components/NoahLogo';
import { cv } from '../../theme/cssVars';
import { usePlatformAuth } from '../auth/PlatformAuthContext';

export default function PlatformLoginPage() {
  const { login } = usePlatformAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('platformadmin@noahcloud.ai');
  const [password, setPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [requiresMfa, setRequiresMfa] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await login(email.trim(), password, requiresMfa ? mfaCode.trim() : undefined);
      if (res?.requiresMfa) {
        setRequiresMfa(true);
        setError(res.message || 'An authentication code has been sent to your email');
      } else {
        navigate('/platform', { replace: true });
      }
    } catch (err: any) {
      if (err?.requiresMfa || err?.data?.requiresMfa || err?.response?.data?.requiresMfa) {
        setRequiresMfa(true);
        setError(err instanceof Error ? err.message : (err?.data?.message || err?.message || 'Invalid or expired code'));
      } else {
        setError(err instanceof Error ? err.message : (err?.data?.message || err?.response?.data?.message || 'Login failed'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setRequiresMfa(false);
    setMfaCode('');
    setError('');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
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
        <Box sx={AUTH_LOGO_PARENT_SX}>
          <NoahLogo sx={AUTH_LOGO_SX} showGlow={false} animated={false} disableCustomBranding />
        </Box>
        <Box sx={{ position: 'relative', width: '100%', maxWidth: 420, overflow: 'visible' }}>
          <NoahMascot pose="wave" preset="authCompanion" />
          <GlassCard glow sx={{ position: 'relative', zIndex: 1, width: '100%' }}>
            <Box component="form" onSubmit={(e) => void onSubmit(e)} sx={{ p: 4 }}>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                Platform Admin
              </Typography>
              <Typography sx={{ color: cv.textSecondary, mb: 3, fontSize: '0.9rem' }}>
                {requiresMfa
                  ? `Enter the 6-digit authentication code sent to ${email}`
                  : 'NOAH operator console — not for customer accounts'}
              </Typography>

              {!requiresMfa ? (
                <>
                  <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    sx={{ mb: 2 }}
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                  <TextField
                    fullWidth
                    label="Password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    sx={{ mb: 2 }}
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                </>
              ) : (
                <TextField
                  fullWidth
                  label="Authentication Code"
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value)}
                  sx={{ mb: 2 }}
                  slotProps={{ inputLabel: { shrink: true } }}
                  autoFocus
                />
              )}

              {error ? (
                <Typography
                  sx={{
                    color: requiresMfa && !error.toLowerCase().includes('invalid') && !error.toLowerCase().includes('expired') && !error.toLowerCase().includes('denied') ? cv.brandOrchid : cv.destructive,
                    fontSize: '0.8125rem',
                    mb: 2,
                    p: requiresMfa && !error.toLowerCase().includes('invalid') && !error.toLowerCase().includes('expired') ? 1.25 : 0,
                    borderRadius: '6px',
                    background: requiresMfa && !error.toLowerCase().includes('invalid') && !error.toLowerCase().includes('expired') ? cv.purpleSurface : 'transparent',
                    border: requiresMfa && !error.toLowerCase().includes('invalid') && !error.toLowerCase().includes('expired') ? `1px solid ${cv.purpleChipBorder}` : 'none',
                  }}
                >
                  {error}
                </Typography>
              ) : null}

              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading || (requiresMfa && !mfaCode)}
                sx={{
                  height: 40,
                  minHeight: 40,
                  py: 0,
                  background: cv.brandGradient,
                  boxShadow: cv.loginBrandShadow,
                }}
              >
                {loading
                  ? 'Verifying…'
                  : requiresMfa
                  ? 'Verify Code'
                  : 'Sign in'}
              </Button>

              {requiresMfa && (
                <Button
                  fullWidth
                  variant="text"
                  onClick={handleBackToLogin}
                  sx={{
                    mt: 1.5,
                    color: cv.textSecondary,
                    fontSize: '0.8125rem',
                    textTransform: 'none',
                    '&:hover': { color: cv.textPrimary },
                  }}
                >
                  Back to login
                </Button>
              )}
            </Box>
          </GlassCard>
        </Box>
      </Box>
    </Box>
  );
}

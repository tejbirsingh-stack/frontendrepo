import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, TextField, Typography } from '@mui/material';
import GlassCard from '../../components/GlassCard';
import LiquidBackground from '../../components/LiquidBackground';
import WaveBackground from '../../components/WaveBackground';
import NoahLogo, { AUTH_LOGO_PARENT_SX, AUTH_LOGO_SX } from '../../components/NoahLogo';
import { cv } from '../../theme/cssVars';
import { usePlatformAuth } from '../auth/PlatformAuthContext';

export default function PlatformLoginPage() {
  const { login } = usePlatformAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('platformadmin@noahcloud.ai');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email.trim(), password);
      navigate('/platform', { replace: true });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
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
      }}
    >
      <LiquidBackground />
      <WaveBackground />
      <Box sx={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 640, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Box sx={AUTH_LOGO_PARENT_SX}>
          <NoahLogo sx={AUTH_LOGO_SX} showGlow={false} animated={false} />
        </Box>
        <GlassCard glow sx={{ width: '100%', maxWidth: 420 }}>
          <Box component="form" onSubmit={(e) => void onSubmit(e)} sx={{ p: 4 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
              Platform Admin
            </Typography>
            <Typography sx={{ color: cv.textSecondary, mb: 3, fontSize: '0.9rem' }}>
              NOAH operator console — not for customer accounts
            </Typography>
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
            {error ? (
              <Typography sx={{ color: cv.destructive, fontSize: '0.8125rem', mb: 2 }}>
                {error}
              </Typography>
            ) : null}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{
                py: 1.4,
                background: cv.brandGradient,
                boxShadow: cv.loginBrandShadow,
              }}
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>
          </Box>
        </GlassCard>
      </Box>
    </Box>
  );
}

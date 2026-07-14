import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Box, Button, CircularProgress, Typography } from '@mui/material';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutlineOutlined';
import GlassCard from '../components/GlassCard';
import LiquidBackground from '../components/LiquidBackground';
import WaveBackground from '../components/WaveBackground';
import NoahLogo from '../components/NoahLogo';
import { cv } from '../theme/cssVars';
import { verifyEmailRequest } from '../api/auth.service';

export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function doVerify() {
      if (!token) {
        if (isMounted) {
          setLoading(false);
          setSuccess(false);
          setMessage('Missing verification token in URL. Please check the exact link from your verification email.');
        }
        return;
      }

      try {
        const res = await verifyEmailRequest(token);
        if (isMounted) {
          setLoading(false);
          setSuccess(true);
          setMessage(res?.message || 'Your email address has been verified successfully. You can now log in.');
        }
      } catch (err: any) {
        console.error('Email verification error:', err);
        if (isMounted) {
          setLoading(false);
          setSuccess(false);
          setMessage(
            err.response?.data?.message ||
              err.message ||
              'This verification link is invalid or has already been used.'
          );
        }
      }
    }

    doVerify();

    return () => {
      isMounted = false;
    };
  }, [token]);

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
          maxWidth: 460,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <NoahLogo />

        <GlassCard glow sx={{ width: '100%' }}>
          <Box
            sx={{
              p: { xs: 4, sm: 5 },
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
            }}
          >
            {loading ? (
              <>
                <CircularProgress size={54} sx={{ color: cv.brandBlue, mb: 3 }} />
                <Typography variant="h5" sx={{ fontWeight: 600, mb: 1.5, color: cv.textPrimary }}>
                  Verifying Your Email
                </Typography>
                <Typography variant="body2" sx={{ color: cv.textSecondary }}>
                  Please wait while we verify your email address...
                </Typography>
              </>
            ) : success ? (
              <>
                <CheckCircleOutlinedIcon sx={{ fontSize: 64, color: cv.success, mb: 2 }} />
                <Typography variant="h5" sx={{ fontWeight: 600, mb: 1.5, color: cv.textPrimary }}>
                  Email Verified!
                </Typography>
                <Typography variant="body2" sx={{ color: cv.textSecondary, mb: 3.5 }}>
                  {message}
                </Typography>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={() => navigate('/', { replace: true })}
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
                  Go to Sign In
                </Button>
              </>
            ) : (
              <>
                <ErrorOutlineIcon sx={{ fontSize: 64, color: cv.destructive, mb: 2 }} />
                <Typography variant="h5" sx={{ fontWeight: 600, mb: 1.5, color: cv.textPrimary }}>
                  Verification Failed
                </Typography>
                <Typography variant="body2" sx={{ color: cv.textSecondary, mb: 3.5 }}>
                  {message}
                </Typography>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={() => navigate('/', { replace: true })}
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
                  Return to Sign In
                </Button>
              </>
            )}
          </Box>
        </GlassCard>
      </Box>
    </Box>
  );
}

import { useState } from 'react';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
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
import MarkEmailReadOutlinedIcon from '@mui/icons-material/MarkEmailReadOutlined';
import GlassCard from '../components/GlassCard';
import LiquidBackground from '../components/LiquidBackground';
import WaveBackground from '../components/WaveBackground';
import NoahLogo from '../components/NoahLogo';
import { cv } from '../theme/cssVars';
import { validateBusinessEmail, validatePassword } from '../utils/authValidation';
import { registerUser } from "../api/auth.service";

export default function SignUpPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [error, setError] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError("");

  const trimmedName = name.trim();
  const trimmedCompanyName = companyName.trim();
  const trimmedPhone = phone.trim();

  if (trimmedName.length < 2) {
    setError("Please enter your full name.");
    return;
  }

  const emailError = validateBusinessEmail(email);
  if (emailError) {
    setError(emailError);
    return;
  }

  if (trimmedCompanyName.length < 2) {
    setError("Please enter your company name.");
    return;
  }

  if (trimmedPhone.length !== 10) {
    setError("Please enter a valid 10-digit phone number.");
    return;
  }

  const passwordError = validatePassword(password);
  if (passwordError) {
    setError(passwordError);
    return;
  }

  if (password !== confirmPassword) {
    setError("Passwords do not match.");
    return;
  }

  if (!agreeToTerms) {
    setError("Please accept the terms to continue.");
    return;
  }

  try {
    const response = await registerUser({
      name: trimmedName,
      email,
      password,
      orgName: trimmedCompanyName,
      phone: trimmedPhone,
      jobTitle: "",
      hubspotUtk: "",
    });

    if (response) {
      localStorage.setItem("response", JSON.stringify(response));
    }
    setRegisteredEmail(email);
    setIsRegistered(true);

  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      setError(
        err.response?.data?.message ||
        err.message ||
        "Unable to create account."
      );
    } else if (err instanceof Error) {
      setError(err.message);
    } else {
      setError("Unable to create account.");
    }
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
          {isRegistered ? (
            <Box
              sx={{
                p: { xs: 4, sm: 5 },
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
              }}
            >
              <MarkEmailReadOutlinedIcon sx={{ fontSize: 64, color: cv.brandBlue, mb: 2 }} />
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 1.5, color: cv.textPrimary }}>
                Verification Email Sent
              </Typography>
              <Typography variant="body2" sx={{ color: cv.textSecondary, mb: 3.5, lineHeight: 1.6 }}>
                Verification email sent to your email (<strong>{registeredEmail}</strong>). Please check your email and verify your account before logging in.
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
              Create your account
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: cv.textSecondary, mb: 4, fontSize: '0.9375rem' }}
            >
              Get started with Noah in a few steps
            </Typography>

            <TextField
              fullWidth
              label="Full name"
              type="text"
              placeholder="Full name"
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
              label="Company Name"
              type="text"
              placeholder="Company Name"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              sx={{ mb: 2.5 }}
              slotProps={{
                inputLabel: { shrink: true },
              }}
            />

            <TextField
              fullWidth
              label="Phone Number"
              type="tel"
              placeholder="Phone Number"
              value={phone}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '');
                if (val.length <= 10) {
                  setPhone(val);
                }
              }}
              autoComplete="tel"
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
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              sx={{ mb: 2 }}
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

            <FormControlLabel
              control={
                <Checkbox
                  checked={agreeToTerms}
                  onChange={(e) => setAgreeToTerms(e.target.checked)}
                  size="small"
                />
              }
              label={
                <Typography variant="body2" sx={{ color: cv.textSecondary }}>
                  I agree to the{' '}
                  <Link href="#" underline="hover" sx={{ color: cv.textPrimary, fontWeight: 500 }}>
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link href="#" underline="hover" sx={{ color: cv.textPrimary, fontWeight: 500 }}>
                    Privacy Policy
                  </Link>
                </Typography>
              }
              sx={{ mb: 3, alignItems: 'flex-start', ml: 0 }}
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
              Create account
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
              Already have an account?{' '}
              <Link
                component={RouterLink}
                to="/"
                state={location.state}
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

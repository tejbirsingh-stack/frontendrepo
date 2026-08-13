import { useEffect, useMemo, useRef, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Divider,
  IconButton,
  InputAdornment,
  Link,
  TextField,
  Typography,
  keyframes,
} from '@mui/material';
import { useMsal } from '@azure/msal-react';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import CloseIcon from '@mui/icons-material/Close';
import GoogleIcon from '@mui/icons-material/Google';
import MicrosoftIcon from '@mui/icons-material/Window';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import GlassCard from '../components/GlassCard';
import LiquidBackground from '../components/LiquidBackground';
import WaveBackground from '../components/WaveBackground';
import NoahLogo, { AUTH_LOGO_PARENT_SX, AUTH_LOGO_SX } from '../components/NoahLogo';
import ChoosePlanScreen from '../components/onboarding/ChoosePlanScreen';
import { useAuth } from '../auth/AuthContext';
import { persistSession } from '../auth/authStorage';
import { cv } from '../theme/cssVars';
import { validateBusinessEmail, validatePassword } from '../utils/authValidation';
import { mockAuthEmailExists } from '../constants/mockAuthCredentials';
import {
  checkEmailRequest,
  sendSignupOtpRequest,
  verifySignupOtpRequest,
  completeSignupRequest,
  fetchCurrentUserRequest,
  mapAuthUserDtoToSessionUser,
} from '../api/auth.service';
import { useUploadManager } from '../context/UploadManagerContext';

type SignupPhase = 'email' | 'verify' | 'workspace' | 'usage' | 'upload' | 'done' | 'plans';

const STATIC_VERIFICATION_CODE = '123456';
const WORKSPACE_URL_PREFIX = 'noahcloud.com/';
const TOTAL_WORKSPACE_STEPS = 3;
const ACCEPTED_UPLOAD_TYPES = 'video/*,audio/*,image/*';
const PREPARING_SCREEN_MS = 8000;
const PREPARING_STEP_MS = 2000;

const PREPARING_STATUS_LINES = [
  'Setting up your workspace...',
  'Preparing your media library...',
  'Warming up video & audio tools...',
  'Your workspace is ready!',
] as const;

const statusFadeIn = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
`;

const TEAM_SIZE_OPTIONS = ['Solo', '2-10', '11-50', '50-100', '101-500', '501+'] as const;

const FIRST_FOCUS_OPTIONS = [
  'Review & annotate videos',
  'Share media for client feedback',
  'Organize video & audio library',
  'Collaborate on audio edits',
  'Deliver final media assets',
  'Just exploring',
] as const;

type TeamSizeOption = (typeof TEAM_SIZE_OPTIONS)[number];
type FirstFocusOption = (typeof FIRST_FOCUS_OPTIONS)[number];

/** Static existing-account check until a backend email-lookup API exists. */
function emailAlreadyExists(email: string): boolean {
  return mockAuthEmailExists(email);
}

function slugifyWorkspaceName(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

function formatWorkspaceNameWithSuffix(value: string): string {
  if (!value || typeof value !== 'string') return 'Workspace-ARK';
  let trimmed = value.trim();
  if (trimmed.endsWith('-Workspace-ARK')) {
    return trimmed;
  }
  trimmed = trimmed.replace(/-Workspace$/i, '').replace(/-ARK$/i, '').replace(/-Workspace-ARK$/i, '').trim();
  return `${trimmed}-Workspace-ARK`;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const choicePillSx = (selected: boolean) => ({
  px: 1.5,
  py: 0.85,
  borderRadius: '999px',
  border: `1.5px solid ${selected ? cv.textPrimary : cv.border}`,
  backgroundColor: selected ? cv.surfaceHover : 'transparent',
  color: cv.textPrimary,
  fontSize: '0.8125rem',
  fontWeight: selected ? 600 : 500,
  textTransform: 'none' as const,
  lineHeight: 1.3,
  minHeight: 36,
  '&:hover': {
    borderColor: selected ? cv.textPrimary : cv.borderStrong,
    backgroundColor: cv.surfaceHover,
  },
});

function SignupStepFooter({
  activeStep,
  onBack,
  continueDisabled,
  showSkip,
  onSkip,
}: {
  activeStep: number;
  onBack: () => void;
  continueDisabled?: boolean;
  showSkip?: boolean;
  onSkip?: () => void;
}) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        mt: 2,
      }}
    >
      <IconButton
        type="button"
        aria-label="Go back"
        onClick={onBack}
        sx={{
          width: 44,
          height: 44,
          border: `1px solid ${cv.border}`,
          borderRadius: '50%',
          color: cv.textSecondary,
          '&:hover': {
            borderColor: cv.borderStrong,
            backgroundColor: cv.surfaceHover,
          },
        }}
      >
        <ArrowBackIcon sx={{ fontSize: 20 }} />
      </IconButton>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flex: 1 }}>
        {Array.from({ length: TOTAL_WORKSPACE_STEPS }, (_, index) => {
          const isActive = index === activeStep - 1;
          const isComplete = index < activeStep;
          return (
            <Box
              key={index}
              sx={{
                height: 4,
                width: isActive ? 40 : 28,
                borderRadius: 999,
                backgroundColor: isComplete ? cv.textPrimary : cv.border,
                transition: 'width 0.2s ease, background-color 0.2s ease',
              }}
            />
          );
        })}
      </Box>

      {showSkip && onSkip ? (
        <Button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onSkip();
          }}
          sx={{
            color: cv.textSecondary,
            textTransform: 'none',
            fontWeight: 500,
            minWidth: 0,
            px: 1.25,
            '&:hover': {
              backgroundColor: 'transparent',
              color: cv.textPrimary,
            },
          }}
        >
          Skip
        </Button>
      ) : null}

      <Button
        type="submit"
        variant="contained"
        disabled={continueDisabled}
        sx={{
          minWidth: 120,
          py: 1.25,
          px: 2.5,
          background: cv.brandGradient,
          boxShadow: cv.loginBrandShadow,
          '&:hover': {
            background: cv.brandGradientHover,
            boxShadow: cv.loginBrandShadowHover,
          },
        }}
      >
        Continue
      </Button>
    </Box>
  );
}

export default function SignUpPage() {
  const navigate = useNavigate();
  const { instance } = useMsal();
  const { loginGoogle, loginMicrosoft, setSession } = useAuth();
  const [phase, setPhase] = useState<SignupPhase>('email');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [workspaceName, setWorkspaceName] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [teamSize, setTeamSize] = useState<TeamSizeOption | ''>('');
  const [firstFocus, setFirstFocus] = useState<FirstFocusOption | ''>('');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [preparingStep, setPreparingStep] = useState(0);
  const [error, setError] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [isSsoLoading, setIsSsoLoading] = useState(false);
  const { enqueueFiles } = useUploadManager();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const workspaceSlug = useMemo(() => slugifyWorkspaceName(workspaceName), [workspaceName]);

  const addFiles = (fileList: FileList | File[] | null) => {
    if (!fileList) return;
    const next = Array.from(fileList).filter((file) =>
      /^(video|audio|image)\//.test(file.type),
    );
    if (next.length === 0) {
      setError('Please upload video, audio, or image files.');
      return;
    }
    setUploadedFiles((prev) => [...prev, ...next]);
    setError('');
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleEmailContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (email.length > 255) {
      setError('Email cannot exceed 255 characters.');
      return;
    }

    const emailError = validateBusinessEmail(email);
    if (emailError) {
      setError(emailError);
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!showPasswordFields) {
      setIsChecking(true);
      try {
        await checkEmailRequest(normalizedEmail);
        setEmail(normalizedEmail);
        setShowPasswordFields(true);
        setError('');
      } catch (err: any) {
        console.error('Email check error:', err);
        if (err.response?.status === 409 || err.response?.data?.exists) {
          setError('Email ID is already registered with this email');
          return;
        }
        setError(err.response?.data?.message || err.message || 'Failed to check email.');
      } finally {
        setIsChecking(false);
      }
    } else {
      if (!firstName.trim()) {
        setError('First name is required.');
        return;
      }
      if (firstName.trim().length > 50) {
        setError('First name cannot exceed 50 characters.');
        return;
      }

      if (!lastName.trim()) {
        setError('Last name is required.');
        return;
      }
      if (lastName.trim().length > 50) {
        setError('Last name cannot exceed 50 characters.');
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

      setIsChecking(true);
      try {
        await sendSignupOtpRequest(normalizedEmail);
        setVerificationCode('');
        setPhase('verify');
      } catch (err: any) {
        console.error('Email OTP Error:', err);
        if (err.response?.status === 409) {
          setError('Email ID is already registered with this email');
          return;
        }
        setError(err.response?.data?.message || err.message || 'Failed to send verification code.');
      } finally {
        setIsChecking(false);
      }
    }
  };

  const handleVerifyContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const code = verificationCode.trim();
    if (!/^\d{6}$/.test(code)) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    setIsChecking(true);
    try {
      await verifySignupOtpRequest(email, code);
      setError('');
      setPhase('workspace');
    } catch (err: any) {
      console.error('Verify OTP Error:', err);
      setError(err.response?.data?.message || err.message || 'Invalid verification code. Please try again.');
    } finally {
      setIsChecking(false);
    }
  };

  const handleFinalPlanSelect = async (planId: string, billingCycle: string) => {
    setIsChecking(true);
    setError('');

    try {
      const hubspotUtkCookie = document.cookie
        .split('; ')
        .find((row) => row.startsWith('hubspotutk='))
        ?.split('=')[1];

      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
      const formattedWorkspaceName = formatWorkspaceNameWithSuffix(workspaceName);
      const response = await completeSignupRequest({
        email,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        name: fullName,
        password,
        workspaceName: formattedWorkspaceName,
        companyWebsite,
        mobileNumber,
        teamSize,
        firstFocus,
        planId,
        billingCycle,
        hubspotUtk: hubspotUtkCookie,
      });

      const activeToken = response?.accessToken || response?.token;
      if (activeToken) {
        localStorage.setItem('accessToken', activeToken);
        localStorage.setItem('token', activeToken);

        const mappedUser = mapAuthUserDtoToSessionUser(response?.user || response);
        setSession(activeToken, mappedUser);
        persistSession(activeToken, mappedUser);

        try {
          const currentUserDto = await fetchCurrentUserRequest();
          if (currentUserDto) {
            const updatedUser = mapAuthUserDtoToSessionUser(currentUserDto);
            setSession(activeToken, updatedUser);
            persistSession(activeToken, updatedUser);
          }
        } catch (fetchUserErr) {
          console.warn('Failed to fetch full user profile after signup:', fetchUserErr);
        }
      }

      if (uploadedFiles && uploadedFiles.length > 0) {
        const targetWorkspaceId = response?.workspace?.id || response?.user?.workspace?.id || response?.user?.orgId;
        void enqueueFiles(uploadedFiles, {
          ownerType: 'WORKSPACE',
          ownerId: targetWorkspaceId,
        });
      }

      navigate('/home', { replace: true });
    } catch (err: any) {
      console.error('Failed to complete signup:', err);
      setError(err.response?.data?.message || err.message || 'Failed to complete signup. Please try again.');
    } finally {
      setIsChecking(false);
    }
  };

  const handleWorkspaceContinue = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedName = workspaceName.trim();
    if (trimmedName.length < 2) {
      setError('Workspace name must be at least 2 characters long.');
      return;
    }
    if (trimmedName.length > 100) {
      setError('Workspace name cannot exceed 100 characters.');
      return;
    }

    if (companyWebsite.trim().length > 255) {
      setError('Company website URL cannot exceed 255 characters.');
      return;
    }

    if (mobileNumber.trim().length > 50) {
      setError('Mobile number cannot exceed 50 characters.');
      return;
    }

    setPhase('usage');
  };

  const handleUsageContinue = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!teamSize) {
      setError('Please select a team size.');
      return;
    }

    if (!firstFocus) {
      setError('Please select how you are planning to use the platform.');
      return;
    }

    setPhase('upload');
  };

  const handleUploadContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (uploadedFiles.length === 0) {
      setError('Upload at least one file to continue, or skip for now.');
      return;
    }
    setError('');
    setPhase('done');
  };

  const goBackToEmail = () => {
    setPhase('email');
    setVerificationCode('');
    setError('');
  };

  const handleGoogleSignup = async () => {
    setError('');
    setIsSsoLoading(true);
    const clientId =
      import.meta.env.VITE_GOOGLE_CLIENT_ID ||
      '967923512322-0oullb620hh9se1ff0prs8stvbspi829.apps.googleusercontent.com';

    const loadGoogleScript = (): Promise<any> =>
      new Promise((resolve) => {
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

    try {
      const google = await loadGoogleScript();
      const client = google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope:
          'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
        callback: async (tokenResponse: any) => {
          if (!tokenResponse?.access_token) {
            setIsSsoLoading(false);
            setError('Google sign-up cancelled or failed.');
            return;
          }
          try {
            const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
            });
            if (userInfoRes.ok) {
              const googleUser = await userInfoRes.json();
              const googleEmail = (googleUser.email || '').toLowerCase().trim();
              if (googleEmail) {
                try {
                  await checkEmailRequest(googleEmail);
                } catch (checkErr: any) {
                  if (checkErr.response?.status === 409 || checkErr.response?.data?.exists) {
                    setError('Email ID is already registered with this email');
                    return;
                  }
                  setError(checkErr.response?.data?.message || checkErr.message || 'Failed to verify Google email.');
                  return;
                }
                setEmail(googleEmail);
              }
              if (googleUser.given_name) setFirstName(googleUser.given_name);
              if (googleUser.family_name) setLastName(googleUser.family_name);
            }
            setPhase('workspace');
          } catch (submitError: any) {
            console.error('Google sign-up error:', submitError);
            setError(
              submitError.response?.data?.message ||
                submitError.message ||
                'Google sign-up failed.',
            );
          } finally {
            setIsSsoLoading(false);
          }
        },
      });
      client.requestAccessToken();
    } catch (err: any) {
      console.error('Failed to load Google SDK:', err);
      setIsSsoLoading(false);
      setError('Could not initialize Google sign-up.');
    }
  };

  const handleMicrosoftSignup = async () => {
    setError('');
    setIsSsoLoading(true);
    try {
      let response: any = null;
      try {
        response = await instance.loginPopup({
          scopes: ['User.Read', 'profile', 'email', 'openid'],
        });
      } catch (popupErr: any) {
        console.warn('Popup login failed/blocked, falling back to redirect:', popupErr);
        sessionStorage.setItem('msal_redirecting', 'true');
        sessionStorage.setItem('msal_auth_mode', 'signup');
        await instance.loginRedirect({
          scopes: ['User.Read', 'profile', 'email', 'openid'],
        });
        return;
      }

      if (response && response.account) {
        const account = response.account;
        const msEmail = (account.username || (account.idTokenClaims as any)?.email || '').toLowerCase().trim();
        const msName = account.name || (account.idTokenClaims as any)?.name || '';

        if (msEmail) {
          try {
            await checkEmailRequest(msEmail);
          } catch (checkErr: any) {
            if (checkErr.response?.status === 409 || checkErr.response?.data?.exists) {
              setError('Email ID is already registered with this email');
              return;
            }
            setError(checkErr.response?.data?.message || checkErr.message || 'Failed to verify Microsoft email.');
            return;
          }
          setEmail(msEmail);
        }

        if (msName) {
          const nameParts = msName.trim().split(' ');
          setFirstName(nameParts[0] || '');
          setLastName(nameParts.slice(1).join(' ') || '');
        }

        setPhase('workspace');
      }
    } catch (err: any) {
      console.error('Microsoft sign-up error:', err);
      setError(err.response?.data?.message || err.message || 'Microsoft sign-up failed.');
    } finally {
      setIsSsoLoading(false);
    }
  };

  useEffect(() => {
    if (sessionStorage.getItem('msal_redirecting') === 'true') {
      instance
        .handleRedirectPromise()
        .then(async (response) => {
          sessionStorage.removeItem('msal_redirecting');
          sessionStorage.removeItem('msal_auth_mode');
          if (response && response.account) {
            const account = response.account;
            const msEmail = (account.username || (account.idTokenClaims as any)?.email || '').toLowerCase().trim();
            const msName = account.name || (account.idTokenClaims as any)?.name || '';

            if (msEmail) {
              try {
                await checkEmailRequest(msEmail);
              } catch (checkErr: any) {
                if (checkErr.response?.status === 409 || checkErr.response?.data?.exists) {
                  setError('Email ID is already registered with this email');
                  return;
                }
                setError(checkErr.response?.data?.message || checkErr.message || 'Failed to verify Microsoft email.');
                return;
              }
              setEmail(msEmail);
            }

            if (msName) {
              const nameParts = msName.trim().split(' ');
              setFirstName(nameParts[0] || '');
              setLastName(nameParts.slice(1).join(' ') || '');
            }

            setPhase('workspace');
          }
        })
        .catch((err) => {
          sessionStorage.removeItem('msal_redirecting');
          sessionStorage.removeItem('msal_auth_mode');
          console.error('MSAL Redirect Error:', err);
          setError(err.message || 'Microsoft sign-up failed.');
        });
    }
  }, [instance]);

  useEffect(() => {
    if (phase !== 'done') {
      setPreparingStep(0);
      return;
    }

    setPreparingStep(0);
    const stepTimers = PREPARING_STATUS_LINES.map((_, index) =>
      window.setTimeout(() => {
        setPreparingStep(index);
      }, index * PREPARING_STEP_MS),
    );

    // After the preparing animation, show the plans screen (no dashboard redirect yet)
    const plansTimer = window.setTimeout(() => {
      setPhase('plans');
    }, PREPARING_SCREEN_MS);

    return () => {
      stepTimers.forEach((timer) => window.clearTimeout(timer));
      window.clearTimeout(plansTimer);
    };
  }, [phase]);

  if (phase === 'plans') {
    return (
      <ChoosePlanScreen
        onSelectPlan={(planId, billingCycle) => void handleFinalPlanSelect(planId, billingCycle)}
      />
    );
  }

  if (phase === 'done') {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          width: '100%',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          px: { xs: 3, sm: 5, md: 8, lg: 12 },
          py: { xs: 6, md: 8 },
        }}
      >
        <LiquidBackground />
        <WaveBackground />

        <Box
          sx={{
            position: 'relative',
            zIndex: 1,
            width: '100%',
            maxWidth: 1200,
            mx: 'auto',
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1.1fr 0.9fr' },
            gap: { xs: 6, md: 8 },
            alignItems: 'center',
          }}
        >
          <Box>
            <Box sx={{ ...AUTH_LOGO_PARENT_SX, justifyContent: 'flex-start', mb: { xs: 3, md: 4 } }}>
              <NoahLogo
                align="left"
                animated={false}
                showGlow={false}
                sx={AUTH_LOGO_SX}
              />
            </Box>
            <Typography
              sx={{
                color: cv.textPrimary,
                fontWeight: 700,
                fontSize: { xs: '2rem', sm: '2.75rem', md: '3.25rem' },
                lineHeight: 1.15,
                letterSpacing: '-0.02em',
                maxWidth: 520,
              }}
            >
              A library worthy of
              <br />
              your beautiful work.
            </Typography>
          </Box>

          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: { xs: 2, md: 2.5 },
              pl: { md: 2 },
            }}
            aria-live="polite"
          >
            {PREPARING_STATUS_LINES.map((line, index) => {
              const isActive = index === preparingStep;
              const isPast = index < preparingStep;
              const isVisible = index <= preparingStep;

              return (
                <Typography
                  key={line}
                  sx={{
                    color: cv.textPrimary,
                    fontSize: { xs: '1rem', md: '1.125rem' },
                    fontWeight: isActive ? 600 : 400,
                    opacity: !isVisible ? 0 : isActive ? 1 : isPast ? 0.45 : 0.28,
                    transform: isVisible ? 'none' : 'translateY(8px)',
                    transition: 'opacity 0.45s ease, transform 0.45s ease, font-weight 0.2s ease',
                    animation: isActive ? `${statusFadeIn} 0.45s ease` : 'none',
                    minHeight: '1.5em',
                  }}
                >
                  {line}
                </Typography>
              );
            })}
          </Box>
        </Box>
      </Box>
    );
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
          maxWidth: 640,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Box sx={AUTH_LOGO_PARENT_SX}>
          <NoahLogo sx={AUTH_LOGO_SX} showGlow={false} animated={false} />
        </Box>

        <GlassCard glow sx={{ width: '100%', maxWidth: phase === 'usage' || phase === 'upload' ? 560 : 440 }}>
          {phase === 'email' ? (
            <Box
              component="form"
              onSubmit={(event) => void handleEmailContinue(event)}
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
                Enter your work email to get started
              </Typography>

              <TextField
                fullWidth
                label="Work email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (showPasswordFields) {
                    setShowPasswordFields(false);
                    setFirstName('');
                    setLastName('');
                    setPassword('');
                    setConfirmPassword('');
                  }
                  if (error) setError('');
                }}
                autoComplete="email"
                autoFocus
                disabled={isChecking}
                sx={{ mb: 2.5 }}
                slotProps={{
                  inputLabel: { shrink: true },
                  htmlInput: { maxLength: 255 },
                }}
              />

              {showPasswordFields ? (
                <>
                  <Box sx={{ display: 'flex', gap: 2, mb: 2.5 }}>
                    <TextField
                      fullWidth
                      label="First Name"
                      type="text"
                      placeholder="First name"
                      value={firstName}
                      onChange={(e) => {
                        setFirstName(e.target.value);
                        if (error) setError('');
                      }}
                      autoComplete="given-name"
                      disabled={isChecking}
                      slotProps={{
                        inputLabel: { shrink: true },
                        htmlInput: { maxLength: 50 },
                      }}
                    />

                    <TextField
                      fullWidth
                      label="Last Name"
                      type="text"
                      placeholder="Last name"
                      value={lastName}
                      onChange={(e) => {
                        setLastName(e.target.value);
                        if (error) setError('');
                      }}
                      autoComplete="family-name"
                      disabled={isChecking}
                      slotProps={{
                        inputLabel: { shrink: true },
                        htmlInput: { maxLength: 50 },
                      }}
                    />
                  </Box>

                  <TextField
                    fullWidth
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter password (min 8 chars)"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError('');
                    }}
                    autoComplete="new-password"
                    disabled={isChecking}
                    sx={{ mb: 2.5 }}
                    slotProps={{
                      inputLabel: { shrink: true },
                      htmlInput: { maxLength: 255 },
                      input: {
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              aria-label="toggle password visibility"
                              onClick={() => setShowPassword((prev) => !prev)}
                              edge="end"
                              size="small"
                              sx={{ color: cv.textSecondary }}
                            >
                              {showPassword ? (
                                <VisibilityOff sx={{ fontSize: 20 }} />
                              ) : (
                                <Visibility sx={{ fontSize: 20 }} />
                              )}
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
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (error) setError('');
                    }}
                    autoComplete="new-password"
                    disabled={isChecking}
                    sx={{ mb: 2.5 }}
                    slotProps={{
                      inputLabel: { shrink: true },
                      htmlInput: { maxLength: 255 },
                      input: {
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              aria-label="toggle confirm password visibility"
                              onClick={() => setShowConfirmPassword((prev) => !prev)}
                              edge="end"
                              size="small"
                              sx={{ color: cv.textSecondary }}
                            >
                              {showConfirmPassword ? (
                                <VisibilityOff sx={{ fontSize: 20 }} />
                              ) : (
                                <Visibility sx={{ fontSize: 20 }} />
                              )}
                            </IconButton>
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                </>
              ) : null}

              {error ? (
                <Typography sx={{ mb: 2, fontSize: '0.8125rem', color: cv.destructive }}>
                  {error}
                </Typography>
              ) : null}

              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={isChecking || isSsoLoading}
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
                {isChecking
                  ? 'Checking…'
                  : showPasswordFields
                    ? 'Continue to verification'
                    : 'Continue with email'}
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

              <Box sx={{ display: 'flex', gap: 2, width: '100%', mb: 2 }}>
                <Button
                  type="button"
                  fullWidth
                  variant="outlined"
                  disabled={isChecking || isSsoLoading}
                  onClick={() => void handleGoogleSignup()}
                  startIcon={<GoogleIcon />}
                  sx={{
                    py: 1.5,
                    borderColor: cv.border,
                    color: cv.textPrimary,
                    backgroundColor: cv.footerTint,
                    '&:hover': {
                      borderColor: cv.borderStrong,
                      backgroundColor: cv.surfaceHover,
                    },
                  }}
                >
                  Google
                </Button>

                <Button
                  type="button"
                  fullWidth
                  variant="outlined"
                  disabled={isChecking || isSsoLoading}
                  onClick={() => void handleMicrosoftSignup()}
                  startIcon={<MicrosoftIcon />}
                  sx={{
                    py: 1.5,
                    borderColor: cv.border,
                    color: cv.textPrimary,
                    backgroundColor: cv.footerTint,
                    '&:hover': {
                      borderColor: cv.borderStrong,
                      backgroundColor: cv.surfaceHover,
                    },
                  }}
                >
                  Microsoft
                </Button>
              </Box>

              <Typography
                variant="body2"
                sx={{
                  mt: 2,
                  textAlign: 'center',
                  color: cv.textSecondary,
                }}
              >
                Already have an account?{' '}
                <Link
                  component={RouterLink}
                  to="/"
                  underline="hover"
                  sx={{ color: cv.textPrimary, fontWeight: 500 }}
                >
                  Sign in
                </Link>
              </Typography>
            </Box>
          ) : phase === 'verify' ? (
            <Box
              component="form"
              onSubmit={handleVerifyContinue}
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
                An authentication code has been sent to <strong>{email}</strong>.
              </Typography>

              <TextField
                fullWidth
                label="Authentication Code"
                type="text"
                placeholder="Enter 6-digit code"
                value={verificationCode}
                onChange={(e) => {
                  const next = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setVerificationCode(next);
                  if (error) setError('');
                }}
                inputMode="numeric"
                autoComplete="one-time-code"
                autoFocus
                sx={{ mb: 3 }}
                slotProps={{
                  inputLabel: { shrink: true },
                  htmlInput: {
                    maxLength: 6,
                    inputMode: 'numeric',
                    pattern: '[0-9]*',
                    'aria-label': '6-digit authentication code',
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
                disabled={verificationCode.length !== 6}
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
                  component="button"
                  type="button"
                  underline="hover"
                  onClick={goBackToEmail}
                  sx={{
                    color: cv.textPrimary,
                    fontWeight: 500,
                    background: 'none',
                    border: 0,
                    p: 0,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    fontSize: 'inherit',
                    '&:hover': { color: cv.brandBlue },
                  }}
                >
                  Use a different email
                </Link>
              </Typography>
            </Box>
          ) : phase === 'workspace' ? (
            <Box
              component="form"
              onSubmit={handleWorkspaceContinue}
              sx={{
                p: { xs: 3, sm: 4 },
                display: 'flex',
                flexDirection: 'column',
                minHeight: 420,
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
                Let&apos;s set up your workspace
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: cv.textSecondary, mb: 4, fontSize: '0.9375rem' }}
              >
                You can always change this later
              </Typography>

              <TextField
                fullWidth
                label="Workspace name"
                type="text"
                placeholder="Enter company name or campaign..."
                value={workspaceName}
                onChange={(e) => {
                  setWorkspaceName(e.target.value);
                  if (error) setError('');
                }}
                autoFocus
                sx={{ mb: 0.75 }}
                slotProps={{
                  inputLabel: { shrink: true },
                  htmlInput: { maxLength: 100 },
                }}
              />
              <Typography
                sx={{
                  mb: 3,
                  fontSize: '0.8125rem',
                  color: cv.textMuted,
                }}
              >
                {WORKSPACE_URL_PREFIX}
                <Box
                  component="span"
                  sx={{
                    color: workspaceSlug ? cv.brandTeal : cv.textMuted,
                    fontWeight: workspaceSlug ? 500 : 400,
                  }}
                >
                  {workspaceSlug || 'your-workspace'}
                </Box>
              </Typography>

              <TextField
                fullWidth
                label="Company website (optional)"
                type="url"
                placeholder="www.noahcloud.com"
                value={companyWebsite}
                onChange={(e) => setCompanyWebsite(e.target.value)}
                sx={{ mb: 3 }}
                slotProps={{
                  inputLabel: { shrink: true },
                  htmlInput: { maxLength: 255 },
                }}
              />

              <TextField
                fullWidth
                label="Mobile number (optional)"
                type="tel"
                placeholder="+1 (555) 000-0000"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                autoComplete="tel"
                sx={{ mb: 3 }}
                slotProps={{
                  inputLabel: { shrink: true },
                  htmlInput: {
                    inputMode: 'tel',
                    maxLength: 50,
                    'aria-label': 'Mobile number (optional)',
                  },
                }}
              />

              {error ? (
                <Typography sx={{ mb: 2, fontSize: '0.8125rem', color: cv.destructive }}>
                  {error}
                </Typography>
              ) : null}

              <Box sx={{ flex: 1 }} />

              <SignupStepFooter
                activeStep={1}
                continueDisabled={workspaceName.trim().length < 2}
                onBack={() => {
                  setPhase('verify');
                  setError('');
                }}
              />
            </Box>
          ) : phase === 'usage' ? (
            <Box
              component="form"
              onSubmit={handleUsageContinue}
              sx={{
                p: { xs: 3, sm: 4 },
                display: 'flex',
                flexDirection: 'column',
                minHeight: 420,
              }}
            >
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 600,
                  mb: 1,
                  fontSize: { xs: '1.35rem', sm: '1.6rem' },
                }}
              >
                How will you use this workspace?
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: cv.textSecondary, mb: 4, fontSize: '0.9375rem' }}
              >
                We&apos;ll highlight features that matter most to your team
              </Typography>

              <Typography
                sx={{
                  mb: 1.25,
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  color: cv.textMuted,
                }}
              >
                Team size
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 1,
                  mb: teamSize ? 3.5 : 3,
                }}
              >
                {TEAM_SIZE_OPTIONS.map((option) => (
                  <Button
                    key={option}
                    type="button"
                    onClick={() => {
                      setTeamSize(option);
                      if (error) setError('');
                    }}
                    sx={choicePillSx(teamSize === option)}
                  >
                    {option}
                  </Button>
                ))}
              </Box>

              {teamSize ? (
                <>
                  <Typography
                    sx={{
                      mb: 1.25,
                      fontSize: '0.8125rem',
                      fontWeight: 500,
                      color: cv.textMuted,
                    }}
                  >
                    How are you planning to use the platform?
                  </Typography>
                  <Box
                    sx={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 1,
                      mb: 3,
                    }}
                  >
                    {FIRST_FOCUS_OPTIONS.map((option) => (
                      <Button
                        key={option}
                        type="button"
                        onClick={() => {
                          setFirstFocus(option);
                          if (error) setError('');
                        }}
                        sx={choicePillSx(firstFocus === option)}
                      >
                        {option}
                      </Button>
                    ))}
                  </Box>
                </>
              ) : null}

              {error ? (
                <Typography sx={{ mb: 2, fontSize: '0.8125rem', color: cv.destructive }}>
                  {error}
                </Typography>
              ) : null}

              <Box sx={{ flex: 1 }} />

              <SignupStepFooter
                activeStep={2}
                continueDisabled={!teamSize || !firstFocus}
                onBack={() => {
                  setPhase('workspace');
                  setError('');
                }}
              />
            </Box>
          ) : phase === 'upload' ? (
            <Box
              component="form"
              onSubmit={handleUploadContinue}
              sx={{
                p: { xs: 3, sm: 4 },
                display: 'flex',
                flexDirection: 'column',
                minHeight: 460,
              }}
            >
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 600,
                  mb: 1,
                  fontSize: { xs: '1.35rem', sm: '1.6rem' },
                }}
              >
                Upload your first files
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: cv.textSecondary, mb: 3.5, fontSize: '0.9375rem' }}
              >
                Upload video or audio from a recent project and see what Noah can do
              </Typography>

              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_UPLOAD_TYPES}
                multiple
                hidden
                onChange={(e) => {
                  addFiles(e.target.files);
                  e.target.value = '';
                }}
              />

              <Box
                onDragEnter={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDragOver(true);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDragOver(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDragOver(false);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDragOver(false);
                  addFiles(e.dataTransfer.files);
                }}
                sx={{
                  border: `1.5px dashed ${isDragOver ? cv.brandTeal : cv.border}`,
                  borderRadius: '16px',
                  backgroundColor: isDragOver ? cv.greenAccentSurface : cv.surfaceHover,
                  p: 1.25,
                  mb: 2,
                  transition: 'border-color 0.15s ease, background-color 0.15s ease',
                }}
              >
                <Box
                  sx={{
                    borderRadius: '12px',
                    backgroundColor: cv.surface,
                    minHeight: 168,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    px: 3,
                    py: 4,
                    textAlign: 'center',
                  }}
                >
                  <Typography sx={{ fontSize: '0.9375rem', color: cv.textSecondary }}>
                    Drag and drop files here or{' '}
                    <Box
                      component="button"
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      sx={{
                        display: 'inline',
                        p: 0,
                        m: 0,
                        border: 0,
                        background: 'none',
                        color: cv.textPrimary,
                        font: 'inherit',
                        fontWeight: 600,
                        textDecoration: 'underline',
                        cursor: 'pointer',
                        '&:hover': { color: cv.brandTeal },
                      }}
                    >
                      Upload from desktop
                    </Box>
                  </Typography>
                </Box>
              </Box>

              {uploadedFiles.length > 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
                  {uploadedFiles.map((file, index) => (
                    <Box
                      key={`${file.name}-${file.size}-${index}`}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.25,
                        px: 1.5,
                        py: 1,
                        borderRadius: '10px',
                        border: `1px solid ${cv.border}`,
                        backgroundColor: cv.surface,
                      }}
                    >
                      <InsertDriveFileOutlinedIcon sx={{ fontSize: 20, color: cv.textMuted }} />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                          sx={{
                            fontSize: '0.8125rem',
                            color: cv.textPrimary,
                            fontWeight: 500,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {file.name}
                        </Typography>
                        <Typography sx={{ fontSize: '0.75rem', color: cv.textMuted }}>
                          {formatFileSize(file.size)}
                        </Typography>
                      </Box>
                      <IconButton
                        type="button"
                        aria-label={`Remove ${file.name}`}
                        size="small"
                        onClick={() => removeFile(index)}
                        sx={{ color: cv.textMuted }}
                      >
                        <CloseIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Box>
                  ))}
                </Box>
              ) : null}

              {error ? (
                <Typography sx={{ mb: 2, fontSize: '0.8125rem', color: cv.destructive }}>
                  {error}
                </Typography>
              ) : null}

              <Box sx={{ flex: 1 }} />

              <SignupStepFooter
                activeStep={3}
                continueDisabled={uploadedFiles.length === 0}
                showSkip
                onSkip={() => {
                  setError('');
                  setPhase('done');
                }}
                onBack={() => {
                  setPhase('usage');
                  setError('');
                }}
              />
            </Box>
          ) : null}
        </GlassCard>
      </Box>
    </Box>
  );
}

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CircularProgress,
  Container,
  Divider,
  IconButton,
  InputAdornment,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import ChatBubbleOutlineOutlinedIcon from '@mui/icons-material/ChatBubbleOutlineOutlined';
import SendIcon from '@mui/icons-material/Send';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import ErrorOutlineOutlinedIcon from '@mui/icons-material/ErrorOutlineOutlined';
import { cv } from '../theme/cssVars';
import {
  validateShareTokenApi,
  unlockShareTokenApi,
  getShareAnnotationsApi,
  createShareAnnotationApi,
} from '../api/share.service';
import { env } from '../config/env';
import VideoPlayerPage from './VideoPlayerPage';

export default function ShareGuestPage() {
  const { token } = useParams<{ token: string }>();
  const streamUrl = `${env.apiBaseUrl?.replace(/\/$/, '') || 'http://localhost:3002'}/api/share/${token}/stream`;

  const [status, setStatus] = useState<'loading' | 'password' | 'unlocked' | 'expired' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [assetMeta, setAssetMeta] = useState<any>(null);
  const [permissions, setPermissions] = useState({ view: true, comment: false, download: false, downloadProxy: false });
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [visibility, setVisibility] = useState<string>('public');
  const [mode, setMode] = useState<string>('link');

  // Password unlock state
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [isUnlocking, setIsUnlocking] = useState(false);

  // Commenting state
  const [guestName, setGuestName] = useState('');
  const [guestNameSet, setGuestNameSet] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [annotations, setAnnotations] = useState<any[]>([]);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMessage('Invalid share token');
      return;
    }

    validateShareTokenApi(token)
      .then((res) => {
        if (!res.valid) {
          setStatus('expired');
          return;
        }
        setAssetMeta(res.assetMeta);
        setPermissions(res.permissions || { view: true, comment: false, download: false, downloadProxy: false });
        setExpiresAt(res.expiresAt);
        if (res.visibility) setVisibility(res.visibility);
        if (res.mode) setMode(res.mode);

        if (res.requiresPassword) {
          setStatus('password');
        } else {
          setStatus('unlocked');
          if (res.permissions?.comment) {
            void loadAnnotations(token);
          }
        }
      })
      .catch((err: any) => {
        if (err?.status === 404 || err?.data?.expired) {
          setStatus('expired');
        } else {
          setStatus('error');
          setErrorMessage(err?.message || 'Failed to load shared link');
        }
      });
  }, [token]);

  const loadAnnotations = async (shareToken: string) => {
    try {
      const res = await getShareAnnotationsApi(shareToken);
      if (res && res.data) {
        setAnnotations(res.data);
      }
    } catch {
      // ignore
    }
  };

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !password) return;
    setIsUnlocking(true);
    setPasswordError('');

    try {
      const res = await unlockShareTokenApi(token, password);
      if (res.unlocked) {
        setStatus('unlocked');
        if (permissions.comment) {
          void loadAnnotations(token);
        }
      } else {
        setPasswordError('Incorrect password');
      }
    } catch (err: any) {
      setPasswordError(err?.message || 'Incorrect password');
    } finally {
      setIsUnlocking(false);
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !commentText.trim()) return;
    if (!guestNameSet || !guestName.trim()) {
      setGuestNameSet(false);
      return;
    }

    setIsSubmittingComment(true);
    try {
      await createShareAnnotationApi(token, {
        guestName: guestName.trim(),
        text: commentText.trim(),
      });
      setCommentText('');
      void loadAnnotations(token);
    } catch (err: any) {
      console.error('Failed to post comment', err);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const isPrivateShare = visibility === 'private' || mode === 'email';

  if (status === 'unlocked' && token && isPrivateShare) {
    return (
      <VideoPlayerPage
        isGuestMode={true}
        shareToken={token}
        guestPermissions={permissions}
        guestAssetMeta={assetMeta}
        guestExpiresAt={expiresAt}
      />
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: '#090a0f',
        color: '#f1f5f9',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: 3,
          py: 2,
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          backgroundColor: 'rgba(15, 17, 26, 0.8)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              fontWeight: 800,
              fontSize: '1.25rem',
              letterSpacing: '-0.02em',
              background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            NOAH
          </Box>
          <Typography sx={{ fontSize: '0.8125rem', color: cv.textMuted }}>
            Secure Share Review
          </Typography>
        </Box>

        {expiresAt ? (
          <Typography sx={{ fontSize: '0.75rem', color: cv.textMuted }}>
            Expires: {new Date(expiresAt).toLocaleDateString()}
          </Typography>
        ) : null}
      </Box>

      {/* Content Body */}
      <Container maxWidth="lg" sx={{ flex: 1, py: 4, display: 'flex', flexDirection: 'column' }}>
        {status === 'loading' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', my: 'auto', gap: 2 }}>
            <CircularProgress size={40} sx={{ color: cv.brandPurple }} />
            <Typography sx={{ color: cv.textSecondary }}>Validating secure share token...</Typography>
          </Box>
        )}

        {status === 'expired' && (
          <Card
            sx={{
              maxWidth: 460,
              mx: 'auto',
              my: 'auto',
              p: 4,
              borderRadius: '20px',
              backgroundColor: 'rgba(15, 17, 26, 0.95)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              textAlign: 'center',
            }}
          >
            <ErrorOutlineOutlinedIcon sx={{ fontSize: 48, color: '#ef4444', mb: 1.5 }} />
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#f8fafc', mb: 1 }}>
              Share Link Expired or Revoked
            </Typography>
            <Typography sx={{ fontSize: '0.875rem', color: cv.textSecondary, lineHeight: 1.5 }}>
              This link is no longer active. Please request a new share link from the asset owner.
            </Typography>
          </Card>
        )}

        {status === 'error' && (
          <Card
            sx={{
              maxWidth: 460,
              mx: 'auto',
              my: 'auto',
              p: 4,
              borderRadius: '20px',
              backgroundColor: 'rgba(15, 17, 26, 0.95)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              textAlign: 'center',
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#f8fafc', mb: 1 }}>
              Unable to Access Share Link
            </Typography>
            <Typography sx={{ fontSize: '0.875rem', color: cv.textSecondary }}>
              {errorMessage || 'The share link is invalid or has been removed.'}
            </Typography>
          </Card>
        )}

        {status === 'password' && (
          <Card
            component="form"
            onSubmit={handleUnlock}
            sx={{
              maxWidth: 420,
              mx: 'auto',
              my: 'auto',
              p: 4,
              borderRadius: '20px',
              backgroundColor: 'rgba(15, 17, 26, 0.95)',
              border: '1px solid rgba(168, 85, 247, 0.3)',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)',
              display: 'flex',
              flexDirection: 'column',
              gap: 2.5,
            }}
          >
            <Box sx={{ textAlign: 'center' }}>
              <Box
                sx={{
                  width: 52,
                  height: 52,
                  borderRadius: '16px',
                  bgcolor: 'rgba(168, 85, 247, 0.15)',
                  color: cv.purpleLight,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 1.5,
                }}
              >
                <LockOutlinedIcon sx={{ fontSize: 26 }} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#f8fafc' }}>
                Protected Share
              </Typography>
              <Typography sx={{ fontSize: '0.8125rem', color: cv.textSecondary, mt: 0.5 }}>
                Enter the password provided by the owner to preview this media.
              </Typography>
            </Box>

            <TextField
              fullWidth
              size="medium"
              type={showPassword ? 'text' : 'password'}
              label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={Boolean(passwordError)}
              helperText={passwordError}
              autoFocus
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword((v) => !v)} edge="end">
                        {showPassword ? <VisibilityOffOutlinedIcon /> : <VisibilityOutlinedIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />

            <Button
              type="submit"
              variant="contained"
              disabled={isUnlocking || !password}
              sx={{
                py: 1.25,
                borderRadius: '12px',
                fontWeight: 600,
                textTransform: 'none',
                background: cv.brandGradient,
                boxShadow: cv.brandShadow,
              }}
            >
              {isUnlocking ? 'Unlocking...' : 'Unlock Preview'}
            </Button>
          </Card>
        )}

        {status === 'unlocked' && (
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 3, flex: 1 }}>
            {/* Player Container */}
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box
                sx={{
                  position: 'relative',
                  width: '100%',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  backgroundColor: '#000',
                  boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <Box sx={{
                  width: '100%',
                  maxHeight: '65vh',
                  '& video::-webkit-media-controls-enclosure': {
                    overflow: 'hidden',
                  },
                  '& video::-webkit-media-controls-panel': {
                    width: 'calc(100% + 30px)', // Push the overflow menu button off-screen
                  },
                }}>
                  <video
                    src={streamUrl}
                    controls
                    controlsList="nodownload"
                    onContextMenu={(e) => e.preventDefault()}
                    autoPlay
                    style={{ width: '100%', maxHeight: '65vh', display: 'block' }}
                  />
                </Box>
                {assetMeta?.logoUrl ? (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 16,
                      left: 16,
                      zIndex: 10,
                      opacity: 0.7,
                      pointerEvents: 'none',
                      userSelect: 'none',
                    }}
                  >
                    <img 
                      src={assetMeta.logoUrl} 
                      alt={assetMeta.organizationName || 'Company Watermark'} 
                      style={{ maxHeight: '48px', maxWidth: '120px', objectFit: 'contain' }}
                    />
                  </Box>
                ) : null}
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#f8fafc' }}>
                  {assetMeta?.title || 'Shared Media Asset'}
                </Typography>

                {/* Download button removed to prevent downloading of watermarked videos */}
              </Box>
            </Box>

            {/* Comment Section (If Allowed) */}
            {permissions.comment ? (
              <Card
                sx={{
                  width: { xs: '100%', lg: 360 },
                  borderRadius: '16px',
                  backgroundColor: 'rgba(15, 17, 26, 0.95)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  display: 'flex',
                  flexDirection: 'column',
                  maxHeight: { lg: '75vh' },
                }}
              >
                <Box sx={{ p: 2, borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ChatBubbleOutlineOutlinedIcon sx={{ color: cv.brandPurple, fontSize: 20 }} />
                  <Typography sx={{ fontWeight: 600, fontSize: '0.9375rem', color: '#f8fafc' }}>
                    Feedback & Comments ({annotations.length})
                  </Typography>
                </Box>

                {/* Comments List */}
                <Box sx={{ flex: 1, overflowY: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {annotations.length === 0 ? (
                    <Typography sx={{ fontSize: '0.8125rem', color: cv.textMuted, textAlign: 'center', my: 4 }}>
                      No comments yet. Leave the first comment below!
                    </Typography>
                  ) : (
                    annotations.map((ann) => (
                      <Box
                        key={ann.id}
                        sx={{
                          p: 1.5,
                          borderRadius: '10px',
                          backgroundColor: 'rgba(255,255,255,0.04)',
                          border: '1px solid rgba(255,255,255,0.06)',
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600, color: cv.indigoLight }}>
                            {ann.guestName || ann.data?.guestName || 'Guest Reviewer'}
                          </Typography>
                          <Typography sx={{ fontSize: '0.6875rem', color: cv.textMuted }}>
                            {new Date(ann.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </Typography>
                        </Box>
                        <Typography sx={{ fontSize: '0.875rem', color: '#e2e8f0', lineHeight: 1.4 }}>
                          {ann.data?.text || ann.text || ''}
                        </Typography>
                      </Box>
                    ))
                  )}
                </Box>

                <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />

                {/* Comment Input */}
                <Box component="form" onSubmit={handlePostComment} sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {!guestNameSet ? (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <TextField
                        fullWidth
                        size="small"
                        placeholder="Your name to comment..."
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                      />
                      <Button
                        size="small"
                        variant="contained"
                        disabled={!guestName.trim()}
                        onClick={() => setGuestNameSet(true)}
                        sx={{ textTransform: 'none', borderRadius: '8px' }}
                      >
                        Set
                      </Button>
                    </Box>
                  ) : (
                    <>
                      <Typography sx={{ fontSize: '0.75rem', color: cv.indigoLight }}>
                        Commenting as: <strong>{guestName}</strong>
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <TextField
                          fullWidth
                          size="small"
                          placeholder="Type your feedback..."
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                        />
                        <IconButton
                          type="submit"
                          disabled={isSubmittingComment || !commentText.trim()}
                          sx={{ color: cv.brandPurple }}
                        >
                          <SendIcon />
                        </IconButton>
                      </Box>
                    </>
                  )}
                </Box>
              </Card>
            ) : null}
          </Box>
        )}
      </Container>
    </Box>
  );
}

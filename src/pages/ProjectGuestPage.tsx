import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CircularProgress,
  Container,
  Typography,
  Grid,
} from '@mui/material';
import ErrorOutlineOutlinedIcon from '@mui/icons-material/ErrorOutlineOutlined';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutlined';
import FolderIcon from '@mui/icons-material/FolderOutlined';
import NoahLogo from '../components/NoahLogo';
import { DASHBOARD_TOP_BAR_HEIGHT, DASHBOARD_TOP_BAR_BORDER } from '../constants/layout';
import { cv } from '../theme/cssVars';
import { env } from '../config/env';

// Type representing a guest project response
interface ProjectGuestData {
  id: string;
  name: string;
  visibility: string;
  guestAccessLevel: string;
  assets: {
    id: string;
    title: string;
    type: string;
    status: string;
    createdAt: string;
    cdnUrl: string | null;
  }[];
}

export default function ProjectGuestPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [status, setStatus] = useState<'loading' | 'unlocked' | 'expired' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [projectData, setProjectData] = useState<ProjectGuestData | null>(null);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMessage('Invalid project share token');
      return;
    }

    const fetchProjectGuestView = async () => {
      try {
        const baseUrl = env.apiBaseUrl?.replace(/\/$/, '') || 'http://localhost:3002';
        const response = await fetch(`${baseUrl}/workspaces/project/guest/${token}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const res = await response.json();
        
        if (!response.ok || !res.valid) {
          if (res.expired) {
            setStatus('expired');
          } else {
            setStatus('error');
            setErrorMessage(res.message || 'Failed to load project link');
          }
          return;
        }

        setProjectData(res.data);
        setStatus('unlocked');
      } catch (err: any) {
        setStatus('error');
        setErrorMessage(err?.message || 'Network error occurred');
      }
    };

    void fetchProjectGuestView();
  }, [token]);

  const handleAssetClick = (assetId: string) => {
    // Navigate to the video player page or an asset share link if we implemented one.
    // However, we don't have a specific project-scoped media viewer right now,
    // so we can redirect to a route that might open a guest viewer, or a preview modal.
    // For now, if we have a ShareLink for this asset, we should use it. Since we don't know it,
    // we could open a modal here, or just show a message.
    alert('Guest media preview from project view is coming soon!');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: cv.bg,
        color: cv.textPrimary,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <Box
        component="header"
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 1100,
          display: 'flex',
          alignItems: 'center',
          gap: { xs: 1, sm: 2 },
          px: { xs: 2, sm: 3 },
          height: DASHBOARD_TOP_BAR_HEIGHT,
          minHeight: DASHBOARD_TOP_BAR_HEIGHT,
          maxHeight: DASHBOARD_TOP_BAR_HEIGHT,
          boxSizing: 'border-box',
          borderBottom: DASHBOARD_TOP_BAR_BORDER,
          background: 'var(--noah-header-background)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        }}
      >
        <NoahLogo 
          width={{ xs: 120, sm: 140 }} 
          align="left" 
          animated={false} 
          showGlow={false} 
          sx={{ mb: 0, px: 0, flexShrink: 0 }} 
        />
        <Box sx={{ flex: 1 }} />
        <Box>
          <Typography sx={{ fontSize: '0.8125rem', color: cv.textSecondary, fontWeight: 500 }}>
            {status === 'unlocked' && projectData ? `Project: ${projectData.name}` : 'Secure Project Review'}
          </Typography>
        </Box>
      </Box>

      {/* Content Body */}
      <Box sx={{ flex: 1, p: { xs: 2, md: 3 }, display: 'flex', flexDirection: 'column' }}>
        {status === 'loading' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', my: 'auto', gap: 2 }}>
            <CircularProgress size={40} sx={{ color: cv.brandPurple }} />
            <Typography sx={{ color: cv.textSecondary }}>Validating secure project link...</Typography>
          </Box>
        )}

        {status === 'expired' && (
          <Card
            sx={{
              maxWidth: 460,
              mx: 'auto',
              my: 'auto',
              p: 5,
              borderRadius: '24px',
              backgroundColor: cv.surface,
              border: `1px solid ${cv.destructiveBorderSoft}`,
              boxShadow: cv.cardShadow,
              textAlign: 'center',
            }}
          >
            <ErrorOutlineOutlinedIcon sx={{ fontSize: 56, color: cv.destructive, mb: 2 }} />
            <Typography variant="h5" sx={{ fontWeight: 700, color: cv.textPrimary, mb: 1.5, letterSpacing: '-0.01em' }}>
              Project Link Expired
            </Typography>
            <Typography sx={{ fontSize: '0.95rem', color: cv.textSecondary, lineHeight: 1.6 }}>
              This link is no longer active. Please request a new project link from the owner.
            </Typography>
          </Card>
        )}

        {status === 'error' && (
          <Card
            sx={{
              maxWidth: 460,
              mx: 'auto',
              my: 'auto',
              p: 5,
              borderRadius: '24px',
              backgroundColor: cv.surface,
              border: `1px solid ${cv.borderStrong}`,
              boxShadow: cv.cardShadow,
              textAlign: 'center',
            }}
          >
            <Typography variant="h5" sx={{ fontWeight: 700, color: cv.textPrimary, mb: 1.5, letterSpacing: '-0.01em' }}>
              Unable to Access Project Link
            </Typography>
            <Typography sx={{ fontSize: '0.95rem', color: cv.textSecondary, lineHeight: 1.6 }}>
              {errorMessage || 'The project link is invalid or has been removed.'}
            </Typography>
          </Card>
        )}

        {status === 'unlocked' && projectData && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1 }}>
            
            <Box sx={{ mb: 4, pb: 3, borderBottom: `1px solid ${cv.border}` }}>
                <Typography variant="h3" sx={{ fontWeight: 800, color: cv.textPrimary, mb: 1, letterSpacing: '-0.02em' }}>
                  {projectData.name}
                </Typography>
                <Typography sx={{ color: cv.textSecondary, fontSize: '1rem' }}>
                  {projectData.assets.length} item{projectData.assets.length !== 1 ? 's' : ''} • Secure Shared Access
                </Typography>
            </Box>

            <Grid container spacing={3}>
              {projectData.assets.length === 0 ? (
                <Grid item xs={12}>
                  <Box sx={{ py: 12, textAlign: 'center' }}>
                     <Typography sx={{ color: cv.textSecondary }}>No more items to show.</Typography>
                  </Box>
                </Grid>
              ) : (
                projectData.assets.map((asset) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={asset.id}>
                    <Card
                      onClick={() => handleAssetClick(asset.id)}
                      sx={{
                        backgroundColor: cv.surface,
                        border: `1px solid ${cv.border}`,
                        borderRadius: '16px',
                        cursor: 'pointer',
                        overflow: 'hidden',
                        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                        boxShadow: cv.cardShadow,
                        '&:hover': {
                          backgroundColor: cv.surfaceHover,
                          borderColor: cv.borderStrong,
                          transform: 'translateY(-4px)',
                          boxShadow: cv.cardHoverShadow
                        }
                      }}
                    >
                      <Box sx={{ position: 'relative', width: '100%', paddingTop: '56.25%', backgroundColor: cv.skeletonBase }}>
                        {asset.cdnUrl ? (
                          <img 
                            src={asset.cdnUrl} 
                            alt={asset.title}
                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <PlayCircleOutlineIcon sx={{ fontSize: 48, color: cv.textMuted }} />
                          </Box>
                        )}
                        
                        {/* Overlay on hover */}
                        <Box className="asset-hover-overlay" sx={{
                          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                          background: cv.videoScrimGradient,
                          opacity: 0, transition: 'opacity 0.2s',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          '.MuiCard-root:hover &': { opacity: 1 }
                        }}>
                            <PlayCircleOutlineIcon sx={{ fontSize: 56, color: cv.white, filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.5))' }} />
                        </Box>
                      </Box>
                      <Box sx={{ p: 2.5 }}>
                        <Typography sx={{ fontWeight: 600, color: cv.textPrimary, mb: 0.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.95rem' }}>
                          {asset.title}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
                          <Typography sx={{ fontSize: '0.75rem', color: cv.textMuted, fontWeight: 600, letterSpacing: '0.02em', textTransform: 'uppercase' }}>
                            {asset.type || 'Video'}
                          </Typography>
                          <Typography sx={{ fontSize: '0.75rem', color: cv.textMuted }}>
                            {new Date(asset.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </Typography>
                        </Box>
                      </Box>
                    </Card>
                  </Grid>
                ))
              )}
            </Grid>
          </Box>
        )}
      </Box>
    </Box>
  );
}

import { useEffect, useRef, useState } from 'react';
import { Box, Button, IconButton, Skeleton, Typography } from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import {
  fetchPublicDashboardNotification,
  type DashboardNotificationSettings,
  type DashboardNotificationImage,
} from '../../platform/api/platformApi';
import { cv } from '../../theme/cssVars';

export default function DashboardNotificationPopup() {
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const [notification, setNotification] = useState<DashboardNotificationSettings | null>(null);
  const [slideIndex, setSlideIndex] = useState(0);
  const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({});
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    let mounted = true;
    const checkNotification = async () => {
      try {
        const res = await fetchPublicDashboardNotification();
        if (mounted && res.success && res.notification && res.notification.isEnabled) {
          const { updatedAt } = res.notification;
          const dismissalKey = `dashboard_notification_dismissed_${updatedAt}`;
          
          setNotification(res.notification);
          setSlideIndex(0);
          setLoadedImages({});
          
          if (!localStorage.getItem(dismissalKey)) {
            setOpen(true);
            setTimeout(() => setVisible(true), 50);
          }
        }
      } catch (err) {
        console.warn('Failed to load dashboard notification', err);
      }
    };
    checkNotification();

    const handleOpenEvent = () => {
      setOpen(true);
      setTimeout(() => setVisible(true), 50);
    };
    window.addEventListener('open-dashboard-notification', handleOpenEvent);

    return () => { 
      mounted = false; 
      window.removeEventListener('open-dashboard-notification', handleOpenEvent);
    };
  }, []);

  const handleDismiss = () => {
    setVisible(false);
    setTimeout(() => setOpen(false), 300);
    if (notification?.updatedAt) {
      localStorage.setItem(`dashboard_notification_dismissed_${notification.updatedAt}`, 'true');
    }
  };

  const handleCtaClick = () => {
    if (notification?.ctaUrl) {
      window.open(notification.ctaUrl, '_blank', 'noopener,noreferrer');
    }
    handleDismiss();
  };

  const images: DashboardNotificationImage[] = notification?.images || [];
  const hasImages = images.length > 0;
  const hasSlider = images.length > 1;

  const prevSlide = () => setSlideIndex((i) => (i === 0 ? images.length - 1 : i - 1));
  const nextSlide = () => setSlideIndex((i) => (i === images.length - 1 ? 0 : i + 1));

  const markLoaded = (id: string) => setLoadedImages((prev) => ({ ...prev, [id]: true }));
  const isCurrentLoaded = images[slideIndex] ? !!loadedImages[images[slideIndex].id] : true;

  if (!notification || !open) return null;

  return (
    <>
      {/* Backdrop — lighter */}
      <Box
        onClick={handleDismiss}
        sx={{
          position: 'fixed',
          inset: 0,
          zIndex: 1300,
          backgroundColor: 'rgba(0, 0, 0, 0.38)',
          backdropFilter: 'blur(2px)',
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.3s ease',
        }}
      />

      {/* Modal Card */}
      <Box
        onClick={(e) => e.stopPropagation()}
        sx={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: visible
            ? 'translate(-50%, -50%) scale(1)'
            : 'translate(-50%, -46%) scale(0.96)',
          zIndex: 1301,
          width: { xs: 'calc(100vw - 32px)', sm: hasImages ? 560 : 520 },
          maxWidth: '100%',
          opacity: visible ? 1 : 0,
          transition: 'all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
          borderRadius: '20px',
          overflow: 'hidden',
          background: cv.dialogSurface,
          border: `1px solid ${cv.border}`,
          boxShadow: `0 32px 80px rgba(0,0,0,0.45), 0 0 0 1px ${cv.whiteBorderSoft}, inset 0 1px 0 ${cv.whiteSurfaceStrong}`,
        }}
      >
        {/* Brand gradient top accent bar */}
        <Box sx={{ height: 4, background: cv.brandGradient, width: '100%' }} />

        {/* Header */}
        <Box
          sx={{
            position: 'relative',
            px: 3.5,
            pt: 3,
            pb: 2,
            background: `linear-gradient(180deg, ${cv.purpleSurface} 0%, transparent 100%)`,
          }}
        >
          {/* NOAH brand badge */}
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.75,
              mb: 2,
              px: 1.25,
              py: 0.4,
              borderRadius: '8px',
              background: cv.purpleSelectionSoft,
              border: `1px solid ${cv.purpleChipBorder}`,
            }}
          >
            <Box
              sx={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: cv.brandGradient,
                boxShadow: `0 0 6px ${cv.brandBlue}`,
                animation: 'noahPulse 2s ease-in-out infinite',
                '@keyframes noahPulse': {
                  '0%, 100%': { opacity: 1, transform: 'scale(1)' },
                  '50%': { opacity: 0.6, transform: 'scale(1.3)' },
                },
              }}
            />
            <Typography
              sx={{
                fontSize: '0.6875rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                background: cv.brandGradient,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              NOAH Cloud
            </Typography>
          </Box>

          {/* Close */}
          <IconButton
            onClick={handleDismiss}
            size="small"
            sx={{
              position: 'absolute',
              top: 14,
              right: 14,
              color: cv.textMuted,
              '&:hover': { color: cv.textPrimary, backgroundColor: cv.surfaceHover },
            }}
          >
            <CloseRoundedIcon fontSize="small" />
          </IconButton>

          {/* Title */}
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              fontSize: { xs: '1.25rem', sm: '1.5rem' },
              color: cv.textPrimary,
              lineHeight: 1.25,
              letterSpacing: '-0.02em',
            }}
          >
            {notification.title}
          </Typography>
        </Box>

        {/* Divider */}
        <Box sx={{ height: '1px', mx: 3.5, background: cv.divider }} />

        {/* Body */}
        <Box sx={{ px: 3.5, py: 2.5 }}>
          <Typography
            sx={{
              color: cv.textSecondary,
              fontSize: '0.9375rem',
              lineHeight: 1.7,
              whiteSpace: 'pre-line',
            }}
          >
            {notification.body}
          </Typography>
        </Box>

        {/* Image Slider */}
        {hasImages && (
          <>
            <Box sx={{ height: '1px', mx: 3.5, background: cv.divider }} />
            <Box
              sx={{ position: 'relative', mx: 2.5, my: 2, borderRadius: 2, overflow: 'hidden', minHeight: 180 }}
              onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
              onTouchEnd={(e) => {
                if (touchStartX.current === null) return;
                const diff = touchStartX.current - e.changedTouches[0].clientX;
                if (diff > 40) nextSlide();
                else if (diff < -40) prevSlide();
                touchStartX.current = null;
              }}
            >
              {/* Skeleton shimmer — shown while current image is loading */}
              {!isCurrentLoaded && (
                <Skeleton
                  variant="rectangular"
                  animation="wave"
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    borderRadius: 2,
                    bgcolor: cv.surfaceMuted,
                    '&::after': {
                      background: `linear-gradient(90deg, transparent, ${cv.surfaceHover}, transparent)`,
                    },
                  }}
                />
              )}

              {/* Render all images but only show the current one */}
              {images.map((img, i) => (
                <Box
                  key={img.id}
                  component="img"
                  src={img.url || ''}
                  alt={img.fileName}
                  loading="eager"
                  onLoad={() => markLoaded(img.id)}
                  onError={() => markLoaded(img.id)}
                  sx={{
                    position: i === 0 ? 'relative' : 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: i === 0 ? 'auto' : '100%',
                    maxHeight: 260,
                    objectFit: 'cover',
                    display: 'block',
                    borderRadius: 2,
                    opacity: i === slideIndex && loadedImages[img.id] ? 1 : 0,
                    transition: 'opacity 0.3s ease',
                    pointerEvents: i === slideIndex ? 'auto' : 'none',
                  }}
                />
              ))}

              {/* Slider nav arrows — only shown when multiple images */}
              {hasSlider && (
                <>
                  <IconButton
                    onClick={prevSlide}
                    size="small"
                    sx={{
                      position: 'absolute',
                      left: 8,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      bgcolor: 'rgba(0,0,0,0.55)',
                      color: '#fff',
                      backdropFilter: 'blur(4px)',
                      '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' },
                      zIndex: 2,
                    }}
                  >
                    <ChevronLeftRoundedIcon />
                  </IconButton>
                  <IconButton
                    onClick={nextSlide}
                    size="small"
                    sx={{
                      position: 'absolute',
                      right: 8,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      bgcolor: 'rgba(0,0,0,0.55)',
                      color: '#fff',
                      backdropFilter: 'blur(4px)',
                      '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' },
                      zIndex: 2,
                    }}
                  >
                    <ChevronRightRoundedIcon />
                  </IconButton>

                  {/* Dot indicators */}
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: 10,
                      left: 0,
                      right: 0,
                      display: 'flex',
                      justifyContent: 'center',
                      gap: 0.75,
                      zIndex: 2,
                    }}
                  >
                    {images.map((_, i) => (
                      <Box
                        key={i}
                        onClick={() => setSlideIndex(i)}
                        sx={{
                          width: i === slideIndex ? 18 : 6,
                          height: 6,
                          borderRadius: '3px',
                          bgcolor: i === slideIndex ? '#fff' : 'rgba(255,255,255,0.45)',
                          cursor: 'pointer',
                          transition: 'all 0.25s ease',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
                        }}
                      />
                    ))}
                  </Box>
                </>
              )}
            </Box>
          </>
        )}

        {/* Actions */}
        <Box
          sx={{
            px: 3.5,
            pb: 3,
            pt: hasImages ? 0 : 0.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 1.5,
          }}
        >
          <Button
            variant="text"
            onClick={handleDismiss}
            sx={{
              color: cv.textMuted,
              textTransform: 'none',
              fontWeight: 500,
              fontSize: '0.875rem',
              borderRadius: '10px',
              px: 2,
              '&:hover': { backgroundColor: cv.surfaceHover, color: cv.textPrimary },
            }}
          >
            Dismiss
          </Button>

          {notification.ctaLabel && notification.ctaUrl && (
            <Button
              variant="contained"
              onClick={handleCtaClick}
              endIcon={<OpenInNewRoundedIcon sx={{ fontSize: '14px !important' }} />}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.875rem',
                borderRadius: '10px',
                px: 2.5,
                py: 0.875,
                background: cv.brandGradient,
                boxShadow: cv.brandShadow,
                color: '#fff',
                '&:hover': {
                  background: cv.brandGradientHover,
                  boxShadow: cv.brandShadowStrong,
                  transform: 'translateY(-1px)',
                },
                transition: 'all 0.2s ease',
              }}
            >
              {notification.ctaLabel}
            </Button>
          )}
        </Box>
      </Box>
    </>
  );
}

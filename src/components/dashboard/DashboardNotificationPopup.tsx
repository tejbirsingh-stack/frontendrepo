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
import { readLocalDashboardNotification } from '../../platform/utils/localDashboardNotification';
import { DISPLAY_FONT } from '../landing/landingContent';

/** NOAH primary brand blue (royal purple → electric orchid system) */
const BRAND = {
  primary: '#8e44ad',
  primaryDeep: '#703688',
  primaryLight: '#d28cff',
  ink: '#1C1C1C',
  inkMuted: '#5A5A5A',
  white: '#FFFFFF',
  cream: '#FAFAFC',
};

type PreviewDetail = {
  notification?: DashboardNotificationSettings;
};

function mergeNotificationSources(
  remote: DashboardNotificationSettings | null,
  local: DashboardNotificationSettings | null,
): DashboardNotificationSettings | null {
  if (!local) return remote;
  if (!remote) return local;

  const remoteTs = remote.updatedAt ? Date.parse(remote.updatedAt) : 0;
  const localTs = local.updatedAt ? Date.parse(local.updatedAt) : 0;
  if (localTs >= remoteTs) return local;
  return remote;
}

type Props = {
  /** When false, only opens via the preview event (platform admin). Default true. */
  autoOpen?: boolean;
};

export default function DashboardNotificationPopup({ autoOpen = true }: Readonly<Props>) {
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const [notification, setNotification] = useState<DashboardNotificationSettings | null>(null);
  const [slideIndex, setSlideIndex] = useState(0);
  const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({});
  const touchStartX = useRef<number | null>(null);

  const showPopup = (data: DashboardNotificationSettings, force = false) => {
    setNotification(data);
    setSlideIndex(0);
    setLoadedImages({});

    if (!force && data.updatedAt) {
      const dismissalKey = `dashboard_notification_dismissed_${data.updatedAt}`;
      if (localStorage.getItem(dismissalKey)) return;
    }

    setOpen(true);
    setTimeout(() => setVisible(true), 50);
  };

  useEffect(() => {
    let mounted = true;

    const checkNotification = async () => {
      let remote: DashboardNotificationSettings | null = null;
      try {
        const res = await fetchPublicDashboardNotification();
        if (res.success && res.notification) remote = res.notification;
      } catch (err) {
        console.warn('Failed to load dashboard notification', err);
      }

      if (!mounted) return;

      const local = readLocalDashboardNotification();
      const merged = mergeNotificationSources(remote, local);
      if (merged?.isEnabled) {
        if (autoOpen) showPopup(merged);
        else setNotification(merged);
      }
    };

    checkNotification();

    const handleOpenEvent = (event: Event) => {
      const custom = event as CustomEvent<PreviewDetail>;
      const preview = custom.detail?.notification;
      if (preview) {
        showPopup(preview, true);
        return;
      }
      const local = readLocalDashboardNotification();
      if (local) {
        showPopup(local, true);
        return;
      }
      if (notification) {
        showPopup(notification, true);
      } else {
        setOpen(true);
        setTimeout(() => setVisible(true), 50);
      }
    };

    window.addEventListener('open-dashboard-notification', handleOpenEvent);
    return () => {
      mounted = false;
      window.removeEventListener('open-dashboard-notification', handleOpenEvent);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      <Box
        onClick={handleDismiss}
        sx={{
          position: 'fixed',
          inset: 0,
          zIndex: 1300,
          backgroundColor: 'rgba(12, 10, 18, 0.62)',
          backdropFilter: 'blur(4px)',
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.3s ease',
        }}
      />

      {/* Positioning wrapper — close sits outside the modal */}
      <Box
        sx={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: visible
            ? 'translate(-50%, -50%) scale(1)'
            : 'translate(-50%, -46%) scale(0.97)',
          zIndex: 1301,
          width: { xs: 'calc(100vw - 40px)', sm: hasImages ? 900 : 520 },
          maxWidth: 'calc(100vw - 40px)',
          opacity: visible ? 1 : 0,
          transition: 'all 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        <IconButton
          onClick={handleDismiss}
          aria-label="Close notification"
          sx={{
            position: 'absolute',
            top: { xs: -14, sm: -18 },
            right: { xs: -10, sm: -18 },
            zIndex: 6,
            width: 32,
            height: 32,
            bgcolor: BRAND.white,
            color: BRAND.ink,
            boxShadow: '0 8px 24px rgba(0,0,0,0.28)',
            '&:hover': {
              bgcolor: BRAND.white,
              color: BRAND.primary,
              boxShadow: '0 10px 28px rgba(0,0,0,0.35)',
            },
          }}
        >
          <CloseRoundedIcon sx={{ fontSize: 18 }} />
        </IconButton>

        <Box
          role="dialog"
          aria-modal="true"
          aria-labelledby="dashboard-notification-title"
          onClick={(e) => e.stopPropagation()}
          sx={{
            width: '100%',
            maxHeight: 'min(92vh, 500px)',
            borderTopLeftRadius: 0,
            borderBottomLeftRadius: { xs: '40px', sm: '72px' },
            borderTopRightRadius: { xs: '40px', sm: '72px' },
            borderBottomRightRadius: 0,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: { xs: 'column', sm: hasImages ? 'row' : 'column' },
            background: BRAND.white,
            boxShadow: '0 40px 100px rgba(20, 10, 40, 0.45)',
          }}
        >
          {/* Left — image + logo + notification label */}
          {hasImages && (
            <Box
              sx={{
                position: 'relative',
                flex: { xs: '0 0 auto', sm: '1 1 50%' },
                minHeight: { xs: 240, sm: 460 },
                background: `linear-gradient(160deg, ${BRAND.primary} 0%, ${BRAND.primaryDeep} 75%)`,
                overflow: 'hidden',
              }}
              onTouchStart={(e) => {
                touchStartX.current = e.touches[0].clientX;
              }}
              onTouchEnd={(e) => {
                if (touchStartX.current === null) return;
                const diff = touchStartX.current - e.changedTouches[0].clientX;
                if (diff > 40) nextSlide();
                else if (diff < -40) prevSlide();
                touchStartX.current = null;
              }}
            >
              {!isCurrentLoaded && (
                <Skeleton
                  variant="rectangular"
                  animation="wave"
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    bgcolor: 'rgba(255,255,255,0.18)',
                    '&::after': {
                      background:
                        'linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)',
                    },
                  }}
                />
              )}

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
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    objectPosition: 'center',
                    opacity: i === slideIndex && loadedImages[img.id] ? 1 : 0,
                    transition: 'opacity 0.35s ease',
                  }}
                />
              ))}

              <Box
                sx={{
                  position: 'absolute',
                  inset: 0,
                  background:
                    'linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.2) 45%, rgba(20,8,36,0.82) 100%)',
                  pointerEvents: 'none',
                }}
              />

              <Box
                component="img"
                src="/noah-logo.png"
                alt="NOAH Cloud"
                sx={{
                  position: 'absolute',
                  left: { xs: '50%', sm: '50%' },
                  transform: { xs: 'translateX(-50%)', sm: 'translateX(-50%)' },
                  bottom: { xs: 50, sm: 50 },
                  zIndex: 3,
                  width: 'auto',
                  maxWidth: { xs: '72%', sm: '70%' },
                  objectFit: 'contain',
                  objectPosition: 'left bottom',
                  mixBlendMode: 'lighten',
                  filter: 'drop-shadow(0 4px 20px rgba(0,0,0,0.4))',
                }}
              />

              <Box
                sx={{
                  position: 'absolute',
                  right: { xs: 10, sm: 10 },
                  bottom: { xs: 10, sm: 10 },
                  zIndex: 3,
                  display: 'inline-flex',
                  alignItems: 'center',
                  px: 1.35,
                  py: 0.5,
                  borderRadius: '999px',
                  bgcolor: 'rgba(255,255,255,0.16)',
                  border: '1px solid rgba(255,255,255,0.35)',
                  backdropFilter: 'blur(8px)',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                }}
              >
                <Typography
                  sx={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    letterSpacing: '0.02em',
                    color: BRAND.white,
                    lineHeight: 1.2,
                    whiteSpace: 'nowrap',
                  }}
                >
                  Notification from NOAH Cloud
                </Typography>
              </Box>

              {hasSlider && (
                <>
                  <IconButton
                    onClick={prevSlide}
                    size="small"
                    aria-label="Previous image"
                    sx={{
                      position: 'absolute',
                      left: 10,
                      top: '42%',
                      bgcolor: 'rgba(0,0,0,0.35)',
                      color: '#fff',
                      zIndex: 3,
                      '&:hover': { bgcolor: 'rgba(0,0,0,0.55)' },
                    }}
                  >
                    <ChevronLeftRoundedIcon />
                  </IconButton>
                  <IconButton
                    onClick={nextSlide}
                    size="small"
                    aria-label="Next image"
                    sx={{
                      position: 'absolute',
                      right: 10,
                      top: '42%',
                      bgcolor: 'rgba(0,0,0,0.35)',
                      color: '#fff',
                      zIndex: 3,
                      '&:hover': { bgcolor: 'rgba(0,0,0,0.55)' },
                    }}
                  >
                    <ChevronRightRoundedIcon />
                  </IconButton>
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 16,
                      left: 0,
                      right: 0,
                      display: 'flex',
                      justifyContent: 'center',
                      gap: 0.75,
                      zIndex: 3,
                    }}
                  >
                    {images.map((img, i) => (
                      <Box
                        key={img.id}
                        onClick={() => setSlideIndex(i)}
                        sx={{
                          width: i === slideIndex ? 16 : 6,
                          height: 6,
                          borderRadius: '3px',
                          bgcolor: i === slideIndex ? BRAND.white : 'rgba(255,255,255,0.45)',
                          cursor: 'pointer',
                          transition: 'all 0.25s ease',
                        }}
                      />
                    ))}
                  </Box>
                </>
              )}
            </Box>
          )}

          {/* Right — title, body, actions */}
          <Box
            sx={{
              position: 'relative',
              flex: { xs: '1 1 auto', sm: hasImages ? '1 1 50%' : '1 1 auto' },
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              px: { xs: 3, sm: 4.5 },
              py: { xs: 3.5, sm: 4.5 },
              zIndex: 2,
              background: BRAND.white,
              minWidth: 0,
              minHeight: { sm: hasImages ? 460 : undefined },
            }}
          >
            <Typography
              id="dashboard-notification-title"
              sx={{
                fontFamily: DISPLAY_FONT,
                fontWeight: 600,
                fontSize: { xs: '1.5rem', sm: hasImages ? '1.85rem' : '2rem' },
                lineHeight: 1.2,
                letterSpacing: '-0.02em',
                color: BRAND.ink,
                mb: 2,
              }}
            >
              {notification.title}
            </Typography>

            <Typography
              sx={{
                color: BRAND.inkMuted,
                fontSize: { xs: '0.9rem', sm: '0.95rem' },
                lineHeight: 1.7,
                letterSpacing: '0.01em',
                whiteSpace: 'pre-line',
                mb: 4,
              }}
            >
              {notification.body}
            </Typography>

            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: 1.5,
                mt: 'auto',
                flexWrap: 'wrap',
              }}
            >
              <Button
                variant="text"
                onClick={handleDismiss}
                sx={{
                  color: BRAND.inkMuted,
                  textTransform: 'none',
                  fontWeight: 500,
                  fontSize: '0.875rem',
                  borderRadius: '999px',
                  px: 2,
                  '&:hover': {
                    backgroundColor: 'rgba(142, 68, 173, 0.1)',
                    color: BRAND.ink,
                  },
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
                    borderRadius: '999px',
                    px: 2.75,
                    py: 1,
                    background: `linear-gradient(135deg, ${BRAND.primary} 0%, ${BRAND.primaryLight} 100%)`,
                    color: BRAND.white,
                    boxShadow: '0 8px 24px rgba(142, 68, 173, 0.4)',
                    '&:hover': {
                      background: `linear-gradient(135deg, ${BRAND.primaryDeep} 0%, ${BRAND.primary} 100%)`,
                      boxShadow: '0 10px 28px rgba(112, 54, 136, 0.5)',
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
        </Box>
      </Box>
    </>
  );
}

import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  Drawer,
  IconButton,
  Link,
  Typography,
  keyframes,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import VideoLibraryRoundedIcon from '@mui/icons-material/VideoLibraryRounded';
import RateReviewRoundedIcon from '@mui/icons-material/RateReviewRounded';
import IosShareRoundedIcon from '@mui/icons-material/IosShareRounded';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import NoahLogo from '../components/NoahLogo';
import NoahMascot from '../components/NoahMascot';
import WaveBackground from '../components/WaveBackground';
import LandingCtaDialogs from '../components/landing/LandingCtaDialogs';
import {
  CAPABILITIES,
  DISPLAY_FONT,
  FALLBACK_HERO,
  FALLBACK_PLANS,
  FRICTION,
  NAV_LINKS,
  PILLARS,
} from '../components/landing/landingContent';
import { useAuth } from '../auth/AuthContext';
import { useForcedDarkTheme } from '../context/ThemePreferenceContext';
import { fetchPublicCatalogPlans, fetchPublicLanding, type PlatformPlan } from '../platform/api/platformApi';
import { formatBytes } from '../platform/components/PlatformUi';
import { cv } from '../theme/cssVars';

type CtaModal = 'demo' | 'trial' | null;
type BillingCycle = 'annual' | 'monthly';
type LandingPlan = Pick<
  PlatformPlan,
  'id' | 'name' | 'monthlyPriceCents' | 'isFeatured' | 'hasAI' | 'maxUsers' | 'maxWorkspaces' | 'maxProjects' | 'storageQuotaBytes' | 'showProjectQuota' | 'showStorageQuota' | 'showMemberQuota'
> & {
  description?: string | null;
  yearlyPriceCents?: number;
  annualPriceCents?: number;
  features: (string | { name: string })[];
  ctaLabel?: string | null;
};

const MAX = 1180;
const sectionPad = { px: { xs: 2.5, sm: 4 }, py: { xs: 8, md: 12 } };
const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)';

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(28px); }
  to { opacity: 1; transform: translateY(0); }
`;

function asString(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value : fallback;
}

function primaryButtonSx(extra?: object) {
  return {
    height: 48,
    minHeight: 44,
    px: 2.75,
    borderRadius: '999px',
    background: cv.brandGradient,
    color: cv.textOnCta,
    fontWeight: 600,
    textTransform: 'none',
    boxShadow: 'none',
    transition: `background 0.28s ${EASE}, transform 0.28s ${EASE}, box-shadow 0.28s ${EASE}`,
    '&:hover': {
      background: cv.brandGradientHover,
      boxShadow: cv.brandShadow,
      transform: 'translateY(-1px)',
    },
    ...extra,
  };
}

function ghostButtonSx(extra?: object) {
  return {
    height: 48,
    minHeight: 44,
    px: 2.75,
    borderRadius: '999px',
    border: `1px solid ${cv.borderStrong}`,
    color: cv.textPrimary,
    fontWeight: 600,
    textTransform: 'none',
    backgroundColor: 'transparent',
    transition: `background-color 0.28s ${EASE}, border-color 0.28s ${EASE}, transform 0.28s ${EASE}`,
    '&:hover': {
      borderColor: cv.brandOrchid,
      backgroundColor: cv.purpleSurfaceHover,
      transform: 'translateY(-1px)',
    },
    ...extra,
  };
}

const footerLinkButtonSx = {
  display: 'block',
  width: '100%',
  textAlign: 'left',
  background: 'none',
  border: 0,
  p: 0,
  py: 0.6,
  color: cv.textSecondary,
  cursor: 'pointer',
  font: 'inherit',
  minHeight: 44,
  '&:hover': { color: cv.brandOrchid },
  transition: `color 0.22s ${EASE}`,
  '&:focus-visible': { outline: `2px solid ${cv.brandOrchid}`, outlineOffset: 2 },
} as const;

const cardHoverSx = {
  transition: `transform 0.4s ${EASE}, border-color 0.4s ${EASE}, box-shadow 0.4s ${EASE}`,
  '&:hover': {
    transform: 'translateY(-6px)',
    borderColor: cv.purpleChipBorder,
    boxShadow: '0 18px 40px rgba(0,0,0,0.28)',
  },
} as const;

const PILLAR_ICONS = {
  library: VideoLibraryRoundedIcon,
  review: RateReviewRoundedIcon,
  share: IosShareRoundedIcon,
} as const;

function heroAnim(delayMs: number) {
  return {
    animation: `${fadeUp} 0.9s ${EASE} both`,
    animationDelay: `${delayMs}ms`,
    '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
  };
}

function ProductPreview() {
  const cards = [
    { title: 'Hero_cut_v12.mov', meta: '4K · 02:14', tone: cv.brandPurple },
    { title: 'VO_final.wav', meta: 'Audio · 00:46', tone: cv.brandTeal },
    { title: 'Still_08.jpg', meta: 'RAW · 48 MP', tone: cv.brandOrchid },
    { title: 'Brand_kit.pdf', meta: 'Document', tone: cv.brandPurple },
  ];

  return (
    <Box
      aria-hidden
      sx={{
        position: 'relative',
        borderRadius: { xs: '20px', md: '28px' },
        border: `1px solid ${cv.border}`,
        background: 'linear-gradient(180deg, rgba(28,28,28,0.92) 0%, rgba(18,18,18,0.96) 100%)',
        boxShadow: '0 40px 80px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.04)',
        overflow: 'hidden',
        minHeight: { xs: 280, md: 420 },
      }}
    >
      <Box sx={{ display: 'flex', minHeight: { xs: 280, md: 420 } }}>
        <Box
          sx={{
            display: { xs: 'none', sm: 'flex' },
            width: 168,
            flexDirection: 'column',
            gap: 0.75,
            p: 2,
            borderRight: `1px solid ${cv.border}`,
            background: 'rgba(12,12,12,0.65)',
          }}
        >
          <Box sx={{ height: 10, width: 72, borderRadius: 99, background: cv.brandOrchid, opacity: 0.85, mb: 1.5 }} />
          {['Recent', 'Projects', 'Shared', 'Favorites', 'Trash'].map((item, index) => (
            <Box
              key={item}
              sx={{
                px: 1,
                py: 0.7,
                borderRadius: '8px',
                fontSize: '0.75rem',
                color: index === 1 ? cv.textPrimary : cv.textMuted,
                background: index === 1 ? cv.purpleSurface : 'transparent',
              }}
            >
              {item}
            </Box>
          ))}
        </Box>
        <Box sx={{ flex: 1, p: { xs: 1.5, md: 2.5 } }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              mb: 2,
              px: 1.5,
              height: 40,
              borderRadius: '12px',
              border: `1px solid ${cv.border}`,
              color: cv.textMuted,
              fontSize: '0.8125rem',
            }}
          >
            <SearchRoundedIcon sx={{ fontSize: 16 }} />
            Search assets, tags, comments…
          </Box>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' },
              gap: 1.25,
            }}
          >
            {cards.map((card) => (
              <Box
                key={card.title}
                sx={{
                  borderRadius: '14px',
                  overflow: 'hidden',
                  border: `1px solid ${cv.border}`,
                  background: cv.surface,
                  transition: `transform 0.35s ${EASE}, border-color 0.35s ${EASE}`,
                  '&:hover': { transform: 'translateY(-4px)', borderColor: cv.purpleChipBorder },
                }}
              >
                <Box
                  sx={{
                    height: { xs: 72, md: 96 },
                    background: `linear-gradient(135deg, ${card.tone}55, ${cv.surface})`,
                    display: 'grid',
                    placeItems: 'center',
                  }}
                >
                  {card.title.endsWith('.mov') ? (
                    <PlayArrowRoundedIcon sx={{ color: cv.brandOrchid }} />
                  ) : (
                    <FolderOutlinedIcon sx={{ color: cv.brandOrchid, opacity: 0.85 }} />
                  )}
                </Box>
                <Box sx={{ p: 1.1 }}>
                  <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {card.title}
                  </Typography>
                  <Typography sx={{ fontSize: '0.6875rem', color: cv.textMuted, mt: 0.25 }}>{card.meta}</Typography>
                </Box>
              </Box>
            ))}
          </Box>
          <Box
            sx={{
              mt: 2,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 1.25,
              p: 1.5,
              borderRadius: '14px',
              border: `1px solid ${cv.purpleChipBorder}`,
              background: cv.purpleSurface,
            }}
          >
            <Box
              sx={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: cv.brandGradient,
                flexShrink: 0,
                mt: 0.2,
              }}
            />
            <Box>
              <Typography sx={{ fontSize: '0.75rem', fontWeight: 700 }}>00:14:22 · Color pass</Typography>
              <Typography sx={{ fontSize: '0.75rem', color: cv.textSecondary, mt: 0.25, lineHeight: 1.45 }}>
                Hold the sky 8% warmer and keep the VO dip at 14:18. Client approved this cut.
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export default function MarketingLandingPage() {
  useForcedDarkTheme();
  const { isAuthenticated } = useAuth();
  const [modal, setModal] = useState<CtaModal>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [heroTitle, setHeroTitle] = useState(FALLBACK_HERO.title);
  const [heroSubtitle, setHeroSubtitle] = useState(FALLBACK_HERO.subtitle);
  const [ctaLabel, setCtaLabel] = useState('Start free trial');
  const [ctaHref, setCtaHref] = useState('');
  const [plansEnabled, setPlansEnabled] = useState(true);
  const [plans, setPlans] = useState<LandingPlan[]>(FALLBACK_PLANS);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('annual');

  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth';
    return () => {
      document.documentElement.style.scrollBehavior = '';
    };
  }, []);

  useEffect(() => {
    fetchPublicLanding()
      .then((res) => {
        const page = res.page || {};
        setHeroTitle(asString(page.heroTitle || page.heroHeadline, FALLBACK_HERO.title));
        setHeroSubtitle(asString(page.heroSubtitle || page.heroSubheadline, FALLBACK_HERO.subtitle));
        setCtaLabel(asString(page.ctaLabel || page.heroCtaLabel, 'Start free trial'));
        setCtaHref(asString(page.ctaHref || page.heroCtaUrl, ''));
        if (typeof page.plansEnabled === 'boolean') setPlansEnabled(page.plansEnabled);
      })
      .catch(() => {
        /* keep authored fallbacks */
      });

    fetchPublicCatalogPlans()
      .then((res) => {
        if (res.plans?.length) {
          const sortedPlans = [...res.plans].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
          setPlans(sortedPlans);
        }
      })
      .catch(() => {
        /* plans section hides if empty */
      });
  }, []);

  useEffect(() => {
    const prefersReduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const nodes = document.querySelectorAll<HTMLElement>('[data-reveal]');
    if (prefersReduce) {
      nodes.forEach((node) => node.classList.add('is-visible'));
      return undefined;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    );
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [plansEnabled, plans.length]);

  const openTrial = () => setModal('trial');
  const openDemo = () => setModal('demo');
  const closeMenu = () => setMenuOpen(false);

  const priceLabel = (plan: LandingPlan) => {
    const monthly = (plan.monthlyPriceCents || 0) / 100;
    if (monthly === 0) return 'Free';
    if (billingCycle === 'annual') {
      const yearly = ((plan.yearlyPriceCents ?? plan.annualPriceCents) || 0) / 100;
      const perMonth = yearly > 0 ? yearly / 12 : monthly;
      return `$${Math.round(perMonth)}`;
    }
    return `$${Math.round(monthly)}`;
  };

  const activeNavLinks = NAV_LINKS.filter(
    (item) => plansEnabled || item.href !== '#plans'
  );

  const handlePlanCta = (plan: LandingPlan) => {
    const name = (plan.name || '').toLowerCase();
    if (name.includes('enterprise') || (plan.ctaLabel || '').toLowerCase().includes('contact')) {
      openDemo();
      return;
    }
    openTrial();
  };

  return (
    <Box
      sx={{
        height: '100vh',
        overflowX: 'hidden',
        overflowY: modal ? 'hidden' : 'auto',
        background: cv.bg,
        color: cv.textPrimary,
        scrollBehavior: 'smooth',
        '& [data-reveal]': {
          opacity: 0,
          transform: 'translateY(32px)',
          transition: `opacity 0.8s ${EASE}, transform 0.8s ${EASE}`,
        },
        '& [data-reveal].is-visible': {
          opacity: 1,
          transform: 'none',
        },
        '@media (prefers-reduced-motion: reduce)': {
          scrollBehavior: 'auto',
          '& [data-reveal]': { opacity: 1, transform: 'none', transition: 'none' },
        },
      }}
    >
      <Link
        href="#main-content"
        className="skip-link"
        sx={{
          position: 'absolute',
          left: 16,
          top: -80,
          zIndex: 2000,
          px: 2,
          py: 1.25,
          borderRadius: '10px',
          background: cv.brandGradient,
          color: cv.textOnCta,
          fontWeight: 700,
          '&:focus': { top: 16, outline: `3px solid ${cv.brandOrchid}` },
        }}
      >
        Skip to main content
      </Link>

      <Box
        component="header"
        role="banner"
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 20,
          backdropFilter: 'blur(22px) saturate(160%)',
          background: 'rgba(18,18,18,0.78)',
          borderBottom: `1px solid ${cv.border}`,
          transition: `background 0.35s ${EASE}, border-color 0.35s ${EASE}`,
        }}
      >
        <Box
          sx={{
            maxWidth: MAX,
            mx: 'auto',
            px: { xs: 2, sm: 3 },
            height: { xs: 72, sm: 80, md: 88 },
            display: 'flex',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <Box sx={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center' }}>
            <NoahLogo
              width={{ xs: 200, sm: 200, md: 292 }}
              height={{ xs: 56, sm: 56, md: 72 }}
              boxWidth={{ xs: 200, sm: 200, md: 292 }}
              objectFit="cover"
              animated={false}
              showGlow={false}
              align="left"
              ariaLabel="NOAH Cloud home"
              sx={{
                mb: 0,
                overflow: 'hidden',
                maxWidth: { xs: 200, sm: 200, md: 'none' },
                '& img': {
                  mixBlendMode: 'lighten',
                  objectPosition: 'center',
                  transform: 'scale(1)',
                  maxWidth: { xs: '200px', sm: '200px', md: 'none' },
                  width: { xs: '100%', sm: '100%', md: '100%' },
                  height: 'auto',
                },
                'html[data-theme="light"] & img': { mixBlendMode: 'normal' },
              }}
            />
          </Box>
          <Box
            component="nav"
            aria-label="Page sections"
            sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 0.5 }}
          >
            {activeNavLinks.map((item) => (
              <Button
                key={item.href}
                href={item.href}
                sx={{
                  color: cv.textSecondary,
                  minHeight: 44,
                  px: 1.5,
                  fontWeight: 500,
                  transition: `color 0.22s ${EASE}, background-color 0.22s ${EASE}`,
                  '&:hover': { color: cv.textPrimary, backgroundColor: cv.surfaceHover },
                }}
              >
                {item.label}
              </Button>
            ))}
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {isAuthenticated ? (
              <Button component={RouterLink} to="/home" sx={ghostButtonSx({ display: { xs: 'none', sm: 'inline-flex' }, height: 40 })}>
                Open library
              </Button>
            ) : (
              <Button component={RouterLink} to="/login" sx={{ ...ghostButtonSx({ display: { xs: 'none', sm: 'inline-flex' }, height: 40, px: 2 }) }}>
                Sign in
              </Button>
            )}
            <Button onClick={openDemo} sx={ghostButtonSx({ display: { xs: 'none', lg: 'inline-flex' }, height: 40, px: 2 })}>
              Book a demo
            </Button>
            <Button onClick={openTrial} sx={primaryButtonSx({ height: 40, px: 2 })}>
              Start free trial
            </Button>
            <IconButton
              aria-label="Open menu"
              onClick={() => setMenuOpen(true)}
              sx={{ display: { md: 'none' }, color: cv.textPrimary, minWidth: 44, minHeight: 44 }}
            >
              <MenuIcon />
            </IconButton>
          </Box>
        </Box>
      </Box>

      <Drawer
        anchor="right"
        open={menuOpen}
        onClose={closeMenu}
        slotProps={{ paper: { sx: { width: 'min(100%, 360px)', background: cv.bg, backgroundImage: 'none', p: 2 } } }}
        transitionDuration={{ enter: 360, exit: 260 }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography sx={{ fontWeight: 700 }}>Menu</Typography>
          <IconButton aria-label="Close menu" onClick={closeMenu} sx={{ minWidth: 44, minHeight: 44 }}>
            <CloseIcon />
          </IconButton>
        </Box>
        <Box component="nav" aria-label="Mobile" sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {activeNavLinks.map((item) => (
            <Button key={item.href} href={item.href} onClick={closeMenu} sx={{ justifyContent: 'flex-start', minHeight: 44, color: cv.textPrimary }}>
              {item.label}
            </Button>
          ))}
          {isAuthenticated ? (
            <Button component={RouterLink} to="/home" onClick={closeMenu} sx={{ justifyContent: 'flex-start', minHeight: 44 }}>
              Open library
            </Button>
          ) : (
            <Button component={RouterLink} to="/login" onClick={closeMenu} sx={{ justifyContent: 'flex-start', minHeight: 44 }}>
              Sign in
            </Button>
          )}
          <Button onClick={() => { closeMenu(); openDemo(); }} sx={{ ...ghostButtonSx(), mt: 1 }}>
            Book a demo
          </Button>
          <Button onClick={() => { closeMenu(); openTrial(); }} sx={primaryButtonSx()}>
            Start free trial
          </Button>
        </Box>
      </Drawer>

      <Box component="main" id="main-content" tabIndex={-1} sx={{ outline: 'none' }}>
        <Box
          component="section"
          aria-labelledby="hero-title"
          sx={{
            ...sectionPad,
            pt: { xs: 8, md: 12 },
            position: 'relative',
            overflow: 'hidden',
            background:
              'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(142,68,173,0.22), transparent 55%), radial-gradient(ellipse 40% 40% at 90% 10%, rgba(210,140,255,0.12), transparent 50%)',
          }}
        >
          <Box sx={{ position: 'relative', zIndex: 1, maxWidth: MAX, mx: 'auto', textAlign: 'center' }}>
            <Box
              component="div"
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                mb: 3,
                height: 32,
                px: 1.5,
                borderRadius: '999px',
                color: cv.brandOrchid,
                border: `1px solid ${cv.purpleChipBorder}`,
                background: cv.purpleSurface,
                fontWeight: 600,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                fontSize: '0.6875rem',
                ...heroAnim(40),
              }}
            >
              The creative operations platform
            </Box>
            <Typography
              id="hero-title"
              component="h1"
              sx={{
                fontFamily: DISPLAY_FONT,
                fontWeight: 600,
                fontSize: { xs: '2.35rem', sm: '3.4rem', md: '4.6rem' },
                lineHeight: 1.05,
                letterSpacing: '-0.04em',
                maxWidth: 920,
                mx: 'auto',
                ...heroAnim(120),
              }}
            >
              {heroTitle}
            </Typography>
            <Typography
              sx={{
                mt: 2.5,
                color: cv.textSecondary,
                fontSize: { xs: '1.05rem', md: '1.2rem' },
                lineHeight: 1.6,
                maxWidth: 680,
                mx: 'auto',
                ...heroAnim(220),
              }}
            >
              {heroSubtitle}
            </Typography>
            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center', gap: 1.5, flexWrap: 'wrap', ...heroAnim(320) }}>
              {ctaHref ? (
                <Button component={RouterLink} to={ctaHref} sx={primaryButtonSx({ px: 3.5 })}>
                  {ctaLabel}
                </Button>
              ) : (
                <Button onClick={openTrial} sx={primaryButtonSx({ px: 3.5 })}>
                  {ctaLabel}
                </Button>
              )}
              <Button onClick={openDemo} sx={ghostButtonSx({ px: 3.5 })}>
                Book a demo
              </Button>
            </Box>
            <Box sx={{ mt: { xs: 5, md: 8 }, ...heroAnim(440) }}>
              <NoahMascot pose="gesture" preset="hero" />
              <ProductPreview />
            </Box>
          </Box>
        </Box>

        <Box
          component="section"
          aria-label="Platform capabilities"
          data-reveal
          sx={{ borderTop: `1px solid ${cv.border}`, borderBottom: `1px solid ${cv.border}`, py: { xs: 4, md: 5 }, px: { xs: 2.5, sm: 4 } }}
        >
          <Box
            sx={{
              maxWidth: MAX,
              mx: 'auto',
              display: 'grid',
              gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' },
              gap: { xs: 3, md: 4 },
            }}
          >
            {CAPABILITIES.map((item) => (
              <Box key={item.value}>
                <Typography sx={{ fontFamily: DISPLAY_FONT, fontSize: { xs: '1.5rem', md: '1.85rem' }, fontWeight: 600 }}>
                  {item.value}
                </Typography>
                <Typography sx={{ color: cv.textSecondary, mt: 0.75, fontSize: '0.9rem', lineHeight: 1.5 }}>{item.label}</Typography>
              </Box>
            ))}
          </Box>
        </Box>

        <Box component="section" id="features" aria-labelledby="pillars-title" data-reveal sx={{ ...sectionPad, scrollMarginTop: '104px' }}>
          <Box sx={{ maxWidth: MAX, mx: 'auto' }}>
            <Typography sx={{ color: cv.brandOrchid, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: '0.75rem', mb: 1.5 }}>
              Built as one platform
            </Typography>
            <Typography
              id="pillars-title"
              component="h2"
              sx={{ fontFamily: DISPLAY_FONT, fontSize: { xs: '2rem', md: '3rem' }, fontWeight: 600, letterSpacing: '-0.03em', maxWidth: 720, mb: 6 }}
            >
              Media intelligence across library, review, and delivery
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2.5 }}>
              {PILLARS.map((pillar) => {
                const PillarIcon = PILLAR_ICONS[pillar.id];
                return (
                  <Box
                    key={pillar.id}
                    sx={{
                      p: { xs: 2.5, md: 3 },
                      borderRadius: '20px',
                      border: `1px solid ${cv.border}`,
                      background: cv.surface,
                      ...cardHoverSx,
                    }}
                  >
                    <Box
                      aria-hidden
                      sx={{
                        width: 48,
                        height: 48,
                        mb: 2,
                        display: 'grid',
                        placeItems: 'center',
                        borderRadius: '14px',
                        color: cv.brandOrchid,
                        border: `1px solid ${cv.purpleChipBorder}`,
                        background: cv.purpleSurface,
                      }}
                    >
                      <PillarIcon sx={{ fontSize: 24 }} />
                    </Box>
                    <Typography sx={{ color: cv.brandOrchid, fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                      {pillar.kicker}
                    </Typography>
                    <Typography component="h3" sx={{ mt: 1.25, fontSize: '1.35rem', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.25 }}>
                      {pillar.title}
                    </Typography>
                    <Typography sx={{ mt: 1.25, color: cv.textSecondary, fontSize: '0.9375rem', lineHeight: 1.6 }}>{pillar.body}</Typography>
                  </Box>
                );
              })}
            </Box>
          </Box>
        </Box>

        <Box component="section" aria-labelledby="compare-title" data-reveal sx={{ ...sectionPad, pt: 0 }}>
          <Box sx={{ maxWidth: MAX, mx: 'auto' }}>
            <Typography
              id="compare-title"
              component="h2"
              sx={{ fontFamily: DISPLAY_FONT, fontSize: { xs: '2rem', md: '3rem' }, fontWeight: 600, letterSpacing: '-0.03em', mb: 1 }}
            >
              Transform chaos into content
            </Typography>
            <Typography sx={{ color: cv.textSecondary, mb: 4, maxWidth: 560 }}>
              Creative teams do not need another island. They need the library, the review, and the share to be the same place.
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
              <Box sx={{ p: { xs: 2.5, md: 3.5 }, borderRadius: '20px', border: `1px solid ${cv.border}`, background: cv.surfaceMuted, ...cardHoverSx }}>
                <Typography sx={{ fontWeight: 700, mb: 2, color: cv.textMuted }}>Without NOAH</Typography>
                <Box component="ul" sx={{ m: 0, pl: 2.4 }}>
                  {FRICTION.without.map((item) => (
                    <Box component="li" key={item} sx={{ mb: 1.25, color: cv.textSecondary, lineHeight: 1.5 }}>
                      {item}
                    </Box>
                  ))}
                </Box>
              </Box>
              <Box
                sx={{
                  p: { xs: 2.5, md: 3.5 },
                  borderRadius: '20px',
                  border: `1px solid ${cv.purpleChipBorder}`,
                  background: `linear-gradient(180deg, ${cv.purpleSurfaceHover}, rgba(18,18,18,0.4))`,
                }}
              >
                <Typography sx={{ fontWeight: 700, mb: 2, color: cv.brandOrchid }}>With NOAH Cloud</Typography>
                <Box component="ul" sx={{ m: 0, pl: 0, listStyle: 'none' }}>
                  {FRICTION.with.map((item) => (
                    <Box key={item} sx={{ display: 'flex', gap: 1.25, mb: 1.25, alignItems: 'flex-start' }}>
                      <CheckRoundedIcon sx={{ color: cv.brandOrchid, fontSize: 20, mt: '2px' }} aria-hidden />
                      <Typography sx={{ color: cv.textPrimary, lineHeight: 1.5 }}>{item}</Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>

        {plansEnabled && plans.length > 0 ? (
          <Box component="section" id="plans" aria-labelledby="plans-title" data-reveal sx={{ ...sectionPad, background: cv.surface, scrollMarginTop: '104px' }}>
            <Box sx={{ maxWidth: MAX, mx: 'auto' }}>
              <Typography
                id="plans-title"
                component="h2"
                sx={{ fontFamily: DISPLAY_FONT, fontSize: { xs: '2rem', md: '3rem' }, fontWeight: 600, letterSpacing: '-0.03em' }}
              >
                Plans that grow with the library
              </Typography>
              <Typography sx={{ color: cv.textSecondary, mt: 1.25, mb: 3, maxWidth: 560 }}>
                Start free, add storage and seats as the team does, or talk to us when you need SSO depth and a dedicated path.
              </Typography>
              <Box
                role="group"
                aria-label="Billing cycle"
                sx={{
                  display: 'inline-flex',
                  p: 0.5,
                  mb: 4,
                  borderRadius: '999px',
                  border: `1px solid ${cv.border}`,
                  background: cv.bg,
                }}
              >
                {(['monthly', 'annual'] as const).map((cycle) => (
                  <Button
                    key={cycle}
                    onClick={() => setBillingCycle(cycle)}
                    aria-pressed={billingCycle === cycle}
                    sx={{
                      minHeight: 40,
                      px: 2,
                      borderRadius: '999px',
                      color: billingCycle === cycle ? cv.textOnCta : cv.textSecondary,
                      background: billingCycle === cycle ? cv.brandGradient : 'transparent',
                      fontWeight: 600,
                      transition: `background 0.28s ${EASE}, color 0.28s ${EASE}`,
                      '&:hover': { background: billingCycle === cycle ? cv.brandGradientHover : cv.surfaceHover },
                    }}
                  >
                    {cycle === 'annual' ? 'Annual' : 'Monthly'}
                  </Button>
                ))}
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 2 }}>
                {plans.map((plan) => {
                  const featured = Boolean(plan.isFeatured);
                  return (
                    <Box
                      key={plan.id}
                      sx={{
                        p: 2.5,
                        borderRadius: '20px',
                        border: `1px solid ${featured ? cv.purpleChipBorder : cv.border}`,
                        background: featured ? `linear-gradient(180deg, ${cv.purpleSurfaceHover}, rgba(18,18,18,0.5))` : cv.bg,
                        display: 'flex',
                        flexDirection: 'column',
                        ...cardHoverSx,
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.25 }}>
                        <Typography sx={{ fontWeight: 700, fontSize: '1.125rem' }}>{plan.name}</Typography>
                        {plan.hasAI && (
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0.5,
                              px: 0.85,
                              py: 0.25,
                              borderRadius: '999px',
                              background: `linear-gradient(135deg, ${cv.brandOrchid} 0%, #6366f1 100%)`,
                              color: '#fff',
                            }}
                          >
                            <AutoAwesomeIcon sx={{ fontSize: 14 }} />
                            <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.04em' }}>
                              AI
                            </Typography>
                          </Box>
                        )}
                      </Box>
                      <Typography sx={{ color: cv.textMuted, fontSize: '0.8125rem', mt: 0.5, minHeight: 40 }}>
                        {plan.description}
                      </Typography>
                      <Typography sx={{ fontFamily: DISPLAY_FONT, fontSize: '2.25rem', fontWeight: 600, mt: 1.5 }}>
                        {priceLabel(plan)}
                        {priceLabel(plan) !== 'Free' ? (
                          <Box component="span" sx={{ fontFamily: 'Inter, sans-serif', fontSize: '0.875rem', color: cv.textMuted, ml: 0.5 }}>
                            /mo
                          </Box>
                        ) : null}
                      </Typography>
                      <Box component="ul" sx={{ m: 0, mt: 2, pl: 0, listStyle: 'none', flex: 1 }}>
                        {(() => {
                          const dynamicPoints: string[] = [];
                          if (plan.showProjectQuota && plan.maxProjects !== undefined && plan.maxWorkspaces !== undefined) {
                            dynamicPoints.push(`${plan.maxProjects} Project${plan.maxProjects !== 1 ? 's' : ''} & ${plan.maxWorkspaces} Workspace${plan.maxWorkspaces !== 1 ? 's' : ''}`);
                          }
                          if (plan.showStorageQuota && plan.storageQuotaBytes !== undefined) {
                            dynamicPoints.push(`${formatBytes(plan.storageQuotaBytes)} Storage`);
                          }
                          if (plan.showMemberQuota && plan.maxUsers !== undefined) {
                            dynamicPoints.push(`${plan.maxUsers} Member${plan.maxUsers !== 1 ? 's' : ''}`);
                          }

                          const cleanCustomFeatures = (plan.features || [])
                            .map((feat) => typeof feat === 'string' ? feat : feat.name)
                            .filter((featStr) => {
                              if (!featStr) return false;
                              const low = featStr.toLowerCase();
                              if (low.includes('storage')) return false;
                              if (low.includes('workspace') || low.includes('project')) return false;
                              if (low.includes('member') || low.includes('user')) return false;
                              return true;
                            });

                          const allFeatures = [...dynamicPoints, ...cleanCustomFeatures].slice(0, 6);

                          return allFeatures.map((label) => (
                            <Box key={label} sx={{ display: 'flex', gap: 1, mb: 0.85, alignItems: 'flex-start' }}>
                              <CheckRoundedIcon sx={{ fontSize: 16, color: cv.brandOrchid, mt: '2px' }} aria-hidden />
                              <Typography sx={{ fontSize: '0.8125rem', color: cv.textSecondary, lineHeight: 1.4 }}>{label}</Typography>
                            </Box>
                          ));
                        })()}
                      </Box>
                      <Button
                        onClick={() => handlePlanCta(plan)}
                        sx={featured ? primaryButtonSx({ mt: 2, width: '100%' }) : ghostButtonSx({ mt: 2, width: '100%' })}
                      >
                        {plan.ctaLabel || (featured ? 'Start free trial' : 'Choose plan')}
                      </Button>
                    </Box>
                  );
                })}
              </Box>
            </Box>
          </Box>
        ) : null}

        <Box component="section" aria-labelledby="final-cta-title" data-reveal sx={{ ...sectionPad, pt: { xs: 4, md: 6 } }}>
          <Box
            sx={{
              maxWidth: MAX,
              mx: 'auto',
              borderRadius: { xs: '24px', md: '32px' },
              p: { xs: 3.5, md: 8 },
              textAlign: 'center',
              border: `1px solid ${cv.purpleChipBorder}`,
              background:
                'radial-gradient(ellipse at top, rgba(142,68,173,0.28), transparent 55%), linear-gradient(180deg, rgba(28,28,28,0.9), rgba(18,18,18,0.95))',
              transition: `transform 0.5s ${EASE}, box-shadow 0.5s ${EASE}`,
              '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 24px 60px rgba(0,0,0,0.35)' },
            }}
          >
            <Typography
              id="final-cta-title"
              component="h2"
              sx={{ fontFamily: DISPLAY_FONT, fontSize: { xs: '2rem', md: '3.15rem' }, fontWeight: 600, letterSpacing: '-0.03em' }}
            >
              Manage, review, and deliver from one place
            </Typography>
            <Typography sx={{ mt: 1.5, color: cv.textSecondary, fontSize: '1.05rem', maxWidth: 560, mx: 'auto' }}>
              Ready to give the team a library that keeps up with the work?
            </Typography>
            <Box sx={{ mt: 3.5, display: 'flex', justifyContent: 'center', gap: 1.5, flexWrap: 'wrap' }}>
              <Button onClick={openTrial} endIcon={<ArrowForwardRoundedIcon />} sx={primaryButtonSx({ px: 3.5 })}>
                Start free trial
              </Button>
              <Button onClick={openDemo} sx={ghostButtonSx({ px: 3.5 })}>
                Book a demo
              </Button>
            </Box>
          </Box>
        </Box>
      </Box>

      <Box
        component="footer"
        role="contentinfo"
        sx={{
          position: 'relative',
          overflow: 'hidden',
          borderTop: `1px solid ${cv.border}`,
          px: { xs: 2.5, sm: 4 },
          pt: 5,
          pb: { xs: 8, md: 20 },
        }}
      >
        <Box
          sx={{
            position: 'relative',
            zIndex: 1,
            maxWidth: MAX,
            mx: 'auto',
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1.4fr 1fr 1fr 1fr' },
            gap: 4,
          }}
        >
          <Box>
            <NoahLogo
              width={{ xs: 200, sm: 200, md: 292 }}
              height={{ xs: 56, sm: 56, md: 72 }}
              boxWidth={{ xs: 200, sm: 200, md: 292 }}
              objectFit="cover"
              animated={false}
              showGlow={false}
              align="left"
              sx={{
                mb: 1.5,
                overflow: 'hidden',
                maxWidth: { xs: 200, sm: 200, md: 'none' },
                '& img': {
                  mixBlendMode: 'lighten',
                  objectPosition: 'center',
                  transform: 'scale(1)',
                  maxWidth: { xs: '200px', sm: '200px', md: 'none' },
                  width: { xs: '100%', sm: '100%', md: '100%' },
                  height: 'auto',
                },
                'html[data-theme="light"] & img': { mixBlendMode: 'normal' },
              }}
            />
            <Typography sx={{ color: cv.textMuted, fontSize: '0.875rem', maxWidth: 280, lineHeight: 1.55 }}>
              NOAH Cloud — enterprise media asset management for teams that review, share, and ship from a single library.
            </Typography>
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 700, mb: 1.25 }}>Product</Typography>
            {activeNavLinks.map((item) => (
              <Link key={item.href} href={item.href} underline="none" sx={{ display: 'block', color: cv.textSecondary, py: 0.6, transition: `color 0.22s ${EASE}`, '&:hover': { color: cv.brandOrchid } }}>
                {item.label}
              </Link>
            ))}
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 700, mb: 1.25 }}>Get started</Typography>
            <Box component="button" onClick={openTrial} sx={footerLinkButtonSx}>
              Start free trial
            </Box>
            <Box component="button" onClick={openDemo} sx={footerLinkButtonSx}>
              Book a demo
            </Box>
            <Link component={RouterLink} to="/login" underline="none" sx={{ display: 'block', color: cv.textSecondary, py: 0.6, transition: `color 0.22s ${EASE}`, '&:hover': { color: cv.brandOrchid } }}>
              Sign in
            </Link>
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 700, mb: 1.25 }}>Platform</Typography>
            <Typography sx={{ color: cv.textSecondary, fontSize: '0.875rem', lineHeight: 1.6 }}>
              Workspaces, projects, annotations, share links, MFA, SSO, and plan-based usage — all in the product you already run.
            </Typography>
          </Box>
        </Box>
        <Typography sx={{ position: 'relative', zIndex: 1, maxWidth: MAX, mx: 'auto', mt: 5, color: cv.textMuted, fontSize: '0.75rem' }}>
          © {new Date().getFullYear()} NOAH Cloud. All rights reserved.
        </Typography>
        <WaveBackground sx={{ position: 'absolute' }} />
      </Box>

      <LandingCtaDialogs open={modal} onClose={() => setModal(null)} />
    </Box>
  );
}

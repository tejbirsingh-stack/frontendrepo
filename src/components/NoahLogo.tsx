import { Link as RouterLink } from 'react-router-dom';
import { Box, Typography, type SxProps, type Theme, keyframes } from '@mui/material';
import { cv } from '../theme/cssVars';
import { useAuth } from '../auth/AuthContext';

const LOGO_SRC = '/noah-logo.png';

/** Parent wrapper for login / signup flow logos — fixed height, no extra vertical padding. */
export const AUTH_LOGO_PARENT_SX = {
  width: '100%',
  height: { xs: 120, sm: 160 },
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  mb: 4,
  overflow: 'hidden',
  background: 'transparent',
} as const;

/**
 * Auth logo — larger mark inside a fixed ~160px-tall crop.
 * `cover` + mild scale clips PNG padding without cutting off “CLOUD”.
 */
export const AUTH_LOGO_SX = {
  mb: 0,
  width: '100%',
    maxWidth: { xs: 320, sm: 400 },
  height: '100%',
  overflow: 'hidden',
  background: 'transparent',
  '& img': {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    objectPosition: 'center',
    transform: 'scale(1.05)',
    transformOrigin: 'center center',
    // Logo asset has an opaque black canvas; lighten makes black transparent on dark UIs.
    mixBlendMode: 'lighten',
  },
  'html[data-theme="light"] & img': {
    mixBlendMode: 'normal',
  },
} as const;

const pulse = keyframes`
  0%, 100% { opacity: 0.5; transform: scale(1); }
  50% { opacity: 0.75; transform: scale(1.05); }
`;

const drift = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
`;

type ResponsiveSize = number | { xs?: number; sm?: number; md?: number; lg?: number };

interface NoahLogoProps {
  /** Scales the logo — maps to rendered height; width follows the asset aspect ratio. */
  width?: ResponsiveSize;
  /** Explicit image / crop-box height in px (overrides height derived from `width`). */
  height?: ResponsiveSize;
  /**
   * When set with an explicit height, sizes the crop box to this width and uses
   * object-fit to fill it (keeps width while cropping excess PNG canvas height).
   */
  boxWidth?: ResponsiveSize;
  /** object-fit for the image inside the sized box. Default: contain when fitContainer, else none. */
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  /** Shrink the logo to fit a narrow parent (e.g. sidebar). */
  fitContainer?: boolean;
  animated?: boolean;
  showGlow?: boolean;
  align?: 'left' | 'center';
  sx?: SxProps<Theme>;
  /** When set, the logo links to this route (e.g. dashboard for signed-in users). */
  to?: string;
  onClick?: () => void;
  ariaLabel?: string;
}

function resolveLogoHeight(width: ResponsiveSize): ResponsiveSize {
  if (typeof width === 'number') {
    return Math.max(24, Math.round(width * 0.42));
  }

  const resolved: { xs?: number; sm?: number; md?: number; lg?: number } = {};
  if (width.xs !== undefined) resolved.xs = Math.max(24, Math.round(width.xs * 0.42));
  if (width.sm !== undefined) resolved.sm = Math.max(24, Math.round(width.sm * 0.42));
  if (width.md !== undefined) resolved.md = Math.max(24, Math.round(width.md * 0.42));
  if (width.lg !== undefined) resolved.lg = Math.max(24, Math.round(width.lg * 0.42));
  return resolved;
}

export default function NoahLogo({
  /** ~171 width resolves to 72px height — matches compact header/sidebar bars. */
  width = 171,
  height,
  boxWidth,
  objectFit,
  fitContainer = false,
  animated = true,
  showGlow = true,
  align = 'center',
  sx,
  to,
  onClick,
  ariaLabel = 'Go to dashboard',
}: NoahLogoProps) {
  const isInteractive = Boolean(to || onClick);
  const logoHeight = height ?? resolveLogoHeight(width);
  const useCropBox = Boolean(boxWidth && height);
  const resolvedObjectFit = objectFit ?? (fitContainer || useCropBox ? 'cover' : undefined);

  const rootSx: SxProps<Theme> = {
    position: 'relative',
    display: fitContainer || useCropBox ? 'flex' : 'inline-flex',
    width: fitContainer ? '100%' : useCropBox ? boxWidth : undefined,
    maxWidth: fitContainer ? '100%' : undefined,
    height: useCropBox ? logoHeight : undefined,
    overflow: useCropBox ? 'hidden' : undefined,
    justifyContent: align === 'left' ? 'flex-start' : 'center',
    alignItems: 'center',
    mb: 4,
    textDecoration: 'none',
    color: 'inherit',
    border: 'none',
    background: 'transparent',
    p: 0,
    ...(isInteractive && {
      cursor: 'pointer',
      borderRadius: '8px',
      '&:focus-visible': {
        outline: `2px solid ${cv.brandBlue}`,
        outlineOffset: 2,
      },
    }),
    ...sx,
  };

  const { orgBranding, user } = useAuth();
  const activeBranding = orgBranding?.branding || orgBranding || user?.organization?.metadata;
  const customLogoUrl = activeBranding?.logoUrl;
  const customAccountName = activeBranding?.accountName || user?.accountName || user?.organization?.name;
  const hasCustomLogo = Boolean(customLogoUrl);

  const logoContent = (
    <Box
      sx={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 1.25,
        maxWidth: '100%',
        maxHeight: 44,
        zIndex: 1,
      }}
    >
      {showGlow && (
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            width: typeof logoHeight === 'number' ? logoHeight * 4 : 140,
            height: typeof logoHeight === 'number' ? logoHeight * 1.2 : 36,
            top: '50%',
            left: align === 'left' ? '35%' : '50%',
            transform: 'translate(-50%, -50%)',
            background: activeBranding?.accentColor || cv.brandGradient,
            filter: 'blur(32px)',
            opacity: 0.25,
            animation: animated ? `${pulse} 6s ease-in-out infinite` : 'none',
            pointerEvents: 'none',
          }}
        />
      )}

      {hasCustomLogo ? (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: 38,
            width: 38,
            minWidth: 38,
            borderRadius: '10px',
            overflow: 'hidden',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.25)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            p: '2px',
            flexShrink: 0,
          }}
        >
          <Box
            component="img"
            src={customLogoUrl}
            alt={customAccountName || "Brand Logo"}
            sx={{
              maxHeight: '100%',
              maxWidth: '100%',
              objectFit: 'contain',
              display: 'block',
            }}
          />
        </Box>
      ) : (
        <Box
          component="img"
          src={LOGO_SRC}
          alt="NOAH CLOUD"
          sx={{
            display: 'block',
            flexShrink: 0,
            position: 'relative',
            animation: animated ? `${drift} 8s ease-in-out infinite` : 'none',
            ...(useCropBox
              ? {
                  width: '100%',
                  height: '100%',
                  objectFit: resolvedObjectFit ?? 'cover',
                  objectPosition: align === 'left' ? 'left center' : 'center',
                }
              : fitContainer
                ? {
                    width: 'auto',
                    maxWidth: '100%',
                    height: 'auto',
                    maxHeight: Math.min(typeof logoHeight === 'number' ? logoHeight : 40, 40),
                    objectFit: 'contain',
                    objectPosition: align === 'left' ? 'left center' : 'center',
                  }
                : {
                    height: Math.min(typeof logoHeight === 'number' ? logoHeight : 40, 40),
                    maxHeight: 40,
                    maxWidth: 160,
                    width: 'auto',
                    verticalAlign: 'middle',
                    objectFit: 'contain',
                  }),
          }}
        />
      )}

      {hasCustomLogo && customAccountName && (
        <Typography
          sx={{
            fontWeight: 700,
            fontSize: '0.975rem',
            letterSpacing: '-0.015em',
            color: '#f8fafc',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: 130,
          }}
        >
          {customAccountName}
        </Typography>
      )}
    </Box>
  );

  if (to) {
    return (
      <Box component={RouterLink} to={to} aria-label={ariaLabel} sx={rootSx}>
        {logoContent}
      </Box>
    );
  }

  if (onClick) {
    return (
      <Box
        component="button"
        type="button"
        onClick={onClick}
        aria-label={ariaLabel}
        sx={rootSx}
      >
        {logoContent}
      </Box>
    );
  }

  return <Box sx={rootSx}>{logoContent}</Box>;
}

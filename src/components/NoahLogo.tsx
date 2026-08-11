import { Link as RouterLink } from 'react-router-dom';
import { Box, type SxProps, type Theme, keyframes } from '@mui/material';
import { cv } from '../theme/cssVars';

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

  const logoContent = (
    <Box
      sx={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        width: fitContainer || useCropBox ? '100%' : undefined,
        height: useCropBox ? '100%' : undefined,
        zIndex: 1,
        overflow: useCropBox ? 'hidden' : undefined,
      }}
    >
      {showGlow && (
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            width: typeof logoHeight === 'number' ? logoHeight * 5 : { xs: 140, sm: 180 },
            height: typeof logoHeight === 'number' ? logoHeight * 1.4 : { xs: 36, sm: 48 },
            top: '50%',
            left: align === 'left' ? '35%' : '50%',
            transform: 'translate(-50%, -50%)',
            background: cv.brandGradient,
            filter: 'blur(40px)',
            opacity: 0.3,
            animation: animated ? `${pulse} 6s ease-in-out infinite` : 'none',
            pointerEvents: 'none',
          }}
        />
      )}
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
                  width: '100%',
                  maxWidth: '100%',
                  height: 'auto',
                  maxHeight: logoHeight,
                  objectFit: resolvedObjectFit ?? 'contain',
                  objectPosition: align === 'left' ? 'left center' : 'center',
                }
              : {
                  height: logoHeight,
                  width: 'auto',
                  verticalAlign: 'middle',
                }),
        }}
      />
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

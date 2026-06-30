import { Link as RouterLink } from 'react-router-dom';
import { Box, type SxProps, type Theme, keyframes } from '@mui/material';
import { cv } from '../theme/cssVars';

const LOGO_SRC = '/noah-logo.png';

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
  width = { xs: 160, sm: 200 },
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
  const logoHeight = resolveLogoHeight(width);

  const rootSx: SxProps<Theme> = {
    position: 'relative',
    display: fitContainer ? 'flex' : 'inline-flex',
    width: fitContainer ? '100%' : undefined,
    maxWidth: fitContainer ? '100%' : undefined,
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
        width: fitContainer ? '100%' : undefined,
        zIndex: 1,
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
          ...(fitContainer
            ? {
                width: '100%',
                maxWidth: '100%',
                height: 'auto',
                maxHeight: logoHeight,
                objectFit: 'contain',
                objectPosition: 'left center',
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

import { Box, type BoxProps } from '@mui/material';
import { cv } from '../theme/cssVars';

interface GlassCardProps extends BoxProps {
  glow?: boolean;
}

export default function GlassCard({ children, glow = false, sx, ...props }: GlassCardProps) {
  return (
    <Box
      {...props}
      sx={{
        position: 'relative',
        borderRadius: { xs: '16px', md: '20px' },
        background: cv.glassBackground,
        backdropFilter: 'blur(40px) saturate(180%)',
        WebkitBackdropFilter: 'blur(40px) saturate(180%)',
        border: `1px solid ${cv.border}`,
        boxShadow: glow
          ? `0 0 60px ${cv.blueSelectionSurface}, ${cv.cardShadow}`
          : cv.cardShadow,
        overflow: 'hidden',
        '&::before': glow
          ? {
              content: '""',
              position: 'absolute',
              inset: 0,
              borderRadius: 'inherit',
              padding: '1px',
              background: cv.brandGradient,
              WebkitMask: `linear-gradient(${cv.textInverse} 0 0) content-box, linear-gradient(${cv.textInverse} 0 0)`,
              WebkitMaskComposite: 'xor',
              maskComposite: 'exclude',
              opacity: 0.35,
              pointerEvents: 'none',
            }
          : undefined,
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}

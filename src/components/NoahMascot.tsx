import { Box, keyframes, type SxProps, type Theme } from '@mui/material';

export type NoahMascotPose = 'gesture' | 'wave' | 'walk' | 'peek';
export type NoahMascotPreset = 'hero' | 'authCompanion' | 'authBrand' | 'panelPeek';

const MASCOT_SRC: Record<NoahMascotPose, string> = {
  gesture: '/mascots/noah-mascot-gesture.svg',
  wave: '/mascots/noah-mascot-wave.svg',
  walk: '/mascots/noah-mascot-walk.svg',
  peek: '/mascots/noah-mascot-peek.svg',
};

const float = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
`;

/** Dip ~10px into the login card, then rise back up. */
const peekIntoCard = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(10px); }
`;

function presetSx(preset: NoahMascotPreset, side: 'left' | 'right'): SxProps<Theme> {
  if (preset === 'hero') {
    return {
      display: { xs: 'none', md: 'block' },
      position: 'absolute',
      right: 120,
      top: { md: '18%' },
      width: { md: 180, lg: 220 },
      maxWidth: '22vw',
      zIndex: 0,
    };
  }

  if (preset === 'panelPeek') {
    return {
      display: 'block',
      position: 'absolute',
      right: 0,
      bottom: 16,
      width: 110,
      zIndex: 1,
    };
  }

  // authBrand — sits beside the logo in the auth header
  if (preset === 'authBrand') {
    return {
      display: 'block',
      position: 'relative',
      width: 90,
      flexShrink: 0,
      zIndex: 2,
    };
  }

  // authCompanion — fully outside the card, larger, above the glass layer
  return {
    display: { xs: 'none', sm: 'block' },
    position: 'absolute',
    ...(side === 'left'
      ? { left: 'auto', right: 'calc(100% + 20px)' }
      : { right: 'auto', left: 'calc(100% + 20px)' }),
    bottom: { sm: 12, md: 20 },
    width: { sm: 180, md: 220 },
    zIndex: 2,
  };
}

interface NoahMascotProps {
  readonly pose: NoahMascotPose;
  /** Layout preset for default size/position. */
  readonly preset?: NoahMascotPreset;
  /** Side for auth companion (walk on signup sits left). */
  readonly side?: 'left' | 'right';
  readonly animated?: boolean;
  readonly sx?: SxProps<Theme>;
}

export default function NoahMascot({
  pose,
  preset = 'authCompanion',
  side = 'right',
  animated = true,
  sx,
}: NoahMascotProps) {
  const motion = preset === 'authBrand' ? peekIntoCard : float;

  return (
    <Box
      aria-hidden
      sx={[
        presetSx(preset, side),
        {
          pointerEvents: 'none',
          userSelect: 'none',
          lineHeight: 0,
          animation: animated ? `${motion} 7s ease-in-out infinite` : 'none',
        },
        ...normalizeSx(sx),
      ]}
    >
      <Box
        component="img"
        src={MASCOT_SRC[pose]}
        alt=""
        sx={{
          display: 'block',
          width: '100%',
          height: 'auto',
          objectFit: 'contain',
        }}
      />
    </Box>
  );
}

function normalizeSx(sx: SxProps<Theme> | undefined): SxProps<Theme>[] {
  if (!sx) return [];
  return Array.isArray(sx) ? (sx as SxProps<Theme>[]) : [sx];
}

import { Box, keyframes } from '@mui/material';
import { cv } from '../theme/cssVars';

const float1 = keyframes`
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(30px, -40px) scale(1.05); }
  66% { transform: translate(-20px, 20px) scale(0.95); }
`;

const float2 = keyframes`
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(-40px, 30px) scale(1.08); }
  66% { transform: translate(25px, -25px) scale(0.92); }
`;

const float3 = keyframes`
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(20px, 35px) scale(1.03); }
`;

const blobBase = {
  position: 'absolute',
  borderRadius: '50%',
  filter: 'blur(80px)',
  opacity: 0.45,
  pointerEvents: 'none',
} as const;

export default function LiquidBackground() {
  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        overflow: 'hidden',
        zIndex: 0,
        background: cv.bg,
      }}
    >
      <Box
        sx={{
          ...blobBase,
          width: { xs: 320, md: 520 },
          height: { xs: 320, md: 520 },
          top: { xs: '-10%', md: '-5%' },
          left: { xs: '-15%', md: '-8%' },
          background: cv.liquidBlueOrb,
          animation: `${float1} 18s ease-in-out infinite`,
        }}
      />
      <Box
        sx={{
          ...blobBase,
          width: { xs: 280, md: 480 },
          height: { xs: 280, md: 480 },
          bottom: { xs: '-5%', md: '10%' },
          right: { xs: '-10%', md: '5%' },
          background: cv.liquidPurpleOrb,
          animation: `${float2} 22s ease-in-out infinite`,
        }}
      />
      <Box
        sx={{
          ...blobBase,
          width: { xs: 200, md: 360 },
          height: { xs: 200, md: 360 },
          top: '40%',
          left: '50%',
          transform: 'translateX(-50%)',
          background: cv.liquidIndigoOrb,
          animation: `${float3} 15s ease-in-out infinite`,
          opacity: 0.3,
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background: cv.liquidFloorGlow,
          pointerEvents: 'none',
        }}
      />
    </Box>
  );
}

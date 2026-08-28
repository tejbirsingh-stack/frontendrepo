import { Box, keyframes } from '@mui/material';
import useUserActivity from '../hooks/useUserActivity';

const walkBob = keyframes`
  0%, 100% { transform: translateY(0) rotate(0deg); }
  25% { transform: translateY(-3px) rotate(-2deg); }
  50% { transform: translateY(0) rotate(0deg); }
  75% { transform: translateY(-3px) rotate(2deg); }
`;

const pace = keyframes`
  0%, 100% { transform: translateX(0); }
  50% { transform: translateX(-8px); }
`;

interface NoahWalkingMascotProps {
  readonly walking?: boolean;
  readonly idleMs?: number;
  readonly size?: number;
}

/**
 * Noah walk-pose mascot. Bobs while the user is active; freezes when idle.
 * Uses the brand PNG (transparent, legs down).
 */
export default function NoahWalkingMascot({
  walking,
  idleMs = 2500,
  size = 56,
}: NoahWalkingMascotProps) {
  const isActive = useUserActivity(idleMs);
  const isWalking = walking ?? isActive;
  // Walk asset is 186×150 — keep that aspect so legs stay visible and upright.
  const width = size;
  const height = Math.round(size * (150 / 186));

  return (
    <Box
      aria-hidden
      sx={{
        width,
        height,
        lineHeight: 0,
        pointerEvents: 'none',
        userSelect: 'none',
        flexShrink: 0,
        backgroundColor: 'transparent',
        animation: isWalking ? `${pace} 1.6s ease-in-out infinite` : 'none',
      }}
    >
      <Box
        component="img"
        src="/mascots/noah-mascot-walk.png"
        alt=""
        sx={{
          display: 'block',
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          objectPosition: 'center bottom',
          backgroundColor: 'transparent',
          transformOrigin: 'center bottom',
          animation: isWalking ? `${walkBob} 0.7s ease-in-out infinite` : 'none',
        }}
      />
    </Box>
  );
}

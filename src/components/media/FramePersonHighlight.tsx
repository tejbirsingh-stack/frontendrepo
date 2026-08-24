import { Box, Typography } from '@mui/material';
import { cv } from '../../theme/cssVars';
import type { FramePerson } from '../../data/mockFramePeople';

interface FramePersonHighlightProps {
  person: FramePerson;
}

/** Selection box drawn over the frame for a person picked from the AI insights panel. */
export default function FramePersonHighlight({ person }: Readonly<FramePersonHighlightProps>) {
  const { xPercent, yPercent, widthPercent, heightPercent } = person.box;
  const labelBelowBox = yPercent < 10;

  return (
    <Box
      sx={{
        position: 'absolute',
        left: `${xPercent}%`,
        top: `${yPercent}%`,
        width: `${widthPercent}%`,
        height: `${heightPercent}%`,
        zIndex: 4,
        pointerEvents: 'none',
        border: `2px solid ${cv.purpleLight}`,
        borderRadius: '4px',
        boxShadow: cv.focusRingPurple2,
      }}
    >
      <Typography
        role="status"
        sx={{
          position: 'absolute',
          left: 0,
          ...(labelBelowBox ? { top: '100%', mt: 0.5 } : { bottom: '100%', mb: 0.5 }),
          maxWidth: '160px',
          px: 0.75,
          py: 0.25,
          borderRadius: '6px',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          fontSize: '0.6875rem',
          fontWeight: 600,
          lineHeight: 1.4,
          color: cv.white,
          backgroundColor: cv.brandPurple,
        }}
      >
        {person.name}
      </Typography>
    </Box>
  );
}

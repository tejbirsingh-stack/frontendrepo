import { useMemo } from 'react';
import { cv } from '../../theme/cssVars';
import { Avatar, Box } from '@mui/material';
import type { VideoStamp } from '../../types/videoStamps';
import { CURRENT_USER } from '../../constants/currentUser';
import { getStampRotationDeg } from '../../utils/stampStickerStyle';
import StampContent from './StampContent';

interface StampMarkerProps {
  stamp: VideoStamp;
  selected: boolean;
  interactive: boolean;
  onSelect: () => void;
  onPointerDown?: (event: React.PointerEvent<HTMLDivElement>) => void;
}

export default function StampMarker({
  stamp,
  selected,
  interactive,
  onSelect,
  onPointerDown,
}: StampMarkerProps) {
  const rotationDeg = useMemo(() => getStampRotationDeg(stamp.id), [stamp.id]);

  return (
    <Box
      data-video-stamp
      data-stamp-id={stamp.id}
      onPointerDown={(event) => {
        if (!interactive) return;
        event.stopPropagation();
        onSelect();
        onPointerDown?.(event);
      }}
      onClick={(event) => event.stopPropagation()}
      sx={{
        position: 'absolute',
        left: `${stamp.xPercent}%`,
        top: `${stamp.yPercent}%`,
        transform: 'translate(-50%, -50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        pointerEvents: interactive ? 'auto' : 'none',
        cursor: interactive ? 'grab' : 'default',
        '& [data-stamp-name-tag]': {
          opacity: 0,
          visibility: 'hidden',
          pointerEvents: 'none',
          transition: 'opacity 0.15s ease, visibility 0.15s ease',
        },
        '&:hover [data-stamp-name-tag]': {
          opacity: 1,
          visibility: 'visible',
        },
      }}
    >
      <Box
        data-stamp-name-tag
        sx={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          gap: 0.75,
          px: 1,
          py: 0.5,
          mb: 0.75,
          borderRadius: '6px',
          backgroundColor: cv.gray900Ui,
          color: cv.textInverse,
          fontSize: '0.75rem',
          fontWeight: 600,
          lineHeight: 1.2,
          whiteSpace: 'nowrap',
          boxShadow: cv.stampMarkerShadow,
          '&::after': {
            content: '""',
            position: 'absolute',
            left: '50%',
            bottom: -5,
            transform: 'translateX(-50%)',
            width: 0,
            height: 0,
            borderLeft: '6px solid transparent',
            borderRight: '6px solid transparent',
            borderTop: `6px solid ${cv.gray900Ui}`,
          },
        }}
      >
        <Avatar
          src={CURRENT_USER.avatarUrl}
          alt=""
          sx={{
            width: 20,
            height: 20,
            fontSize: '0.625rem',
            fontWeight: 700,
            background: cv.brandGradient,
          }}
        >
          {!CURRENT_USER.avatarUrl ? CURRENT_USER.initials : null}
        </Avatar>
        {CURRENT_USER.name}
      </Box>

      <Box
        data-stamp-sticker
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          lineHeight: 0,
          transform: `rotate(${rotationDeg}deg)`,
          willChange: 'transform',
        }}
      >
        <StampContent
          stampId={stamp.stampId}
          customEmoji={stamp.customEmoji}
          size="canvas"
          selected={selected}
        />
      </Box>
    </Box>
  );
}

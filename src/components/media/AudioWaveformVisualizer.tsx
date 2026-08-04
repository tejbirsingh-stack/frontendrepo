import { useMemo } from 'react';
import { Box, Typography } from '@mui/material';
import AudioFileOutlinedIcon from '@mui/icons-material/AudioFileOutlined';
import { cv } from '../../theme/cssVars';

interface AudioWaveformVisualizerProps {
  isPlaying: boolean;
  audioTitle?: string;
  fileSizeText?: string;
}

const BAR_COUNT = 32;

// Symmetrical height profile for resting state
const BASE_HEIGHTS = [
  25, 35, 50, 40, 65, 80, 60, 90, 100, 85, 70, 95, 60, 45, 75, 85,
  85, 75, 45, 60, 95, 70, 85, 100, 90, 60, 80, 65, 40, 50, 35, 25,
];

export default function AudioWaveformVisualizer({
  isPlaying,
  audioTitle,
  fileSizeText,
}: AudioWaveformVisualizerProps) {
  // Pre-calculate randomized animation delays and durations for natural wave effect
  const barConfigs = useMemo(() => {
    return BASE_HEIGHTS.map((baseHeight, index) => ({
      baseHeight,
      delay: `${(index % 8) * 0.12}s`,
      duration: `${1.1 + (index % 5) * 0.25}s`,
    }));
  }, []);

  return (
    <Box
      sx={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(circle at center, rgba(30, 24, 48, 0.95) 0%, rgba(12, 10, 20, 0.98) 100%)',
        zIndex: 1,
        px: 2,
        userSelect: 'none',
      }}
    >
      {/* Central Ambient Glow */}
      <Box
        sx={{
          position: 'absolute',
          width: 280,
          height: 280,
          borderRadius: '50%',
          background: isPlaying
            ? 'radial-gradient(circle, rgba(168, 85, 247, 0.15) 0%, rgba(12, 10, 20, 0) 70%)'
            : 'radial-gradient(circle, rgba(120, 119, 198, 0.08) 0%, rgba(12, 10, 20, 0) 70%)',
          transition: 'all 0.6s ease',
          pointerEvents: 'none',
        }}
      />

      {/* Glassmorphic Audio Icon Card */}
      <Box
        sx={{
          width: 80,
          height: 80,
          borderRadius: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: isPlaying
            ? '0 12px 32px rgba(168, 85, 247, 0.25)'
            : '0 8px 24px rgba(0, 0, 0, 0.4)',
          mb: 3,
          transition: 'all 0.4s ease',
          animation: isPlaying ? 'pulse-ambient 3s infinite ease-in-out' : 'none',
          '@keyframes pulse-ambient': {
            '0%': { transform: 'scale(1)', boxShadow: '0 12px 32px rgba(168, 85, 247, 0.2)' },
            '50%': { transform: 'scale(1.05)', boxShadow: '0 16px 40px rgba(168, 85, 247, 0.35)' },
            '100%': { transform: 'scale(1)', boxShadow: '0 12px 32px rgba(168, 85, 247, 0.2)' },
          },
        }}
      >
        <AudioFileOutlinedIcon
          sx={{
            fontSize: 40,
            color: isPlaying ? (cv.purpleAccent || '#a855f7') : cv.textSecondary,
            transition: 'color 0.4s ease',
          }}
        />
      </Box>

      {/* 32-Bar Audio Waveform Container */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '4px',
          height: 90,
          width: '100%',
          maxWidth: 420,
          px: 2,
          py: 1,
          mb: 3,
          borderRadius: '16px',
          backgroundColor: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          backdropFilter: 'blur(8px)',
        }}
      >
        {barConfigs.map((config, index) => (
          <Box
            key={index}
            sx={{
              width: '6px',
              height: `${config.baseHeight}%`,
              borderRadius: '3px',
              background: isPlaying
                ? 'linear-gradient(180deg, #c084fc 0%, #a855f7 50%, #6366f1 100%)'
                : 'linear-gradient(180deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.12) 100%)',
              boxShadow: isPlaying ? '0 0 8px rgba(168, 85, 247, 0.4)' : 'none',
              transition: isPlaying ? 'none' : 'all 0.5s ease',
              animation: isPlaying
                ? `audioWaveform ${config.duration} infinite ease-in-out alternate`
                : 'none',
              animationDelay: config.delay,
              '@keyframes audioWaveform': {
                '0%': { height: `${Math.max(15, config.baseHeight * 0.3)}%` },
                '100%': { height: `${Math.min(100, config.baseHeight * 1.15)}%` },
              },
            }}
          />
        ))}
      </Box>

      {/* Audio Details Title & Subtitle */}
      {audioTitle && (
        <Typography
          variant="h6"
          sx={{
            color: cv.textPrimary,
            fontWeight: 600,
            fontSize: '1.0625rem',
            textAlign: 'center',
            mb: 0.5,
            maxWidth: 400,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {audioTitle}
        </Typography>
      )}

      <Typography
        variant="body2"
        sx={{
          color: cv.textMuted,
          fontSize: '0.8125rem',
          fontWeight: 500,
          textAlign: 'center',
        }}
      >
        Audio Asset • {fileSizeText || 'Unknown Size'}
      </Typography>
    </Box>
  );
}

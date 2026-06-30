import { useCallback, useEffect, useState, type RefObject } from 'react';
import { cv } from '../../theme/cssVars';
import {
  Box,
  IconButton,
  Menu,
  MenuItem,
  Slider,
  Typography,
} from '@mui/material';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import Forward5OutlinedIcon from '@mui/icons-material/Forward5Outlined';
import FullscreenExitOutlinedIcon from '@mui/icons-material/FullscreenExitOutlined';
import FullscreenOutlinedIcon from '@mui/icons-material/FullscreenOutlined';
import KeyboardArrowDownOutlinedIcon from '@mui/icons-material/KeyboardArrowDownOutlined';
import PauseOutlinedIcon from '@mui/icons-material/PauseOutlined';
import PlayArrowOutlinedIcon from '@mui/icons-material/PlayArrowOutlined';
import Replay5OutlinedIcon from '@mui/icons-material/Replay5Outlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VolumeOffOutlinedIcon from '@mui/icons-material/VolumeOffOutlined';
import VolumeUpOutlinedIcon from '@mui/icons-material/VolumeUpOutlined';
import AnnotationTimeline from './AnnotationTimeline';
import ShortcutTooltip from './ShortcutTooltip';
import type { TimelineAnnotationItem, TimelineAnnotationType } from '../../types/annotationTimeline';

const PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5, 2];
const SKIP_SECONDS = 5;

const controlButtonSx = {
  width: 36,
  height: 36,
  color: cv.textPrimary,
  '&:hover': {
    backgroundColor: cv.surfaceHover,
  },
};

const sliderSx = {
  color: cv.brandBlue,
  height: 6,
  padding: '10px 0 !important',
  '& .MuiSlider-rail': {
    opacity: 0.25,
    backgroundColor: cv.textSecondary,
  },
  '& .MuiSlider-track': {
    border: 'none',
  },
  '& .MuiSlider-thumb': {
    width: 14,
    height: 14,
    backgroundColor: cv.textPrimary,
    '&:hover, &.Mui-focusVisible': {
      boxShadow: cv.focusRingBlue,
    },
  },
};

interface VideoPlayerControlsProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  fullscreenTargetRef: RefObject<HTMLElement | null>;
  onClose?: () => void;
  annotationCount?: number;
  annotationsVisible?: boolean;
  onToggleAnnotationsVisible?: () => void;
  timelineItems?: TimelineAnnotationItem[];
  onAnnotationRangeChange?: (
    id: string,
    type: TimelineAnnotationType,
    startTime: number,
    endTime: number,
  ) => void;
  timelineFallbackDuration?: number;
}

export default function VideoPlayerControls({
  videoRef,
  fullscreenTargetRef,
  onClose,
  annotationCount,
  annotationsVisible = true,
  onToggleAnnotationsVisible,
  timelineItems = [],
  onAnnotationRangeChange,
  timelineFallbackDuration,
}: VideoPlayerControlsProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [speedAnchor, setSpeedAnchor] = useState<HTMLElement | null>(null);
  const [isScrubbing, setIsScrubbing] = useState(false);

  const syncFromVideo = useCallback(() => {
    const element = videoRef.current;
    if (!element) return;

    setIsPlaying(!element.paused && !element.ended);
    setCurrentTime(element.currentTime);
    setDuration(Number.isFinite(element.duration) ? element.duration : 0);
    setVolume(element.volume);
    setPlaybackRate(element.playbackRate);
  }, [videoRef]);

  useEffect(() => {
    const element = videoRef.current;
    if (!element) return;

    const handleTimeUpdate = () => {
      if (!isScrubbing) {
        setCurrentTime(element.currentTime);
      }
      setIsPlaying(!element.paused && !element.ended);
    };

    const events: Array<keyof HTMLMediaElementEventMap> = [
      'play',
      'pause',
      'ended',
      'volumechange',
      'ratechange',
      'loadedmetadata',
      'durationchange',
      'loadeddata',
      'canplay',
    ];

    events.forEach((event) => element.addEventListener(event, syncFromVideo));
    element.addEventListener('timeupdate', handleTimeUpdate);

    syncFromVideo();

    return () => {
      events.forEach((event) => element.removeEventListener(event, syncFromVideo));
      element.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [videoRef, isScrubbing, syncFromVideo]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const togglePlay = () => {
    const element = videoRef.current;
    if (!element) return;

    if (element.paused || element.ended) {
      void element.play().catch(() => undefined);
    } else {
      element.pause();
    }
  };

  const seekBy = (delta: number) => {
    const element = videoRef.current;
    if (!element) return;

    const max = Number.isFinite(element.duration) ? element.duration : 0;
    element.currentTime = Math.min(max, Math.max(0, element.currentTime + delta));
    setCurrentTime(element.currentTime);
  };

  const seekTo = useCallback((nextTime: number) => {
    const element = videoRef.current;
    if (!element) return;

    element.currentTime = nextTime;
    setCurrentTime(nextTime);
  }, [videoRef]);

  const handleVolumeChange = (_event: Event, value: number | number[]) => {
    const element = videoRef.current;
    if (!element) return;

    const nextVolume = Array.isArray(value) ? value[0] : value;
    element.volume = nextVolume;
    element.muted = nextVolume === 0;
    setVolume(nextVolume);
  };

  const handlePlaybackRate = (rate: number) => {
    const element = videoRef.current;
    if (!element) return;

    element.playbackRate = rate;
    setPlaybackRate(rate);
    setSpeedAnchor(null);
  };

  const toggleFullscreen = async () => {
    const target = fullscreenTargetRef.current;
    if (!target) return;

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await target.requestFullscreen();
      }
    } catch {
      // Fullscreen may be blocked by the browser.
    }
  };

  const toggleMute = () => {
    const element = videoRef.current;
    if (!element) return;

    if (element.volume > 0) {
      element.volume = 0;
      element.muted = true;
      setVolume(0);
    } else {
      element.volume = 1;
      element.muted = false;
      setVolume(1);
    }
  };

  const showAnnotationMeta =
    annotationCount !== undefined && Boolean(onToggleAnnotationsVisible);

  return (
    <Box
      sx={{
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box
        role="group"
        aria-label="Video player controls"
        onClick={(event) => event.stopPropagation()}
        onMouseDown={(event) => event.stopPropagation()}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: { xs: 0.75, md: 1.25 },
          px: { xs: 1.25, md: 2 },
          py: 1.25,
          borderTop: "1px solid var(--noah-border)",
          backgroundColor: 'var(--noah-popover-surface-deep)',
        }}
      >
      <ShortcutTooltip label={isPlaying ? 'Pause' : 'Play'} placement="top">
        <span>
          <IconButton type="button" aria-label={isPlaying ? 'Pause' : 'Play'} onClick={togglePlay} sx={controlButtonSx}>
            {isPlaying ? (
              <PauseOutlinedIcon sx={{ fontSize: 22 }} />
            ) : (
              <PlayArrowOutlinedIcon sx={{ fontSize: 24 }} />
            )}
          </IconButton>
        </span>
      </ShortcutTooltip>

      <ShortcutTooltip label={`Rewind ${SKIP_SECONDS} seconds`} placement="top">
        <span>
          <IconButton
            type="button"
            aria-label={`Rewind ${SKIP_SECONDS} seconds`}
            onClick={() => seekBy(-SKIP_SECONDS)}
            sx={controlButtonSx}
          >
            <Replay5OutlinedIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </span>
      </ShortcutTooltip>

      <ShortcutTooltip label={`Forward ${SKIP_SECONDS} seconds`} placement="top">
        <span>
          <IconButton
            type="button"
            aria-label={`Forward ${SKIP_SECONDS} seconds`}
            onClick={() => seekBy(SKIP_SECONDS)}
            sx={controlButtonSx}
          >
            <Forward5OutlinedIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </span>
      </ShortcutTooltip>

      <ShortcutTooltip label={volume === 0 ? 'Unmute' : 'Mute'} placement="top">
        <span>
          <IconButton
            type="button"
            aria-label={volume === 0 ? 'Unmute' : 'Mute'}
            onClick={toggleMute}
            sx={{ ...controlButtonSx, display: { xs: 'none', sm: 'inline-flex' } }}
          >
            {volume === 0 ? (
              <VolumeOffOutlinedIcon sx={{ fontSize: 20 }} />
            ) : (
              <VolumeUpOutlinedIcon sx={{ fontSize: 20 }} />
            )}
          </IconButton>
        </span>
      </ShortcutTooltip>

      <Slider
        aria-label="Volume"
        min={0}
        max={1}
        step={0.05}
        value={volume}
        onChange={handleVolumeChange}
        sx={{
          ...sliderSx,
          width: { xs: 0, sm: 72, md: 88 },
          display: { xs: 'none', sm: 'block' },
        }}
      />

      <Box sx={{ flex: 1, minWidth: 8 }} />

      {showAnnotationMeta ? (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            flexShrink: 0,
            minWidth: 0,
            mr: 0.5,
          }}
        >
          <Typography
            variant="caption"
            noWrap
            sx={{
              display: { xs: 'none', sm: 'block' },
              color: cv.textMuted,
            }}
          >
            {annotationCount} annotation{annotationCount === 1 ? '' : 's'} recorded
          </Typography>
          <ShortcutTooltip
            label={annotationsVisible ? 'Hide annotations' : 'Show annotations'}
            placement="top"
          >
            <span>
              <IconButton
                size="small"
                aria-label={annotationsVisible ? 'Hide annotations' : 'Show annotations'}
                aria-pressed={annotationsVisible}
                onClick={onToggleAnnotationsVisible}
                sx={{
                  width: 28,
                  height: 28,
                  color: annotationsVisible ? cv.textSecondary : cv.textMuted,
                  '&:hover': {
                    color: cv.textPrimary,
                    backgroundColor: cv.insetHighlight,
                  },
                }}
              >
                {annotationsVisible ? (
                  <VisibilityOutlinedIcon sx={{ fontSize: 18 }} />
                ) : (
                  <VisibilityOffOutlinedIcon sx={{ fontSize: 18 }} />
                )}
              </IconButton>
            </span>
          </ShortcutTooltip>
        </Box>
      ) : null}

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          flexShrink: 0,
        }}
      >
        <ShortcutTooltip label="Playback speed" placement="top">
          <Box
            component="button"
            type="button"
            aria-label="Playback speed"
            aria-haspopup="menu"
            onClick={(event) => setSpeedAnchor(event.currentTarget)}
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.25,
              border: 'none',
              background: 'transparent',
              color: cv.textPrimary,
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
              px: 0.75,
              py: 0.5,
              borderRadius: '8px',
              '&:hover': {
                backgroundColor: cv.surfaceHover,
              },
            }}
          >
            {playbackRate === 1 ? '1x' : `${playbackRate}x`}
            <KeyboardArrowDownOutlinedIcon sx={{ fontSize: 18, color: cv.textSecondary }} />
          </Box>
        </ShortcutTooltip>

        <Menu
          anchorEl={speedAnchor}
          open={Boolean(speedAnchor)}
          onClose={() => setSpeedAnchor(null)}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          transformOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          slotProps={{
            paper: {
              sx: {
                mt: -0.5,
                minWidth: 88,
                borderRadius: '12px',
                border: "1px solid var(--noah-border)",
                background: 'var(--noah-dialog-surface-strong)',
              },
            },
          }}
        >
          {PLAYBACK_RATES.map((rate) => (
            <MenuItem
              key={rate}
              selected={rate === playbackRate}
              onClick={() => handlePlaybackRate(rate)}
              sx={{
                fontSize: '0.875rem',
                color: cv.textPrimary,
                '&.Mui-selected': {
                  backgroundColor: cv.purpleSelectionHover,
                },
              }}
            >
              {rate}x
            </MenuItem>
          ))}
        </Menu>
      </Box>

      <ShortcutTooltip
        label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
        placement="top"
      >
        <span>
          <IconButton
            type="button"
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            onClick={() => void toggleFullscreen()}
            sx={controlButtonSx}
          >
            {isFullscreen ? (
              <FullscreenExitOutlinedIcon sx={{ fontSize: 20 }} />
            ) : (
              <FullscreenOutlinedIcon sx={{ fontSize: 20 }} />
            )}
          </IconButton>
        </span>
      </ShortcutTooltip>

      {onClose && (
        <ShortcutTooltip label="Close player controls" placement="top">
          <span>
            <IconButton type="button" aria-label="Close player controls" onClick={onClose} sx={controlButtonSx}>
              <CloseOutlinedIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </span>
        </ShortcutTooltip>
      )}
      </Box>

      <AnnotationTimeline
        duration={duration}
        currentTime={currentTime}
        items={timelineItems}
        onSeek={seekTo}
        onRangeChange={onAnnotationRangeChange}
        onScrubStart={() => setIsScrubbing(true)}
        onScrubEnd={() => setIsScrubbing(false)}
        fallbackDuration={timelineFallbackDuration}
      />
    </Box>
  );
}

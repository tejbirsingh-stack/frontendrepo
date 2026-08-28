import { useCallback, useEffect, useRef, useState } from 'react';
import { cv } from '../../theme/cssVars';
import { thumbnailOverlayChipStyles } from '../../utils/thumbnailOverlayStyles';
import { Box, Typography } from '@mui/material';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import VideocamOutlinedIcon from '@mui/icons-material/VideocamOutlined';
import CircularProgress from '@mui/material/CircularProgress';

const PREVIEW_DURATION_SEC = 5;

interface VideoHoverPreviewProps {
  videoSrc?: string;
  thumbnail?: string;
  title: string;
  duration?: string;
  showPlayOverlay?: boolean;
  accent?: string;
  isProcessing?: boolean;
  progress?: string;
}

export default function VideoHoverPreview({
  videoSrc,
  thumbnail,
  title,
  duration,
  showPlayOverlay = true,
  accent = cv.blueAccentSurface,
  isProcessing = false,
  progress,
}: VideoHoverPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [shouldLoadVideo, setShouldLoadVideo] = useState(false);
  const [thumbnailError, setThumbnailError] = useState(false);
  const [thumbnailLoaded, setThumbnailLoaded] = useState(false);

  const stopPreview = useCallback(() => {
    const video = videoRef.current;
    if (video) {
      video.pause();
      video.currentTime = 0;
    }
    setIsPreviewing(false);
  }, []);

  const handleMouseEnter = () => {
    if (!videoSrc || isProcessing) return;
    setShouldLoadVideo(true);
    setIsHovering(true);
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    stopPreview();
  };

  useEffect(() => {
    if (!isHovering || !videoSrc || !shouldLoadVideo) return;

    const video = videoRef.current;
    if (!video) return;
    const playPromise = video.play();

    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setIsPreviewing(true);
        })
        .catch(() => {
          setIsPreviewing(false);
        });
    }

    const timer = setTimeout(() => {
      stopPreview();
    }, PREVIEW_DURATION_SEC * 1000);

    return () => {
      clearTimeout(timer);
    };
  }, [isHovering, shouldLoadVideo, videoSrc, stopPreview]);

  useEffect(() => {
    if (!isHovering) stopPreview();
  }, [isHovering, stopPreview]);

  return (
    <Box
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      aria-label={`${title} video. Hover to preview the first ${PREVIEW_DURATION_SEC} seconds.`}
      sx={{ position: 'relative', width: '100%', height: '100%' }}
    >
      {thumbnail && !thumbnailError ? (
        <>
          {!thumbnailLoaded && (
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: `linear-gradient(160deg, ${accent} 0%, ${cv.surfaceSubtle} 100%)`,
                zIndex: 1,
              }}
            >
              <CircularProgress size={24} sx={{ color: cv.textMuted }} />
            </Box>
          )}
          <Box
            component="img"
            src={thumbnail}
            alt=""
            loading="lazy"
            onLoad={() => setThumbnailLoaded(true)}
            onError={() => setThumbnailError(true)}
            sx={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
              opacity: thumbnailLoaded ? (isPreviewing ? 0 : 1) : 0,
              transition: 'opacity 0.2s ease',
            }}
          />
        </>
      ) : videoSrc ? (
        <Box
          component="video"
          src={`${videoSrc}#t=0.1`}
          preload="metadata"
          muted
          playsInline
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
            opacity: isPreviewing ? 0 : 1,
            transition: 'opacity 0.2s ease',
          }}
        />
      ) : (
        <Box
          sx={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: `linear-gradient(160deg, ${accent} 0%, ${cv.surfaceSubtle} 100%)`,
            opacity: isPreviewing ? 0 : 1,
            transition: 'opacity 0.2s ease',
          }}
        >
          <VideocamOutlinedIcon sx={{ fontSize: 48, color: cv.brandBlue, opacity: 0.85 }} />
        </Box>
      )}

      {videoSrc && shouldLoadVideo ? (
        <Box
          component="video"
          ref={videoRef}
          src={videoSrc}
          poster={thumbnail}
          muted
          playsInline
          preload="metadata"
          aria-hidden
          sx={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
            opacity: isPreviewing ? 1 : 0,
            transition: 'opacity 0.2s ease',
            pointerEvents: 'none',
          }}
        />
      ) : null}

      {showPlayOverlay && !isPreviewing ? (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: isProcessing ? 'rgba(0, 0, 0, 0.5)' : cv.inkOverlay20,
            pointerEvents: 'none',
          }}
        >
          {isProcessing ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
               <Typography variant="caption" sx={{ fontWeight: 600, color: cv.textInverse, background: 'rgba(0,0,0,0.6)', px: 1, py: 0.5, borderRadius: '4px' }}>
                 {progress ? `Processing ${progress}` : 'Processing...'}
               </Typography>
            </Box>
          ) : (
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                ...thumbnailOverlayChipStyles,
              }}
            >
              <PlayArrowRoundedIcon sx={{ fontSize: 28, color: cv.textInverse }} />
            </Box>
          )}
        </Box>
      ) : null}

      {duration ? (
        <Typography
          variant="caption"
          sx={{
            position: 'absolute',
            bottom: 8,
            right: 8,
            px: 0.75,
            py: 0.25,
            borderRadius: '6px',
            ...thumbnailOverlayChipStyles,
            fontSize: '0.75rem',
            fontWeight: 500,
            color: cv.textInverse,
            pointerEvents: 'none',
          }}
        >
          {duration}
        </Typography>
      ) : null}
    </Box>
  );
}

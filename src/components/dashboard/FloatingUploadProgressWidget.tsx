import { useState, useEffect, useId } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Box,
  Card,
  CircularProgress,
  IconButton,
  LinearProgress,
  Typography,
  Collapse,
  Tooltip,
} from '@mui/material';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import KeyboardArrowUpRoundedIcon from '@mui/icons-material/KeyboardArrowUpRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import { useUploadManager } from '../../context/UploadManagerContext';

function formatBytes(bytes: number): string {
  if (bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

/** App homepage (`/home`) shows the full banner; all other routes use a compact FAB. */
function isAppHomePath(pathname: string): boolean {
  return pathname === '/home' || pathname === '/home/';
}

export default function FloatingUploadProgressWidget() {
  const location = useLocation();
  const {
    queue,
    isUploading,
    activeItem,
    totalFiles,
    completedCount,
    batchLoadedBytes,
    batchTotalBytes,
    overallProgressPercent,
    isWidgetVisible,
    isMinimized,
    setIsMinimized,
    dismissWidget,
  } = useUploadManager();

  const isHomePage = isAppHomePath(location.pathname);
  const [isExpanded, setIsExpanded] = useState(isHomePage);
  const [autoHideTimer, setAutoHideTimer] = useState<number | null>(null);
  const glowFilterId = useId().replace(/:/g, '');

  const isAllComplete = totalFiles > 0 && completedCount === totalFiles;
  const hasFailed = queue.some((item) => item.status === 'failed');

  // Sync expansion mode when navigating between home and internal pages
  useEffect(() => {
    setIsExpanded(isHomePage);
    if (isHomePage) {
      setIsMinimized(false);
    }
  }, [isHomePage, setIsMinimized]);

  // Auto hide 4 seconds after all complete
  useEffect(() => {
    if (isAllComplete) {
      const timer = window.setTimeout(() => {
        dismissWidget();
      }, 4000);
      setAutoHideTimer(timer);
      return () => window.clearTimeout(timer);
    }
  }, [isAllComplete, dismissWidget]);

  if (!isWidgetVisible || totalFiles === 0) {
    return null;
  }

  const currentDisplayIndex = activeItem
    ? queue.findIndex((i) => i.id === activeItem.id) + 1
    : completedCount;

  const showBanner = isHomePage || isExpanded;

  const statusIcon = isUploading ? (
    <Box sx={{ position: 'relative', display: 'inline-flex' }}>
      <CircularProgress
        variant="determinate"
        value={overallProgressPercent}
        size={26}
        thickness={4.5}
        sx={{ color: '#818cf8' }}
      />
      <Box
        sx={{
          top: 0,
          left: 0,
          bottom: 0,
          right: 0,
          position: 'absolute',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CloudUploadOutlinedIcon sx={{ fontSize: 13, color: '#a5b4fc' }} />
      </Box>
    </Box>
  ) : isAllComplete ? (
    <CheckCircleOutlineRoundedIcon sx={{ color: '#4ade80', fontSize: 24 }} />
  ) : hasFailed ? (
    <ErrorOutlineRoundedIcon sx={{ color: '#f87171', fontSize: 24 }} />
  ) : (
    <CloudUploadOutlinedIcon sx={{ color: '#818cf8', fontSize: 24 }} />
  );

  // Compact fixed button on internal pages — glowing ring with current/total count
  // Sits above the help FAB (bottom: 24, height: 44) with a 12px gap
  if (!showBanner) {
    const displayCurrent = isAllComplete
      ? totalFiles
      : Math.max(activeItem ? currentDisplayIndex : completedCount, isUploading ? 1 : 0);
    const filesLabel = `${displayCurrent}/${totalFiles}`;
    const progress = Math.min(100, Math.max(0, overallProgressPercent));
    const size = 44;
    const stroke = 2.5;
    const radius = (size - stroke) / 2;
    const circumference = 2 * Math.PI * radius;
    const dashOffset = circumference - (progress / 100) * circumference;
    const endAngleRad = ((progress / 100) * 360 - 90) * (Math.PI / 180);
    const endX = size / 2 + radius * Math.cos(endAngleRad);
    const endY = size / 2 + radius * Math.sin(endAngleRad);
    const startX = size / 2;
    const startY = size / 2 - radius;

    return (
      <Tooltip
        title={
          isAllComplete
            ? 'All files uploaded'
            : isUploading
              ? `Uploading ${filesLabel} · ${overallProgressPercent}%`
              : `Upload queue · ${filesLabel}`
        }
        placement="left"
      >
        <Box
          sx={{
            position: 'fixed',
            bottom: { xs: 68, sm: 80 },
            right: { xs: 16, sm: 24 },
            zIndex: 1400,
            width: size,
            height: size,
            cursor: 'pointer',
          }}
          onClick={() => {
            setIsExpanded(true);
            setIsMinimized(false);
          }}
          role="button"
          aria-label={`Show upload queue, file ${filesLabel}`}
        >
          <Box
            sx={{
              position: 'relative',
              width: size,
              height: size,
              borderRadius: '50%',
              backgroundColor:
                hasFailed && !isUploading
                  ? '#7f1d1d'
                  : isAllComplete
                    ? '#14532d'
                    : '#2f8f8a',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)',
              transition: 'background-color 0.25s ease',
              '&:hover': {
                filter: 'brightness(1.08)',
              },
            }}
          >
            <Box
              component="svg"
              width={size}
              height={size}
              viewBox={`0 0 ${size} ${size}`}
              sx={{
                position: 'absolute',
                inset: 0,
                display: 'block',
                overflow: 'visible',
              }}
            >
              <defs>
                <filter id={glowFilterId} x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="1.6" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="rgba(255, 255, 255, 0.35)"
                strokeWidth={stroke}
              />

              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="rgba(255, 255, 255, 0.95)"
                strokeWidth={stroke + 1.5}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
                filter={`url(#${glowFilterId})`}
                style={{ transition: 'stroke-dashoffset 0.35s ease' }}
              />

              {progress > 0 && (
                <>
                  <circle
                    cx={startX}
                    cy={startY}
                    r={2.5}
                    fill="#fff"
                    filter={`url(#${glowFilterId})`}
                  />
                  <circle
                    cx={endX}
                    cy={endY}
                    r={2.5}
                    fill="#fff"
                    filter={`url(#${glowFilterId})`}
                  />
                </>
              )}
            </Box>

            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none',
              }}
            >
              {isAllComplete ? (
                <CheckCircleOutlineRoundedIcon sx={{ fontSize: 18, color: '#fff' }} />
              ) : hasFailed && !isUploading ? (
                <ErrorOutlineRoundedIcon sx={{ fontSize: 18, color: '#fecaca' }} />
              ) : (
                <Typography
                  component="span"
                  sx={{
                    fontWeight: 300,
                    fontSize: totalFiles > 9 ? '0.6rem' : '0.72rem',
                    color: '#fff',
                    lineHeight: 1,
                    letterSpacing: '0.02em',
                  }}
                >
                  {filesLabel}
                </Typography>
              )}
            </Box>
          </Box>
        </Box>
      </Tooltip>
    );
  }

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: { xs: 16, sm: 24 },
        right: { xs: 16, sm: 24 },
        zIndex: 1400,
        maxWidth: { xs: 'calc(100vw - 32px)', sm: 380 },
        width: '100%',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      <Card
        elevation={12}
        sx={{
          borderRadius: '16px',
          backgroundColor: 'rgba(15, 23, 42, 0.94)',
          backdropFilter: 'blur(16px) saturate(180%)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5), 0 0 20px rgba(99, 102, 241, 0.15)',
          color: '#f8fafc',
          overflow: 'hidden',
        }}
      >
        {/* Header Bar */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 2,
            py: 1.5,
            cursor: 'pointer',
            userSelect: 'none',
            borderBottom: isMinimized ? 'none' : '1px solid rgba(255, 255, 255, 0.08)',
          }}
          onClick={() => {
            if (isHomePage) {
              setIsMinimized((prev) => !prev);
            } else {
              // On internal pages, collapsing header returns to the compact FAB
              setIsExpanded(false);
            }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
            {statusIcon}

            <Box sx={{ minWidth: 0 }}>
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  color: '#f8fafc',
                  lineHeight: 1.2,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {isAllComplete
                  ? 'All files uploaded'
                  : isUploading
                    ? `Uploading (${completedCount}/${totalFiles})`
                    : 'Upload Queue'}
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: '#94a3b8', fontSize: '0.75rem', display: 'block' }}
              >
                {isAllComplete
                  ? `${totalFiles} file${totalFiles > 1 ? 's' : ''} completed`
                  : `${overallProgressPercent}% completed`}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                if (isHomePage) {
                  setIsMinimized((prev) => !prev);
                } else {
                  setIsExpanded(false);
                }
              }}
              sx={{ color: '#94a3b8', '&:hover': { color: '#f8fafc' } }}
            >
              {isHomePage ? (
                isMinimized ? (
                  <KeyboardArrowUpRoundedIcon fontSize="small" />
                ) : (
                  <KeyboardArrowDownRoundedIcon fontSize="small" />
                )
              ) : (
                <KeyboardArrowDownRoundedIcon fontSize="small" />
              )}
            </IconButton>

            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                if (autoHideTimer) window.clearTimeout(autoHideTimer);
                dismissWidget();
              }}
              sx={{ color: '#94a3b8', '&:hover': { color: '#f8fafc' } }}
            >
              <CloseRoundedIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>

        {/* Collapsible Detail Section */}
        <Collapse in={!isMinimized || !isHomePage}>
          <Box sx={{ p: 2, pt: 1.5 }}>
            <Typography
              variant="body2"
              sx={{
                fontSize: '0.8125rem',
                color: '#cbd5e1',
                mb: 1,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {activeItem
                ? `Uploading file ${currentDisplayIndex} of ${totalFiles}: ${activeItem.name}`
                : isAllComplete
                  ? 'Your media files are now available in your workspace.'
                  : 'Processing files...'}
            </Typography>

            <Box sx={{ mb: 1.5 }}>
              <LinearProgress
                variant="determinate"
                value={overallProgressPercent}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 3,
                    background: 'linear-gradient(90deg, #6366f1 0%, #a855f7 100%)',
                  },
                }}
              />
            </Box>

            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.75rem',
                color: '#94a3b8',
              }}
            >
              <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                {batchTotalBytes > 0
                  ? `${formatBytes(batchLoadedBytes)} of ${formatBytes(batchTotalBytes)}`
                  : `${completedCount} of ${totalFiles} completed`}
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#a5b4fc' }}>
                {overallProgressPercent}%
              </Typography>
            </Box>
          </Box>
        </Collapse>
      </Card>
    </Box>
  );
}

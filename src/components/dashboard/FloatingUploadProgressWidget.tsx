import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CircularProgress,
  IconButton,
  LinearProgress,
  Typography,
  Collapse,
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

export default function FloatingUploadProgressWidget() {
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

  const [autoHideTimer, setAutoHideTimer] = useState<number | null>(null);

  const isAllComplete = totalFiles > 0 && completedCount === totalFiles;
  const hasFailed = queue.some((item) => item.status === 'failed');

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
          onClick={() => setIsMinimized((prev) => !prev)}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
            {isUploading ? (
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
            )}

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
                setIsMinimized((prev) => !prev);
              }}
              sx={{ color: '#94a3b8', '&:hover': { color: '#f8fafc' } }}
            >
              {isMinimized ? (
                <KeyboardArrowUpRoundedIcon fontSize="small" />
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
        <Collapse in={!isMinimized}>
          <Box sx={{ p: 2, pt: 1.5 }}>
            {/* Active file description */}
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

            {/* Progress Bar */}
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

            {/* Bytes & Stats footer */}
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

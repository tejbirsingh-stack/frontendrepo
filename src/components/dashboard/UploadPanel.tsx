import { useRef, useState } from 'react';
import { cv } from '../../theme/cssVars';
import { Box, Button, Typography } from '@mui/material';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import toast from 'react-hot-toast';
import { UPLOAD_ACCEPT, getUploadableFiles } from '../../utils/fileMediaType';
import { getUsageSummary } from '../../api/usage.service';

interface UploadPanelProps {
  onUpload: (files: File[]) => number;
}

export default function UploadPanel({ onUpload }: UploadPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const checkStorageBreached = async (): Promise<boolean> => {
    try {
      const summary = await getUsageSummary();
      if (summary.storageWarningLevel === 'exceeded' || summary.storageUsedBytes >= summary.storageQuotaBytes) {
        toast.error('Storage limit reached — Uploads are blocked until you free space or upgrade your plan.');
        return true;
      }
    } catch (err) {}
    return false;
  };

  const processFiles = async (fileList: FileList | File[] | null) => {
    if (!fileList) return;
    const isBreached = await checkStorageBreached();
    if (isBreached) return;

    const uploadable = getUploadableFiles(fileList);
    if (uploadable.length > 0) {
      onUpload(uploadable);
    }
  };

  const handleDragEnter = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer.types.includes('Files')) {
      setIsDragging(true);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = 'copy';
    setIsDragging(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.currentTarget === event.target) {
      setIsDragging(false);
    }
  };

  const handleDrop = async (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    await processFiles(event.dataTransfer.files);
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    void processFiles(event.target.files);
    event.target.value = '';
  };

  const handleBrowseClick = async () => {
    const isBreached = await checkStorageBreached();
    if (!isBreached) {
      inputRef.current?.click();
    }
  };

  return (
    <Box sx={{ px: 1, pb: 1 }}>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={UPLOAD_ACCEPT}
        hidden
        onChange={handleInputChange}
      />

      <Box
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        sx={{
          mx: 0,
          p: 2,
          borderRadius: '12px',
          border: `1px dashed ${
            isDragging ? cv.borderFocus : cv.annotationGuide
          }`,
          backgroundColor: isDragging
            ? cv.blueDragSurface
            : cv.surfaceMuted,
          textAlign: 'center',
          transition: 'all 0.2s ease',
        }}
      >
        <CloudUploadOutlinedIcon
          sx={{
            fontSize: 28,
            color: isDragging ? cv.textPrimary : cv.textMuted,
            mb: 0.75,
          }}
        />
        <Typography
          variant="body2"
          sx={{
            fontSize: '0.8125rem',
            fontWeight: 500,
            color: cv.textPrimary,
            mb: 0.25,
          }}
        >
          Drop files to upload
        </Typography>
        <Typography
          variant="caption"
          sx={{ display: 'block', color: cv.textMuted, mb: 1.25, fontSize: '0.75rem' }}
        >
          Images, video, audio, and documents
        </Typography>
        <Button
          size="small"
          variant="outlined"
          onClick={handleBrowseClick}
          sx={{
            borderRadius: '8px',
            fontSize: '0.75rem',
            textTransform: 'none',
            color: cv.textSecondary,
            borderColor: cv.border,
            '&:hover': {
              borderColor: cv.borderStrong,
              backgroundColor: cv.surfaceHover,
            },
          }}
        >
          Browse files
        </Button>
      </Box>
    </Box>
  );
}

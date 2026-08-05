import { useState } from 'react';
import { Box, Collapse, Typography } from '@mui/material';
import { cv } from '../../theme/cssVars';
import { formatFileSizeCompact } from '../../utils/formatFileSize';
import { formatTechnicalDate } from '../../utils/formatTechnicalDate';

export interface TechnicalExifDetails {
  make?: string;
  model?: string;
  lens?: string;
  exposureTime?: string;
  fNumber?: string;
  iso?: string;
  focalLength?: string;
  dateTimeOriginal?: string;
  resolution?: string;
  orientation?: string;
}

interface TechnicalFileOriginSummaryProps {
  fileSizeBytes: number;
  uploadedBy?: string;
  uploadedAt?: string;
  originallyCreatedAt?: string;
  exif?: TechnicalExifDetails;
  variant?: 'panel' | 'inline';
}

const accentSx = {
  color: cv.pinkAccent,
  fontWeight: 500,
};

export default function TechnicalFileOriginSummary({
  fileSizeBytes,
  uploadedBy,
  uploadedAt,
  originallyCreatedAt,
  exif,
  variant = 'panel',
}: TechnicalFileOriginSummaryProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const hasUploadLine = Boolean(uploadedAt);
  const hasOriginLine = Boolean(originallyCreatedAt);
  const hasCameraExif = Boolean(
    exif &&
      (exif.make ||
        exif.model ||
        exif.lens ||
        exif.exposureTime ||
        exif.fNumber ||
        exif.iso ||
        exif.focalLength ||
        exif.dateTimeOriginal ||
        exif.resolution ||
        exif.orientation),
  );

  if (!hasUploadLine && !hasOriginLine) {
    return null;
  }

  const uploaderLabel = uploadedBy?.trim() || 'Unknown user';

  const exifItems = exif
    ? [
        { label: 'Date taken', value: exif.dateTimeOriginal ? formatTechnicalDate(exif.dateTimeOriginal) : null },
        {
          label: 'Camera',
          value: exif.make || exif.model ? [exif.make, exif.model].filter(Boolean).join(' ') : null,
        },
        { label: 'Lens', value: exif.lens },
        { label: 'Resolution', value: exif.resolution },
        { label: 'Orientation', value: exif.orientation },
        { label: 'Exposure', value: exif.exposureTime },
        { label: 'Aperture', value: exif.fNumber },
        { label: 'ISO', value: exif.iso },
        { label: 'Focal length', value: exif.focalLength },
      ].filter((item) => Boolean(item.value))
    : [];

  return (
    <Box
      sx={{
        px: variant === 'panel' ? 1.5 : 0,
        py: variant === 'panel' ? 1.25 : 0,
        borderBottom: variant === 'panel' ? `1px solid ${cv.dividerSubtle}` : 'none',
        textAlign: variant === 'inline' ? 'center' : 'left',
        maxWidth: '100%',
      }}
    >
      {hasUploadLine ? (
        <Typography
          component="p"
          sx={{
            m: 0,
            fontSize: '0.8125rem',
            lineHeight: 1.55,
            color: cv.textSecondary,
          }}
        >
          <Box component="span" sx={{ color: cv.slateMuted, fontWeight: 500 }}>
            {formatFileSizeCompact(fileSizeBytes)}
          </Box>{' '}
          Uploaded by{' '}
          <Box component="span" sx={accentSx}>
            {uploaderLabel}
          </Box>{' '}
          on{' '}
          <Box component="span" sx={accentSx}>
            {formatTechnicalDate(uploadedAt)}
          </Box>
          {hasCameraExif ? (
            <>
              {' '}
              <Box
                component="button"
                type="button"
                aria-expanded={isExpanded}
                aria-controls="exif-expandable-panel"
                onClick={() => setIsExpanded((prev) => !prev)}
                sx={{
                  m: 0,
                  p: 0,
                  border: 'none',
                  background: 'transparent',
                  font: 'inherit',
                  fontSize: 'inherit',
                  lineHeight: 'inherit',
                  color: cv.purpleAccent || '#a855f7',
                  fontWeight: 600,
                  textDecoration: 'underline',
                  textUnderlineOffset: 3,
                  cursor: 'pointer',
                  transition: 'color 0.15s ease',
                  '&:hover': { color: cv.textPrimary },
                }}
              >
                {isExpanded ? 'Hide EXIF' : 'Show EXIF'}
              </Box>
            </>
          ) : null}
        </Typography>
      ) : null}

      {hasOriginLine ? (
        <Typography
          component="p"
          sx={{
            m: 0,
            mt: hasUploadLine ? 0.25 : 0,
            fontSize: '0.8125rem',
            lineHeight: 1.55,
            color: cv.textSecondary,
          }}
        >
          Originally created on{' '}
          <Box component="span" sx={accentSx}>
            {formatTechnicalDate(originallyCreatedAt)}
          </Box>
        </Typography>
      ) : null}

      {hasCameraExif && (
        <Collapse in={isExpanded} timeout="auto" unmountOnExit id="exif-expandable-panel">
          <Box
            sx={{
              mt: 1,
              p: 1.25,
              borderRadius: '8px',
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
              border: `1px solid ${cv.dividerSubtle}`,
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
              gap: 0.75,
            }}
          >
            {exifItems.map((item) => (
              <Box key={item.label} sx={{ display: 'flex', flexDirection: 'column', gap: 0.2 }}>
                <Typography sx={{ fontSize: '0.7rem', color: cv.textSecondary, fontWeight: 500 }}>
                  {item.label}
                </Typography>
                <Typography sx={{ fontSize: '0.8125rem', color: cv.textPrimary, fontWeight: 600 }}>
                  {item.value}
                </Typography>
              </Box>
            ))}
          </Box>
        </Collapse>
      )}
    </Box>
  );
}

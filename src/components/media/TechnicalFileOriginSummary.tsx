import { Box, Tooltip, Typography } from '@mui/material';
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

function buildExifTooltip(exif: TechnicalExifDetails): string {
  const lines = [
    exif.dateTimeOriginal ? `Date taken: ${formatTechnicalDate(exif.dateTimeOriginal)}` : null,
    exif.make || exif.model
      ? `Camera: ${[exif.make, exif.model].filter(Boolean).join(' ')}`
      : null,
    exif.lens ? `Lens: ${exif.lens}` : null,
    exif.resolution ? `Resolution: ${exif.resolution}` : null,
    exif.orientation ? `Orientation: ${exif.orientation}` : null,
    exif.exposureTime ? `Exposure: ${exif.exposureTime}` : null,
    exif.fNumber ? `Aperture: ${exif.fNumber}` : null,
    exif.iso ? `ISO: ${exif.iso}` : null,
    exif.focalLength ? `Focal length: ${exif.focalLength}` : null,
  ].filter(Boolean);

  return lines.length > 0 ? lines.join('\n') : 'No EXIF metadata available';
}

export default function TechnicalFileOriginSummary({
  fileSizeBytes,
  uploadedBy,
  uploadedAt,
  originallyCreatedAt,
  exif,
  variant = 'panel',
}: TechnicalFileOriginSummaryProps) {
  const hasUploadLine = Boolean(uploadedAt);
  const hasOriginLine = Boolean(originallyCreatedAt);
  const exifTooltip = exif ? buildExifTooltip(exif) : 'No EXIF metadata available';
  const showExif = Boolean(exif && exifTooltip !== 'No EXIF metadata available');

  if (!hasUploadLine && !hasOriginLine) {
    return null;
  }

  const uploaderLabel = uploadedBy?.trim() || 'Unknown user';

  return (
    <Box
      sx={{
        px: variant === 'panel' ? 1.5 : 0,
        py: variant === 'panel' ? 1.25 : 0,
        borderBottom:
          variant === 'panel' ? `1px solid ${cv.dividerSubtle}` : 'none',
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
          {showExif ? (
            <>
              {' '}
              <Tooltip title={<Box sx={{ whiteSpace: 'pre-line' }}>{exifTooltip}</Box>} arrow placement="top">
                <Box
                  component="button"
                  type="button"
                  aria-label="View EXIF metadata"
                  sx={{
                    m: 0,
                    p: 0,
                    border: 'none',
                    background: 'transparent',
                    font: 'inherit',
                    fontSize: 'inherit',
                    lineHeight: 'inherit',
                    color: cv.textMuted,
                    textDecoration: 'underline',
                    textDecorationStyle: 'dashed',
                    textUnderlineOffset: 3,
                    cursor: 'pointer',
                    '&:hover': { color: cv.textSecondary },
                  }}
                >
                  EXIF
                </Box>
              </Tooltip>
            </>
          ) : null}
        </Typography>
      ) : null}

      {hasOriginLine ? (
        <Typography
          component="p"
          sx={{
            m: 0,
            mt: hasUploadLine ? 0.35 : 0,
            fontSize: '0.8125rem',
            lineHeight: 1.55,
            color: cv.textMuted,
          }}
        >
          Originally created on {formatTechnicalDate(originallyCreatedAt)}
        </Typography>
      ) : null}
    </Box>
  );
}

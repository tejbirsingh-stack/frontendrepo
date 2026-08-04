import { useEffect, useState, type ReactNode } from 'react';
import { cv } from '../../theme/cssVars';
import {
  Box,
  Button,
  Chip,
  Typography,
} from '@mui/material';
import {
  LayersOutlined as LayersOutlinedIcon,
  LocalOfferOutlined as LocalOfferOutlinedIcon,
  MovieOutlined as MovieOutlinedIcon,
  FileDownloadOutlined as FileDownloadOutlinedIcon,
} from '@mui/icons-material';
import type { MediaItem } from '../../data/mockMedia';
import { formatFileSize } from '../../utils/formatFileSize';
import { getMediaFileName } from '../../utils/mediaFileName';
import TechnicalFileOriginSummary, {
  type TechnicalExifDetails,
} from './TechnicalFileOriginSummary';
import {
  resolveMediaExifDetails,
  resolveMediaOriginDetails,
} from '../../utils/mediaOriginDetails';
import { findManagedTagByName, getManagedTagChipSx, getTagScopeChipSx } from '../../utils/managedTagStyles';
import { useDashboard } from '../../context/DashboardContext';
import TagTypeaheadInput from './TagTypeaheadInput';
import {
  getResolutionTier,
  calculateMegapixels,
  deriveOrientation,
} from '../../utils/resolutionTier';

export type MediaDetailsSection = 'file' | 'technical' | 'tags';

export interface MediaTechnicalDetails {
  duration?: string;
  width?: number;
  height?: number;
  resolution?: string;
  displayResolution?: string;
  resolutionTier?: string;
  resolution_tier?: string;
  aspectRatio?: string;
  orientation?: string;
  megapixels?: string;
  frameRate?: string;
  containerFormat?: string;
  videoCodec?: string;
  estimatedBitrate?: string;
  hasAudio?: string;
  scanType?: string;
  decodedFrames?: string;
  droppedFrames?: string;
  createdAt?: string;
  storageProvider?: string;
  uploadedBy?: string;
  uploadedAt?: string;
  originallyCreatedAt?: string;
  exif?: TechnicalExifDetails;
  make?: string;
  model?: string;
  lens?: string;
  exposureTime?: string;
  fNumber?: string;
  iso?: string;
  focalLength?: string;
  sampleRate?: string;
  channels?: string;
  artist?: string;
  album?: string;
}

const DETAILS_SECTIONS: { value: MediaDetailsSection; label: string }[] = [
  { value: 'file', label: 'File' },
  { value: 'technical', label: 'Technical' },
  { value: 'tags', label: 'Tags' },
];

interface MediaDetailsPanelProps {
  mediaItem: MediaItem;
  technicalDetails?: MediaTechnicalDetails;
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  activeSection?: MediaDetailsSection;
  onSectionChange?: (section: MediaDetailsSection) => void;
  onDownloadOriginal?: () => void;
  canDownload?: boolean;
}

const sectionCardSx = {
  borderRadius: '12px',
  border: "1px solid var(--noah-border)",
  backgroundColor: cv.surfaceMuted,
  overflow: 'hidden',
};

const sectionHeaderSx = {
  display: 'flex',
  alignItems: 'center',
  gap: 1,
  px: 1.5,
  py: 1.25,
  borderBottom: "1px solid var(--noah-border)",
};

const detailRowSx = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: 2,
  px: 1.5,
  py: 1.1,
  '& + &': {
    borderTop: `1px solid ${cv.dividerSubtle}`,
  },
};

function formatValue(value?: string | number | null): string {
  if (value === undefined || value === null) return 'N/A';
  const str = String(value).trim();
  if (!str || str === '—' || str === '-') return 'N/A';
  return str;
}

function DetailRow({
  label,
  value,
  multiline = false,
}: {
  label: string;
  value: string;
  multiline?: boolean;
}) {
  const displayVal = formatValue(value);
  if (multiline) {
    return (
      <Box sx={{ ...detailRowSx, flexDirection: 'column', alignItems: 'stretch' }}>
        <Typography sx={{ fontSize: '0.875rem', color: cv.textSecondary }}>
          {label}
        </Typography>
        <Typography
          sx={{
            mt: 0.5,
            fontSize: '0.875rem',
            color: displayVal === 'N/A' ? cv.textMuted : cv.textPrimary,
            lineHeight: 1.5,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {displayVal}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={detailRowSx}>
      <Typography sx={{ fontSize: '0.875rem', color: cv.textSecondary, flexShrink: 0 }}>
        {label}
      </Typography>
      <Typography
        sx={{
          fontSize: '0.875rem',
          color: displayVal === 'N/A' ? cv.textMuted : cv.textPrimary,
          textAlign: 'right',
          wordBreak: 'break-word',
          fontWeight: displayVal === 'N/A' ? 400 : 500,
        }}
      >
        {displayVal}
      </Typography>
    </Box>
  );
}

function MatrixItem({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  const displayVal = formatValue(value);
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 0.25,
        p: 1.1,
        borderRadius: '8px',
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        border: `1px solid ${cv.dividerSubtle}`,
      }}
    >
      <Typography sx={{ fontSize: '0.75rem', color: cv.textSecondary, fontWeight: 500 }}>
        {label}
      </Typography>
      <Typography
        sx={{
          fontSize: '0.875rem',
          color: displayVal === 'N/A' ? cv.textMuted : cv.textPrimary,
          fontWeight: displayVal === 'N/A' ? 400 : 600,
          wordBreak: 'break-word',
        }}
      >
        {displayVal}
      </Typography>
    </Box>
  );
}

function MatrixGrid({ children }: { children: ReactNode }) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
        gap: 1,
        p: 1.5,
      }}
    >
      {children}
    </Box>
  );
}

function DetailsSection({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <Box sx={sectionCardSx}>
      <Box sx={sectionHeaderSx}>
        <Box sx={{ color: cv.textSecondary, display: 'flex', alignItems: 'center' }}>
          {icon}
        </Box>
        <Typography sx={{ fontSize: '0.9375rem', fontWeight: 600, color: cv.textPrimary }}>
          {title}
        </Typography>
      </Box>
      {children}
    </Box>
  );
}

function formatCreatedAt(value?: string): string {
  if (!value) return 'N/A';
  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return 'N/A';
    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(d);
  } catch {
    return 'N/A';
  }
}

function formatStorageProvider(value?: string): string {
  if (!value) return 'N/A';
  const valLower = value.toLowerCase();
  if (valLower === 'b2' || valLower.includes('backblaze')) return 'B2 Cloud Storage';
  if (valLower.includes('s3') || valLower.includes('cloud')) return 'Cloud Storage';
  if (valLower === 'local') return 'Local Storage';
  return `${value} Storage`;
}

export default function MediaDetailsPanel({
  mediaItem,
  technicalDetails,
  tags,
  onTagsChange,
  activeSection: controlledSection,
  onSectionChange,
  onDownloadOriginal,
  canDownload = true,
}: MediaDetailsPanelProps) {
  const { managedTags, tagScopeColors } = useDashboard();
  const [internalSection, setInternalSection] = useState<MediaDetailsSection>('file');
  const activeSection = controlledSection ?? internalSection;
  const originDetails = resolveMediaOriginDetails(mediaItem, technicalDetails);
  const exifDetails = resolveMediaExifDetails(mediaItem, technicalDetails);

  // Resolution & dimension calculations
  const width = technicalDetails?.width || (technicalDetails as any)?.w;
  const height = technicalDetails?.height || (technicalDetails as any)?.h;
  const resolutionTier =
    (mediaItem as any)?.resolution_tier ||
    (mediaItem as any)?.resolutionTier ||
    technicalDetails?.resolutionTier ||
    technicalDetails?.resolution_tier ||
    getResolutionTier(width, height);
  const megapixels = technicalDetails?.megapixels || calculateMegapixels(width, height);
  const orientation = technicalDetails?.orientation || exifDetails?.orientation || deriveOrientation(width, height);
  const resolution = technicalDetails?.resolution || (width && height ? `${width} × ${height} px` : undefined) || exifDetails?.resolution;
  const displaySize = technicalDetails?.displayResolution || (technicalDetails as any)?.displaySize || resolution;
  const aspectRatio = technicalDetails?.aspectRatio || (width && height ? `${(width / height).toFixed(2)}:1` : undefined);
  const camera = [exifDetails?.make || technicalDetails?.make, exifDetails?.model || technicalDetails?.model].filter(Boolean).join(' ') || undefined;
  const lens = exifDetails?.lens || technicalDetails?.lens;
  const exposure = exifDetails?.exposureTime || technicalDetails?.exposureTime;
  const aperture = exifDetails?.fNumber || technicalDetails?.fNumber;
  const iso = exifDetails?.iso || technicalDetails?.iso;
  const focalLength = exifDetails?.focalLength || technicalDetails?.focalLength;
  const storageLabel = formatStorageProvider(technicalDetails?.storageProvider ?? (technicalDetails as any)?.storage ?? mediaItem.storageProvider);

  useEffect(() => {
    if (controlledSection !== undefined) {
      setInternalSection(controlledSection);
    }
  }, [controlledSection]);

  const handleSectionChange = (section: MediaDetailsSection) => {
    if (onSectionChange) {
      onSectionChange(section);
    } else {
      setInternalSection(section);
    }
  };

  const addTag = (tagName: string) => {
    if (tags.includes(tagName)) return;
    onTagsChange([...tags, tagName]);
  };

  const removeTag = (tag: string) => {
    onTagsChange(tags.filter((current) => current !== tag));
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25, py: 0.5 }}>
      <Box
        role="tablist"
        aria-label="Media details sections"
        sx={{
          display: 'flex',
          gap: 0.5,
          p: 0.5,
          borderRadius: '12px',
          border: "1px solid var(--noah-border)",
          backgroundColor: cv.surface,
        }}
      >
        {DETAILS_SECTIONS.map((section) => {
          const isActive = activeSection === section.value;

          return (
            <Box
              key={section.value}
              component="button"
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => handleSectionChange(section.value)}
              sx={{
                flex: 1,
                border: 'none',
                borderRadius: '8px',
                px: 1,
                py: 0.65,
                fontSize: '0.75rem',
                fontWeight: isActive ? 600 : 500,
                lineHeight: 1.2,
                cursor: 'pointer',
                color: isActive ? cv.textPrimary : cv.textSecondary,
                backgroundColor: isActive ? cv.purpleSelectionHover : 'transparent',
                boxShadow: isActive ? `inset 0 0 0 1px ${cv.purpleSelectionStrong}` : 'none',
                transition: 'background-color 0.15s ease, color 0.15s ease',
                '&:hover': {
                  color: cv.textPrimary,
                  backgroundColor: isActive
                    ? cv.purpleSelectionMedium
                    : cv.glassBackground,
                },
              }}
            >
              {section.label}
            </Box>
          );
        })}
      </Box>

      {activeSection === 'file' && (
        <DetailsSection
          icon={<MovieOutlinedIcon sx={{ fontSize: 18 }} />}
          title="File Information"
        >
          <DetailRow label="Name:" value={mediaItem.title || getMediaFileName(mediaItem)} />
          <DetailRow label="Size:" value={formatFileSize(mediaItem.sizeBytes)} />
          <DetailRow label="Type:" value={mediaItem.type} />
          <DetailRow
            label="Summary:"
            value={mediaItem.summary?.trim() || (mediaItem.customMetadata as any)?.summary || (technicalDetails as any)?.summary}
            multiline
          />
          {canDownload && (
            <Box sx={{ px: 1.5, py: 1.5, borderTop: `1px solid ${cv.dividerSubtle}` }}>
              <Button
                variant="contained"
                fullWidth
                startIcon={<FileDownloadOutlinedIcon />}
                onClick={() => {
                  if (onDownloadOriginal) {
                    onDownloadOriginal();
                  } else if (mediaItem?.id) {
                    const downloadUrl = `/api/media/${encodeURIComponent(mediaItem.id)}/download?raw=true`;
                    const a = document.createElement('a');
                    a.href = downloadUrl;
                    a.download = '';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                  }
                }}
                sx={{
                  py: 1.1,
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  textTransform: 'none',
                  backgroundColor: cv.purpleAccent || '#9333ea',
                  color: '#ffffff',
                  boxShadow: '0 4px 12px rgba(147, 51, 234, 0.25)',
                  '&:hover': {
                    backgroundColor: cv.purpleHover || '#7e22ce',
                    boxShadow: '0 6px 16px rgba(147, 51, 234, 0.35)',
                  },
                }}
              >
                Download Original File
              </Button>
            </Box>
          )}
        </DetailsSection>
      )}

      {activeSection === 'technical' && (
        <DetailsSection
          icon={<LayersOutlinedIcon sx={{ fontSize: 18 }} />}
          title="Technical Details"
        >
          <TechnicalFileOriginSummary
            fileSizeBytes={mediaItem.sizeBytes}
            uploadedBy={originDetails.uploadedBy}
            uploadedAt={originDetails.uploadedAt}
            originallyCreatedAt={originDetails.originallyCreatedAt}
            exif={exifDetails}
          />

          {mediaItem.type === 'image' && (
            <MatrixGrid>
              <MatrixItem label="Resolution Tier" value={resolutionTier} />
              <MatrixItem label="Resolution" value={resolution} />
              <MatrixItem label="Display Size" value={displaySize} />
              <MatrixItem label="Aspect Ratio" value={aspectRatio} />
              <MatrixItem label="Orientation" value={orientation} />
              <MatrixItem label="Megapixels" value={megapixels} />
              <MatrixItem label="Container Format" value={technicalDetails?.containerFormat || (technicalDetails as any)?.container || (technicalDetails as any)?.format || 'JPEG'} />
              <MatrixItem label="Storage Provider" value={storageLabel} />
              <MatrixItem label="Camera" value={camera} />
              <MatrixItem label="Lens" value={lens} />
              <MatrixItem label="Exposure" value={exposure} />
              <MatrixItem label="Aperture" value={aperture} />
              <MatrixItem label="ISO" value={iso} />
              <MatrixItem label="Focal Length" value={focalLength} />
              <MatrixItem label="Uploaded Date" value={formatCreatedAt(originDetails.uploadedAt)} />
              <MatrixItem label="Originally Created" value={formatCreatedAt(technicalDetails?.originallyCreatedAt || (technicalDetails as any)?.originallyCreated || originDetails.originallyCreatedAt)} />
            </MatrixGrid>
          )}

          {mediaItem.type === 'audio' && (
            <MatrixGrid>
              <MatrixItem label="Title" value={(technicalDetails as any)?.title} />
              <MatrixItem label="Artist" value={technicalDetails?.artist || (technicalDetails as any)?.artist} />
              <MatrixItem label="Album" value={technicalDetails?.album || (technicalDetails as any)?.album} />
              <MatrixItem label="Genre" value={(technicalDetails as any)?.genre} />
              <MatrixItem label="Year" value={(technicalDetails as any)?.year} />
              <MatrixItem label="Duration" value={technicalDetails?.duration || mediaItem.duration} />
              <MatrixItem label="Sample Rate" value={technicalDetails?.sampleRate || (technicalDetails as any)?.sampleRate || '44.1 kHz'} />
              <MatrixItem label="Channels" value={technicalDetails?.channels || (technicalDetails as any)?.channels || 'Stereo'} />
              <MatrixItem label="Est. Bitrate" value={technicalDetails?.estimatedBitrate || (technicalDetails as any)?.bitrate} />
              <MatrixItem label="Audio Codec" value={(technicalDetails as any)?.audioCodec} />
              <MatrixItem label="Container Format" value={technicalDetails?.containerFormat || (technicalDetails as any)?.container || 'MP3'} />
              <MatrixItem label="Storage Provider" value={storageLabel} />
              <MatrixItem label="Uploaded Date" value={formatCreatedAt(originDetails.uploadedAt)} />
              <MatrixItem label="Originally Created" value={formatCreatedAt(technicalDetails?.originallyCreatedAt || (technicalDetails as any)?.originallyCreated || originDetails.originallyCreatedAt)} />
            </MatrixGrid>
          )}

          {mediaItem.type !== 'image' && mediaItem.type !== 'audio' && (
            <MatrixGrid>
              <MatrixItem label="Resolution Tier" value={resolutionTier} />
              <MatrixItem label="Resolution" value={resolution} />
              <MatrixItem label="Display Size" value={displaySize} />
              <MatrixItem label="Aspect Ratio" value={aspectRatio} />
              <MatrixItem label="Orientation" value={orientation} />
              <MatrixItem label="Megapixels" value={megapixels} />
              <MatrixItem label="Duration" value={technicalDetails?.duration || mediaItem.duration} />
              <MatrixItem label="Frame Rate" value={technicalDetails?.frameRate || ((technicalDetails as any)?.fps !== undefined ? `${(technicalDetails as any).fps} fps` : undefined)} />
              <MatrixItem label="Scan Type" value={technicalDetails?.scanType || 'Progressive'} />
              <MatrixItem label="Container Format" value={technicalDetails?.containerFormat || (technicalDetails as any)?.container || 'MP4'} />
              <MatrixItem label="Video Codec" value={technicalDetails?.videoCodec || (technicalDetails as any)?.codec || (technicalDetails as any)?.videoCodec || 'H.264 / AAC'} />
              <MatrixItem label="Est. Bitrate" value={technicalDetails?.estimatedBitrate || (technicalDetails as any)?.bitrate} />
              <MatrixItem label="Audio Stream" value={technicalDetails?.hasAudio || ((technicalDetails as any)?.audio !== undefined ? ((technicalDetails as any).audio ? 'Yes' : 'No') : 'Yes')} />
              <MatrixItem label="Storage Provider" value={storageLabel} />
              <MatrixItem label="Decoded Frames" value={technicalDetails?.decodedFrames} />
              <MatrixItem label="Dropped Frames" value={technicalDetails?.droppedFrames} />
              <MatrixItem label="Camera" value={camera} />
              <MatrixItem label="Lens" value={lens} />
              <MatrixItem label="Uploaded Date" value={formatCreatedAt(originDetails.uploadedAt)} />
              <MatrixItem label="Originally Created" value={formatCreatedAt(technicalDetails?.originallyCreatedAt || (technicalDetails as any)?.originallyCreated || originDetails.originallyCreatedAt)} />
            </MatrixGrid>
          )}
        </DetailsSection>
      )}

      {activeSection === 'tags' && (
        <DetailsSection
          icon={<LocalOfferOutlinedIcon sx={{ fontSize: 18 }} />}
          title="Tags"
        >
          <Box sx={{ px: 1.5, py: 1.25 }}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: tags.length > 0 ? 1.25 : 0 }}>
              {tags.length === 0 ? (
                <Typography sx={{ fontSize: '0.875rem', color: cv.textMuted }}>
                  No tags yet
                </Typography>
              ) : (
                tags.map((tag) => {
                  const managedTag = findManagedTagByName(tag, managedTags);
                  const chipSx = managedTag
                    ? getManagedTagChipSx(managedTag, tagScopeColors)
                    : getTagScopeChipSx('personal', tagScopeColors);

                  return (
                    <Chip
                      key={tag}
                      label={tag}
                      size="small"
                      onDelete={() => removeTag(tag)}
                      sx={chipSx}
                    />
                  );
                })
              )}
            </Box>

            <TagTypeaheadInput
              workspaceId={mediaItem.workspaceId}
              appliedTags={tags}
              onAddTag={addTag}
            />
          </Box>
        </DetailsSection>
      )}
    </Box>
  );
}

import { useEffect, useState, type ReactNode } from 'react';
import { cv } from '../../theme/cssVars';
import {
  Box,
  Chip,
  Typography,
} from '@mui/material';
import LayersOutlinedIcon from '@mui/icons-material/LayersOutlined';
import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined';
import MovieOutlinedIcon from '@mui/icons-material/MovieOutlined';
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

export type MediaDetailsSection = 'file' | 'technical' | 'tags';

export interface MediaTechnicalDetails {
  duration?: string;
  width?: number;
  height?: number;
  resolution?: string;
  displayResolution?: string;
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

function DetailRow({
  label,
  value,
  multiline = false,
}: {
  label: string;
  value: string;
  multiline?: boolean;
}) {
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
            color: cv.textPrimary,
            lineHeight: 1.5,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {value}
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
          color: cv.textPrimary,
          textAlign: 'right',
          wordBreak: 'break-word',
        }}
      >
        {value}
      </Typography>
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
  if (!value) return '—';
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
}

function formatStorageProvider(value?: string): string {
  if (!value) return '—';
  if (value === 'b2') return 'B2 Cloud';
  return 'Local';
}

export default function MediaDetailsPanel({
  mediaItem,
  technicalDetails,
  tags,
  onTagsChange,
  activeSection: controlledSection,
  onSectionChange,
}: MediaDetailsPanelProps) {
  const { managedTags, tagScopeColors } = useDashboard();
  const [internalSection, setInternalSection] = useState<MediaDetailsSection>('file');
  const activeSection = controlledSection ?? internalSection;
  const originDetails = resolveMediaOriginDetails(mediaItem, technicalDetails);
  const exifDetails = resolveMediaExifDetails(mediaItem, technicalDetails);

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
          {(mediaItem.type === 'video' || mediaItem.type === 'image') ? (
            <DetailRow
              label="Summary:"
              value={mediaItem.summary?.trim() || (mediaItem.customMetadata as any)?.summary || (technicalDetails as any)?.summary || '—'}
              multiline
            />
          ) : null}
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
          <DetailRow
            label="Duration:"
            value={technicalDetails?.duration || mediaItem.duration || '—'}
          />
          <DetailRow label="Resolution:" value={technicalDetails?.resolution || '—'} />
          <DetailRow
            label="Display size:"
            value={technicalDetails?.displayResolution || (technicalDetails as any)?.displaySize || '—'}
          />
          <DetailRow label="Aspect ratio:" value={technicalDetails?.aspectRatio || '—'} />
          <DetailRow label="Orientation:" value={technicalDetails?.orientation || '—'} />
          <DetailRow label="Megapixels:" value={technicalDetails?.megapixels || '—'} />
          <DetailRow
            label="Frame rate:"
            value={
              technicalDetails?.frameRate ||
              ((technicalDetails as any)?.fps !== undefined
                ? typeof (technicalDetails as any).fps === 'number'
                  ? `${(technicalDetails as any).fps} fps`
                  : String((technicalDetails as any).fps)
                : '—')
            }
          />
          <DetailRow label="Scan type:" value={technicalDetails?.scanType || '—'} />
          <DetailRow
            label="Container:"
            value={technicalDetails?.containerFormat || (technicalDetails as any)?.container || '—'}
          />
          <DetailRow
            label="Video codec:"
            value={technicalDetails?.videoCodec || (technicalDetails as any)?.codec || (technicalDetails as any)?.videoCodec || '—'}
          />
          <DetailRow
            label="Est. bitrate:"
            value={technicalDetails?.estimatedBitrate || (technicalDetails as any)?.bitrate || '—'}
          />
          <DetailRow
            label="Audio:"
            value={
              technicalDetails?.hasAudio ||
              ((technicalDetails as any)?.audio !== undefined
                ? (technicalDetails as any).audio
                  ? 'Yes (assumed)'
                  : 'No'
                : '—')
            }
          />
          {technicalDetails?.sampleRate || (technicalDetails as any)?.sampleRate ? (
            <DetailRow
              label="Sample rate:"
              value={technicalDetails?.sampleRate || (technicalDetails as any)?.sampleRate}
            />
          ) : null}
          {technicalDetails?.channels || (technicalDetails as any)?.channels ? (
            <DetailRow
              label="Channels:"
              value={technicalDetails?.channels || (technicalDetails as any)?.channels}
            />
          ) : null}
          {technicalDetails?.artist || (technicalDetails as any)?.artist ? (
            <DetailRow
              label="Artist:"
              value={technicalDetails?.artist || (technicalDetails as any)?.artist}
            />
          ) : null}
          {technicalDetails?.album || (technicalDetails as any)?.album ? (
            <DetailRow
              label="Album:"
              value={technicalDetails?.album || (technicalDetails as any)?.album}
            />
          ) : null}
          <DetailRow label="Decoded frames:" value={technicalDetails?.decodedFrames || '0'} />
          <DetailRow label="Dropped frames:" value={technicalDetails?.droppedFrames || '0'} />
          <DetailRow
            label="Uploaded:"
            value={formatCreatedAt(originDetails.uploadedAt)}
          />
          <DetailRow
            label="Originally created:"
            value={formatCreatedAt(technicalDetails?.originallyCreatedAt || (technicalDetails as any)?.originallyCreated || originDetails.originallyCreatedAt)}
          />
          <DetailRow
            label="Uploaded by:"
            value={originDetails.uploadedBy}
          />
          <DetailRow
            label="Storage:"
            value={formatStorageProvider(technicalDetails?.storageProvider ?? (technicalDetails as any)?.storage ?? mediaItem.storageProvider)}
          />
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

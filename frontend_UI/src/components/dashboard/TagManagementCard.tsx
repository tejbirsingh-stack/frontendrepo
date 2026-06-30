import { Box, Chip, IconButton, Typography } from '@mui/material';
import { cv } from '../../theme/cssVars';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import WorkspacesOutlinedIcon from '@mui/icons-material/WorkspacesOutlined';
import type { ManagedTag } from '../../types/managedTag';
import TruncatedText from '../TruncatedText';
import { useDashboard } from '../../context/DashboardContext';
import { getTagScopeChipSx } from '../../utils/managedTagStyles';
import { getTagScopeColor } from '../../utils/tagScopeColorsStorage';

interface TagManagementCardProps {
  tag: ManagedTag;
  workspaceName?: string;
  usageCount: number;
  onEdit: () => void;
  onDelete: () => void;
}

const scopeMeta = {
  company: {
    label: 'Company',
    icon: BusinessOutlinedIcon,
    accent: cv.blueAccentMedium,
  },
  personal: {
    label: 'Personal',
    icon: PersonOutlineOutlinedIcon,
    accent: cv.purpleSelectionBg,
  },
  project: {
    label: 'Project',
    icon: WorkspacesOutlinedIcon,
    accent: cv.greenAccentMedium,
  },
} as const;

export default function TagManagementCard({
  tag,
  workspaceName,
  usageCount,
  onEdit,
  onDelete,
}: TagManagementCardProps) {
  const { tagScopeColors } = useDashboard();
  const meta = scopeMeta[tag.scope];
  const ScopeIcon = meta.icon;
  const scopeColor = getTagScopeColor(tag.scope, tagScopeColors);
  const tagChipSx = getTagScopeChipSx(tag.scope, tagScopeColors, {
    height: 32,
    fontSize: '0.875rem',
  });

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 1.25,
        p: 1.5,
        borderRadius: '14px',
        border: `1px solid ${cv.border}`,
        background: 'var(--noah-footer-tint)',
        transition: 'border-color 0.2s ease, transform 0.2s ease',
        '&:hover': {
          borderColor: cv.annotationGuide,
          transform: 'translateY(-1px)',
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
        <Chip
          label={<TruncatedText text={tag.name} sx={{ fontSize: '0.875rem', fontWeight: 600 }} />}
          size="small"
          sx={{ ...tagChipSx, maxWidth: '100%' }}
        />

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, flexShrink: 0 }}>
          <IconButton
            size="small"
            aria-label={`Edit ${tag.name}`}
            onClick={onEdit}
            sx={{ color: cv.textMuted, '&:hover': { color: cv.textPrimary } }}
          >
            <EditOutlinedIcon sx={{ fontSize: 16 }} />
          </IconButton>
          <IconButton
            size="small"
            aria-label={`Delete ${tag.name}`}
            onClick={onDelete}
            sx={{ color: cv.textMuted, '&:hover': { color: cv.destructive } }}
          >
            <DeleteOutlinedIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Box>
      </Box>

      <Box
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.5,
          alignSelf: 'flex-start',
          px: 0.75,
          py: 0.25,
          borderRadius: '999px',
          backgroundColor: `${scopeColor}18`,
          border: `1px solid ${scopeColor}33`,
        }}
      >
        <ScopeIcon sx={{ fontSize: 14, color: scopeColor }} />
        <Typography sx={{ fontSize: '0.6875rem', fontWeight: 600, color: scopeColor }}>
          {meta.label}
          {tag.scope === 'project' && workspaceName ? ` · ${workspaceName}` : ''}
        </Typography>
      </Box>

      <Typography sx={{ fontSize: '0.8125rem', color: cv.textMuted }}>
        {usageCount === 1 ? 'Used on 1 file' : `Used on ${usageCount} files`}
      </Typography>
    </Box>
  );
}

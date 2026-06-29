import { useState } from 'react';
import {
  Box,
  Chip,
  Drawer,
  IconButton,
  Tooltip,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PaletteOutlinedIcon from '@mui/icons-material/PaletteOutlined';
import { cv } from '../../theme/cssVars';
import { useDashboard } from '../../context/DashboardContext';
import { getTagScopeChipSx } from '../../utils/managedTagStyles';
import {
  getTagScopeColorOptions,
  normalizeHexColor,
  TAG_SCOPES,
} from '../../utils/tagScopeColorsStorage';
import type { TagScope } from '../../types/managedTag';

const DRAWER_WIDTH = 360;

const scopeMeta: Record<TagScope, { label: string; shortLabel: string; description: string }> = {
  company: {
    label: 'Company tags',
    shortLabel: 'Company',
    description: 'Shared across your organization.',
  },
  project: {
    label: 'Project tags',
    shortLabel: 'Project',
    description: 'Scoped to a workspace project.',
  },
  personal: {
    label: 'Personal tags',
    shortLabel: 'Personal',
    description: 'Private tags you create for yourself.',
  },
};

const reservedByLabel: Record<TagScope, string> = {
  company: 'Company',
  project: 'Project',
  personal: 'Personal',
};

function ColorSwatchGrid({
  scope,
  onSelect,
}: {
  scope: TagScope;
  onSelect: (color: string) => void;
}) {
  const { tagScopeColors } = useDashboard();
  const options = getTagScopeColorOptions(scope, tagScopeColors);
  const activeColor = normalizeHexColor(tagScopeColors[scope]);

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
      {options.map(({ color, disabled, reservedBy }) => {
        const normalizedColor = normalizeHexColor(color);
        const isSelected = activeColor === normalizedColor;
        const swatch = (
          <Box sx={{ position: 'relative', width: 32, height: 32, flexShrink: 0 }}>
            <Box
              component="button"
              type="button"
              disabled={disabled}
              aria-label={
                disabled && reservedBy
                  ? `${color} is used by ${reservedByLabel[reservedBy]} tags`
                  : `Set ${scopeMeta[scope].label} color to ${color}`
              }
              aria-pressed={isSelected}
              onClick={() => onSelect(color)}
              sx={{
                width: '100%',
                height: '100%',
                borderRadius: '999px',
                border:
                  isSelected
                    ? `2px solid ${cv.textPrimary}`
                    : '2px solid transparent',
                backgroundColor: color,
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.55 : 1,
                boxShadow: isSelected ? `0 0 0 2px ${color}` : 'none',
                '&:disabled': {
                  opacity: 0.55,
                },
              }}
            />
            {disabled && reservedBy ? (
              <Box
                aria-hidden
                sx={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '999px',
                  backgroundColor: 'rgba(0, 0, 0, 0.35)',
                  pointerEvents: 'none',
                }}
              >
                <CloseIcon
                  sx={{
                    fontSize: 16,
                    color: '#fff',
                    filter: 'drop-shadow(0 0 1px rgba(0, 0, 0, 0.6))',
                  }}
                />
              </Box>
            ) : null}
          </Box>
        );

        if (disabled && reservedBy) {
          return (
            <Tooltip
              key={color}
              title={`Used by ${reservedByLabel[reservedBy]} tags`}
              arrow
              placement="top"
            >
              <span>{swatch}</span>
            </Tooltip>
          );
        }

        return <Box key={color}>{swatch}</Box>;
      })}
    </Box>
  );
}

interface TagScopeColorsDrawerProps {
  open: boolean;
  focusScope: TagScope | null;
  onClose: () => void;
}

function TagScopeColorsDrawer({ open, focusScope, onClose }: TagScopeColorsDrawerProps) {
  const { tagScopeColors, updateTagScopeColor } = useDashboard();
  const orderedScopes = focusScope
    ? [focusScope, ...TAG_SCOPES.filter((scope) => scope !== focusScope)]
    : TAG_SCOPES;

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            width: { xs: '100%', sm: DRAWER_WIDTH },
            maxWidth: '100%',
            borderLeft: '1px solid var(--noah-border)',
            backgroundColor: cv.drawerSurface,
            backgroundImage: 'none',
          },
        },
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1,
            px: 2,
            py: 1.5,
            borderBottom: `1px solid ${cv.border}`,
          }}
        >
          <Box>
            <Typography sx={{ fontWeight: 600, fontSize: '1.0625rem', color: cv.textPrimary }}>
              Category colors
            </Typography>
            <Typography sx={{ fontSize: '0.75rem', color: cv.textMuted, mt: 0.25 }}>
              Each color can only be used by one category.
            </Typography>
          </Box>
          <IconButton aria-label="Close category colors" onClick={onClose} sx={{ color: cv.textMuted }}>
            <CloseIcon />
          </IconButton>
        </Box>

        <Box sx={{ flex: 1, overflowY: 'auto', p: 2, display: 'grid', gap: 1.5 }}>
          {orderedScopes.map((scope) => {
            const meta = scopeMeta[scope];
            const isFocused = scope === focusScope;

            return (
              <Box
                key={scope}
                sx={{
                  p: 1.5,
                  borderRadius: '12px',
                  border: `1px solid ${isFocused ? cv.purpleSelectionBorder : cv.border}`,
                  backgroundColor: isFocused ? cv.purpleSelectionSoft : cv.surface,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
                  <Chip
                    label={meta.shortLabel}
                    size="small"
                    sx={getTagScopeChipSx(scope, tagScopeColors, {
                      height: 24,
                      fontSize: '0.75rem',
                    })}
                  />
                  <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: cv.textPrimary }}>
                    {meta.label}
                  </Typography>
                </Box>
                <Typography sx={{ fontSize: '0.75rem', color: cv.textMuted, mb: 1.25 }}>
                  {meta.description}
                </Typography>
                <ColorSwatchGrid
                  scope={scope}
                  onSelect={(color) => updateTagScopeColor(scope, color)}
                />
              </Box>
            );
          })}
        </Box>
      </Box>
    </Drawer>
  );
}

export default function TagScopeColorsSettings() {
  const { tagScopeColors } = useDashboard();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [focusScope, setFocusScope] = useState<TagScope | null>(null);

  const openDrawer = (scope: TagScope | null = null) => {
    setFocusScope(scope);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setFocusScope(null);
  };

  return (
    <>
      <Box
        sx={{
          mb: 3,
          px: 2,
          py: 1.5,
          borderRadius: '16px',
          border: '1px solid var(--noah-border)',
          background: 'var(--noah-footer-tint)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          flexWrap: { xs: 'wrap', sm: 'nowrap' },
        }}
      >
        <Box sx={{ minWidth: 0, flex: '1 1 auto' }}>
          <Typography sx={{ fontWeight: 600, fontSize: '1rem', color: cv.textPrimary }}>
            Category colors
          </Typography>
          <Typography sx={{ fontSize: '0.8125rem', color: cv.textSecondary, mt: 0.25 }}>
            One color per category. Tags inherit their category color automatically.
          </Typography>
        </Box>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            flexShrink: 0,
            flexWrap: 'nowrap',
          }}
        >
          {TAG_SCOPES.map((scope) => {
            const meta = scopeMeta[scope];

            return (
              <Tooltip key={scope} title={`Edit ${meta.label.toLowerCase()}`} arrow placement="top">
                <Box
                  component="button"
                  type="button"
                  onClick={() => openDrawer(scope)}
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.75,
                    px: 1.25,
                    py: 0.65,
                    borderRadius: '999px',
                    border: `1px solid ${cv.border}`,
                    backgroundColor: cv.surface,
                    cursor: 'pointer',
                    transition: 'border-color 0.15s ease, background-color 0.15s ease',
                    '&:hover': {
                      borderColor: cv.purpleSelectionBorder,
                      backgroundColor: cv.purpleSelectionSoft,
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      backgroundColor: tagScopeColors[scope],
                      flexShrink: 0,
                    }}
                  />
                  <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600, color: cv.textPrimary }}>
                    {meta.shortLabel}
                  </Typography>
                </Box>
              </Tooltip>
            );
          })}

          <Tooltip title="Edit all category colors" arrow placement="top">
            <IconButton
              aria-label="Edit category colors"
              onClick={() => openDrawer(null)}
              sx={{
                width: 36,
                height: 36,
                border: `1px solid ${cv.border}`,
                backgroundColor: cv.surface,
                color: cv.textSecondary,
                '&:hover': {
                  color: cv.textPrimary,
                  backgroundColor: cv.purpleSelectionSoft,
                  borderColor: cv.purpleSelectionBorder,
                },
              }}
            >
              <PaletteOutlinedIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <TagScopeColorsDrawer open={drawerOpen} focusScope={focusScope} onClose={closeDrawer} />
    </>
  );
}

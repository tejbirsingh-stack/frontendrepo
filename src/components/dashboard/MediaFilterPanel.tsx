import React, { useEffect, useMemo, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  Checkbox,
  Chip,
  Collapse,
  FormControl,
  IconButton,
  Link,
  MenuItem,
  Popover,
  Select,
  Typography,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import { cv } from '../../theme/cssVars';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import { dropdownMenuPaperSx } from '../../constants/dropdownMenu';
import {
  AI_TAG_OPTIONS,
  DATE_RANGE_OPTIONS,
  MEDIA_TYPE_FILTER_OPTIONS,
  type DateRangeFilter,
  type MediaTypeFilter,
} from '../../constants/mediaFilters';
import { useDashboard } from '../../context/DashboardContext';
import { useAiEntitled } from '../../hooks/useAiEntitled';
import { listAiTagsRequest } from '../../api/ai.service';
import { filterTagChipStyles } from '../../utils/badgeStyles';
import { getManagedTagChipSx, getTagScopeBadgeSx } from '../../utils/managedTagStyles';
import {
  buildTagForest,
  countDescendants,
  countSelectedDescendants,
  groupForestByRootScope,
  type TagTreeNode,
} from '../../utils/tagHierarchy';
import {
  TAG_UI_DARK_SURFACE,
  ensureContrastOnBackground,
  getContrastingForeground,
} from '../../utils/colorContrast';
import { getTagScopeColor } from '../../utils/tagScopeColorsStorage';
import type { TagScope } from '../../types/managedTag';

const menuPaperSx = dropdownMenuPaperSx;

const TAG_SCOPE_ORDER: TagScope[] = ['company', 'project', 'personal'];

const TAG_SCOPE_LABELS: Record<TagScope, string> = {
  company: 'Company',
  project: 'Project',
  personal: 'Personal',
};

const filterSelectSx = {
  height: 40,
  borderRadius: '10px',
  fontSize: '0.875rem',
  color: cv.textSecondary,
  backgroundColor: cv.glassBackground,
  '& .MuiSelect-select': { py: 1 },
  '& .MuiOutlinedInput-notchedOutline': { borderColor: cv.border },
  '&:hover': {
    backgroundColor: cv.surfaceHover,
    '& .MuiOutlinedInput-notchedOutline': { borderColor: cv.surfaceActive },
  },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
    borderColor: cv.borderFocus,
    borderWidth: 1,
  },
  '& .MuiSelect-icon': { color: cv.textMuted },
};

const filterLabelSx = {
  display: 'block',
  mb: 1,
  fontSize: '0.8125rem',
  fontWeight: 600,
  color: cv.textPrimary,
};

const PREVIEW_TAG_COUNT = 3;

function tagCheckboxSx(color: string) {
  const accent = ensureContrastOnBackground(color, TAG_UI_DARK_SURFACE, 4.5);
  return {
    p: 0.35,
    color: cv.textSecondary,
    '&.Mui-checked, &.MuiCheckbox-indeterminate': {
      color: accent,
    },
    '& .MuiSvgIcon-root': {
      fontSize: 18,
    },
  } as const;
}

function tagOptionRowSx(selected: boolean, color: string) {
  const accent = ensureContrastOnBackground(color, TAG_UI_DARK_SURFACE, 4.5);
  return {
    display: 'flex',
    alignItems: 'center',
    gap: 0.75,
    borderRadius: '10px',
    px: 1,
    py: 0.65,
    cursor: 'pointer',
    backgroundColor: selected ? `${color}33` : 'transparent',
    border: `1px solid ${selected ? accent : 'transparent'}`,
    transition: 'background-color 0.15s ease, border-color 0.15s ease',
    '&:hover': {
      backgroundColor: selected ? `${color}44` : cv.surfaceHover,
    },
    '&:focus-visible': {
      outline: `2px solid ${accent}`,
      outlineOffset: 1,
    },
  } as const;
}

interface FilterFieldProps {
  label: string;
  children: React.ReactNode;
}

function FilterField({ label, children }: FilterFieldProps) {
  return (
    <Box>
      <Typography component="label" sx={filterLabelSx}>
        {label}
      </Typography>
      {children}
    </Box>
  );
}

interface MediaFilterPanelProps {
  mediaTypeFilter: MediaTypeFilter;
  dateRangeFilter: DateRangeFilter;
  selectedTags: Set<string>;
  selectedAiTags: Set<string>;
  onMediaTypeChange: (value: MediaTypeFilter) => void;
  onDateRangeChange: (value: DateRangeFilter) => void;
  onToggleTag: (tag: string) => void;
  onToggleAiTag: (tag: string) => void;
  onApply: () => void;
}

export default function MediaFilterPanel({
  mediaTypeFilter,
  dateRangeFilter,
  selectedTags,
  selectedAiTags,
  onMediaTypeChange,
  onDateRangeChange,
  onToggleTag,
  onToggleAiTag,
  onApply,
}: MediaFilterPanelProps) {
  const { activeWorkspaceId, getAssignableTags, tagScopeColors } = useDashboard();
  const aiEntitled = useAiEntitled();
  const [aiTagOptions, setAiTagOptions] = useState<string[]>([]);
  const assignableTags = useMemo(
    () => getAssignableTags(activeWorkspaceId),
    [getAssignableTags, activeWorkspaceId],
  );
  const previewManagedTags = useMemo(
    () => assignableTags.slice(0, PREVIEW_TAG_COUNT),
    [assignableTags],
  );
  const scopedTagTrees = useMemo(
    () => groupForestByRootScope(buildTagForest(assignableTags)),
    [assignableTags],
  );

  const [showAllAiTags, setShowAllAiTags] = useState(false);
  const [tagsMenuAnchor, setTagsMenuAnchor] = useState<HTMLElement | null>(null);
  const [expandedParents, setExpandedParents] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!aiEntitled) {
      setAiTagOptions([]);
      return;
    }
    let cancelled = false;
    void listAiTagsRequest()
      .then((res) => {
        if (cancelled) return;
        setAiTagOptions((res.tags || []).filter(Boolean));
      })
      .catch(() => {
        if (!cancelled) setAiTagOptions([...AI_TAG_OPTIONS]);
      });
    return () => {
      cancelled = true;
    };
  }, [aiEntitled]);

  const tagsMenuOpen = Boolean(tagsMenuAnchor);
  const hasMoreTags = assignableTags.length > PREVIEW_TAG_COUNT;

  const toggleExpanded = (tagId: string, currentlyExpanded: boolean) => {
    setExpandedParents((prev) => ({
      ...prev,
      [tagId]: !currentlyExpanded,
    }));
  };

  const renderTagTreeNode = (
    node: TagTreeNode,
    depth: number,
    sectionScopeColor: string,
  ): React.ReactNode => {
    const { tag, children } = node;
    const selected = selectedTags.has(tag.name);
    const tagColor = getTagScopeColor(tag.scope, tagScopeColors);
    const accent = ensureContrastOnBackground(tagColor, TAG_UI_DARK_SURFACE, 4.5);
    const descendantCount = countDescendants(node);
    const selectedDescendantCount = countSelectedDescendants(node, selectedTags);
    const hasChildren = children.length > 0;
    const expanded =
      expandedParents[tag.id] !== undefined
        ? expandedParents[tag.id]
        : selectedDescendantCount > 0;

    return (
      <Box key={tag.id} sx={{ mb: depth === 0 ? 0.35 : 0.25 }}>
        <Box
          role="menuitemcheckbox"
          aria-checked={selected}
          tabIndex={0}
          onClick={() => onToggleTag(tag.name)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              onToggleTag(tag.name);
            }
          }}
          sx={{
            ...tagOptionRowSx(selected, tagColor),
            py: depth === 0 ? 0.65 : 0.45,
          }}
        >
          <Checkbox
            size="small"
            checked={selected}
            indeterminate={!selected && selectedDescendantCount > 0}
            tabIndex={-1}
            disableRipple
            sx={tagCheckboxSx(tagColor)}
          />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.75,
                minWidth: 0,
                flexWrap: 'wrap',
              }}
            >
              <Typography
                sx={{
                  fontSize: depth === 0 ? '0.875rem' : '0.8125rem',
                  fontWeight: selected || depth === 0 ? 600 : 500,
                  color: cv.textPrimary,
                  lineHeight: 1.25,
                }}
              >
                {tag.name}
              </Typography>
              <Box component="span" sx={getTagScopeBadgeSx(tag.scope, tagScopeColors)}>
                {TAG_SCOPE_LABELS[tag.scope]}
              </Box>
            </Box>
            {hasChildren ? (
              <Typography
                sx={{
                  fontSize: '0.6875rem',
                  color: cv.textSecondary,
                  lineHeight: 1.3,
                  mt: 0.15,
                }}
              >
                {selectedDescendantCount > 0
                  ? `${selectedDescendantCount} of ${descendantCount} selected`
                  : `${descendantCount} subtag${descendantCount === 1 ? '' : 's'}`}
              </Typography>
            ) : null}
          </Box>
          {hasChildren ? (
            <IconButton
              size="small"
              aria-label={expanded ? 'Hide child tags' : 'Show child tags'}
              aria-expanded={expanded}
              onClick={(event) => {
                event.stopPropagation();
                toggleExpanded(tag.id, expanded);
              }}
              sx={{
                width: 28,
                height: 28,
                color: expanded ? getContrastingForeground(tagColor) : cv.textSecondary,
                backgroundColor: expanded ? tagColor : 'transparent',
                border: expanded ? `1px solid ${tagColor}` : `1px solid transparent`,
                '&:hover': {
                  color: expanded ? getContrastingForeground(tagColor) : accent,
                  backgroundColor: expanded ? tagColor : `${tagColor}33`,
                  filter: expanded ? 'brightness(1.08)' : undefined,
                },
              }}
            >
              {expanded ? (
                <KeyboardArrowDownIcon sx={{ fontSize: 18 }} />
              ) : (
                <KeyboardArrowRightIcon sx={{ fontSize: 18 }} />
              )}
            </IconButton>
          ) : null}
        </Box>

        {hasChildren ? (
          <Collapse in={expanded} timeout="auto" unmountOnExit>
            <Box
              sx={{
                position: 'relative',
                ml: depth === 0 ? 2.25 : 1.5,
                mt: 0.25,
                mb: 0.5,
                pl: 1.5,
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  left: 0,
                  top: 4,
                  bottom: 4,
                  width: 2,
                  borderRadius: 1,
                  backgroundColor: `${sectionScopeColor}66`,
                },
              }}
            >
              {children.map((child) =>
                renderTagTreeNode(child, depth + 1, sectionScopeColor),
              )}
            </Box>
          </Collapse>
        ) : null}
      </Box>
    );
  };

  const handleMediaTypeChange = (event: SelectChangeEvent) => {
    onMediaTypeChange(event.target.value as MediaTypeFilter);
  };

  const handleDateRangeChange = (event: SelectChangeEvent) => {
    onDateRangeChange(event.target.value as DateRangeFilter);
  };

  const selectedCountInMenu = assignableTags.filter((tag) => selectedTags.has(tag.name)).length;

  return (
    <Box
      sx={{
        p: 2.5,
        borderRadius: '16px',
        border: "1px solid var(--noah-border)",
        background: 'var(--noah-footer-tint)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <Typography
        variant="subtitle1"
        sx={{ fontWeight: 600, fontSize: '1rem', color: cv.textPrimary, mb: 2.5 }}
      >
        Filters
      </Typography>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            lg: 'repeat(4, 1fr)',
          },
          gap: 2.5,
        }}
      >
        <FilterField label="Media Type">
          <FormControl fullWidth size="small">
            <Select
              value={mediaTypeFilter}
              onChange={handleMediaTypeChange}
              IconComponent={KeyboardArrowDownIcon}
              sx={filterSelectSx}
              MenuProps={{
                slotProps: { paper: { sx: menuPaperSx } },
              }}
            >
              {MEDIA_TYPE_FILTER_OPTIONS.map((option) => (
                <MenuItem
                  key={option.value}
                  value={option.value}
                  sx={{ fontSize: '0.875rem', color: cv.textSecondary }}
                >
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </FilterField>

        <FilterField label="Date Range">
          <FormControl fullWidth size="small">
            <Select
              value={dateRangeFilter}
              onChange={handleDateRangeChange}
              IconComponent={KeyboardArrowDownIcon}
              sx={filterSelectSx}
              MenuProps={{
                slotProps: { paper: { sx: menuPaperSx } },
              }}
            >
              {DATE_RANGE_OPTIONS.map((option) => (
                <MenuItem
                  key={option.value}
                  value={option.value}
                  sx={{ fontSize: '0.875rem', color: cv.textSecondary }}
                >
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </FilterField>

        <FilterField label="Tags">
          {assignableTags.length === 0 ? (
            <Typography sx={{ fontSize: '0.8125rem', color: cv.textSecondary, lineHeight: 1.5 }}>
              No tags yet.{' '}
              <Link
                component={RouterLink}
                to="/home/tags"
                sx={{
                  color: cv.brandPurple,
                  fontWeight: 600,
                  textDecoration: 'underline',
                  textUnderlineOffset: 2,
                  '&:hover': { color: cv.purpleLight },
                }}
              >
                Create one
              </Link>
            </Typography>
          ) : (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
            {previewManagedTags.map((tag) => {
              const selected = selectedTags.has(tag.name);
              return (
                <Chip
                  key={tag.id}
                  label={tag.name}
                  onClick={() => onToggleTag(tag.name)}
                  sx={getManagedTagChipSx(tag, tagScopeColors, {
                    selected,
                    height: 30,
                    fontSize: '0.8125rem',
                  })}
                />
              );
            })}
            {hasMoreTags && (
              <Chip
                label={
                  selectedCountInMenu > 0
                    ? `See more · ${selectedCountInMenu}`
                    : 'See more'
                }
                onClick={(event) => setTagsMenuAnchor(event.currentTarget)}
                aria-haspopup="menu"
                aria-expanded={tagsMenuOpen}
                sx={{
                  ...filterTagChipStyles(tagsMenuOpen || selectedCountInMenu > 0),
                  backgroundColor: tagsMenuOpen ? cv.brandPurple : 'transparent',
                  border: `1px dashed ${tagsMenuOpen ? cv.brandPurple : cv.textSecondary}`,
                  color: tagsMenuOpen ? '#ffffff' : cv.textPrimary,
                  '&:hover': {
                    backgroundColor: tagsMenuOpen ? cv.brandPurple : cv.purpleSelectionHover,
                    borderColor: cv.brandPurple,
                    color: tagsMenuOpen ? '#ffffff' : cv.textPrimary,
                    filter: tagsMenuOpen ? 'brightness(1.08)' : undefined,
                  },
                }}
              />
            )}
          </Box>
          )}

          <Popover
            anchorEl={tagsMenuAnchor}
            open={tagsMenuOpen}
            onClose={() => setTagsMenuAnchor(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            transformOrigin={{ vertical: 'top', horizontal: 'left' }}
            slotProps={{
              paper: {
                sx: {
                  ...menuPaperSx,
                  mt: 1,
                  minWidth: 288,
                  maxWidth: 340,
                  maxHeight: 400,
                  p: 0,
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                },
              },
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 1,
                px: 1.75,
                py: 1.25,
                borderBottom: `1px solid ${cv.border}`,
                background: cv.insetHighlight,
              }}
            >
              <Typography
                sx={{
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: cv.textSecondary,
                }}
              >
                Select tags
              </Typography>
              {selectedCountInMenu > 0 && (
                <Box
                  sx={{
                    px: 1,
                    py: 0.2,
                    borderRadius: '999px',
                    fontSize: '0.6875rem',
                    fontWeight: 700,
                    color: '#ffffff',
                    backgroundColor: cv.brandPurple,
                    border: `1px solid ${cv.brandPurple}`,
                  }}
                >
                  {selectedCountInMenu} selected
                </Box>
              )}
            </Box>

            <Box sx={{ overflowY: 'auto', py: 1, px: 1 }}>
              {TAG_SCOPE_ORDER.map((scope) => {
                const trees = scopedTagTrees[scope];
                if (trees.length === 0) return null;

                const scopeColor = ensureContrastOnBackground(
                  getTagScopeColor(scope, tagScopeColors),
                  TAG_UI_DARK_SURFACE,
                  3,
                );

                return (
                  <Box key={scope} sx={{ mb: 1.25, '&:last-of-type': { mb: 0 } }}>
                    {trees.map((node) => renderTagTreeNode(node, 0, scopeColor))}
                  </Box>
                );
              })}
            </Box>
          </Popover>
        </FilterField>

        {aiEntitled ? (
        <FilterField label="AI Tags">
          {aiTagOptions.length === 0 ? (
            <Typography sx={{ fontSize: '0.8125rem', color: cv.textSecondary }}>
              No AI tags yet. They appear after media is transcribed.
            </Typography>
          ) : (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
            {(showAllAiTags ? aiTagOptions : aiTagOptions.slice(0, 3)).map((tag) => {
              const selected = selectedAiTags.has(tag);
              return (
                <Chip
                  key={tag}
                  label={tag}
                  onClick={() => onToggleAiTag(tag)}
                  sx={{
                    height: 30,
                    borderRadius: '999px',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    backgroundColor: selected ? cv.brandPurple : cv.badgeOutlinedBg,
                    color: selected ? '#ffffff' : cv.badgeOutlinedText,
                    border: `1px solid ${selected ? cv.brandPurple : cv.badgeOutlinedBorder}`,
                    '&:hover': {
                      backgroundColor: selected
                        ? cv.brandPurple
                        : cv.purpleSelectionHover,
                      filter: selected ? 'brightness(1.08)' : undefined,
                    },
                    '& .MuiChip-label': { px: 1.25 },
                  }}
                />
              );
            })}
            {aiTagOptions.length > 3 && (
              <Chip
                label={showAllAiTags ? "See less" : "See more"}
                onClick={() => setShowAllAiTags(!showAllAiTags)}
                sx={{
                  height: 30,
                  borderRadius: '999px',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  backgroundColor: 'transparent',
                  color: cv.badgeOutlinedText,
                  border: `1px dashed ${cv.badgeOutlinedBorder}`,
                  '&:hover': {
                    backgroundColor: cv.purpleSelectionHover,
                    borderColor: cv.brandPurple,
                  },
                  '& .MuiChip-label': { px: 1.25 },
                }}
              />
            )}
          </Box>
          )}
        </FilterField>
        ) : null}
      </Box>

      {/* Apply button */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2.5 }}>
        <Button
          variant="contained"
          onClick={onApply}
          sx={{
            px: 3,
            py: 0.875,
            borderRadius: '10px',
            fontSize: '0.875rem',
            fontWeight: 600,
            textTransform: 'none',
            background: 'linear-gradient(135deg, var(--noah-brand-purple), var(--noah-brand-purple-light, #a78bfa))',
            boxShadow: '0 2px 12px rgba(139,92,246,0.35)',
            '&:hover': {
              background: 'linear-gradient(135deg, var(--noah-brand-purple-hover, #7c3aed), var(--noah-brand-purple))',
              boxShadow: '0 4px 16px rgba(139,92,246,0.5)',
            },
            transition: 'all 0.2s ease',
          }}
        >
          Apply Filters
        </Button>
      </Box>
    </Box>
  );
}

import { useMemo, useState } from 'react';
import {
  Box,
  Collapse,
  IconButton,
  Popover,
  TextField,
  Typography,
} from '@mui/material';
import {
  AddOutlined as AddOutlinedIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  KeyboardArrowRight as KeyboardArrowRightIcon,
  AccountTreeOutlined as AccountTreeOutlinedIcon,
} from '@mui/icons-material';
import { cv } from '../../theme/cssVars';
import { useDashboard } from '../../context/DashboardContext';
import type { TagScope } from '../../types/managedTag';
import {
  buildTagForest,
  countDescendants,
  groupForestByRootScope,
  type TagTreeNode,
} from '../../utils/tagHierarchy';
import { getTagScopeColor } from '../../utils/tagScopeColorsStorage';
import { getTagScopeBadgeSx } from '../../utils/managedTagStyles';
import { normalizeTagName } from '../../utils/tagRegistryStorage';

interface HierarchicalTagPickerProps {
  workspaceId: string;
  appliedTags: string[];
  onAddTag: (tagName: string) => void;
  canEditTags?: boolean;
}

const tagScopeLabels: Record<TagScope, string> = {
  company: 'Company Tags',
  project: 'Project Tags',
  personal: 'Personal Tags',
};

const tagScopeOrder: TagScope[] = ['company', 'project', 'personal'];

export default function HierarchicalTagPicker({
  workspaceId,
  appliedTags,
  onAddTag,
  canEditTags = true,
}: HierarchicalTagPickerProps) {
  const { getAssignableTags, tagScopeColors } = useDashboard();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedParents, setExpandedParents] = useState<Record<string, boolean>>({});

  const assignableTags = useMemo(
    () => getAssignableTags(workspaceId),
    [getAssignableTags, workspaceId],
  );

  const scopedTagTrees = useMemo(
    () => groupForestByRootScope(buildTagForest(assignableTags)),
    [assignableTags],
  );

  const toggleParentExpand = (parentId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedParents((prev) => ({
      ...prev,
      [parentId]: !prev[parentId],
    }));
  };

  const handleSelectTag = (tagName: string) => {
    const normalized = normalizeTagName(tagName);
    if (!normalized || appliedTags.includes(normalized)) return;
    onAddTag(normalized);
    setSearchQuery('');
    setAnchorEl(null);
  };

  if (!canEditTags) {
    return null;
  }

  const open = Boolean(anchorEl);
  const filteredQuery = searchQuery.trim().toLowerCase();

  const nodeMatchesQuery = (node: TagTreeNode): boolean => {
    if (!filteredQuery) return true;
    if (node.tag.name.toLowerCase().includes(filteredQuery)) return true;
    return node.children.some(nodeMatchesQuery);
  };

  const renderNode = (node: TagTreeNode, depth: number, scopeColor: string): React.ReactNode => {
    if (filteredQuery && !nodeMatchesQuery(node)) return null;

    const { tag, children } = node;
    const hasChildren = children.length > 0;
    const isApplied = appliedTags.includes(tag.name);
    const isExpanded = expandedParents[tag.id] || Boolean(filteredQuery);
    const descendantCount = countDescendants(node);

    return (
      <Box key={tag.id} sx={{ mb: 0.5 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            py: 0.5,
            px: 0.75,
            borderRadius: '6px',
            cursor: 'pointer',
            backgroundColor: isApplied ? cv.purpleSelectionHover : 'transparent',
            '&:hover': { backgroundColor: cv.glassBackground || 'rgba(255,255,255,0.04)' },
          }}
          onClick={() => handleSelectTag(tag.name)}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0 }}>
            {hasChildren ? (
              <IconButton
                size="small"
                onClick={(e) => toggleParentExpand(tag.id, e)}
                sx={{ p: 0.2, color: cv.textMuted }}
              >
                {isExpanded ? (
                  <KeyboardArrowDownIcon sx={{ fontSize: 16 }} />
                ) : (
                  <KeyboardArrowRightIcon sx={{ fontSize: 16 }} />
                )}
              </IconButton>
            ) : (
              <Box sx={{ width: 24 }} />
            )}
            <Box sx={{ minWidth: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, flexWrap: 'wrap' }}>
                <Typography
                  sx={{
                    fontSize: depth === 0 ? '0.8125rem' : '0.78125rem',
                    fontWeight: depth === 0 && hasChildren ? 600 : 500,
                    color: isApplied ? cv.textSecondary : cv.textPrimary,
                  }}
                >
                  {tag.name}
                </Typography>
                <Box component="span" sx={getTagScopeBadgeSx(tag.scope, tagScopeColors)}>
                  {tagScopeLabels[tag.scope].replace(' Tags', '')}
                </Box>
              </Box>
              {hasChildren && !filteredQuery ? (
                <Typography sx={{ fontSize: '0.625rem', color: cv.textSecondary }}>
                  {descendantCount} subtag{descendantCount === 1 ? '' : 's'}
                </Typography>
              ) : null}
            </Box>
          </Box>
          {!isApplied && (
            <AddOutlinedIcon sx={{ fontSize: 14, color: depth === 0 ? cv.textSecondary : scopeColor }} />
          )}
        </Box>

        {hasChildren ? (
          <Collapse in={isExpanded} timeout="auto">
            <Box
              sx={{
                pl: 2.75,
                pt: 0.25,
                borderLeft: `1px solid ${cv.dividerSubtle}`,
                ml: 1.25,
              }}
            >
              {children.map((child) => renderNode(child, depth + 1, scopeColor))}
            </Box>
          </Collapse>
        ) : null}
      </Box>
    );
  };

  return (
    <Box sx={{ mt: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
        <TextField
          size="small"
          fullWidth
          placeholder="Search or browse tag hierarchy..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onClick={(e) => setAnchorEl(e.currentTarget)}
          aria-label="Add or browse tags"
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '10px',
              fontSize: '0.8125rem',
              backgroundColor: cv.surface,
              color: cv.textPrimary,
              '& fieldset': { borderColor: cv.border },
              '&:hover fieldset': { borderColor: cv.annotationGuide },
              '&.Mui-focused fieldset': { borderColor: cv.purpleFocusBorder },
            },
          }}
        />
        <IconButton
          type="button"
          onClick={(e) => setAnchorEl(open ? null : e.currentTarget)}
          aria-label="Browse tag hierarchy"
          title="Browse tag hierarchy"
          sx={{
            width: 36,
            height: 36,
            flexShrink: 0,
            color: cv.purpleAccent || '#a855f7',
            border: '1px solid var(--noah-border)',
            borderRadius: '10px',
            backgroundColor: cv.surface,
            '&:hover': {
              backgroundColor: cv.purpleSelectionHover,
              borderColor: cv.purpleSelectionStrong,
            },
          }}
        >
          <AccountTreeOutlinedIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{
          paper: {
            sx: {
              mt: 0.5,
              width: anchorEl ? Math.max(anchorEl.offsetWidth, 300) : 300,
              maxHeight: 340,
              borderRadius: '12px',
              border: '1px solid var(--noah-border)',
              backgroundColor: cv.elevatedSurface || cv.surface,
              boxShadow: cv.dropdownShadow,
              p: 1.25,
              overflowY: 'auto',
            },
          },
        }}
      >
        <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: cv.textMuted, mb: 1, px: 0.5 }}>
          TAG HIERARCHY & SCOPES
        </Typography>

        {tagScopeOrder.map((scope) => {
          const trees = scopedTagTrees[scope];
          const scopeColor = getTagScopeColor(scope, tagScopeColors);
          const visibleTrees = filteredQuery
            ? trees.filter(nodeMatchesQuery)
            : trees;

          if (visibleTrees.length === 0) return null;

          return (
            <Box key={scope} sx={{ mb: 1.5, '&:last-of-type': { mb: 0 } }}>
              <Typography
                sx={{
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  color: scopeColor,
                  px: 0.5,
                  mb: 0.5,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                }}
              >
                <Box sx={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: scopeColor }} />
                {tagScopeLabels[scope]}
              </Typography>

              {visibleTrees.map((node) => renderNode(node, 0, scopeColor))}
            </Box>
          );
        })}

        {filteredQuery && (
          <Box sx={{ mt: 1, pt: 1, borderTop: `1px solid ${cv.dividerSubtle}` }}>
            <Box
              sx={{
                py: 0.5,
                px: 0.75,
                borderRadius: '6px',
                cursor: 'pointer',
                backgroundColor: cv.purpleSelectionHover,
                '&:hover': { backgroundColor: cv.purpleSelectionMedium },
              }}
              onClick={() => handleSelectTag(searchQuery.trim())}
            >
              <Typography sx={{ fontSize: '0.8125rem', color: cv.textPrimary }}>
                Add <Box component="span" sx={{ fontWeight: 600 }}>"{searchQuery.trim()}"</Box> as custom tag
              </Typography>
            </Box>
          </Box>
        )}
      </Popover>
    </Box>
  );
}

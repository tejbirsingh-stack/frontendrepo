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
import type { ManagedTag, TagScope } from '../../types/managedTag';
import { getTagScopeColor } from '../../utils/tagScopeColorsStorage';
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

  // Group tags into parent/child hierarchy per scope
  const hierarchicalTagsByScope = useMemo(() => {
    const scopes: Record<TagScope, { parents: ManagedTag[]; childrenMap: Map<string, ManagedTag[]>; standalone: ManagedTag[] }> = {
      company: { parents: [], childrenMap: new Map(), standalone: [] },
      project: { parents: [], childrenMap: new Map(), standalone: [] },
      personal: { parents: [], childrenMap: new Map(), standalone: [] },
    };

    const tagsById = new Map<string, ManagedTag>(assignableTags.map((t) => [t.id, t]));

    assignableTags.forEach((tag) => {
      const scopeData = scopes[tag.scope] || scopes.personal;
      if (tag.parentId && tagsById.has(tag.parentId)) {
        const existing = scopeData.childrenMap.get(tag.parentId) || [];
        existing.push(tag);
        scopeData.childrenMap.set(tag.parentId, existing);
      } else {
        // Tag is a root/parent candidate
        scopeData.parents.push(tag);
      }
    });

    // Separate parents into those with children vs standalone
    tagScopeOrder.forEach((scope) => {
      const scopeData = scopes[scope];
      const realParents: ManagedTag[] = [];
      const standalone: ManagedTag[] = [];

      scopeData.parents.forEach((tag) => {
        if (scopeData.childrenMap.has(tag.id)) {
          realParents.push(tag);
        } else {
          standalone.push(tag);
        }
      });

      scopeData.parents = realParents;
      scopeData.standalone = standalone;
    });

    return scopes;
  }, [assignableTags]);

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
          const scopeData = hierarchicalTagsByScope[scope];
          const scopeColor = getTagScopeColor(scope, tagScopeColors);
          const hasTags = scopeData.parents.length > 0 || scopeData.standalone.length > 0;

          if (!hasTags && !filteredQuery) return null;

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

              {/* Parent Categories with Children */}
              {scopeData.parents.map((parentTag) => {
                const children = scopeData.childrenMap.get(parentTag.id) || [];
                const isParentExpanded = expandedParents[parentTag.id] || Boolean(filteredQuery);
                const isParentApplied = appliedTags.includes(parentTag.name);

                const matchingChildren = filteredQuery
                  ? children.filter((c) => c.name.toLowerCase().includes(filteredQuery))
                  : children;

                if (filteredQuery && !parentTag.name.toLowerCase().includes(filteredQuery) && matchingChildren.length === 0) {
                  return null;
                }

                return (
                  <Box key={parentTag.id} sx={{ mb: 0.5 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        py: 0.5,
                        px: 0.75,
                        borderRadius: '6px',
                        cursor: 'pointer',
                        backgroundColor: isParentApplied ? cv.purpleSelectionHover : 'transparent',
                        '&:hover': { backgroundColor: cv.glassBackground || 'rgba(255,255,255,0.04)' },
                      }}
                      onClick={() => handleSelectTag(parentTag.name)}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0 }}>
                        <IconButton
                          size="small"
                          onClick={(e) => toggleParentExpand(parentTag.id, e)}
                          sx={{ p: 0.2, color: cv.textMuted }}
                        >
                          {isParentExpanded ? (
                            <KeyboardArrowDownIcon sx={{ fontSize: 16 }} />
                          ) : (
                            <KeyboardArrowRightIcon sx={{ fontSize: 16 }} />
                          )}
                        </IconButton>
                        <Typography
                          sx={{
                            fontSize: '0.8125rem',
                            fontWeight: 600,
                            color: isParentApplied ? cv.textMuted : cv.textPrimary,
                          }}
                        >
                          {parentTag.name}
                        </Typography>
                      </Box>
                      {!isParentApplied && (
                        <AddOutlinedIcon sx={{ fontSize: 14, color: cv.textSecondary }} />
                      )}
                    </Box>

                    {/* Nested Child Tags */}
                    <Collapse in={isParentExpanded} timeout="auto">
                      <Box sx={{ pl: 2.75, pt: 0.25, borderLeft: `1px solid ${cv.dividerSubtle}`, ml: 1.25 }}>
                        {matchingChildren.map((childTag) => {
                          const isChildApplied = appliedTags.includes(childTag.name);
                          return (
                            <Box
                              key={childTag.id}
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                py: 0.4,
                                px: 0.75,
                                my: 0.2,
                                borderRadius: '6px',
                                cursor: 'pointer',
                                opacity: isChildApplied ? 0.5 : 1,
                                '&:hover': { backgroundColor: cv.purpleSelectionHover },
                              }}
                              onClick={() => handleSelectTag(childTag.name)}
                            >
                              <Typography sx={{ fontSize: '0.78125rem', color: cv.textSecondary, fontWeight: 500 }}>
                                {childTag.name}
                              </Typography>
                              {!isChildApplied && (
                                <AddOutlinedIcon sx={{ fontSize: 14, color: scopeColor }} />
                              )}
                            </Box>
                          );
                        })}
                      </Box>
                    </Collapse>
                  </Box>
                );
              })}

              {/* Standalone Tags (No children) */}
              {scopeData.standalone.map((tag) => {
                if (filteredQuery && !tag.name.toLowerCase().includes(filteredQuery)) {
                  return null;
                }
                const isApplied = appliedTags.includes(tag.name);

                return (
                  <Box
                    key={tag.id}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      py: 0.5,
                      px: 0.75,
                      my: 0.2,
                      borderRadius: '6px',
                      cursor: 'pointer',
                      opacity: isApplied ? 0.5 : 1,
                      '&:hover': { backgroundColor: cv.glassBackground || 'rgba(255,255,255,0.04)' },
                    }}
                    onClick={() => handleSelectTag(tag.name)}
                  >
                    <Typography sx={{ fontSize: '0.8125rem', color: cv.textPrimary }}>
                      {tag.name}
                    </Typography>
                    {!isApplied && <AddOutlinedIcon sx={{ fontSize: 14, color: cv.textSecondary }} />}
                  </Box>
                );
              })}
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

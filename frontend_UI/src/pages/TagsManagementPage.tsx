import { useMemo, useState } from 'react';
import { cv } from '../theme/cssVars';
import {
  Box,
  Button,
  Chip,
  FormControl,
  InputAdornment,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import WorkspacesOutlinedIcon from '@mui/icons-material/WorkspacesOutlined';
import CreateTagModal from '../components/dashboard/CreateTagModal';
import TagManagementCard from '../components/dashboard/TagManagementCard';
import TagScopeColorsSettings from '../components/dashboard/TagScopeColorsSettings';
import TrashConfirmModal from '../components/dashboard/TrashConfirmModal';
import { useDashboard } from '../context/DashboardContext';
import type { ManagedTag, TagScope } from '../types/managedTag';
import { dropdownMenuProps } from '../constants/dropdownMenu';

type ScopeFilter = 'all' | TagScope;

const scopeFilterOptions: { value: ScopeFilter; label: string }[] = [
  { value: 'all', label: 'All tags' },
  { value: 'company', label: 'Company' },
  { value: 'project', label: 'Project' },
  { value: 'personal', label: 'Personal' },
];

const sectionMeta = {
  company: {
    title: 'Company tags',
    description: 'Shared across your organization. Everyone can see and apply these tags.',
    icon: BusinessOutlinedIcon,
  },
  project: {
    title: 'Project tags',
    description: 'Scoped to a specific workspace. Useful for campaign or client workflows.',
    icon: WorkspacesOutlinedIcon,
  },
  personal: {
    title: 'Personal tags',
    description: 'Private to you. Only visible in your library and tagging menus.',
    icon: PersonOutlineOutlinedIcon,
  },
} as const;

function TagSection({
  scope,
  tags,
  workspaceNameById,
  getTagUsageCount,
  onEdit,
  onDelete,
}: {
  scope: TagScope;
  tags: ManagedTag[];
  workspaceNameById: Map<string, string>;
  getTagUsageCount: (name: string) => number;
  onEdit: (tag: ManagedTag) => void;
  onDelete: (tag: ManagedTag) => void;
}) {
  const meta = sectionMeta[scope];
  const SectionIcon = meta.icon;

  if (tags.length === 0) return null;

  return (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.25, mb: 2 }}>
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: cv.surface,
            border: `1px solid ${cv.border}`,
            flexShrink: 0,
          }}
        >
          <SectionIcon sx={{ fontSize: 18, color: cv.textSecondary }} />
        </Box>
        <Box>
          <Typography sx={{ fontWeight: 600, fontSize: '1rem', color: cv.textPrimary }}>
            {meta.title}
            <Typography component="span" sx={{ ml: 1, fontSize: '0.8125rem', color: cv.textMuted }}>
              ({tags.length})
            </Typography>
          </Typography>
          <Typography sx={{ mt: 0.35, fontSize: '0.8125rem', color: cv.textSecondary }}>
            {meta.description}
          </Typography>
        </Box>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            lg: 'repeat(3, 1fr)',
            xl: 'repeat(4, 1fr)',
          },
          gap: 1.5,
        }}
      >
        {tags.map((tag) => (
          <TagManagementCard
            key={tag.id}
            tag={tag}
            workspaceName={
              tag.workspaceId ? workspaceNameById.get(tag.workspaceId) : undefined
            }
            usageCount={getTagUsageCount(tag.name)}
            onEdit={() => onEdit(tag)}
            onDelete={() => onDelete(tag)}
          />
        ))}
      </Box>
    </Box>
  );
}

export default function TagsManagementPage() {
  const {
    workspaces,
    activeWorkspaceId,
    managedTags,
    createManagedTag,
    updateManagedTag,
    deleteManagedTag,
    getTagUsageCount,
  } = useDashboard();

  const [searchQuery, setSearchQuery] = useState('');
  const [scopeFilter, setScopeFilter] = useState<ScopeFilter>('all');
  const [projectWorkspaceId, setProjectWorkspaceId] = useState(activeWorkspaceId);
  const [tagModalOpen, setTagModalOpen] = useState(false);
  const [tagModalMode, setTagModalMode] = useState<'create' | 'edit'>('create');
  const [editingTag, setEditingTag] = useState<ManagedTag | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ManagedTag | null>(null);

  const workspaceNameById = useMemo(
    () => new Map(workspaces.map((workspace) => [workspace.id, workspace.name])),
    [workspaces],
  );

  const filteredTags = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return managedTags.filter((tag) => {
      if (scopeFilter !== 'all' && tag.scope !== scopeFilter) return false;
      if (tag.scope === 'project' && tag.workspaceId !== projectWorkspaceId) return false;
      if (query && !tag.name.includes(query)) return false;
      return true;
    });
  }, [managedTags, projectWorkspaceId, scopeFilter, searchQuery]);

  const companyTags = filteredTags.filter((tag) => tag.scope === 'company');
  const projectTags = filteredTags.filter((tag) => tag.scope === 'project');
  const personalTags = filteredTags.filter((tag) => tag.scope === 'personal');

  const summary = useMemo(
    () => ({
      total: managedTags.length,
      company: managedTags.filter((tag) => tag.scope === 'company').length,
      project: managedTags.filter((tag) => tag.scope === 'project').length,
      personal: managedTags.filter((tag) => tag.scope === 'personal').length,
    }),
    [managedTags],
  );

  const openCreateModal = () => {
    setTagModalMode('create');
    setEditingTag(null);
    setTagModalOpen(true);
  };

  const openEditModal = (tag: ManagedTag) => {
    setTagModalMode('edit');
    setEditingTag(tag);
    setTagModalOpen(true);
  };

  const handleCreateTag = (input: {
    name: string;
    scope: TagScope;
    workspaceId: string | null;
  }) => Boolean(createManagedTag(input));

  const handleUpdateTag = (id: string, updates: { name?: string }) =>
    updateManagedTag(id, updates);

  const confirmDeleteTag = () => {
    if (!deleteTarget) return;
    deleteManagedTag(deleteTarget.id);
    setDeleteTarget(null);
  };

  const showSectionedLayout = scopeFilter === 'all';
  const visibleTags =
    scopeFilter === 'all'
      ? filteredTags
      : scopeFilter === 'company'
        ? companyTags
        : scopeFilter === 'project'
          ? projectTags
          : personalTags;

  return (
    <Box
      component="main"
      sx={{
        flex: 1,
        overflowY: 'auto',
        px: { xs: 2, md: 3 },
        py: { xs: 2, md: 3 },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 2,
          flexWrap: 'wrap',
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 600, fontSize: '1.375rem', mb: 0.5 }}>
            Tags Management
          </Typography>
          <Typography sx={{ fontSize: '0.875rem', color: cv.textSecondary, maxWidth: 560 }}>
            Create and organize personal, company-wide, and project-level tags for your media library.
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={openCreateModal}
          sx={{
            background: cv.brandGradient,
            boxShadow: cv.brandShadow,
            borderRadius: '10px',
            px: 2,
            py: 0.75,
            fontSize: '0.875rem',
            '&:hover': {
              background: cv.brandGradientHover,
            },
          }}
        >
          Create tag
        </Button>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
          gap: 1.5,
          mb: 3,
        }}
      >
        {[
          { label: 'Total tags', value: summary.total },
          { label: 'Company', value: summary.company },
          { label: 'Project', value: summary.project },
          { label: 'Personal', value: summary.personal },
        ].map((stat) => (
          <Box
            key={stat.label}
            sx={{
              px: 1.5,
              py: 1.25,
              borderRadius: '12px',
              border: `1px solid ${cv.border}`,
              background: 'var(--noah-footer-tint)',
            }}
          >
            <Typography sx={{ fontSize: '0.75rem', color: cv.textMuted, mb: 0.25 }}>
              {stat.label}
            </Typography>
            <Typography sx={{ fontSize: '1.25rem', fontWeight: 600, color: cv.textPrimary }}>
              {stat.value}
            </Typography>
          </Box>
        ))}
      </Box>

      <TagScopeColorsSettings />

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          flexWrap: 'wrap',
          mb: 2.5,
        }}
      >
        <TextField
          size="small"
          placeholder="Search tags..."
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: 18, color: cv.textMuted }} />
                </InputAdornment>
              ),
            },
          }}
          sx={{
            minWidth: { xs: '100%', sm: 260 },
            flex: { sm: '0 0 260px' },
            '& .MuiOutlinedInput-root': {
              borderRadius: '10px',
              backgroundColor: cv.surface,
              '& fieldset': { borderColor: cv.border },
            },
          }}
        />

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
          {scopeFilterOptions.map((option) => (
            <Chip
              key={option.value}
              label={option.label}
              onClick={() => setScopeFilter(option.value)}
              sx={{
                height: 32,
                borderRadius: '999px',
                fontSize: '0.8125rem',
                fontWeight: 500,
                color: scopeFilter === option.value ? cv.textPrimary : cv.textSecondary,
                backgroundColor:
                  scopeFilter === option.value ? cv.purpleSelectionHover : cv.surface,
                border: `1px solid ${
                  scopeFilter === option.value ? cv.purpleSelectionBorder : cv.border
                }`,
                '&:hover': {
                  backgroundColor:
                    scopeFilter === option.value ? cv.purpleGlowSoft : cv.surfaceHover,
                },
              }}
            />
          ))}
        </Box>

        {scopeFilter === 'all' || scopeFilter === 'project' ? (
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <Select
              value={projectWorkspaceId}
              onChange={(event: SelectChangeEvent) => setProjectWorkspaceId(event.target.value)}
              displayEmpty
              MenuProps={dropdownMenuProps}
              sx={{
                borderRadius: '10px',
                fontSize: '0.8125rem',
                color: cv.textSecondary,
                backgroundColor: cv.surface,
                '& .MuiOutlinedInput-notchedOutline': { borderColor: cv.border },
              }}
            >
              {workspaces.map((workspace) => (
                <MenuItem
                  key={workspace.id}
                  value={workspace.id}
                  sx={{
                    fontSize: '0.875rem',
                    color: cv.textPrimary,
                    '&:hover': { backgroundColor: cv.surfaceHover },
                    '&.Mui-selected': {
                      backgroundColor: cv.blueGlow18,
                      '&:hover': { backgroundColor: cv.blueGlow24 },
                    },
                  }}
                >
                  {workspace.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        ) : null}
      </Box>

      {visibleTags.length === 0 ? (
        <Box
          sx={{
            py: 8,
            textAlign: 'center',
            color: cv.textMuted,
            borderRadius: '16px',
            border: `1px dashed ${cv.border}`,
          }}
        >
          <Typography variant="body1" sx={{ mb: 0.5, color: cv.textPrimary }}>
            {searchQuery ? 'No tags match your search' : 'No tags in this view yet'}
          </Typography>
          <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
            {searchQuery
              ? 'Try a different search term or clear your filters.'
              : 'Create a personal, company, or project tag to get started.'}
          </Typography>
        </Box>
      ) : showSectionedLayout ? (
        <>
          <TagSection
            scope="company"
            tags={companyTags}
            workspaceNameById={workspaceNameById}
            getTagUsageCount={getTagUsageCount}
            onEdit={openEditModal}
            onDelete={setDeleteTarget}
          />
          <TagSection
            scope="project"
            tags={projectTags}
            workspaceNameById={workspaceNameById}
            getTagUsageCount={getTagUsageCount}
            onEdit={openEditModal}
            onDelete={setDeleteTarget}
          />
          <TagSection
            scope="personal"
            tags={personalTags}
            workspaceNameById={workspaceNameById}
            getTagUsageCount={getTagUsageCount}
            onEdit={openEditModal}
            onDelete={setDeleteTarget}
          />
        </>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              lg: 'repeat(3, 1fr)',
              xl: 'repeat(4, 1fr)',
            },
            gap: 1.5,
          }}
        >
          {visibleTags.map((tag) => (
            <TagManagementCard
              key={tag.id}
              tag={tag}
              workspaceName={
                tag.workspaceId ? workspaceNameById.get(tag.workspaceId) : undefined
              }
              usageCount={getTagUsageCount(tag.name)}
              onEdit={() => openEditModal(tag)}
              onDelete={() => setDeleteTarget(tag)}
            />
          ))}
        </Box>
      )}

      <CreateTagModal
        open={tagModalOpen}
        mode={tagModalMode}
        workspaces={workspaces}
        activeWorkspaceId={activeWorkspaceId}
        editingTag={editingTag}
        onClose={() => setTagModalOpen(false)}
        onCreate={handleCreateTag}
        onUpdate={handleUpdateTag}
      />

      <TrashConfirmModal
        open={Boolean(deleteTarget)}
        itemTitle={deleteTarget?.name ?? 'Tag'}
        title="Delete tag?"
        confirmLabel="Delete tag"
        description="This tag will be removed from the registry and unlinked from all files that use it."
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDeleteTag}
      />
    </Box>
  );
}

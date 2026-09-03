import { useEffect, useMemo, useState } from 'react';
import { cv } from '../theme/cssVars';
import { Box, IconButton, Tooltip, Typography } from '@mui/material';
import ViewListIcon from '@mui/icons-material/ViewList';
import GridViewIcon from '@mui/icons-material/GridView';
import TrashMediaItemCard from '../components/dashboard/TrashMediaItemCard';
import TrashMediaListRow from '../components/dashboard/TrashMediaListRow';
import TrashSelectionBar from '../components/dashboard/TrashSelectionBar';
import { useDashboard } from '../context/DashboardContext';
import { getTrashRetentionLabel } from '../utils/trashRetention';

type ViewMode = 'grid' | 'list';

const toolbarIconSx = {
  color: cv.textSecondary,
  borderRadius: '10px',
  '&:hover': { backgroundColor: cv.surfaceHover, color: cv.textPrimary },
};

const activeToolbarSx = {
  ...toolbarIconSx,
  color: cv.textPrimary,
  backgroundColor: cv.surfaceRaised,
};

export default function TrashPage() {
  const {
    trashedMediaItems,
    trashedAtById,
    fetchTrashItems,
    restoreFromTrashBulk,
    purgeExpiredTrash,
    activeWorkspaceId,
  } = useDashboard();

  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchTrashItems();
    purgeExpiredTrash();
  }, [fetchTrashItems, purgeExpiredTrash, activeWorkspaceId]);

  useEffect(() => {
    setSelectedIds(new Set());
  }, [activeWorkspaceId]);

  const sortedItems = useMemo(
    () =>
      [...trashedMediaItems].sort((a, b) => {
        const aTime = new Date(trashedAtById[a.id] ?? 0).getTime();
        const bTime = new Date(trashedAtById[b.id] ?? 0).getTime();
        return bTime - aTime;
      }),
    [trashedMediaItems, trashedAtById],
  );

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleRestore = (ids: string[]) => {
    restoreFromTrashBulk(ids);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.delete(id));
      return next;
    });
  };

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
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
          <Typography variant="h5" sx={{ fontWeight: 600, fontSize: '1.375rem' }}>
            Trash
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
            <Tooltip title={viewMode === 'list' ? 'Grid view' : 'List view'} arrow>
              <IconButton
                size="small"
                sx={toolbarIconSx}
                onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
                aria-label={viewMode === 'list' ? 'Grid view' : 'List view'}
              >
                {viewMode === 'list' ? (
                  <GridViewIcon sx={{ fontSize: 20 }} />
                ) : (
                  <ViewListIcon sx={{ fontSize: 20 }} />
                )}
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        <Typography variant="body2" sx={{ color: cv.textMuted, fontSize: '0.875rem' }}>
          Restore items anytime, or they are removed automatically after {getTrashRetentionLabel()}.
        </Typography>
      </Box>

      <TrashSelectionBar
        selectedCount={selectedIds.size}
        totalCount={sortedItems.length}
        onSelectAll={() => setSelectedIds(new Set(sortedItems.map((item) => item.id)))}
        onClearSelection={() => setSelectedIds(new Set())}
        onRestore={() => handleRestore([...selectedIds])}
      />

      {sortedItems.length === 0 ? (
        <Box
          sx={{
            py: 8,
            textAlign: 'center',
            color: cv.textMuted,
            borderRadius: '16px',
            border: `1px dashed var(--noah-border)`,
          }}
        >
          <Typography variant="body1" sx={{ mb: 0.5 }}>
            Trash is empty
          </Typography>
          <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
            Deleted items appear here for {getTrashRetentionLabel()} before being removed automatically.
          </Typography>
        </Box>
      ) : viewMode === 'list' ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {sortedItems.map((item) => (
            <TrashMediaListRow
              key={item.id}
              item={item}
              deletedAt={trashedAtById[item.id] ?? ''}
              isSelected={selectedIds.has(item.id)}
              onToggleSelect={toggleSelect}
              onRestore={(id) => handleRestore([id])}
            />
          ))}
        </Box>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(auto-fill, minmax(280px, 1fr))',
            },
            gap: 2,
          }}
        >
          {sortedItems.map((item) => (
            <TrashMediaItemCard
              key={item.id}
              item={item}
              deletedAt={trashedAtById[item.id] ?? ''}
              isSelected={selectedIds.has(item.id)}
              onToggleSelect={toggleSelect}
              onRestore={(id) => handleRestore([id])}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}

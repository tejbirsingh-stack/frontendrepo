import { useEffect, useState, useMemo } from 'react';
import { Box, IconButton, Table, TableBody, TableCell, TableRow, Tooltip, Typography, TextField, MenuItem, Select, InputAdornment } from '@mui/material';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import SearchIcon from '@mui/icons-material/Search';
import { fetchPlanFeatures, type PlanFeature } from '../api/platformApi';
import { EmptyState, PlatformTableHead, StatusChip, PlatformTablePagination } from './PlatformUi';
import { usePaginatedRows, usePlatformTablePagination } from '../hooks/usePlatformTablePagination';
import { platformTableSx } from './platformTableStyles';
import { cv } from '../../theme/cssVars';

export function PlatformFeaturesCatalogSection({
  refreshKey,
  emptyMessage,
  onEdit,
  onDelete,
}: Readonly<{
  refreshKey: number;
  emptyMessage?: string;
  onEdit: (feature: PlanFeature) => void;
  onDelete: (feature: PlanFeature) => void;
}>) {
  const [features, setFeatures] = useState<PlanFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  useEffect(() => {
    setLoading(true);
    fetchPlanFeatures()
      .then((res) => {
        setFeatures(res.features || []);
        setError('');
      })
      .catch(() => setError('Failed to load features catalog'))
      .finally(() => setLoading(false));
  }, [refreshKey]);

  if (error) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography sx={{ color: cv.destructive }}>{error}</Typography>
      </Box>
    );
  }

  if (!loading && features.length === 0) {
    return <EmptyState title="No features yet" subtitle={emptyMessage || 'Create a feature to build your catalog.'} />;
  }

  const filteredFeatures = useMemo(() => {
    return features.filter((f) => {
      if (statusFilter === 'active' && !f.isActive) return false;
      if (statusFilter === 'inactive' && f.isActive) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesName = f.name.toLowerCase().includes(q);
        const matchesDesc = (f.description || '').toLowerCase().includes(q);
        const matchesSort = String(f.sortOrder).includes(q);
        if (!matchesName && !matchesDesc && !matchesSort) return false;
      }
      return true;
    });
  }, [features, searchQuery, statusFilter]);

  const pagination = usePlatformTablePagination([searchQuery, statusFilter], 10);
  const paginatedFeatures = usePaginatedRows(filteredFeatures, pagination.page, pagination.rowsPerPage);

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 1.5, mb: 2, alignItems: 'center' }}>
        <TextField
          size="small"
          placeholder="Search by name, description, sort order..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ flex: 1, maxWidth: 400 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ fontSize: 18, color: cv.textMuted }} />
              </InputAdornment>
            ),
          }}
        />
        <Select
          size="small"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
          sx={{ minWidth: 140, fontSize: '0.875rem' }}
        >
          <MenuItem value="all">All Statuses</MenuItem>
          <MenuItem value="active">Active</MenuItem>
          <MenuItem value="inactive">Inactive</MenuItem>
        </Select>
      </Box>

      {filteredFeatures.length === 0 ? (
        <EmptyState title="No features found" subtitle="Try adjusting your filters or search query." />
      ) : (
        <Box sx={{ overflowX: 'auto', ...platformTableSx }}>
          <Table sx={{ minWidth: 600 }}>
        <PlatformTableHead
          columns={[
            { id: 'name', label: 'Feature Name', minWidth: 200 },
            { id: 'description', label: 'Description', minWidth: 250 },
            { id: 'sortOrder', label: 'Sort Order', width: 100 },
            { id: 'status', label: 'Status', width: 100, align: 'center' },
            { id: 'actions', label: '', width: 80, align: 'right' },
          ]}
        />
        <TableBody>
          {paginatedFeatures.map((feature) => (
            <TableRow key={feature.id}>
              <TableCell>
                <Typography sx={{ fontWeight: 600, color: cv.textPrimary, fontSize: '0.875rem' }}>
                  {feature.name}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography
                  sx={{
                    color: cv.textSecondary,
                    fontSize: '0.8125rem',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {feature.description || '—'}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography sx={{ color: cv.textMuted, fontSize: '0.8125rem' }}>
                  {feature.sortOrder}
                </Typography>
              </TableCell>
              <TableCell align="center">
                <StatusChip status={feature.isActive ? 'active' : 'inactive'} />
              </TableCell>
              <TableCell align="right">
                <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                  <Tooltip title="Edit">
                    <IconButton size="small" onClick={() => onEdit(feature)} sx={{ color: cv.textMuted }}>
                      <EditOutlinedIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton
                      size="small"
                      onClick={() => onDelete(feature)}
                      sx={{ color: cv.textMuted, '&:hover': { color: cv.destructive } }}
                    >
                      <DeleteOutlineOutlinedIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Tooltip>
                </Box>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <PlatformTablePagination
        count={filteredFeatures.length}
        page={pagination.page}
        rowsPerPage={pagination.rowsPerPage}
        onPageChange={pagination.onPageChange}
        onRowsPerPageChange={pagination.onRowsPerPageChange}
      />
        </Box>
      )}
    </Box>
  );
}

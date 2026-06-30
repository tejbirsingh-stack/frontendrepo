import { Box, Button, IconButton, Typography } from '@mui/material';
import { cv } from '../../theme/cssVars';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import RestoreFromTrashOutlinedIcon from '@mui/icons-material/RestoreFromTrashOutlined';

interface TrashSelectionBarProps {
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onRestore: () => void;
}

export default function TrashSelectionBar({
  selectedCount,
  totalCount,
  onSelectAll,
  onClearSelection,
  onRestore,
}: TrashSelectionBarProps) {
  if (selectedCount === 0) return null;

  const allSelected = selectedCount === totalCount && totalCount > 0;

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        mb: 2,
        px: 1.5,
        py: 1,
        borderRadius: '12px',
        border: `1px solid ${cv.borderFocus}`,
        background: cv.blueSelectionSurface,
      }}
    >
      <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: cv.textPrimary }}>
        {selectedCount} selected
      </Typography>

      <Button
        size="small"
        onClick={allSelected ? onClearSelection : onSelectAll}
        sx={{
          minWidth: 0,
          px: 1.25,
          py: 0.5,
          fontSize: '0.8125rem',
          color: cv.textSecondary,
          borderRadius: '8px',
          '&:hover': { backgroundColor: cv.surfaceHover, color: cv.textPrimary },
        }}
      >
        {allSelected ? 'Deselect all' : 'Select all'}
      </Button>

      <Box sx={{ flex: 1 }} />

      <Button
        size="small"
        startIcon={<RestoreFromTrashOutlinedIcon sx={{ fontSize: 18 }} />}
        onClick={onRestore}
        sx={{
          px: 1.5,
          py: 0.65,
          fontSize: '0.8125rem',
          fontWeight: 600,
          color: cv.textPrimary,
          borderRadius: '8px',
          border: `1px solid ${cv.border}`,
          '&:hover': { backgroundColor: cv.surfaceHover },
        }}
      >
        Restore
      </Button>

      <IconButton
        size="small"
        aria-label="Clear selection"
        onClick={onClearSelection}
        sx={{
          color: cv.textMuted,
          '&:hover': { color: cv.textPrimary, backgroundColor: cv.surfaceHover },
        }}
      >
        <CloseOutlinedIcon sx={{ fontSize: 18 }} />
      </IconButton>
    </Box>
  );
}

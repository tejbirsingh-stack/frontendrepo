import { Box, Button, IconButton, Typography } from '@mui/material';
import { cv } from '../../theme/cssVars';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import CreateNewFolderOutlinedIcon from '@mui/icons-material/CreateNewFolderOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';

interface MediaSelectionBarProps {
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onMove: () => void;
  onDelete: () => void;
  isDeleteDisabled?: boolean;
}

export default function MediaSelectionBar({
  selectedCount,
  totalCount,
  onSelectAll,
  onClearSelection,
  onMove,
  onDelete,
  isDeleteDisabled = false,
}: MediaSelectionBarProps) {
  if (selectedCount === 0) return null;

  const allSelected = selectedCount === totalCount && totalCount > 0;
  const isMulti = selectedCount > 1;
  const moveLabel = isMulti ? 'Move All' : 'Move';
  const deleteLabel = isMulti ? 'Delete All' : 'Delete';

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
        startIcon={<CreateNewFolderOutlinedIcon sx={{ fontSize: 18 }} />}
        onClick={onMove}
        sx={{
          px: 1.5,
          py: 0.65,
          fontSize: '0.8125rem',
          fontWeight: 600,
          color: cv.textPrimary,
          borderRadius: '8px',
          border: `1px solid ${cv.border}`,
          '&:hover': {
            backgroundColor: cv.surfaceHover,
            borderColor: cv.borderFocus,
          },
        }}
      >
        {moveLabel}
      </Button>

      <Button
        size="small"
        disabled={isDeleteDisabled}
        startIcon={
          <DeleteOutlinedIcon
            sx={{
              fontSize: 18,
              color: isDeleteDisabled ? cv.textMuted : cv.destructive,
            }}
          />
        }
        onClick={isDeleteDisabled ? undefined : onDelete}
        sx={{
          px: 1.5,
          py: 0.65,
          fontSize: '0.8125rem',
          fontWeight: 600,
          color: isDeleteDisabled ? cv.textMuted : cv.destructive,
          opacity: isDeleteDisabled ? 0.6 : 1,
          cursor: isDeleteDisabled ? 'not-allowed' : 'pointer',
          borderRadius: '8px',
          border: `1px solid ${isDeleteDisabled ? cv.border : cv.destructiveBorderSoft}`,
          '&:hover': {
            backgroundColor: isDeleteDisabled ? 'transparent' : cv.destructiveHover,
            borderColor: isDeleteDisabled ? cv.border : cv.destructiveBorder,
          },
        }}
      >
        {deleteLabel}
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

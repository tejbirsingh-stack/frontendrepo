import { Box, IconButton, Tooltip } from '@mui/material';
import { cv } from '../../theme/cssVars';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';

interface SelectedStampToolbarProps {
  xPercent: number;
  yPercent: number;
  onDelete?: () => void;
}

export default function SelectedStampToolbar({
  xPercent,
  yPercent,
  onDelete,
}: SelectedStampToolbarProps) {
  const showBelow = yPercent < 18;
  const transform = showBelow
    ? 'translate(-50%, calc(56px + 12px))'
    : 'translate(-50%, calc(-100% - 56px))';

  return (
    <Box
      data-stamp-toolbar
      role="toolbar"
      aria-label="Stamp options"
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
      sx={{
        position: 'absolute',
        left: `${xPercent}%`,
        top: `${yPercent}%`,
        transform,
        zIndex: 5,
        display: 'flex',
        alignItems: 'center',
        gap: 0.25,
        px: 0.5,
        py: 0.5,
        borderRadius: '999px',
        border: "1px solid var(--noah-border)",
        background: 'var(--noah-drawer-surface)',
        backdropFilter: 'blur(24px) saturate(160%)',
        WebkitBackdropFilter: 'blur(24px) saturate(160%)',
        boxShadow: cv.selectedToolbarShadow,
        pointerEvents: 'auto',
      }}
    >
      {onDelete && (
        <Tooltip title="Delete stamp" placement="top">
          <IconButton
            aria-label="Delete stamp"
            onClick={onDelete}
            sx={{
              width: 40,
              height: 40,
              borderRadius: '10px',
              color: cv.textSecondary,
              '&:hover': {
                color: cv.destructive,
                backgroundColor: cv.destructiveHover,
              },
            }}
          >
            <DeleteOutlineOutlinedIcon sx={{ fontSize: 22 }} />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );
}

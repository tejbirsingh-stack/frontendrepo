import { cv } from '../../theme/cssVars';
import { Box, IconButton, Tooltip } from '@mui/material';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import type { VideoDrawingStroke } from '../../types/videoDrawings';
import { parsePathPoints } from '../../utils/drawStrokeStyle';

interface SelectedDrawingToolbarProps {
  stroke: VideoDrawingStroke;
  onDelete?: () => void;
}

export default function SelectedDrawingToolbar({
  stroke,
  onDelete,
}: SelectedDrawingToolbarProps) {
  const points = parsePathPoints(stroke.points);
  if (points.length === 0) return null;

  // Compute bounding box from points
  const xs = points.map((p) => p.xPercent);
  const ys = points.map((p) => p.yPercent);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const left = minX;
  const top = minY;
  const width = maxX - minX;
  const height = maxY - minY;
  const centerX = minX + width / 2;

  const showToolbarBelow = top < 12;
  const toolbarTop = showToolbarBelow ? top + height : top;
  const toolbarTransform = showToolbarBelow
    ? 'translate(-50%, 12px)'
    : 'translate(-50%, calc(-100% - 12px))';

  return (
    <>
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          left: `${left}%`,
          top: `${top}%`,
          width: `${width}%`,
          height: `${height}%`,
          border: `1.5px dashed ${cv.purpleLightDashed}`,
          borderRadius: '2px',
          boxShadow: cv.playheadRing,
          pointerEvents: 'none',
          zIndex: 4,
        }}
      />

      <Box
        role="toolbar"
        aria-label="Drawing options"
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => event.stopPropagation()}
        sx={{
          position: 'absolute',
          left: `${centerX}%`,
          top: `${toolbarTop}%`,
          transform: toolbarTransform,
          zIndex: 5,
          display: 'flex',
          alignItems: 'center',
          gap: 0.25,
          px: 0.75,
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
          <Tooltip title="Delete drawing" placement="top">
            <IconButton
              aria-label="Delete drawing"
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
    </>
  );
}

import { useState } from 'react';
import { cv } from '../../theme/cssVars';
import { Box, Divider, IconButton, Tooltip } from '@mui/material';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import ShapeColorPicker from './ShapeColorPicker';
import ShapeThicknessPicker from './ShapeThicknessPicker';
import type { StrokeThickness } from './StrokeThicknessControl';
import type { AnnotationColor } from '../../constants/annotationColors';
import { getHandlePositions, getNormalizedBounds, type ShapeBounds } from '../../utils/shapeGeometry';

interface SelectedShapeToolbarProps {
  bounds: ShapeBounds;
  activeColor: AnnotationColor;
  activeStroke: StrokeThickness;
  onColorChange: (color: AnnotationColor) => void;
  onStrokeChange: (stroke: StrokeThickness) => void;
  onDelete?: () => void;
}



type ShapeToolbarDrawer = 'color' | 'thickness' | null;

export default function SelectedShapeToolbar({
  bounds,
  activeColor,
  activeStroke,
  onColorChange,
  onStrokeChange,
  onDelete,
}: SelectedShapeToolbarProps) {
  const [openDrawer, setOpenDrawer] = useState<ShapeToolbarDrawer>(null);
  const { left, top, width, height, centerX } = getNormalizedBounds(bounds);
  const handles = getHandlePositions(bounds);
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
        }}
      />

      {(Object.entries(handles) as [string, { xPercent: number; yPercent: number }][]).map(
        ([handleId, handle]) => (
          <Box
            key={handleId}
            aria-hidden
            sx={{
              position: 'absolute',
              left: `${handle.xPercent}%`,
              top: `${handle.yPercent}%`,
              width: 10,
              height: 10,
              transform: 'translate(-50%, -50%)',
              borderRadius: '50%',
              border: `2px solid ${cv.purpleLight}`,
              backgroundColor: cv.textPrimary,
              boxShadow: cv.focusRingPurple2,
              pointerEvents: 'none',
            }}
          />
        ),
      )}

      <Box
        role="toolbar"
        aria-label="Shape options"
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
        <ShapeColorPicker
          activeColor={activeColor}
          onColorChange={onColorChange}
          alwaysShowSwatchBorder
          portaled
          open={openDrawer === 'color'}
          onOpenChange={(open) => setOpenDrawer(open ? 'color' : null)}
        />

        <Divider
          orientation="vertical"
          flexItem
          sx={{ mx: 0.25, borderColor: cv.whiteBorderSoft }}
        />

        <ShapeThicknessPicker
          activeStroke={activeStroke}
          onStrokeChange={onStrokeChange}
          placement="above"
          portaled
          open={openDrawer === 'thickness'}
          onOpenChange={(open) => setOpenDrawer(open ? 'thickness' : null)}
        />

        {onDelete && (
          <>
            <Divider
              orientation="vertical"
              flexItem
              sx={{ mx: 0.25, borderColor: cv.whiteBorderSoft }}
            />

            <Tooltip title="Delete shape" placement="top">
              <IconButton
                aria-label="Delete shape"
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
          </>
        )}
      </Box>
    </>
  );
}

import { Box, Divider, IconButton } from '@mui/material';
import { cv } from '../../theme/cssVars';
import { shapeToolShortcuts } from '../../constants/annotationShortcuts';
import ShortcutTooltip from './ShortcutTooltip';
import type { SvgIconComponent } from '@mui/icons-material';
import SubdirectoryArrowRightOutlinedIcon from '@mui/icons-material/SubdirectoryArrowRightOutlined';
import TimelineOutlinedIcon from '@mui/icons-material/TimelineOutlined';
import ArrowOutwardOutlinedIcon from '@mui/icons-material/ArrowOutwardOutlined';
import RemoveOutlinedIcon from '@mui/icons-material/RemoveOutlined';
import CropSquareOutlinedIcon from '@mui/icons-material/CropSquareOutlined';
import CircleOutlinedIcon from '@mui/icons-material/CircleOutlined';
import DiamondOutlinedIcon from '@mui/icons-material/DiamondOutlined';
import ChangeHistoryOutlinedIcon from '@mui/icons-material/ChangeHistoryOutlined';
import ShapeColorPicker from './ShapeColorPicker';
import StrokeThicknessControl, { type StrokeThickness } from './StrokeThicknessControl';
import type { AnnotationColor } from '../../constants/annotationColors';
import { DEFAULT_DRAW_STROKE_THICKNESS } from '../../utils/drawStrokeStyle';
import {
  subToolbarIslandBaseSx,
  subToolbarIslandResponsiveSx,
} from './subToolbarStyles';

export type ShapeStrokeThickness = StrokeThickness;

export type ShapeTool =
  | 'elbow-connector'
  | 'curved-connector'
  | 'straight-arrow'
  | 'line'
  | 'rectangle'
  | 'circle'
  | 'diamond'
  | 'triangle-up'
  | 'triangle-down';

const SUB_TOOL_BUTTON_SIZE = 40;
const SUB_TOOL_ICON_SIZE = 22;

export const shapeTools: {
  id: ShapeTool;
  label: string;
  icon: SvgIconComponent;
  iconSx?: Record<string, unknown>;
}[] = [
  { id: 'elbow-connector', label: 'Elbow connector', icon: SubdirectoryArrowRightOutlinedIcon },
  { id: 'curved-connector', label: 'Curved connector', icon: TimelineOutlinedIcon },
  { id: 'straight-arrow', label: 'Straight arrow', icon: ArrowOutwardOutlinedIcon },
  {
    id: 'line',
    label: 'Line',
    icon: RemoveOutlinedIcon,
    iconSx: { transform: 'rotate(-45deg)' },
  },
  { id: 'rectangle', label: 'Rectangle', icon: CropSquareOutlinedIcon },
  { id: 'circle', label: 'Circle', icon: CircleOutlinedIcon },
  { id: 'diamond', label: 'Diamond', icon: DiamondOutlinedIcon },
  { id: 'triangle-up', label: 'Triangle', icon: ChangeHistoryOutlinedIcon },
  {
    id: 'triangle-down',
    label: 'Inverted triangle',
    icon: ChangeHistoryOutlinedIcon,
    iconSx: { transform: 'rotate(180deg)' },
  },
];

interface ShapeSubToolbarProps {
  activeShape: ShapeTool;
  onShapeSelect: (shape: ShapeTool) => void;
  activeColor?: AnnotationColor;
  onColorChange?: (color: AnnotationColor) => void;
  activeStroke?: ShapeStrokeThickness;
  onStrokeChange?: (stroke: ShapeStrokeThickness) => void;
  overlay?: boolean;
}

export default function ShapeSubToolbar({
  activeShape,
  onShapeSelect,
  activeColor,
  onColorChange,
  activeStroke = DEFAULT_DRAW_STROKE_THICKNESS,
  onStrokeChange,
  overlay = false,
}: ShapeSubToolbarProps) {
  return (
    <Box
      role="toolbar"
      aria-label="Shape tools"
      sx={{
        ...subToolbarIslandBaseSx,
        ...subToolbarIslandResponsiveSx(920, { overlay }),
      }}
    >
      <ShapeColorPicker activeColor={activeColor} onColorChange={onColorChange} portaled />

      <Divider
        orientation="vertical"
        flexItem
        sx={{ mx: 0.5, borderColor: cv.whiteBorderSoft }}
      />

      <StrokeThicknessControl value={activeStroke} onChange={onStrokeChange} />

      <Divider
        orientation="vertical"
        flexItem
        sx={{ mx: 0.5, borderColor: cv.whiteBorderSoft }}
      />

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.25,
          overflowX: 'auto',
          flex: 1,
          minWidth: 0,
          py: 0.25,
          '&::-webkit-scrollbar': { height: 4 },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: cv.borderInputHover,
            borderRadius: '999px',
          },
        }}
      >
        {shapeTools.map((tool) => {
          const Icon = tool.icon;
          const isActive = activeShape === tool.id;
          const shortcut = shapeToolShortcuts[tool.id];

          return (
            <ShortcutTooltip key={tool.id} label={tool.label} shortcut={shortcut}>
              <IconButton
                aria-label={shortcut ? `${tool.label} (${shortcut})` : tool.label}
                aria-keyshortcuts={shortcut}
                aria-pressed={isActive}
                onClick={() => onShapeSelect(tool.id)}
                sx={{
                  width: SUB_TOOL_BUTTON_SIZE,
                  height: SUB_TOOL_BUTTON_SIZE,
                  flexShrink: 0,
                  borderRadius: '10px',
                  color: isActive ? cv.textPrimary : cv.textSecondary,
                  background: isActive
                    ? cv.stampGradient
                    : 'transparent',
                  border: isActive
                    ? `1px solid ${cv.purpleSelectionBorder}`
                    : '1px solid transparent',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    backgroundColor: isActive ? undefined : cv.surfaceHover,
                    color: cv.textPrimary,
                  },
                }}
              >
                <Icon sx={{ fontSize: SUB_TOOL_ICON_SIZE, ...tool.iconSx }} />
              </IconButton>
            </ShortcutTooltip>
          );
        })}
      </Box>
    </Box>
  );
}

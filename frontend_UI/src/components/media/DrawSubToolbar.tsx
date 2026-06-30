import { Box, Divider, IconButton, Tooltip } from '@mui/material';
import { cv, palette } from '../../theme/cssVars';
import StrokeThicknessControl, { type StrokeThickness } from './StrokeThicknessControl';
import { drawToolShortcuts } from '../../constants/annotationShortcuts';
import ShortcutTooltip from './ShortcutTooltip';
import type { SvgIconComponent } from '@mui/icons-material';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import HighlightOutlinedIcon from '@mui/icons-material/HighlightOutlined';
import GridOnOutlinedIcon from '@mui/icons-material/GridOnOutlined';
import LayersClearOutlinedIcon from '@mui/icons-material/LayersClearOutlined';
import { drawColors, DEFAULT_DRAW_COLOR } from '../../constants/drawColors';
import type { AnnotationColor } from '../../constants/annotationColors';
import CustomColorPickerButton from './CustomColorPickerButton';
import { DEFAULT_DRAW_STROKE_THICKNESS } from '../../utils/drawStrokeStyle';
import {
  subToolbarIslandBaseSx,
  subToolbarIslandResponsiveSx,
} from './subToolbarStyles';

export type DrawTool = 'pencil' | 'highlighter' | 'grid' | 'eraser';
export type DrawStrokeThickness = StrokeThickness;

const SUB_TOOL_BUTTON_SIZE = 40;
const SUB_TOOL_ICON_SIZE = 22;
const SWATCH_SIZE = 28;

const drawTools: {
  id: DrawTool;
  label: string;
  icon: SvgIconComponent;
  iconSx?: Record<string, unknown>;
}[] = [
  { id: 'pencil', label: 'Pencil', icon: EditOutlinedIcon },
  {
    id: 'highlighter',
    label: 'Highlighter',
    icon: HighlightOutlinedIcon,
    iconSx: { color: palette.yellow },
  },
  { id: 'grid', label: 'Grid', icon: GridOnOutlinedIcon },
  {
    id: 'eraser',
    label: 'Eraser',
    icon: LayersClearOutlinedIcon,
    iconSx: { color: palette.pinkLight },
  },
];

const activeButtonSx = {
  color: cv.textPrimary,
  background:
    cv.stampGradient,
  border: `1px solid ${cv.purpleSelectionBorder}`,
};

const inactiveButtonSx = {
  color: cv.textSecondary,
  background: 'transparent',
  border: '1px solid transparent',
};

interface DrawSubToolbarProps {
  activeDrawTool?: DrawTool;
  onDrawToolChange?: (tool: DrawTool) => void;
  activeStroke?: DrawStrokeThickness;
  onStrokeChange?: (stroke: DrawStrokeThickness) => void;
  activeColor?: AnnotationColor;
  onColorChange?: (color: AnnotationColor) => void;
  overlay?: boolean;
}

export default function DrawSubToolbar({
  activeDrawTool = 'pencil',
  onDrawToolChange,
  activeStroke = DEFAULT_DRAW_STROKE_THICKNESS,
  onStrokeChange,
  activeColor = DEFAULT_DRAW_COLOR,
  onColorChange,
  overlay = false,
}: DrawSubToolbarProps) {
  return (
    <Box
      role="toolbar"
      aria-label="Draw tools"
      sx={{
        ...subToolbarIslandBaseSx,
        ...subToolbarIslandResponsiveSx(720, { overlay }),
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, flexShrink: 0 }}>
        {drawTools.map((tool) => {
          const Icon = tool.icon;
          const isActive = activeDrawTool === tool.id;

          const shortcut = drawToolShortcuts[tool.id];

          return (
            <ShortcutTooltip key={tool.id} label={tool.label} shortcut={shortcut}>
              <IconButton
                aria-label={shortcut ? `${tool.label} (${shortcut})` : tool.label}
                aria-keyshortcuts={shortcut}
                aria-pressed={isActive}
                onClick={() => onDrawToolChange?.(tool.id)}
                sx={{
                  width: SUB_TOOL_BUTTON_SIZE,
                  height: SUB_TOOL_BUTTON_SIZE,
                  borderRadius: '10px',
                  transition: 'all 0.2s ease',
                  ...(isActive ? activeButtonSx : inactiveButtonSx),
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
          gap: 0.5,
          flexShrink: 0,
          pr: 0.5,
          opacity: activeDrawTool === 'eraser' ? 0.45 : 1,
          pointerEvents: activeDrawTool === 'eraser' ? 'none' : 'auto',
        }}
      >
        {drawColors.map((color) => {
          const isActive = activeColor.id === color.id;

          return (
            <Tooltip key={color.id} title={color.label} placement="top">
              <IconButton
                aria-label={color.label}
                aria-pressed={isActive}
                disabled={activeDrawTool === 'eraser'}
                onClick={() => onColorChange?.(color)}
                sx={{
                  width: SWATCH_SIZE,
                  height: SWATCH_SIZE,
                  p: 0,
                  borderRadius: '50%',
                  border: isActive ? `2px solid ${cv.purpleLight}` : '2px solid transparent',
                  boxShadow: isActive ? cv.purpleSelectionStrong : 'none',
                  '&:hover': { transform: 'scale(1.08)' },
                }}
              >
                <Box
                  sx={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    background: color.value,
                    border: color.id === 'white' ? "1px solid var(--noah-border)" : 'none',
                  }}
                />
              </IconButton>
            </Tooltip>
          );
        })}
        <CustomColorPickerButton
          activeColor={activeColor}
          onColorChange={onColorChange}
          disabled={activeDrawTool === 'eraser'}
        />
      </Box>
    </Box>
  );
}

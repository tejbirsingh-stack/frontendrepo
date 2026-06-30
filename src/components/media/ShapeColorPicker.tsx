import { useRef, useState } from 'react';
import { cv } from '../../theme/cssVars';
import { createPortal } from 'react-dom';
import { Box, IconButton, Tooltip } from '@mui/material';
import { useFloatingPanelPosition } from '../../hooks/useFloatingPanelPosition';
import KeyboardArrowDownOutlinedIcon from '@mui/icons-material/KeyboardArrowDownOutlined';
import {
  annotationColors,
  DEFAULT_ANNOTATION_COLOR,
  type AnnotationColor,
} from '../../constants/annotationColors';
import CustomColorPickerButton from './CustomColorPickerButton';

const presetAnnotationColors = annotationColors.filter((color) => !color.gradient);

const SUB_TOOL_BUTTON_SIZE = 40;
const SWATCH_SIZE = 28;

interface ShapeColorPickerProps {
  activeColor?: AnnotationColor;
  onColorChange?: (color: AnnotationColor) => void;
  defaultColor?: AnnotationColor;
  alwaysShowSwatchBorder?: boolean;
  /** Render the palette in a portal so it is not clipped by overflow containers. */
  portaled?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function ShapeColorPicker({
  activeColor: controlledColor,
  onColorChange,
  defaultColor = DEFAULT_ANNOTATION_COLOR,
  alwaysShowSwatchBorder = false,
  portaled = false,
  open: controlledOpen,
  onOpenChange,
}: ShapeColorPickerProps) {
  const anchorRef = useRef<HTMLDivElement>(null);
  const [internalColor, setInternalColor] = useState<AnnotationColor>(defaultColor);
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const portalPosition = useFloatingPanelPosition(anchorRef, open && portaled, 'above');

  const activeColor = controlledColor ?? internalColor;

  const handleSelect = (color: AnnotationColor) => {
    if (onColorChange) {
      onColorChange(color);
    } else {
      setInternalColor(color);
    }
  };

  const setOpen = (nextOpen: boolean) => {
    if (onOpenChange) {
      onOpenChange(nextOpen);
    } else {
      setInternalOpen(nextOpen);
    }
  };

  const toggleOpen = () => setOpen(!open);

  const colorPanel = (
    <Box
      role="dialog"
      aria-label="Choose color"
      sx={{
        ...(portaled
          ? portalPosition
          : {
              position: 'absolute',
              bottom: 'calc(100% + 10px)',
              left: 0,
              zIndex: 40,
            }),
        minWidth: 420,
        px: 1.5,
        py: 1.25,
        borderRadius: '16px',
        border: "1px solid var(--noah-border)",
        background: 'var(--noah-popover-surface-deep)',
        backdropFilter: 'blur(24px) saturate(160%)',
        WebkitBackdropFilter: 'blur(24px) saturate(160%)',
        boxShadow: cv.popoverShadowElevated,
        '&::after': {
          content: '""',
          position: 'absolute',
          bottom: -6,
          left: 22,
          width: 12,
          height: 12,
          background: 'var(--noah-popover-surface-deep)',
          borderRight: "1px solid var(--noah-border)",
          borderBottom: "1px solid var(--noah-border)",
          transform: 'rotate(45deg)',
        },
      }}
    >
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(11, 1fr)',
              gap: 0.75,
            }}
          >
            {presetAnnotationColors.map((color) => {
              const isActive = activeColor.id === color.id;

              return (
                <Tooltip key={color.id} title={color.label} placement="top">
                  <IconButton
                    aria-label={color.label}
                    aria-pressed={isActive}
                    onClick={() => handleSelect(color)}
                    sx={{
                      width: SWATCH_SIZE,
                      height: SWATCH_SIZE,
                      p: 0,
                      borderRadius: '50%',
                      border: isActive
                        ? `2px solid ${cv.purpleLight}`
                        : '2px solid transparent',
                      boxShadow: isActive ? cv.purpleSelectionStrong : 'none',
                      '&:hover': {
                        transform: 'scale(1.08)',
                      },
                    }}
                  >
                    <Box
                      sx={{
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        background: color.value,
                        border:
                          color.id === 'white' || color.id === 'white-soft'
                            ? "1px solid var(--noah-border)"
                            : 'none',
                      }}
                    />
                  </IconButton>
                </Tooltip>
              );
            })}
            <CustomColorPickerButton
              activeColor={activeColor}
              onColorChange={handleSelect}
            />
          </Box>
    </Box>
  );

  return (
    <Box ref={anchorRef} sx={{ position: 'relative', flexShrink: 0 }}>
      {open && (!portaled || portalPosition)
        ? portaled
          ? createPortal(colorPanel, document.body)
          : colorPanel
        : null}

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          pl: 0.5,
          pr: 0.25,
          borderRadius: '10px',
          border: open ? `1px solid ${cv.purpleSelectionBorder}` : '1px solid transparent',
          background: open
            ? cv.stampGradient
            : 'transparent',
          transition: 'all 0.2s ease',
        }}
      >
        <Box
          aria-hidden
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: SUB_TOOL_BUTTON_SIZE,
            height: SUB_TOOL_BUTTON_SIZE,
          }}
        >
          <Box
            sx={{
              width: 20,
              height: 20,
              borderRadius: '50%',
              background: activeColor.gradient
                ? cv.rainbowConic
                : activeColor.value,
              border:
                alwaysShowSwatchBorder ||
                activeColor.id === 'white' ||
                activeColor.id === 'white-soft' ||
                activeColor.id === 'custom'
                  ? "1px solid var(--noah-border)"
                  : 'none',
            }}
          />
        </Box>
        <Tooltip title={open ? 'Close colors' : 'Open colors'} placement="top">
          <IconButton
            aria-label={open ? 'Close color picker' : 'Open color picker'}
            aria-expanded={open}
            onClick={toggleOpen}
            sx={{
              width: 28,
              height: SUB_TOOL_BUTTON_SIZE,
              borderRadius: '8px',
              color: open ? cv.textPrimary : cv.textMuted,
              transition: 'all 0.2s ease',
              '&:hover': {
                backgroundColor: cv.surfaceHover,
                color: cv.textPrimary,
              },
            }}
          >
            <KeyboardArrowDownOutlinedIcon
              sx={{
                fontSize: 18,
                transition: 'transform 0.2s ease',
                transform: open ? 'rotate(180deg)' : 'none',
              }}
            />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
}

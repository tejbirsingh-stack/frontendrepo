import { useRef, useState } from 'react';
import { cv } from '../../theme/cssVars';
import { createPortal } from 'react-dom';
import { Box, IconButton, Tooltip } from '@mui/material';
import { useFloatingPanelPosition } from '../../hooks/useFloatingPanelPosition';
import KeyboardArrowDownOutlinedIcon from '@mui/icons-material/KeyboardArrowDownOutlined';
import StrokeThicknessControl, { type StrokeThickness } from './StrokeThicknessControl';
import { DEFAULT_DRAW_STROKE_THICKNESS } from '../../utils/drawStrokeStyle';

const SUB_TOOL_BUTTON_SIZE = 40;

function ThicknessBarsIcon() {
  return (
    <Box
      aria-hidden
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        justifyContent: 'center',
        gap: '3px',
        width: 20,
        height: 20,
      }}
    >
      <Box sx={{ height: 2, width: 12, borderRadius: '999px', backgroundColor: cv.textPrimary }} />
      <Box sx={{ height: 2.5, width: 16, borderRadius: '999px', backgroundColor: cv.textPrimary }} />
      <Box sx={{ height: 3.5, width: 20, borderRadius: '999px', backgroundColor: cv.textPrimary }} />
    </Box>
  );
}

interface ShapeThicknessPickerProps {
  activeStroke?: StrokeThickness;
  onStrokeChange?: (stroke: StrokeThickness) => void;
  placement?: 'above' | 'below';
  /** Render the panel in a portal so it is not clipped by overflow containers. */
  portaled?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function ShapeThicknessPicker({
  activeStroke = DEFAULT_DRAW_STROKE_THICKNESS,
  onStrokeChange,
  placement = 'above',
  portaled = false,
  open: controlledOpen,
  onOpenChange,
}: ShapeThicknessPickerProps) {
  const anchorRef = useRef<HTMLDivElement>(null);
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const portalPosition = useFloatingPanelPosition(anchorRef, open && portaled, placement);

  const setOpen = (nextOpen: boolean) => {
    if (onOpenChange) {
      onOpenChange(nextOpen);
    } else {
      setInternalOpen(nextOpen);
    }
  };

  const toggleOpen = () => setOpen(!open);

  const thicknessPanel = (
    <Box
      role="dialog"
      aria-label="Choose stroke thickness"
      sx={{
        ...(portaled
          ? portalPosition
          : {
              position: 'absolute',
              left: 0,
              zIndex: 40,
              ...(placement === 'below'
                ? { top: 'calc(100% + 10px)' }
                : { bottom: 'calc(100% + 10px)' }),
            }),
        px: 1.5,
        py: 1.25,
        borderRadius: '16px',
        border: "1px solid var(--noah-border)",
        background: 'var(--noah-popover-surface-deep)',
        backdropFilter: 'blur(24px) saturate(160%)',
        WebkitBackdropFilter: 'blur(24px) saturate(160%)',
        boxShadow: cv.popoverShadowElevated,
        '&::after':
          placement === 'below'
            ? {
                content: '""',
                position: 'absolute',
                top: -6,
                left: 22,
                width: 12,
                height: 12,
                background: 'var(--noah-popover-surface-deep)',
                borderLeft: "1px solid var(--noah-border)",
                borderTop: "1px solid var(--noah-border)",
                transform: 'rotate(45deg)',
              }
            : {
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
      <StrokeThicknessControl
        value={activeStroke}
        onChange={onStrokeChange}
        tooltip="Stroke thickness"
      />
    </Box>
  );

  return (
    <Box ref={anchorRef} sx={{ position: 'relative', flexShrink: 0 }}>
      {open && (!portaled || portalPosition)
        ? portaled
          ? createPortal(thicknessPanel, document.body)
          : thicknessPanel
        : null}

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
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
          <ThicknessBarsIcon />
        </Box>
        <Tooltip title={open ? 'Close thickness' : 'Open thickness'} placement="top">
          <IconButton
            aria-label={open ? 'Close thickness picker' : 'Open thickness picker'}
            aria-expanded={open}
            onClick={toggleOpen}
            sx={{
              width: 28,
              height: SUB_TOOL_BUTTON_SIZE,
              borderRadius: '8px',
              color: open ? cv.textPrimary : cv.textMuted,
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

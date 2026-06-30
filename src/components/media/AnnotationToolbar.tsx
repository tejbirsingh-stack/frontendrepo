import { useCallback, useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { cv } from '../../theme/cssVars';
import { Box, Divider, IconButton, Popper, Portal } from '@mui/material';
import NearMeOutlinedIcon from '@mui/icons-material/NearMeOutlined';
import PanToolOutlinedIcon from '@mui/icons-material/PanToolOutlined';
import DrawOutlinedIcon from '@mui/icons-material/DrawOutlined';
import InterestsOutlinedIcon from '@mui/icons-material/InterestsOutlined';
import ChatBubbleOutlineOutlinedIcon from '@mui/icons-material/ChatBubbleOutlineOutlined';
import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import RedoOutlinedIcon from '@mui/icons-material/RedoOutlined';
import UndoOutlinedIcon from '@mui/icons-material/UndoOutlined';
import ShapeSubToolbar, { type ShapeStrokeThickness, type ShapeTool } from './ShapeSubToolbar';
import DrawSubToolbar, { type DrawStrokeThickness, type DrawTool } from './DrawSubToolbar';
import StampSubToolbar from './StampSubToolbar';
import PinnedPlayerToolButtons from './PinnedPlayerToolButtons';
import LabeledToolbarButton, { toolbarHorizontalScrollSx } from './LabeledToolbarButton';
import ShortcutTooltip from './ShortcutTooltip';
import {
  annotationToolShortcuts,
  getRedoShortcutLabel,
  getUndoShortcutLabel,
} from '../../constants/annotationShortcuts';
import { useAnnotationKeyboardShortcuts } from '../../hooks/useAnnotationKeyboardShortcuts';
import { useResolvedKeyboardShortcuts } from '../../hooks/useResolvedKeyboardShortcuts';
import { DEFAULT_DRAW_STROKE_THICKNESS } from '../../utils/drawStrokeStyle';
import { DEFAULT_STAMP_ID, type StampId } from '../../constants/stamps';
import type { CustomStamp } from '../../types/customStamps';
import {
  DEFAULT_ANNOTATION_COLOR,
  type AnnotationColor,
} from '../../constants/annotationColors';
import { DEFAULT_DRAW_COLOR } from '../../constants/drawColors';
import type { PlayerToolHandlers, PlayerToolId, PlayerToolsViewState } from '../../types/playerTools';
import {
  ANNOTATION_TOOL_BUTTON_SIZE,
  ANNOTATION_TOOL_ICON_SIZE,
} from '../../constants/layout';
import { mobileSubToolbarOverlaySlotSx } from './subToolbarStyles';

export type AnnotationTool =
  | 'select'
  | 'pan'
  | 'draw'
  | 'shape'
  | 'comment'
  | 'stamp';

const TOOL_BUTTON_SIZE = ANNOTATION_TOOL_BUTTON_SIZE;
const TOOL_ICON_SIZE = ANNOTATION_TOOL_ICON_SIZE;

const islandSx = {
  display: 'flex',
  alignItems: 'center',
  gap: { xs: 0.25, lg: 0.75 },
  px: { xs: 0.75, lg: 2 },
  py: { xs: 0.5, lg: 1.25 },
  borderRadius: '999px',
  border: '1px solid var(--noah-border)',
  background: 'var(--noah-toolbar-surface)',
  backdropFilter: 'blur(24px) saturate(160%)',
  WebkitBackdropFilter: 'blur(24px) saturate(160%)',
  boxShadow: cv.toolbarShadow,
  flexShrink: 0,
};

const toolButtonSx = {
  width: TOOL_BUTTON_SIZE,
  height: TOOL_BUTTON_SIZE,
  borderRadius: { xs: '10px', lg: '12px' },
};

const dividerSx = {
  mx: { xs: 0.25, lg: 0.75 },
  borderColor: cv.whiteBorderSoft,
};

const tools: { id: AnnotationTool; label: string; icon: typeof NearMeOutlinedIcon }[] = [
  { id: 'select', label: 'Select', icon: NearMeOutlinedIcon },
  { id: 'pan', label: 'Pan', icon: PanToolOutlinedIcon },
  { id: 'draw', label: 'Draw', icon: DrawOutlinedIcon },
  { id: 'shape', label: 'Shape', icon: InterestsOutlinedIcon },
  { id: 'comment', label: 'Comment', icon: ChatBubbleOutlineOutlinedIcon },
  { id: 'stamp', label: 'Stamp', icon: LocalOfferOutlinedIcon },
];

const subIslandPopperSx = {
  zIndex: 1400,
};

const subIslandPopperModifiers = [
  { name: 'offset', options: { offset: [0, 12] as [number, number] } },
  { name: 'preventOverflow', options: { padding: 8, rootBoundary: 'viewport' } },
  { name: 'flip', options: { fallbackPlacements: ['bottom', 'top'] as const } },
];

function SubToolbarContainer({
  compact,
  open,
  anchorRef,
  mobilePlayerFooterRef,
  children,
}: {
  compact: boolean;
  open: boolean;
  anchorRef: RefObject<HTMLElement | null>;
  mobilePlayerFooterRef?: RefObject<HTMLElement | null>;
  children: ReactNode;
}) {
  const [, setPortalRevision] = useState(0);
  const schedulePortalRevision = useCallback(() => {
    setPortalRevision((value) => value + 1);
  }, []);

  useEffect(() => {
    if (!compact || !open) return;
    schedulePortalRevision();
  }, [compact, open, mobilePlayerFooterRef, schedulePortalRevision]);

  if (!open) return null;

  if (compact) {
    const footerContainer = mobilePlayerFooterRef?.current ?? null;

    if (!footerContainer) return null;

    return (
      <Portal container={footerContainer}>
        <Box sx={mobileSubToolbarOverlaySlotSx}>{children}</Box>
      </Portal>
    );
  }

  return (
    <Popper
      open={Boolean(anchorRef.current)}
      anchorEl={anchorRef.current}
      placement="top"
      sx={subIslandPopperSx}
      modifiers={subIslandPopperModifiers}
    >
      {children}
    </Popper>
  );
}

interface AnnotationToolbarProps {
  activeTool?: AnnotationTool;
  onToolChange?: (tool: AnnotationTool) => void;
  activeShape?: ShapeTool;
  onShapeChange?: (shape: ShapeTool) => void;
  activeColor?: AnnotationColor;
  onColorChange?: (color: AnnotationColor) => void;
  activeShapeStroke?: ShapeStrokeThickness;
  onShapeStrokeChange?: (stroke: ShapeStrokeThickness) => void;
  activeDrawTool?: DrawTool;
  onDrawToolChange?: (tool: DrawTool) => void;
  activeDrawStroke?: DrawStrokeThickness;
  onDrawStrokeChange?: (stroke: DrawStrokeThickness) => void;
  activeDrawColor?: AnnotationColor;
  onDrawColorChange?: (color: AnnotationColor) => void;
  activeStamp?: StampId;
  customStamp?: CustomStamp | null;
  onStampSelect?: (stamp: StampId) => void;
  onAddCustomStamp?: (emoji: string) => void;
  keyboardShortcutsDisabled?: boolean;
  toolsDrawerOpen?: boolean;
  onMoreToolsClick?: () => void;
  onToolsDrawerClose?: () => void;
  moreToolsButtonRef?: RefObject<HTMLButtonElement | null>;
  moreToolsAnchorRef?: RefObject<HTMLElement | null>;
  pinnedPlayerTools?: PlayerToolId[];
  playerToolsViewState?: PlayerToolsViewState;
  playerToolHandlers?: PlayerToolHandlers;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  compact?: boolean;
  mobilePlayerFooterRef?: RefObject<HTMLElement | null>;
}

export default function AnnotationToolbar({
  activeTool: controlledTool,
  onToolChange,
  activeShape: controlledShape,
  onShapeChange,
  activeColor: controlledColor,
  onColorChange,
  activeShapeStroke: controlledShapeStroke,
  onShapeStrokeChange,
  activeDrawTool: controlledDrawTool,
  onDrawToolChange,
  activeDrawStroke: controlledDrawStroke,
  onDrawStrokeChange,
  activeDrawColor: controlledDrawColor,
  onDrawColorChange,
  activeStamp: controlledStamp,
  customStamp,
  onStampSelect,
  onAddCustomStamp,
  keyboardShortcutsDisabled = false,
  toolsDrawerOpen = false,
  onMoreToolsClick,
  onToolsDrawerClose,
  moreToolsButtonRef,
  moreToolsAnchorRef,
  pinnedPlayerTools = [],
  playerToolsViewState,
  playerToolHandlers,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  compact = false,
  mobilePlayerFooterRef,
}: AnnotationToolbarProps) {
  const [internalTool, setInternalTool] = useState<AnnotationTool>('select');
  const [internalShape, setInternalShape] = useState<ShapeTool>('circle');
  const [internalColor, setInternalColor] = useState<AnnotationColor>(DEFAULT_ANNOTATION_COLOR);
  const [internalShapeStroke, setInternalShapeStroke] = useState<ShapeStrokeThickness>(
    DEFAULT_DRAW_STROKE_THICKNESS,
  );
  const [internalDrawTool, setInternalDrawTool] = useState<DrawTool>('pencil');
  const [internalDrawStroke, setInternalDrawStroke] = useState<DrawStrokeThickness>(
    DEFAULT_DRAW_STROKE_THICKNESS,
  );
  const [internalDrawColor, setInternalDrawColor] = useState<AnnotationColor>(DEFAULT_DRAW_COLOR);
  const [shapePanelOpen, setShapePanelOpen] = useState(false);
  const [drawPanelOpen, setDrawPanelOpen] = useState(false);
  const [stampPanelOpen, setStampPanelOpen] = useState(false);
  const [internalStamp, setInternalStamp] = useState<StampId>(DEFAULT_STAMP_ID);
  const drawToolAnchorRef = useRef<HTMLDivElement>(null);
  const shapeToolAnchorRef = useRef<HTMLDivElement>(null);
  const stampToolAnchorRef = useRef<HTMLDivElement>(null);

  const activeTool = controlledTool ?? internalTool;
  const activeShape = controlledShape ?? internalShape;
  const activeColor = controlledColor ?? internalColor;
  const activeShapeStroke = controlledShapeStroke ?? internalShapeStroke;
  const activeDrawTool = controlledDrawTool ?? internalDrawTool;
  const activeDrawStroke = controlledDrawStroke ?? internalDrawStroke;
  const activeDrawColor = controlledDrawColor ?? internalDrawColor;
  const showShapeSubIsland = shapePanelOpen && activeTool === 'shape';
  const showDrawSubIsland = drawPanelOpen && activeTool === 'draw';
  const showStampSubIsland = stampPanelOpen && activeTool === 'stamp';
  const activeStamp = controlledStamp ?? internalStamp;
  const { getShortcut } = useResolvedKeyboardShortcuts();
  const undoShortcut = getShortcut('annotation-undo') ?? getUndoShortcutLabel();
  const redoShortcut = getShortcut('annotation-redo') ?? getRedoShortcutLabel();

  const getAnnotationToolShortcut = (toolId: AnnotationTool) =>
    getShortcut(`annotation-tool-${toolId}`) ?? annotationToolShortcuts[toolId];

  const closeAllSubIslands = () => {
    setShapePanelOpen(false);
    setDrawPanelOpen(false);
    setStampPanelOpen(false);
  };

  useEffect(() => {
    if (toolsDrawerOpen) {
      closeAllSubIslands();
    }
  }, [toolsDrawerOpen]);

  const handleMoreToolsClick = () => {
    closeAllSubIslands();
    onMoreToolsClick?.();
  };

  const handleSelect = useCallback((tool: AnnotationTool) => {
    if (tool === 'shape') {
      setDrawPanelOpen(false);
      setStampPanelOpen(false);
      if (activeTool === 'shape' && shapePanelOpen) {
        setShapePanelOpen(false);
      } else {
        setShapePanelOpen(true);
        onToolsDrawerClose?.();
      }
    } else if (tool === 'draw') {
      setShapePanelOpen(false);
      setStampPanelOpen(false);
      if (activeTool === 'draw' && drawPanelOpen) {
        setDrawPanelOpen(false);
      } else {
        setDrawPanelOpen(true);
        onToolsDrawerClose?.();
      }
    } else if (tool === 'stamp') {
      setShapePanelOpen(false);
      setDrawPanelOpen(false);
      if (activeTool === 'stamp' && stampPanelOpen) {
        setStampPanelOpen(false);
      } else {
        setStampPanelOpen(true);
        onToolsDrawerClose?.();
      }
    } else {
      closeAllSubIslands();
    }

    if (onToolChange) {
      onToolChange(tool);
    } else {
      setInternalTool(tool);
    }
  }, [
    activeTool,
    shapePanelOpen,
    drawPanelOpen,
    stampPanelOpen,
    onToolChange,
    onToolsDrawerClose,
  ]);

  const handleShapeSelect = useCallback(
    (shape: ShapeTool) => {
      if (onShapeChange) {
        onShapeChange(shape);
      } else {
        setInternalShape(shape);
      }
    },
    [onShapeChange],
  );

  const handleColorChange = (color: AnnotationColor) => {
    if (onColorChange) {
      onColorChange(color);
    } else {
      setInternalColor(color);
    }
  };

  const handleShapeStrokeChange = (stroke: ShapeStrokeThickness) => {
    if (onShapeStrokeChange) {
      onShapeStrokeChange(stroke);
    } else {
      setInternalShapeStroke(stroke);
    }
  };

  const handleDrawToolChange = useCallback(
    (tool: DrawTool) => {
      if (onDrawToolChange) {
        onDrawToolChange(tool);
      } else {
        setInternalDrawTool(tool);
      }
    },
    [onDrawToolChange],
  );

  const handleDrawStrokeChange = (stroke: DrawStrokeThickness) => {
    if (onDrawStrokeChange) {
      onDrawStrokeChange(stroke);
    } else {
      setInternalDrawStroke(stroke);
    }
  };

  const handleDrawColorChange = (color: AnnotationColor) => {
    if (onDrawColorChange) {
      onDrawColorChange(color);
    } else {
      setInternalDrawColor(color);
    }
  };

  const handleStampSelect = (stamp: StampId) => {
    if (onStampSelect) {
      onStampSelect(stamp);
    } else {
      setInternalStamp(stamp);
    }
  };

  useAnnotationKeyboardShortcuts({
    activeTool,
    drawPanelOpen,
    shapePanelOpen,
    disabled: keyboardShortcutsDisabled,
    onSelectTool: handleSelect,
    onDrawToolChange: handleDrawToolChange,
    onShapeToolChange: handleShapeSelect,
  });

  return (
    <Box
      sx={{
        position: 'relative',
        display: compact ? 'contents' : 'inline-flex',
        maxWidth: compact ? undefined : '100%',
        minWidth: compact ? undefined : 0,
      }}
    >
      <Box
        sx={
          compact
            ? { display: 'contents' }
            : {
                ...toolbarHorizontalScrollSx,
              }
        }
      >
        <Box
          role="toolbar"
          aria-label="Annotation tools"
          sx={
            compact
              ? {
                  display: 'contents',
                }
              : islandSx
          }
        >
        {tools.map((tool, index) => {
          const Icon = tool.icon;
          const isActive = activeTool === tool.id;
          const shortcut = getAnnotationToolShortcut(tool.id);
          const isExpanded =
            tool.id === 'shape'
              ? showShapeSubIsland
              : tool.id === 'draw'
                ? showDrawSubIsland
                : tool.id === 'stamp'
                  ? showStampSubIsland
                  : undefined;

          return (
            <Box
              key={tool.id}
              ref={
                tool.id === 'draw'
                  ? drawToolAnchorRef
                  : tool.id === 'shape'
                    ? shapeToolAnchorRef
                    : tool.id === 'stamp'
                      ? stampToolAnchorRef
                      : undefined
              }
              sx={{ position: 'relative', display: 'flex', alignItems: 'center' }}
            >
              {!compact && index === 2 && (
                <Divider orientation="vertical" flexItem sx={dividerSx} />
              )}
              {!compact && index === 4 && (
                <Divider orientation="vertical" flexItem sx={dividerSx} />
              )}
              {compact ? (
                <LabeledToolbarButton
                  label={tool.label}
                  active={isActive}
                  onClick={() => handleSelect(tool.id)}
                  ariaLabel={shortcut ? `${tool.label} (${shortcut})` : tool.label}
                  ariaPressed={isActive}
                  ariaExpanded={isExpanded}
                >
                  <Icon sx={{ fontSize: TOOL_ICON_SIZE }} />
                </LabeledToolbarButton>
              ) : (
                <ShortcutTooltip label={tool.label} shortcut={shortcut}>
                  <IconButton
                    aria-label={shortcut ? `${tool.label} (${shortcut})` : tool.label}
                    aria-keyshortcuts={shortcut}
                    aria-pressed={isActive}
                    aria-expanded={isExpanded}
                    onClick={() => handleSelect(tool.id)}
                    sx={{
                      ...toolButtonSx,
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
                    <Icon sx={{ fontSize: TOOL_ICON_SIZE }} />
                  </IconButton>
                </ShortcutTooltip>
              )}
            </Box>
          );
        })}

        {!compact && <Divider orientation="vertical" flexItem sx={dividerSx} />}

        {playerToolsViewState && playerToolHandlers ? (
          <PinnedPlayerToolButtons
            pinnedTools={pinnedPlayerTools}
            viewState={playerToolsViewState}
            handlers={playerToolHandlers}
            compact={compact}
          />
        ) : null}

        {compact ? (
          <Box ref={moreToolsAnchorRef} sx={{ display: 'inline-flex', flexShrink: 0 }}>
            <LabeledToolbarButton
              label="More"
              active={toolsDrawerOpen}
              onClick={handleMoreToolsClick}
              ariaLabel="More tools"
              ariaPressed={toolsDrawerOpen}
              ariaExpanded={toolsDrawerOpen}
              buttonRef={moreToolsButtonRef}
            >
              <AddOutlinedIcon sx={{ fontSize: TOOL_ICON_SIZE }} />
            </LabeledToolbarButton>
          </Box>
        ) : (
          <Box ref={moreToolsAnchorRef} sx={{ display: 'inline-flex', flexShrink: 0 }}>
            <ShortcutTooltip label="More tools">
              <IconButton
                ref={moreToolsButtonRef}
                type="button"
                aria-label="More tools"
                aria-expanded={toolsDrawerOpen}
                aria-pressed={toolsDrawerOpen}
                onClick={handleMoreToolsClick}
                sx={{
                  ...toolButtonSx,
                  color: toolsDrawerOpen ? cv.textPrimary : cv.textSecondary,
                  backgroundColor: toolsDrawerOpen ? cv.surfaceHover : 'transparent',
                  border: toolsDrawerOpen ? '1px solid var(--noah-border)' : '1px solid transparent',
                  '&:hover': {
                    backgroundColor: cv.surfaceHover,
                    color: cv.textPrimary,
                  },
                }}
              >
                <AddOutlinedIcon sx={{ fontSize: TOOL_ICON_SIZE }} />
              </IconButton>
            </ShortcutTooltip>
          </Box>
        )}

        {!compact && <Divider orientation="vertical" flexItem sx={dividerSx} />}

        {compact ? (
          <>
            <LabeledToolbarButton
              label="Undo"
              disabled={!canUndo}
              onClick={onUndo}
              ariaLabel="Undo"
            >
              <UndoOutlinedIcon sx={{ fontSize: TOOL_ICON_SIZE }} />
            </LabeledToolbarButton>
            <LabeledToolbarButton
              label="Redo"
              disabled={!canRedo}
              onClick={onRedo}
              ariaLabel="Redo"
            >
              <RedoOutlinedIcon sx={{ fontSize: TOOL_ICON_SIZE }} />
            </LabeledToolbarButton>
          </>
        ) : (
          <>
            <ShortcutTooltip label="Undo" shortcut={undoShortcut}>
              <span>
                <IconButton
                  type="button"
                  aria-label="Undo"
                  disabled={!canUndo}
                  onClick={onUndo}
                  sx={{
                    ...toolButtonSx,
                    color: canUndo ? cv.textSecondary : cv.textMuted,
                    border: '1px solid transparent',
                    '&:hover': {
                      backgroundColor: canUndo ? cv.surfaceHover : undefined,
                      color: canUndo ? cv.textPrimary : cv.textMuted,
                    },
                    '&.Mui-disabled': {
                      color: cv.textMuted,
                    },
                  }}
                >
                  <UndoOutlinedIcon sx={{ fontSize: TOOL_ICON_SIZE }} />
                </IconButton>
              </span>
            </ShortcutTooltip>

            <ShortcutTooltip label="Redo" shortcut={redoShortcut}>
              <span>
                <IconButton
                  type="button"
                  aria-label="Redo"
                  disabled={!canRedo}
                  onClick={onRedo}
                  sx={{
                    ...toolButtonSx,
                    color: canRedo ? cv.textSecondary : cv.textMuted,
                    border: '1px solid transparent',
                    '&:hover': {
                      backgroundColor: canRedo ? cv.surfaceHover : undefined,
                      color: canRedo ? cv.textPrimary : cv.textMuted,
                    },
                    '&.Mui-disabled': {
                      color: cv.textMuted,
                    },
                  }}
                >
                  <RedoOutlinedIcon sx={{ fontSize: TOOL_ICON_SIZE }} />
                </IconButton>
              </span>
            </ShortcutTooltip>
          </>
        )}
        </Box>
      </Box>

      <SubToolbarContainer
        compact={compact}
        open={showDrawSubIsland}
        anchorRef={drawToolAnchorRef}
        mobilePlayerFooterRef={mobilePlayerFooterRef}
      >
        <DrawSubToolbar
          overlay={compact}
          activeDrawTool={activeDrawTool}
          onDrawToolChange={handleDrawToolChange}
          activeStroke={activeDrawStroke}
          onStrokeChange={handleDrawStrokeChange}
          activeColor={activeDrawColor}
          onColorChange={handleDrawColorChange}
        />
      </SubToolbarContainer>

      <SubToolbarContainer
        compact={compact}
        open={showShapeSubIsland}
        anchorRef={shapeToolAnchorRef}
        mobilePlayerFooterRef={mobilePlayerFooterRef}
      >
        <ShapeSubToolbar
          overlay={compact}
          activeShape={activeShape}
          onShapeSelect={handleShapeSelect}
          activeColor={activeColor}
          onColorChange={handleColorChange}
          activeStroke={activeShapeStroke}
          onStrokeChange={handleShapeStrokeChange}
        />
      </SubToolbarContainer>

      <SubToolbarContainer
        compact={compact}
        open={showStampSubIsland}
        anchorRef={stampToolAnchorRef}
        mobilePlayerFooterRef={mobilePlayerFooterRef}
      >
        <StampSubToolbar
          overlay={compact}
          activeStamp={activeStamp}
          customStamp={customStamp}
          onStampSelect={handleStampSelect}
          onAddCustomStamp={onAddCustomStamp}
        />
      </SubToolbarContainer>
    </Box>
  );
}

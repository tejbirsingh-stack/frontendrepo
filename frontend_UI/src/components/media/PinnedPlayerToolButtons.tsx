import { useState } from 'react';
import { cv } from '../../theme/cssVars';
import { Box, IconButton } from '@mui/material';
import LabeledToolbarButton from './LabeledToolbarButton';
import ShortcutTooltip from './ShortcutTooltip';
import { PLAYER_BACKGROUND_OPTIONS } from '../../constants/playerTools';
import type { PlayerBackground, PlayerToolHandlers, PlayerToolId, PlayerToolsViewState } from '../../types/playerTools';
import { getPlayerToolById, isPlayerToolActive } from '../../utils/playerToolUtils';
import {
  ANNOTATION_TOOL_BUTTON_SIZE,
  ANNOTATION_TOOL_ICON_SIZE,
} from '../../constants/layout';

const TOOL_BUTTON_SIZE = ANNOTATION_TOOL_BUTTON_SIZE;
const TOOL_ICON_SIZE = ANNOTATION_TOOL_ICON_SIZE;

const subMenuAnchorSx = {
  position: 'absolute',
  bottom: 'calc(100% + 12px)',
  left: '50%',
  transform: 'translateX(-50%)',
  zIndex: 30,
};

const subMenuSurfaceSx = {
  display: 'flex',
  flexDirection: 'column',
  gap: 0.25,
  px: 0.75,
  py: 0.75,
  borderRadius: '14px',
  border: "1px solid var(--noah-border)",
  background: 'var(--noah-drawer-surface)',
  backdropFilter: 'blur(24px) saturate(160%)',
  WebkitBackdropFilter: 'blur(24px) saturate(160%)',
  boxShadow: cv.islandShadowStrong,
  minWidth: 148,
};

const subMenuItemSx = {
  border: 'none',
  background: 'transparent',
  color: cv.textPrimary,
  borderRadius: '10px',
  px: 1.25,
  py: 0.75,
  fontSize: '0.875rem',
  fontWeight: 500,
  textAlign: 'left' as const,
  cursor: 'pointer',
  whiteSpace: 'nowrap' as const,
  '&:hover': {
    backgroundColor: cv.surfaceHover,
  },
};

interface PinnedPlayerToolButtonsProps {
  pinnedTools: PlayerToolId[];
  viewState: PlayerToolsViewState;
  handlers: PlayerToolHandlers;
  compact?: boolean;
}

export default function PinnedPlayerToolButtons({
  pinnedTools,
  viewState,
  handlers,
  compact = false,
}: PinnedPlayerToolButtonsProps) {
  const [expandedTool, setExpandedTool] = useState<PlayerToolId | null>(null);

  if (pinnedTools.length === 0) {
    return null;
  }

  const handleToolClick = (toolId: PlayerToolId) => {
    const tool = getPlayerToolById(toolId);
    if (!tool || tool.disabled) return;

    switch (toolId) {
      case 'player-background':
        setExpandedTool((current) =>
          current === 'player-background' ? null : 'player-background',
        );
        return;
      case 'audio-meter':
        setExpandedTool(null);
        handlers.onToggleAudioMeter();
        return;
      case 'set-in-point':
        setExpandedTool(null);
        handlers.onSetInPoint();
        return;
      case 'set-out-point':
        setExpandedTool(null);
        handlers.onSetOutPoint();
        return;
      case 'read-timecode':
        setExpandedTool(null);
        handlers.onReadTimecode();
        return;
      case 'toggle-range':
        setExpandedTool(null);
        handlers.onToggleRange();
        return;
      case 'loop':
        setExpandedTool(null);
        handlers.onToggleLoop();
        return;
      case 'flip':
        setExpandedTool(null);
        handlers.onToggleFlip();
        return;
      case 'flop':
        setExpandedTool(null);
        handlers.onToggleFlop();
        return;
      case 'rotate-left':
        setExpandedTool(null);
        handlers.onRotateLeft();
        return;
      case 'rotate-right':
        setExpandedTool(null);
        handlers.onRotateRight();
        return;
      case 'actual-media-size':
        setExpandedTool(null);
        handlers.onToggleActualMediaSize();
        return;
      default:
        return;
    }
  };

  return (
    <>
      {pinnedTools.map((toolId) => {
        const tool = getPlayerToolById(toolId);
        if (!tool || tool.pinnable === false) return null;

        const Icon = tool.icon;
        const active = isPlayerToolActive(toolId, viewState);
        const expanded = expandedTool === toolId;

        return (
          <Box key={toolId} sx={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            {toolId === 'player-background' && expanded ? (
              <Box sx={subMenuAnchorSx}>
                <Box sx={subMenuSurfaceSx}>
                  {PLAYER_BACKGROUND_OPTIONS.map((option) => (
                    <Box
                      key={option.value}
                      component="button"
                      type="button"
                      onClick={() => {
                        handlers.onPlayerBackgroundChange(option.value as PlayerBackground);
                        setExpandedTool(null);
                      }}
                      sx={{
                        ...subMenuItemSx,
                        backgroundColor:
                          viewState.playerBackground === option.value
                            ? cv.purpleSelectionHover
                            : 'transparent',
                        color:
                          viewState.playerBackground === option.value
                            ? cv.purpleLight
                            : cv.textPrimary,
                      }}
                    >
                      {option.label}
                    </Box>
                  ))}
                </Box>
              </Box>
            ) : null}

            {compact ? (
              <LabeledToolbarButton
                label={tool.label}
                active={active || expanded}
                disabled={tool.disabled}
                onClick={() => handleToolClick(toolId)}
                ariaLabel={tool.shortcut ? `${tool.label} (${tool.shortcut})` : tool.label}
                ariaPressed={active || expanded}
                ariaExpanded={tool.hasSubmenu ? expanded : undefined}
              >
                <Icon sx={{ fontSize: TOOL_ICON_SIZE }} />
              </LabeledToolbarButton>
            ) : (
              <ShortcutTooltip label={tool.label} shortcut={tool.shortcut}>
                <span>
                  <IconButton
                    type="button"
                    aria-label={tool.shortcut ? `${tool.label} (${tool.shortcut})` : tool.label}
                    aria-pressed={active || expanded}
                    aria-expanded={tool.hasSubmenu ? expanded : undefined}
                    disabled={tool.disabled}
                    onClick={() => handleToolClick(toolId)}
                    sx={{
                      width: TOOL_BUTTON_SIZE,
                      height: TOOL_BUTTON_SIZE,
                      borderRadius: { xs: '10px', lg: '12px' },
                      color: active || expanded ? cv.textPrimary : cv.textSecondary,
                      background:
                        active || expanded
                          ? cv.stampGradient
                          : 'transparent',
                      border:
                        active || expanded
                          ? `1px solid ${cv.purpleSelectionBorder}`
                          : '1px solid transparent',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        backgroundColor: active || expanded ? undefined : cv.surfaceHover,
                        color: cv.textPrimary,
                      },
                      '&.Mui-disabled': {
                        color: cv.textMuted,
                      },
                    }}
                  >
                    <Icon sx={{ fontSize: TOOL_ICON_SIZE }} />
                  </IconButton>
                </span>
              </ShortcutTooltip>
            )}
          </Box>
        );
      })}
    </>
  );
}

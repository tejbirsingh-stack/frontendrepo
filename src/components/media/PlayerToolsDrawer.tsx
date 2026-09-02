import { useEffect, useLayoutEffect, useState, type ReactNode, type RefObject } from 'react';
import { cv } from '../../theme/cssVars';
import { Box, Divider, IconButton, Popover, Tooltip, Typography } from '@mui/material';
import { getPortalTarget } from '../../utils/portalTarget';
import ChevronRightOutlinedIcon from '@mui/icons-material/ChevronRightOutlined';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import PushPinOutlinedIcon from '@mui/icons-material/PushPinOutlined';
import {
  PLAYER_BACKGROUND_OPTIONS,
  PLAYER_TOOL_SECTIONS,
  type PlayerToolDefinition,
} from '../../constants/playerTools';
import type { PlayerBackground, PlayerToolId, PlayerToolsViewState } from '../../types/playerTools';
import { isPlayerToolActive } from '../../utils/playerToolUtils';

interface PlayerToolsDrawerProps {
  open: boolean;
  anchorRef?: RefObject<HTMLElement | null>;
  onClose: () => void;
  pinnedTools: PlayerToolId[];
  onPinnedToolsChange: (toolIds: PlayerToolId[]) => void;
  viewState: PlayerToolsViewState;
  onToggleLoop: () => void;
  onToggleFlip: () => void;
  onToggleFlop: () => void;
  onRotateLeft: () => void;
  onRotateRight: () => void;
  onSetInPoint: () => void;
  onSetOutPoint: () => void;
  onReadTimecode: () => void;
  onToggleRange: () => void;
  onToggleAudioMeter: () => void;
  onToggleActualMediaSize: () => void;
  onPlayerBackgroundChange: (background: PlayerBackground) => void;
}

const drawerSurface = 'var(--noah-drawer-surface)';

const rowButtonSx = {
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  gap: 1.25,
  px: 1.5,
  py: 1.1,
  border: 'none',
  background: 'transparent',
  color: cv.textPrimary,
  cursor: 'pointer',
  textAlign: 'left' as const,
  '&:hover': {
    backgroundColor: cv.surfaceHover,
  },
  '&:disabled': {
    color: cv.textMuted,
    cursor: 'not-allowed',
    '&:hover': {
      backgroundColor: 'transparent',
    },
  },
};

const shortcutBadgeSx = {
  minWidth: 24,
  height: 22,
  px: 0.75,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '6px',
  backgroundColor: cv.surfaceRaised,
  color: cv.textSecondary,
  fontSize: '0.75rem',
  fontWeight: 600,
  lineHeight: 1,
};

function PinButton({
  pinned,
  disabled,
  onClick,
}: {
  pinned: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <Tooltip title={pinned ? 'Unpin tool' : 'Pin tool'} arrow placement="top">
      <span>
        <IconButton
          type="button"
          aria-label={pinned ? 'Unpin tool' : 'Pin tool'}
          aria-pressed={pinned}
          disabled={disabled}
          onClick={(event) => {
            event.stopPropagation();
            onClick();
          }}
          sx={{
            width: 32,
            height: 32,
            flexShrink: 0,
            color: pinned ? cv.textPrimary : cv.textMuted,
            backgroundColor: pinned ? cv.surfaceRaised : 'transparent',
            border: pinned ? "1px solid var(--noah-border)" : '1px solid transparent',
            '&:hover': {
              backgroundColor: pinned ? cv.surfaceActive : cv.surfaceHover,
              color: cv.textPrimary,
            },
            '&.Mui-disabled': {
              color: cv.textMuted,
              opacity: 0.45,
            },
          }}
        >
          <PushPinOutlinedIcon
            sx={{
              fontSize: 16,
              transform: pinned ? 'rotate(0deg)' : 'rotate(45deg)',
              transition: 'transform 0.15s ease',
            }}
          />
        </IconButton>
      </span>
    </Tooltip>
  );
}

function ToolRow({
  tool,
  pinned,
  active,
  expanded,
  onTogglePin,
  onClick,
  children,
}: {
  tool: PlayerToolDefinition;
  pinned: boolean;
  active?: boolean;
  expanded?: boolean;
  onTogglePin: () => void;
  onClick: () => void;
  children?: ReactNode;
}) {
  const Icon = tool.icon;

  return (
    <Box>
      <Box
        component="button"
        type="button"
        disabled={tool.disabled}
        onClick={onClick}
        sx={{
          ...rowButtonSx,
          backgroundColor: active ? cv.dividerSubtle : 'transparent',
        }}
      >
        <Icon sx={{ fontSize: 20, color: tool.disabled ? cv.textMuted : cv.textSecondary }} />
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <Typography
            noWrap
            sx={{
              fontSize: '0.9375rem',
              fontWeight: 500,
              color: tool.disabled ? cv.textMuted : cv.textPrimary,
              lineHeight: tool.description ? 1.2 : 'inherit',
            }}
          >
            {tool.label}
          </Typography>
          {tool.description && (
            <Typography
              sx={{
                fontSize: '0.75rem',
                color: cv.textMuted,
                mt: 0.25,
              }}
            >
              {tool.description}
            </Typography>
          )}
        </Box>
        {tool.shortcut ? <Box sx={shortcutBadgeSx}>{tool.shortcut}</Box> : null}
        {tool.hasSubmenu ? (
          <ChevronRightOutlinedIcon
            sx={{
              fontSize: 18,
              color: cv.textMuted,
              transform: expanded ? 'rotate(90deg)' : 'none',
              transition: 'transform 0.15s ease',
            }}
          />
        ) : null}
        <PinButton pinned={pinned} disabled={tool.disabled} onClick={onTogglePin} />
      </Box>
      {children}
    </Box>
  );
}

export default function PlayerToolsDrawer({
  open,
  anchorRef,
  onClose,
  pinnedTools,
  onPinnedToolsChange,
  viewState,
  onToggleLoop,
  onToggleFlip,
  onToggleFlop,
  onRotateLeft,
  onRotateRight,
  onSetInPoint,
  onSetOutPoint,
  onReadTimecode,
  onToggleRange,
  onToggleAudioMeter,
  onToggleActualMediaSize,
  onPlayerBackgroundChange,
}: PlayerToolsDrawerProps) {
  const [expandedTool, setExpandedTool] = useState<PlayerToolId | null>(null);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  useLayoutEffect(() => {
    if (!open) {
      setAnchorEl(null);
      return;
    }

    const resolveAnchor = () => {
      setAnchorEl(anchorRef?.current ?? null);
    };

    resolveAnchor();
    const rafId = window.requestAnimationFrame(resolveAnchor);
    window.addEventListener('resize', resolveAnchor);
    window.addEventListener('scroll', resolveAnchor, true);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resolveAnchor);
      window.removeEventListener('scroll', resolveAnchor, true);
    };
  }, [open, anchorRef]);

  const isPopoverOpen = open && Boolean(anchorEl);

  useEffect(() => {
    if (!open) {
      setExpandedTool(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  const togglePin = (toolId: PlayerToolId) => {
    onPinnedToolsChange(
      pinnedTools.includes(toolId)
        ? pinnedTools.filter((id) => id !== toolId)
        : [...pinnedTools, toolId],
    );
  };

  const handleToolClick = (tool: PlayerToolDefinition) => {
    if (tool.disabled) return;

    switch (tool.id) {
      case 'player-background':
        setExpandedTool((current) => (current === 'player-background' ? null : 'player-background'));
        return;
      case 'audio-meter':
        onToggleAudioMeter();
        return;
      case 'set-in-point':
        onSetInPoint();
        return;
      case 'set-out-point':
        onSetOutPoint();
        return;
      case 'read-timecode':
        onReadTimecode();
        return;
      case 'toggle-range':
        onToggleRange();
        return;
      case 'loop':
        onToggleLoop();
        return;
      case 'flip':
        onToggleFlip();
        return;
      case 'flop':
        onToggleFlop();
        return;
      case 'rotate-left':
        onRotateLeft();
        return;
      case 'rotate-right':
        onRotateRight();
        return;
      case 'actual-media-size':
        onToggleActualMediaSize();
        return;
      default:
        return;
    }
  };

  return (
    <>
      {isPopoverOpen ? (
        <Box
          aria-hidden
          onClick={onClose}
          sx={{
            position: 'fixed',
            inset: 0,
            zIndex: 24,
            backgroundColor: cv.inkOverlay35,
            backdropFilter: 'blur(2px)',
          }}
        />
      ) : null}

      <Popover
        container={getPortalTarget}
        open={isPopoverOpen}
        anchorEl={anchorEl}
        onClose={onClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        marginThreshold={16}
        slotProps={{
          root: { sx: { zIndex: 25 } },
          paper: {
            elevation: 0,
            sx: {
              width: { xs: 'min(300px, calc(100vw - 24px))', sm: 300 },
              display: 'flex',
              flexDirection: 'column',
              borderRadius: '16px',
              border: "1px solid var(--noah-border)",
              background: drawerSurface,
              backdropFilter: 'blur(24px) saturate(160%)',
              WebkitBackdropFilter: 'blur(24px) saturate(160%)',
              boxShadow: cv.popoverShadow,
              overflow: 'hidden',
              maxHeight: 'min(70vh, calc(100vh - 180px))',
              mt: -1.5,
            },
          },
        }}
      >
      <Box component="aside" aria-label="Player tools" sx={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1,
          px: 1.5,
          py: 1.25,
        }}
      >
        <Typography sx={{ fontSize: '1rem', fontWeight: 600, color: cv.textPrimary }}>
          Tools
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box
            component="button"
            type="button"
            onClick={() => onPinnedToolsChange([])}
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.75,
              border: 'none',
              background: 'transparent',
              color: cv.textSecondary,
              fontSize: '0.8125rem',
              fontWeight: 500,
              cursor: 'pointer',
              px: 0.75,
              py: 0.5,
              borderRadius: '8px',
              '&:hover': {
                backgroundColor: cv.surfaceHover,
                color: cv.textPrimary,
              },
            }}
          >
            Un-pin all tools
            <PushPinOutlinedIcon sx={{ fontSize: 16, transform: 'rotate(45deg)' }} />
          </Box>

          <Tooltip title="Close tools" arrow placement="top">
            <IconButton
              type="button"
              aria-label="Close tools"
              onClick={onClose}
              sx={{ color: cv.textSecondary }}
            >
              <CloseOutlinedIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Divider sx={{ borderColor: cv.border }} />

      <Box sx={{ flex: 1, overflowY: 'auto', py: 0.5 }}>
        {PLAYER_TOOL_SECTIONS.map((section, sectionIndex) => (
          <Box key={section.map((tool) => tool.id).join('-')}>
            {section.map((tool) => (
              <ToolRow
                key={tool.id}
                tool={tool}
                pinned={pinnedTools.includes(tool.id)}
                active={isPlayerToolActive(tool.id, viewState)}
                expanded={expandedTool === tool.id}
                onTogglePin={() => togglePin(tool.id)}
                onClick={() => handleToolClick(tool)}
              >
                {tool.id === 'player-background' && expandedTool === 'player-background' ? (
                  <Box sx={{ px: 1.5, pb: 1 }}>
                    {PLAYER_BACKGROUND_OPTIONS.map((option) => (
                      <Box
                        key={option.value}
                        component="button"
                        type="button"
                        onClick={() => onPlayerBackgroundChange(option.value)}
                        sx={{
                          ...rowButtonSx,
                          py: 0.85,
                          borderRadius: '10px',
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
                        <Typography sx={{ fontSize: '0.875rem', fontWeight: 500 }}>
                          {option.label}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                ) : null}
              </ToolRow>
            ))}

            {sectionIndex < PLAYER_TOOL_SECTIONS.length - 1 ? (
              <Divider sx={{ my: 0.5, borderColor: cv.border }} />
            ) : null}
          </Box>
        ))}
      </Box>
      </Box>
      </Popover>
    </>
  );
}

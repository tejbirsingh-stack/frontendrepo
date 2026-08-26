import { useEffect, type ReactNode } from 'react';
import { cv } from '../../theme/cssVars';
import { Box, Divider, IconButton, Typography } from '@mui/material';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import RemoveOutlinedIcon from '@mui/icons-material/RemoveOutlined';
import LabeledToolbarButton from './LabeledToolbarButton';
import ShortcutTooltip from './ShortcutTooltip';
import {
  shouldBlockAnnotationShortcuts,
  workspaceZoomShortcuts,
} from '../../constants/annotationShortcuts';
import { useResolvedKeyboardShortcuts } from '../../hooks/useResolvedKeyboardShortcuts';
import { matchesKeyboardShortcut } from '../../utils/matchKeyboardShortcut';
import {
  WORKSPACE_CONTROL_ICON_SIZE,
  WORKSPACE_CONTROL_SIZE,
} from '../../constants/layout';

const CONTROL_SIZE = WORKSPACE_CONTROL_SIZE;
const ICON_SIZE = WORKSPACE_CONTROL_ICON_SIZE;

const surfaceSx = {
  border: '1px solid var(--noah-border)',
  background: 'var(--noah-toolbar-surface)',
  backdropFilter: 'blur(24px) saturate(160%)',
  WebkitBackdropFilter: 'blur(24px) saturate(160%)',
  boxShadow: cv.islandShadow,
};

const controlButtonSx = {
  width: CONTROL_SIZE,
  height: CONTROL_SIZE,
  borderRadius: 0,
  color: cv.textSecondary,
  '&:hover': {
    backgroundColor: cv.surfaceHover,
    color: cv.textPrimary,
  },
  '&.Mui-disabled': {
    color: cv.textMuted,
  },
};

const dividerSx = {
  borderColor: cv.surfaceActive,
  height: { xs: 16, lg: 20 },
  alignSelf: 'center',
};

interface WorkspaceControlsIslandProps {
  zoomLabel?: string;
  canZoomOut: boolean;
  canZoomIn: boolean;
  canResetZoom?: boolean;
  onZoomOut: () => void;
  onZoomIn: () => void;
  onZoomReset?: () => void;
  compact?: boolean;
  /** Rendered after the zoom controls in the compact (mobile) layout. */
  trailingContent?: ReactNode;
  hideZoomControls?: boolean;
}

export default function WorkspaceControlsIsland({
  zoomLabel = '100%',
  canZoomOut,
  canZoomIn,
  canResetZoom = false,
  onZoomOut,
  onZoomIn,
  onZoomReset,
  compact = false,
  trailingContent,
  hideZoomControls = false,
}: WorkspaceControlsIslandProps) {
  const { getShortcut } = useResolvedKeyboardShortcuts();

  const zoomInShortcut = getShortcut('workspace-zoom-in') ?? workspaceZoomShortcuts.in;
  const zoomOutShortcut = getShortcut('workspace-zoom-out') ?? workspaceZoomShortcuts.out;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (shouldBlockAnnotationShortcuts(event.target)) return;

      if (matchesKeyboardShortcut(event, zoomInShortcut) && canZoomIn) {
        event.preventDefault();
        onZoomIn();
      } else if (matchesKeyboardShortcut(event, zoomOutShortcut) && canZoomOut) {
        event.preventDefault();
        onZoomOut();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canZoomIn, canZoomOut, onZoomIn, onZoomOut, zoomInShortcut, zoomOutShortcut]);

  if (compact) {
    return (
      <>
        {!hideZoomControls && (
          <>
            <LabeledToolbarButton
              label="Zoom out"
              disabled={!canZoomOut}
              onClick={onZoomOut}
              ariaLabel="Zoom out"
            >
              <RemoveOutlinedIcon sx={{ fontSize: ICON_SIZE }} />
            </LabeledToolbarButton>
            <Box
              aria-live="polite"
              sx={{
                minWidth: 44,
                px: 0.5,
                textAlign: 'center',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: cv.textPrimary,
              }}
            >
              {zoomLabel}
            </Box>
            <LabeledToolbarButton
              label="Zoom in"
              disabled={!canZoomIn}
              onClick={onZoomIn}
              ariaLabel="Zoom in"
            >
              <AddOutlinedIcon sx={{ fontSize: ICON_SIZE }} />
            </LabeledToolbarButton>
            {onZoomReset ? (
              <LabeledToolbarButton
                label="Reset zoom"
                disabled={!canResetZoom}
                onClick={onZoomReset}
                ariaLabel="Reset zoom"
              >
                <HistoryOutlinedIcon sx={{ fontSize: ICON_SIZE }} />
              </LabeledToolbarButton>
            ) : null}
          </>
        )}
        {trailingContent}
      </>
    );
  }

  return (
    <Box
      role="toolbar"
      aria-label="Workspace controls"
      sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, lg: 1 } }}
    >
      {!hideZoomControls && (
        <Box
          sx={{
            ...surfaceSx,
            display: 'flex',
            alignItems: 'center',
            borderRadius: '999px',
            overflow: 'hidden',
          }}
        >
          <ShortcutTooltip label="Zoom out" shortcut={zoomOutShortcut}>
            <span>
              <IconButton
                type="button"
                aria-label="Zoom out"
                disabled={!canZoomOut}
                onClick={onZoomOut}
                sx={controlButtonSx}
              >
                <RemoveOutlinedIcon sx={{ fontSize: ICON_SIZE }} />
              </IconButton>
            </span>
          </ShortcutTooltip>

          <Divider orientation="vertical" flexItem sx={dividerSx} />

          <Typography
            component="span"
            aria-live="polite"
            aria-label={`Zoom ${zoomLabel}`}
            sx={{
              minWidth: 52,
              px: 1,
              textAlign: 'center',
              fontSize: '0.8125rem',
              fontWeight: 600,
              color: cv.textPrimary,
              userSelect: 'none',
            }}
          >
            {zoomLabel}
          </Typography>

          <Divider orientation="vertical" flexItem sx={dividerSx} />

          <ShortcutTooltip label="Zoom in" shortcut={zoomInShortcut}>
            <span>
              <IconButton
                type="button"
                aria-label="Zoom in"
                disabled={!canZoomIn}
                onClick={onZoomIn}
                sx={controlButtonSx}
              >
                <AddOutlinedIcon sx={{ fontSize: ICON_SIZE }} />
              </IconButton>
            </span>
          </ShortcutTooltip>

          {onZoomReset ? (
            <>
              <Divider orientation="vertical" flexItem sx={dividerSx} />
              <ShortcutTooltip label="Reset zoom">
                <span>
                  <IconButton
                    type="button"
                    aria-label="Reset zoom"
                    disabled={!canResetZoom}
                    onClick={onZoomReset}
                    sx={controlButtonSx}
                  >
                    <HistoryOutlinedIcon sx={{ fontSize: ICON_SIZE }} />
                  </IconButton>
                </span>
              </ShortcutTooltip>
            </>
          ) : null}
        </Box>
      )}
    </Box>
  );
}

import {
  PLAYER_BACKGROUND_OPTIONS,
  PLAYER_TOOL_SECTIONS,
  type PlayerToolDefinition,
} from '../constants/playerTools';
import type { PlayerToolHandlers, PlayerToolId, PlayerToolsViewState } from '../types/playerTools';
import { matchesKeyboardShortcut } from './matchKeyboardShortcut';

const playerToolById = new Map<PlayerToolId, PlayerToolDefinition>(
  PLAYER_TOOL_SECTIONS.flat().map((tool) => [tool.id, tool]),
);

const playerToolIdByShortcut = new Map<string, PlayerToolId>(
  PLAYER_TOOL_SECTIONS.flat()
    .filter((tool): tool is PlayerToolDefinition & { shortcut: string } => Boolean(tool.shortcut))
    .map((tool) => [tool.shortcut.toLowerCase(), tool.id]),
);

export function getPlayerToolById(toolId: PlayerToolId): PlayerToolDefinition | undefined {
  return playerToolById.get(toolId);
}

export function getPlayerToolIdFromShortcut(key: string): PlayerToolId | null {
  return playerToolIdByShortcut.get(key.toLowerCase()) ?? null;
}

export function getPlayerToolIdFromEvent(
  event: KeyboardEvent,
  resolvedShortcuts: Map<PlayerToolId, string>,
): PlayerToolId | null {
  for (const [toolId, shortcut] of resolvedShortcuts) {
    if (matchesKeyboardShortcut(event, shortcut)) {
      return toolId;
    }
  }
  return null;
}

export function buildDefaultPlayerToolShortcutMap(): Map<PlayerToolId, string> {
  return new Map(
    PLAYER_TOOL_SECTIONS.flat()
      .filter((tool): tool is PlayerToolDefinition & { shortcut: string } => Boolean(tool.shortcut))
      .map((tool) => [tool.id, tool.shortcut]),
  );
}

export function runPlayerToolAction(
  toolId: PlayerToolId,
  handlers: PlayerToolHandlers,
  viewState: PlayerToolsViewState,
): boolean {
  const tool = getPlayerToolById(toolId);
  if (!tool || tool.disabled) return false;

  switch (toolId) {
    case 'audio-meter':
      handlers.onToggleAudioMeter();
      return true;
    case 'set-in-point':
      handlers.onSetInPoint();
      return true;
    case 'set-out-point':
      handlers.onSetOutPoint();
      return true;
    case 'read-timecode':
      handlers.onReadTimecode();
      return true;
    case 'toggle-range':
      handlers.onToggleRange();
      return true;
    case 'loop':
      handlers.onToggleLoop();
      return true;
    case 'flip':
      handlers.onToggleFlip();
      return true;
    case 'flop':
      handlers.onToggleFlop();
      return true;
    case 'rotate-left':
      handlers.onRotateLeft();
      return true;
    case 'rotate-right':
      handlers.onRotateRight();
      return true;
    case 'actual-media-size':
      handlers.onToggleActualMediaSize();
      return true;
    case 'player-background': {
      const currentIndex = PLAYER_BACKGROUND_OPTIONS.findIndex(
        (option) => option.value === viewState.playerBackground,
      );
      const nextIndex = (currentIndex + 1) % PLAYER_BACKGROUND_OPTIONS.length;
      handlers.onPlayerBackgroundChange(PLAYER_BACKGROUND_OPTIONS[nextIndex].value);
      return true;
    }
    default:
      return false;
  }
}

export function isPlayerToolActive(
  toolId: PlayerToolId,
  viewState: PlayerToolsViewState,
): boolean {
  switch (toolId) {
    case 'loop':
      return viewState.loop;
    case 'flip':
      return viewState.flipHorizontal;
    case 'flop':
      return viewState.flipVertical;
    case 'toggle-range':
      return viewState.rangeEnabled;
    case 'audio-meter':
      return viewState.showAudioMeter;
    case 'actual-media-size':
      return viewState.actualMediaSize;
    default:
      return false;
  }
}

import {
  AVAILABLE_PLAYER_TOOL_IDS,
  DEFAULT_PINNED_PLAYER_TOOLS,
} from '../constants/playerTools';
import type { PlayerToolId } from '../types/playerTools';

const STORAGE_KEY = 'noah-pinned-player-tools';

function sanitizePinnedTools(toolIds: PlayerToolId[]): PlayerToolId[] {
  return toolIds.filter((id) => AVAILABLE_PLAYER_TOOL_IDS.has(id));
}

export function loadPinnedPlayerTools(): PlayerToolId[] {
  if (typeof window === 'undefined') return [...DEFAULT_PINNED_PLAYER_TOOLS];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [...DEFAULT_PINNED_PLAYER_TOOLS];

    const parsed = JSON.parse(raw) as PlayerToolId[];
    if (!Array.isArray(parsed)) return [...DEFAULT_PINNED_PLAYER_TOOLS];

    return sanitizePinnedTools(parsed);
  } catch {
    return [...DEFAULT_PINNED_PLAYER_TOOLS];
  }
}

export function savePinnedPlayerTools(toolIds: PlayerToolId[]) {
  if (typeof window === 'undefined') return;

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(toolIds));
}

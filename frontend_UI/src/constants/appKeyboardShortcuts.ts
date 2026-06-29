import {
  annotationToolShortcuts,
  drawToolShortcuts,
  getRedoShortcutLabel,
  getUndoShortcutLabel,
  shapeToolShortcuts,
  workspaceZoomShortcuts,
} from './annotationShortcuts';
import { getDashboardShortcutDefinitions } from './dashboardShortcuts';
import { PLAYER_TOOL_SECTIONS } from './playerTools';
import { timelineZoomShortcuts } from '../utils/timelineZoom';
import { getHelpMenuShortcutLabel } from '../components/media/HelpMenuDrawer';

export interface KeyboardShortcutEntry {
  id: string;
  label: string;
  shortcut: string;
  description?: string;
  section?: string;
}

export interface KeyboardShortcutCategory {
  id: string;
  label: string;
  shortcuts: KeyboardShortcutEntry[];
}

const annotationToolLabels: Record<string, string> = {
  select: 'Select tool',
  pan: 'Pan tool',
  draw: 'Draw tool',
  shape: 'Shape tool',
  comment: 'Comment tool',
  stamp: 'Stamp tool',
};

const drawToolLabels: Record<string, string> = {
  pencil: 'Pencil',
  highlighter: 'Highlighter',
  grid: 'Grid',
  eraser: 'Eraser',
};

const shapeToolLabels: Record<string, string> = {
  'elbow-connector': 'Elbow connector',
  'curved-connector': 'Curved connector',
  'straight-arrow': 'Straight arrow',
  line: 'Line',
  rectangle: 'Rectangle',
  circle: 'Circle',
  diamond: 'Diamond',
  'triangle-up': 'Triangle',
  'triangle-down': 'Inverted triangle',
};

export const KEYBOARD_SHORTCUTS_STORAGE_KEY = 'noah-keyboard-shortcut-overrides';

export function buildDefaultKeyboardShortcutCatalog(): KeyboardShortcutCategory[] {
  const dashboardShortcuts: KeyboardShortcutEntry[] = [
    ...getDashboardShortcutDefinitions().map((row) => ({
      id: row.id,
      label: row.label,
      shortcut: row.shortcut,
      section: 'Search & selection',
    })),
  ];

  const annotationTools: KeyboardShortcutEntry[] = Object.entries(annotationToolShortcuts).map(
    ([tool, shortcut]) => ({
      id: `annotation-tool-${tool}`,
      label: annotationToolLabels[tool] ?? tool,
      shortcut,
      section: 'Annotation tools',
    }),
  );

  const drawTools: KeyboardShortcutEntry[] = Object.entries(drawToolShortcuts).map(
    ([tool, shortcut]) => ({
      id: `draw-tool-${tool}`,
      label: drawToolLabels[tool] ?? tool,
      shortcut,
      description: 'Active while Draw tool is selected.',
      section: 'Draw tools',
    }),
  );

  const shapeTools: KeyboardShortcutEntry[] = Object.entries(shapeToolShortcuts).map(
    ([tool, shortcut]) => ({
      id: `shape-tool-${tool}`,
      label: shapeToolLabels[tool] ?? tool,
      shortcut,
      description: 'Active while Shape tool is selected.',
      section: 'Shape tools',
    }),
  );

  const zoomAndHistory: KeyboardShortcutEntry[] = [
    {
      id: 'workspace-zoom-in',
      label: 'Workspace zoom in',
      shortcut: workspaceZoomShortcuts.in,
      section: 'Zoom',
    },
    {
      id: 'workspace-zoom-out',
      label: 'Workspace zoom out',
      shortcut: workspaceZoomShortcuts.out,
      section: 'Zoom',
    },
    {
      id: 'timeline-zoom-in',
      label: 'Timeline zoom in',
      shortcut: timelineZoomShortcuts.in,
      description: 'While pointer is over the timeline.',
      section: 'Zoom',
    },
    {
      id: 'timeline-zoom-out',
      label: 'Timeline zoom out',
      shortcut: timelineZoomShortcuts.out,
      description: 'While pointer is over the timeline.',
      section: 'Zoom',
    },
    {
      id: 'timeline-pinch-zoom',
      label: 'Timeline pinch zoom',
      shortcut: 'Pinch / Ctrl + scroll',
      description: 'Trackpad pinch or Ctrl + mouse wheel over the timeline.',
      section: 'Zoom',
    },
    {
      id: 'annotation-undo',
      label: 'Undo annotation',
      shortcut: getUndoShortcutLabel(),
      section: 'History',
    },
    {
      id: 'annotation-redo',
      label: 'Redo annotation',
      shortcut: getRedoShortcutLabel(),
      section: 'History',
    },
  ];

  const playerTools: KeyboardShortcutEntry[] = PLAYER_TOOL_SECTIONS.flat()
    .filter((tool) => Boolean(tool.shortcut))
    .map((tool) => ({
      id: `player-tool-${tool.id}`,
      label: tool.label,
      shortcut: tool.shortcut!,
      section: 'Player tools',
      description: tool.disabled ? 'Coming soon' : undefined,
    }));

  const mediaPlayerShortcuts = [
    ...annotationTools,
    ...drawTools,
    ...shapeTools,
    ...zoomAndHistory,
    ...playerTools,
    {
      id: 'media-open-help',
      label: 'Open help menu',
      shortcut: getHelpMenuShortcutLabel(),
      section: 'Help',
    },
    {
      id: 'media-open-shortcuts',
      label: 'Open keyboard shortcuts dialog',
      shortcut: 'Help menu → Keyboard shortcuts',
      section: 'Help',
    },
  ];

  const commentShortcuts: KeyboardShortcutEntry[] = [
    {
      id: 'comment-post',
      label: 'Post comment or reply',
      shortcut: 'Enter',
      description: 'Submit the active comment or reply.',
      section: 'Comments',
    },
    {
      id: 'comment-newline',
      label: 'New line in comment',
      shortcut: '⇧ Enter',
      section: 'Comments',
    },
    {
      id: 'comment-cancel',
      label: 'Cancel comment or close thread',
      shortcut: 'Esc',
      section: 'Comments',
    },
    {
      id: 'comment-dismiss-marker',
      label: 'Dismiss comment marker menu',
      shortcut: 'Esc',
      section: 'Comments',
    },
  ];

  const globalShortcuts: KeyboardShortcutEntry[] = [
    {
      id: 'global-close-overlay',
      label: 'Close open menu or dialog',
      shortcut: 'Esc',
      section: 'General',
    },
    {
      id: 'global-profile-menu',
      label: 'Close profile menu',
      shortcut: 'Esc',
      section: 'General',
    },
  ];

  return [
    { id: 'dashboard', label: 'Dashboard', shortcuts: dashboardShortcuts },
    { id: 'media-player', label: 'Media Player', shortcuts: mediaPlayerShortcuts },
    { id: 'comments', label: 'Comments', shortcuts: commentShortcuts },
    { id: 'global', label: 'Global', shortcuts: globalShortcuts },
  ];
}

export type KeyboardShortcutOverride = {
  label?: string;
  shortcut?: string;
};

export type KeyboardShortcutOverrides = Record<string, KeyboardShortcutOverride>;

export function mergeKeyboardShortcutCatalog(
  catalog: KeyboardShortcutCategory[],
  overrides: KeyboardShortcutOverrides,
): KeyboardShortcutCategory[] {
  return catalog.map((category) => ({
    ...category,
    shortcuts: category.shortcuts.map((entry) => {
      const override = overrides[entry.id];
      if (!override) return entry;
      return {
        ...entry,
        label: override.label?.trim() || entry.label,
        shortcut: override.shortcut?.trim() || entry.shortcut,
      };
    }),
  }));
}

export function flattenKeyboardShortcuts(
  catalog: KeyboardShortcutCategory[],
): KeyboardShortcutEntry[] {
  return catalog.flatMap((category) => category.shortcuts);
}

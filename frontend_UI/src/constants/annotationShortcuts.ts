import type { AnnotationTool } from '../components/media/AnnotationToolbar';
import type { DrawTool } from '../components/media/DrawSubToolbar';
import type { ShapeTool } from '../components/media/ShapeSubToolbar';

export const annotationToolShortcuts: Record<AnnotationTool, string> = {
  select: 'V',
  pan: 'H',
  draw: 'D',
  shape: 'S',
  comment: 'C',
  stamp: 'E',
};

export const workspaceZoomShortcuts = {
  in: '+',
  out: '-',
} as const;

export const drawToolShortcuts: Record<DrawTool, string> = {
  pencil: '1',
  highlighter: '2',
  grid: '3',
  eraser: '4',
};

export const shapeToolShortcuts: Record<ShapeTool, string> = {
  'elbow-connector': '1',
  'curved-connector': '2',
  'straight-arrow': '3',
  line: '4',
  rectangle: '5',
  circle: '6',
  diamond: '7',
  'triangle-up': '8',
  'triangle-down': '9',
};

const toolByShortcutKey = Object.entries(annotationToolShortcuts).reduce(
  (map, [tool, shortcut]) => {
    map[shortcut.toLowerCase()] = tool as AnnotationTool;
    return map;
  },
  {} as Record<string, AnnotationTool>,
);

export function getAnnotationToolFromShortcut(key: string): AnnotationTool | null {
  return toolByShortcutKey[key.toLowerCase()] ?? null;
}

export function getWorkspaceZoomDirectionFromShortcut(
  key: string,
): keyof typeof workspaceZoomShortcuts | null {
  if (key === '+' || key === '=') return 'in';
  if (key === '-') return 'out';
  return null;
}

export function getDrawToolFromShortcut(key: string): DrawTool | null {
  const entry = Object.entries(drawToolShortcuts).find(([, shortcut]) => shortcut === key);
  return entry ? (entry[0] as DrawTool) : null;
}

export function getShapeToolFromShortcut(key: string): ShapeTool | null {
  const entry = Object.entries(shapeToolShortcuts).find(([, shortcut]) => shortcut === key);
  return entry ? (entry[0] as ShapeTool) : null;
}

export function isEditableKeyboardTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return (
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT' ||
    target.isContentEditable
  );
}

export function getUndoShortcutLabel(): string {
  const isMac =
    typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.platform);
  return isMac ? '⌘Z' : 'Ctrl+Z';
}

export function getRedoShortcutLabel(): string {
  const isMac =
    typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.platform);
  return isMac ? '⌘⇧Z' : 'Ctrl+Shift+Z';
}

export function shouldBlockAnnotationShortcuts(eventTarget?: EventTarget | null): boolean {
  const candidates = [eventTarget, document.activeElement].filter(
    (target): target is EventTarget => target != null,
  );

  return candidates.some((target) => {
    if (isEditableKeyboardTarget(target)) return true;
    return (
      target instanceof HTMLElement &&
      Boolean(
        target.closest('[data-comment-marker], [data-comment-thread], [data-comment-reply-editor]'),
      )
    );
  });
}

import { useEffect, useMemo } from 'react';
import type { AnnotationTool } from '../components/media/AnnotationToolbar';
import type { DrawTool } from '../components/media/DrawSubToolbar';
import type { ShapeTool } from '../components/media/ShapeSubToolbar';
import {
  annotationToolShortcuts,
  drawToolShortcuts,
  shapeToolShortcuts,
  shouldBlockAnnotationShortcuts,
} from '../constants/annotationShortcuts';
import { matchesKeyboardShortcut } from '../utils/matchKeyboardShortcut';
import { useResolvedKeyboardShortcuts } from './useResolvedKeyboardShortcuts';

interface UseAnnotationKeyboardShortcutsOptions {
  activeTool: AnnotationTool;
  drawPanelOpen: boolean;
  shapePanelOpen: boolean;
  disabled?: boolean;
  onSelectTool: (tool: AnnotationTool) => void;
  onDrawToolChange: (tool: DrawTool) => void;
  onShapeToolChange: (tool: ShapeTool) => void;
}

function buildToolBindings<T extends string>(
  prefix: string,
  defaults: Record<T, string>,
  getShortcut: (id: string) => string | undefined,
) {
  return (Object.keys(defaults) as T[]).map((tool) => ({
    tool,
    shortcut: getShortcut(`${prefix}${tool}`) ?? defaults[tool],
  }));
}

export function useAnnotationKeyboardShortcuts({
  activeTool,
  drawPanelOpen,
  shapePanelOpen,
  disabled = false,
  onSelectTool,
  onDrawToolChange,
  onShapeToolChange,
}: UseAnnotationKeyboardShortcutsOptions) {
  const { getShortcut } = useResolvedKeyboardShortcuts();

  const annotationBindings = useMemo(
    () => buildToolBindings('annotation-tool-', annotationToolShortcuts, getShortcut),
    [getShortcut],
  );
  const drawBindings = useMemo(
    () => buildToolBindings('draw-tool-', drawToolShortcuts, getShortcut),
    [getShortcut],
  );
  const shapeBindings = useMemo(
    () => buildToolBindings('shape-tool-', shapeToolShortcuts, getShortcut),
    [getShortcut],
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (disabled || shouldBlockAnnotationShortcuts(event.target)) return;

      if (shapePanelOpen || activeTool === 'shape') {
        for (const binding of shapeBindings) {
          if (matchesKeyboardShortcut(event, binding.shortcut)) {
            event.preventDefault();
            onShapeToolChange(binding.tool);
            return;
          }
        }
      }

      if (drawPanelOpen || activeTool === 'draw') {
        for (const binding of drawBindings) {
          if (matchesKeyboardShortcut(event, binding.shortcut)) {
            event.preventDefault();
            onDrawToolChange(binding.tool);
            return;
          }
        }
      }

      for (const binding of annotationBindings) {
        if (matchesKeyboardShortcut(event, binding.shortcut)) {
          event.preventDefault();
          onSelectTool(binding.tool);
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    activeTool,
    annotationBindings,
    disabled,
    drawBindings,
    drawPanelOpen,
    onDrawToolChange,
    onSelectTool,
    onShapeToolChange,
    shapeBindings,
    shapePanelOpen,
  ]);
}

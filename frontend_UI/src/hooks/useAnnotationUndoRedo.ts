import { useCallback, useRef, useState } from 'react';
import type { AnnotationSnapshot } from '../types/annotationSnapshot';

const MAX_UNDO_STEPS = 50;

function cloneSnapshot(snapshot: AnnotationSnapshot): AnnotationSnapshot {
  return structuredClone(snapshot);
}

function snapshotsEqual(a: AnnotationSnapshot, b: AnnotationSnapshot): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function useAnnotationUndoRedo() {
  const [undoStack, setUndoStack] = useState<AnnotationSnapshot[]>([]);
  const [redoStack, setRedoStack] = useState<AnnotationSnapshot[]>([]);
  const isRestoringRef = useRef(false);

  const resetStacks = useCallback(() => {
    setUndoStack([]);
    setRedoStack([]);
  }, []);

  const pushSnapshot = useCallback((snapshot: AnnotationSnapshot) => {
    if (isRestoringRef.current) return;

    setUndoStack((current) => {
      const last = current[current.length - 1];
      if (last && snapshotsEqual(last, snapshot)) return current;

      const next = [...current, cloneSnapshot(snapshot)];
      return next.length > MAX_UNDO_STEPS ? next.slice(next.length - MAX_UNDO_STEPS) : next;
    });
    setRedoStack([]);
  }, []);

  const undo = useCallback(
    (current: AnnotationSnapshot): AnnotationSnapshot | null => {
      if (undoStack.length === 0) return null;

      const previous = undoStack[undoStack.length - 1];
      setUndoStack((stack) => stack.slice(0, -1));
      setRedoStack((stack) => [...stack, cloneSnapshot(current)]);
      return cloneSnapshot(previous);
    },
    [undoStack],
  );

  const redo = useCallback(
    (current: AnnotationSnapshot): AnnotationSnapshot | null => {
      if (redoStack.length === 0) return null;

      const next = redoStack[redoStack.length - 1];
      setRedoStack((stack) => stack.slice(0, -1));
      setUndoStack((stack) => [...stack, cloneSnapshot(current)]);
      return cloneSnapshot(next);
    },
    [redoStack],
  );

  const runRestore = useCallback((apply: () => void) => {
    isRestoringRef.current = true;
    apply();
    queueMicrotask(() => {
      isRestoringRef.current = false;
    });
  }, []);

  return {
    canUndo: undoStack.length > 0,
    canRedo: redoStack.length > 0,
    pushSnapshot,
    undo,
    redo,
    resetStacks,
    runRestore,
  };
}

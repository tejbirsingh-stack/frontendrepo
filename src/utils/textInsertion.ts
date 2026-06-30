export interface TextSelection {
  start: number;
  end: number;
}

export function readInputSelection(
  input: HTMLInputElement | HTMLTextAreaElement | null,
  fallbackLength: number,
): TextSelection {
  if (!input) {
    return { start: fallbackLength, end: fallbackLength };
  }

  const start = input.selectionStart ?? fallbackLength;
  const end = input.selectionEnd ?? fallbackLength;
  return { start, end };
}

export function insertAtSelection(
  value: string,
  insertion: string,
  selection: TextSelection,
): { nextValue: string; cursor: number } {
  const { start, end } = selection;
  const nextValue = `${value.slice(0, start)}${insertion}${value.slice(end)}`;
  return { nextValue, cursor: start + insertion.length };
}

export function focusInputAtCursor(
  input: HTMLInputElement | HTMLTextAreaElement | null,
  cursor: number,
) {
  if (!input) return;

  requestAnimationFrame(() => {
    input.focus({ preventScroll: true });
    input.setSelectionRange(cursor, cursor);
  });
}

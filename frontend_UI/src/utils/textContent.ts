import type { KeyboardEvent, MouseEvent, PointerEvent, ReactNode } from 'react';
import { cv } from '../theme/cssVars';
import { createElement, Fragment } from 'react';

export function normalizeLinkUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function buildLinkMarkdown(url: string, label: string): string {
  const normalized = normalizeLinkUrl(url);
  const display = label.trim();
  if (!normalized || !display) return '';
  return `[${display}](${normalized})`;
}

/** Show link labels instead of raw markdown in compact UI (history, previews). */
export function formatAnnotationDisplayText(text: string): string {
  return text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
}

export function insertSnippetAtSelection(
  currentText: string,
  snippet: string,
  selectionStart: number,
  selectionEnd: number,
): { nextText: string; cursorPosition: number } {
  const start = Math.max(0, Math.min(selectionStart, currentText.length));
  const end = Math.max(start, Math.min(selectionEnd, currentText.length));
  const nextText = `${currentText.slice(0, start)}${snippet}${currentText.slice(end)}`;
  const cursorPosition = start + snippet.length;

  return { nextText, cursorPosition };
}

export function appendBulletOnNewLine(currentText: string, selectionStart: number): string {
  const before = currentText.slice(0, selectionStart);
  const after = currentText.slice(selectionStart);
  const needsLeadingNewline = before.length > 0 && !before.endsWith('\n');
  return `${before}${needsLeadingNewline ? '\n' : ''}• ${after}`;
}

type TextSegment =
  | { type: 'text'; value: string }
  | { type: 'link'; label: string; href: string };

export function parseTextSegments(text: string): TextSegment[] {
  const segments: TextSegment[] = [];
  let cursor = 0;

  const combinedRegex = /\[([^\]]+)\]\(([^)]+)\)|(https?:\/\/[^\s]+)/g;
  let match = combinedRegex.exec(text);

  while (match) {
    if (match.index > cursor) {
      segments.push({ type: 'text', value: text.slice(cursor, match.index) });
    }

    if (match[1] && match[2]) {
      segments.push({ type: 'link', label: match[1], href: match[2] });
    } else if (match[3]) {
      segments.push({ type: 'link', label: match[3], href: match[3] });
    }

    cursor = match.index + match[0].length;
    match = combinedRegex.exec(text);
  }

  if (cursor < text.length) {
    segments.push({ type: 'text', value: text.slice(cursor) });
  }

  return segments.length > 0 ? segments : [{ type: 'text', value: text }];
}

export function renderTextSegments(
  text: string,
  linkSx?: Record<string, unknown>,
): ReactNode {
  const segments = parseTextSegments(text);

  return createElement(
    Fragment,
    null,
    segments.map((segment, index) => {
      if (segment.type === 'link') {
        return createElement(
          'a',
          {
            key: `link-${index}`,
            href: segment.href,
            target: '_blank',
            rel: 'noopener noreferrer',
            onClick: (event: MouseEvent) => event.stopPropagation(),
            onPointerDown: (event: PointerEvent) => event.stopPropagation(),
            style: {
              color: cv.brandBlue,
              textDecoration: 'underline',
              wordBreak: 'break-word',
              ...(linkSx as Record<string, string>),
            },
          },
          segment.label,
        );
      }

      return createElement(Fragment, { key: `text-${index}` }, segment.value);
    }),
  );
}

export function splitBulletLines(text: string): string[] {
  return text.split('\n');
}

export function handleAnnotationTextKeyDown({
  event,
  bulletList,
  text,
  onTextChange,
  onSubmit,
  onEscape,
}: {
  event: KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>;
  bulletList: boolean;
  text: string;
  onTextChange: (value: string) => void;
  onSubmit: () => void;
  onEscape: () => void;
}) {
  event.stopPropagation();

  if (event.key === 'Escape') {
    event.preventDefault();
    onEscape();
    return;
  }

  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();

    if (bulletList) {
      const input = event.currentTarget;
      const start = input.selectionStart ?? text.length;
      const end = input.selectionEnd ?? start;
      const { nextText, cursorPosition } = insertSnippetAtSelection(text, '\n', start, end);
      onTextChange(nextText);
      requestAnimationFrame(() => {
        input.setSelectionRange(cursorPosition, cursorPosition);
      });
      return;
    }

    onSubmit();
  }
}

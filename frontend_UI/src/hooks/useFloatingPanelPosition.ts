import { useLayoutEffect, useState, type CSSProperties, type RefObject } from 'react';
import { FLOATING_PANEL_Z_INDEX } from '../constants/floatingPanel';

export type FloatingPlacement = 'above' | 'below' | 'right' | 'left';
const VIEWPORT_MARGIN = 16;
const SIDE_PANEL_GAP = 10;
const COMMENT_THREAD_WIDTH = 320;
const COMMENT_THREAD_MAX_HEIGHT = 480;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function useFloatingPanelPosition(
  anchorRef: RefObject<HTMLElement | null>,
  open: boolean,
  placement: FloatingPlacement,
): CSSProperties | null {
  const [style, setStyle] = useState<CSSProperties | null>(null);

  useLayoutEffect(() => {
    if (!open) {
      setStyle(null);
      return;
    }

    const update = () => {
      const anchor = anchorRef.current;
      if (!anchor) return;

      const rect = anchor.getBoundingClientRect();
      const gap = 10;

      if (placement === 'right' || placement === 'left') {
        const maxHeight = Math.min(
          COMMENT_THREAD_MAX_HEIGHT,
          window.innerHeight - VIEWPORT_MARGIN * 2,
        );
        const spaceRight = window.innerWidth - rect.right - SIDE_PANEL_GAP;
        const spaceLeft = rect.left - SIDE_PANEL_GAP;
        const openOnRight =
          placement === 'right'
            ? spaceRight >= COMMENT_THREAD_WIDTH || spaceRight >= spaceLeft
            : spaceLeft < COMMENT_THREAD_WIDTH && spaceRight > spaceLeft;

        const left = openOnRight
          ? rect.right + SIDE_PANEL_GAP
          : rect.left - SIDE_PANEL_GAP - COMMENT_THREAD_WIDTH;

        let top = rect.top;
        if (top + maxHeight > window.innerHeight - VIEWPORT_MARGIN) {
          top = window.innerHeight - VIEWPORT_MARGIN - maxHeight;
        }
        top = Math.max(VIEWPORT_MARGIN, top);

        setStyle({
          position: 'fixed',
          left: clamp(
            left,
            VIEWPORT_MARGIN,
            window.innerWidth - COMMENT_THREAD_WIDTH - VIEWPORT_MARGIN,
          ),
          top,
          width: COMMENT_THREAD_WIDTH,
          maxHeight,
          zIndex: FLOATING_PANEL_Z_INDEX,
        });
        return;
      }

      if (placement === 'above') {
        setStyle({
          position: 'fixed',
          left: rect.left,
          bottom: window.innerHeight - rect.top + gap,
          zIndex: FLOATING_PANEL_Z_INDEX,
        });
      } else {
        setStyle({
          position: 'fixed',
          left: rect.left,
          top: rect.bottom + gap,
          zIndex: FLOATING_PANEL_Z_INDEX,
        });
      }
    };

    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);

    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [anchorRef, open, placement]);

  return style;
}

const DRAFT_COMMENT_PIN_OFFSET_X = -4;
const DRAFT_COMMENT_PIN_OFFSET_Y = -12;
const DRAFT_COMMENT_PIN_WIDTH = 32;
const DRAFT_COMMENT_PANEL_WIDTH = 300;
const DRAFT_COMMENT_ESTIMATED_HEIGHT = 220;

/** Position draft comment editor (pin + bubble) above controls when anchored near bottom. */
export function useDraftCommentPanelPosition(
  anchorRef: RefObject<HTMLElement | null>,
  open: boolean,
): CSSProperties | null {
  const [style, setStyle] = useState<CSSProperties | null>(null);

  useLayoutEffect(() => {
    if (!open) {
      setStyle(null);
      return;
    }

    const update = () => {
      const anchor = anchorRef.current;
      if (!anchor) return;

      const rect = anchor.getBoundingClientRect();
      const maxHeight = Math.min(
        DRAFT_COMMENT_ESTIMATED_HEIGHT,
        window.innerHeight - VIEWPORT_MARGIN * 2,
      );
      const totalWidth = DRAFT_COMMENT_PIN_WIDTH + DRAFT_COMMENT_PANEL_WIDTH;

      let left = rect.left + DRAFT_COMMENT_PIN_OFFSET_X;
      const spaceBelowAnchor = window.innerHeight - (rect.top + DRAFT_COMMENT_PIN_OFFSET_Y);
      const controlsReserve = 96;
      const openAbove =
        spaceBelowAnchor < maxHeight + controlsReserve &&
        rect.top - maxHeight - 8 > VIEWPORT_MARGIN;
      let top = openAbove
        ? rect.top - maxHeight - 8
        : rect.top + DRAFT_COMMENT_PIN_OFFSET_Y;

      if (left + totalWidth > window.innerWidth - VIEWPORT_MARGIN) {
        left = window.innerWidth - VIEWPORT_MARGIN - totalWidth;
      }
      left = Math.max(VIEWPORT_MARGIN, left);

      if (!openAbove && top + maxHeight > window.innerHeight - VIEWPORT_MARGIN) {
        top = window.innerHeight - VIEWPORT_MARGIN - maxHeight;
      }
      top = Math.max(VIEWPORT_MARGIN, top);

      setStyle({
        position: 'fixed',
        left,
        top,
        zIndex: FLOATING_PANEL_Z_INDEX,
        maxWidth: `min(${totalWidth}px, calc(100vw - ${VIEWPORT_MARGIN * 2}px))`,
        alignItems: openAbove ? 'flex-end' : 'flex-start',
      });
    };

    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);

    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [anchorRef, open]);

  return style;
}

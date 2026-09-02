import { createElement, useEffect, useRef } from 'react';
import { cv } from '../../theme/cssVars';
import { Box, Popover } from '@mui/material';
import { getPortalTarget } from '../../utils/portalTarget';
import { FLOATING_PANEL_OVERLAY_Z_INDEX } from '../../constants/floatingPanel';
import type { EmojiClickEvent, EmojiClickEventDetail } from 'emoji-picker-element/shared';
import type { Picker } from 'emoji-picker-element';
import 'emoji-picker-element';

interface SystemEmojiPickerProps {
  open: boolean;
  anchorEl: HTMLElement | null;
  onClose: () => void;
  onEmojiSelect: (emoji: string) => void;
  /** When inserting into a text field, avoid stealing focus from the target input */
  insertMode?: boolean;
  /** Raise popover above portaled floating panels (e.g. comment thread). */
  elevated?: boolean;
}

function resolveEmojiUnicode(detail: EmojiClickEventDetail): string | null {
  if (detail.unicode) return detail.unicode;

  const emoji = detail.emoji;
  if (emoji && 'unicode' in emoji && typeof emoji.unicode === 'string' && emoji.unicode) {
    return emoji.unicode;
  }

  return null;
}

export default function SystemEmojiPicker({
  open,
  anchorEl,
  onClose,
  onEmojiSelect,
  insertMode = false,
  elevated = false,
}: SystemEmojiPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onEmojiSelectRef = useRef(onEmojiSelect);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onEmojiSelectRef.current = onEmojiSelect;
  }, [onEmojiSelect]);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;

    let removeListener: (() => void) | undefined;
    let cancelled = false;
    let attachAttempts = 0;

    const handleEmojiClick = (event: EmojiClickEvent) => {
      const unicode = resolveEmojiUnicode(event.detail);
      if (!unicode) return;
      onEmojiSelectRef.current(unicode);
      onCloseRef.current();
    };

    const attachListener = () => {
      if (cancelled) return;

      const picker = containerRef.current?.querySelector('emoji-picker') as Picker | null;
      if (!picker) {
        attachAttempts += 1;
        if (attachAttempts < 120) {
          requestAnimationFrame(attachListener);
        }
        return;
      }

      picker.addEventListener('emoji-click', handleEmojiClick);
      removeListener = () => picker.removeEventListener('emoji-click', handleEmojiClick);
    };

    attachListener();

    return () => {
      cancelled = true;
      removeListener?.();
    };
  }, [open]);

  const handlePopoverClose = (
    event: object,
    reason: 'backdropClick' | 'escapeKeyDown',
  ) => {
    if (reason === 'backdropClick' && event instanceof MouseEvent) {
      const path = event.composedPath();
      const clickedPicker = path.some(
        (node) => node instanceof Element && node.localName === 'emoji-picker',
      );
      if (clickedPicker) return;
    }

    onClose();
  };

  return (
    <Popover
      container={getPortalTarget}
      open={open}
      anchorEl={anchorEl}
      onClose={handlePopoverClose}
      disableRestoreFocus={insertMode}
      disableAutoFocus={insertMode}
      disableEnforceFocus={insertMode}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      transformOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      slotProps={{
        root: elevated ? { sx: { zIndex: FLOATING_PANEL_OVERLAY_Z_INDEX } } : undefined,
        paper: {
          onMouseDown: (event: React.MouseEvent) => event.stopPropagation(),
          sx: {
            mt: -1,
            overflow: 'hidden',
            borderRadius: '12px',
            border: `1px solid ${cv.emojiPickerBorder}`,
            backgroundColor: cv.emojiPickerSurface,
            boxShadow: cv.dialogShadow,
          },
        },
      }}
    >
      <Box ref={containerRef} sx={{ position: 'relative' }}>
        {createElement('emoji-picker', {
          class: 'dark',
          style: {
            width: '352px',
            height: '435px',
            border: 'none',
            background: cv.emojiPickerSurface,
            '--background': cv.emojiPickerSurface,
            '--border-color': cv.whiteBorderSoft,
            '--button-hover-background': cv.surfaceRaised,
            '--button-active-background': cv.surfaceActive,
            '--input-border-color': cv.emojiPickerInputBorder,
            '--indicator-color': cv.brandPurple,
            '--category-font-color': cv.emojiPickerText,
            '--input-font-color': cv.emojiPickerText,
            '--input-placeholder-color': cv.emojiPickerPlaceholder,
            '--border-radius': '12px',
          },
        })}
      </Box>
    </Popover>
  );
}

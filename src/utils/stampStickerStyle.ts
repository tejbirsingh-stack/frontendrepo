import type { SxProps, Theme } from '@mui/material';
import { cv } from '../theme/cssVars';

export const STAMP_STICKER_FILTER = 'url(#noah-stamp-sticker)';
export const STAMP_STICKER_FILTER_SELECTED = 'url(#noah-stamp-sticker-selected)';

export function getStampStickerFilter(selected = false): string {
  return selected ? STAMP_STICKER_FILTER_SELECTED : STAMP_STICKER_FILTER;
}

/** Stable slight tilt so placed stamps feel hand-stuck on the canvas. */
export function getStampRotationDeg(stampId: string): number {
  let hash = 0;
  for (let index = 0; index < stampId.length; index += 1) {
    hash = (hash * 31 + stampId.charCodeAt(index)) | 0;
  }

  return (hash % 19) - 9;
}

const CANVAS_TEXT_STROKE_PX = 4;
const CANVAS_TEXT_SHADOW = cv.stampTextShadow;

/** White contour for text stamps (+1, ?) — SVG filters are unreliable on Typography. */
export function canvasTextStickerSx(
  color: string,
  fontSize: string,
  selected = false,
): SxProps<Theme> {
  return {
    display: 'inline-block',
    fontSize,
    fontWeight: 800,
    lineHeight: 1,
    color,
    WebkitTextStroke: `${CANVAS_TEXT_STROKE_PX}px ${cv.stampTextStroke}`,
    paintOrder: 'stroke fill',
    filter: selected
      ? `${cv.stampSelectedGlow} ${CANVAS_TEXT_SHADOW}`
      : CANVAS_TEXT_SHADOW,
  };
}

/** SVG filter must be applied on the graphic itself, not a parent wrapper. */
export function canvasIconStickerSx(
  color: string,
  fontSize: number,
  selected = false,
): SxProps<Theme> {
  return {
    display: 'block',
    fontSize,
    color,
    filter: getStampStickerFilter(selected),
  };
}

export function canvasEmojiStickerSx(selected = false): SxProps<Theme> {
  return {
    display: 'inline-block',
    lineHeight: 1,
    filter: getStampStickerFilter(selected),
  };
}

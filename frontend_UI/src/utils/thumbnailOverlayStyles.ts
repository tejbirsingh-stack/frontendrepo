import { cv } from '../theme/cssVars';

/** Dark frosted chip — stays readable on bright or dark thumbnail images. */
export const thumbnailOverlayChipStyles = {
  background: cv.thumbnailChipBg,
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
  border: `1px solid ${cv.thumbnailChipBorder}`,
  boxShadow: cv.thumbnailChipShadow,
  color: cv.textInverse,
};

export const thumbnailOverlayChipHoverStyles = {
  background: cv.thumbnailChipBgHover,
};

import type { PlayerBackground } from '../types/playerTools';
import { cv } from '../theme/cssVars';

export function getPlayerBackgroundStyle(background: PlayerBackground): string {
  switch (background) {
    case 'white':
      return cv.textInverse;
    case 'dark':
      return cv.gray900Ui;
    case 'checker':
      return `repeating-conic-gradient(${cv.checkerDark} 0% 25%, ${cv.checkerLight} 0% 50%) 50% / 18px 18px`;
    case 'black':
    default:
      return cv.videoStage;
  }
}

export function getVideoTransform(
  rotationSteps: number,
  flipHorizontal: boolean,
  flipVertical: boolean,
): string {
  const transforms = [`rotate(${rotationSteps * 90}deg)`];

  if (flipHorizontal) transforms.push('scaleX(-1)');
  if (flipVertical) transforms.push('scaleY(-1)');

  return transforms.join(' ');
}

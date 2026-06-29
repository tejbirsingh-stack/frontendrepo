import { DEFAULT_FOLDER_COLOR } from '../constants/folderColors';
import { cv } from '../theme/cssVars';

export function resolveFolderColor(color?: string): string {
  return color ?? DEFAULT_FOLDER_COLOR;
}

export function folderAccentBackground(color?: string): string {
  const resolved = resolveFolderColor(color);
  return `linear-gradient(160deg, ${resolved}26 0%, ${cv.surfaceSubtle} 100%)`;
}

export function folderAccentTint(color?: string): string {
  const resolved = resolveFolderColor(color);
  return `${resolved}26`;
}

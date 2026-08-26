import { DEFAULT_FOLDER_COLOR } from '../constants/folderColors';
import { cv } from '../theme/cssVars';

/** Sea green accent for project cards (distinct from yellow folders). */
export const PROJECT_ACCENT_COLOR: string = cv.brandTeal;

export function resolveFolderColor(color?: string): string {
  return color ?? DEFAULT_FOLDER_COLOR;
}

export function resolveLibraryFolderColor(options: {
  folderColor?: string;
  isProject?: boolean;
}): string {
  if (options.isProject) return options.folderColor || PROJECT_ACCENT_COLOR;
  return resolveFolderColor(options.folderColor);
}

export function folderAccentBackground(color?: string): string {
  const resolved = resolveFolderColor(color);
  const tinted = resolved.startsWith('var(') ? `color-mix(in srgb, ${resolved} 15%, transparent)` : `${resolved}26`;
  return `linear-gradient(160deg, ${tinted} 0%, ${cv.surfaceSubtle} 100%)`;
}

export function projectAccentBackground(color?: string): string {
  const resolved = color || PROJECT_ACCENT_COLOR;
  const tinted = resolved.startsWith('var(') ? `color-mix(in srgb, ${resolved} 15%, transparent)` : `${resolved}26`;
  return `linear-gradient(160deg, ${tinted} 0%, ${cv.surfaceSubtle} 100%)`;
}

export function folderAccentTint(color?: string): string {
  const resolved = resolveFolderColor(color);
  return resolved.startsWith('var(') ? `color-mix(in srgb, ${resolved} 15%, transparent)` : `${resolved}26`;
}

export function projectAccentTint(color?: string): string {
  const resolved = color || PROJECT_ACCENT_COLOR;
  return resolved.startsWith('var(') ? `color-mix(in srgb, ${resolved} 15%, transparent)` : `${resolved}26`;
}

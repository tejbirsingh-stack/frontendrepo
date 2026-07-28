import { DEFAULT_FOLDER_COLOR } from '../constants/folderColors';
import { cv } from '../theme/cssVars';

/** Sea green accent for project cards (distinct from yellow folders). */
export const PROJECT_ACCENT_COLOR: string = cv.brandTeal;

export function resolveFolderColor(color?: string): string {
  return color ?? DEFAULT_FOLDER_COLOR;
}

/** Yellow for folders; sea green for projects. */
export function resolveLibraryFolderColor(options: {
  folderColor?: string;
  isProject?: boolean;
}): string {
  if (options.isProject) return PROJECT_ACCENT_COLOR;
  return resolveFolderColor(options.folderColor);
}

export function folderAccentBackground(color?: string): string {
  const resolved = resolveFolderColor(color);
  return `linear-gradient(160deg, ${resolved}26 0%, ${cv.surfaceSubtle} 100%)`;
}

export function projectAccentBackground(): string {
  return `linear-gradient(160deg, ${PROJECT_ACCENT_COLOR}26 0%, ${cv.surfaceSubtle} 100%)`;
}

export function folderAccentTint(color?: string): string {
  const resolved = resolveFolderColor(color);
  return `${resolved}26`;
}

export function projectAccentTint(): string {
  return `${PROJECT_ACCENT_COLOR}26`;
}

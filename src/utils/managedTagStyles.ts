import type { SxProps, Theme } from '@mui/material';
import { cv } from '../theme/cssVars';
import type { ManagedTag, TagScope } from '../types/managedTag';
import type { TagScopeColors } from '../types/tagScopeColors';
import {
  TAG_UI_DARK_SURFACE,
  ensureContrastOnBackground,
  getContrastingForeground,
} from './colorContrast';
import { getTagScopeColor } from './tagScopeColorsStorage';
import { normalizeTagName } from './tagRegistryStorage';

export function findManagedTagByName(
  name: string,
  managedTags: ManagedTag[],
): ManagedTag | undefined {
  const normalized = normalizeTagName(name);
  return managedTags.find((tag) => tag.name === normalized);
}

/** Readable scope accent against dark UI (borders, icons, unchecked accents). */
export function getReadableTagScopeAccent(
  scope: TagScope,
  scopeColors: TagScopeColors,
  surfaceHex: string = TAG_UI_DARK_SURFACE,
): string {
  return ensureContrastOnBackground(getTagScopeColor(scope, scopeColors), surfaceHex, 4.5);
}

/** Solid category badge: scope fill + contrasting label (WCAG AA). */
export function getTagScopeBadgeSx(
  scope: TagScope,
  scopeColors: TagScopeColors,
): SxProps<Theme> {
  const fill = getTagScopeColor(scope, scopeColors);
  const text = getContrastingForeground(fill);

  return {
    display: 'inline-flex',
    alignItems: 'center',
    px: 0.75,
    py: 0.15,
    borderRadius: '999px',
    fontSize: '0.625rem',
    fontWeight: 700,
    letterSpacing: '0.02em',
    lineHeight: 1.4,
    color: text,
    backgroundColor: fill,
    border: `1px solid ${fill}`,
    flexShrink: 0,
  };
}

export function getTagScopeChipSx(
  scope: TagScope,
  scopeColors: TagScopeColors,
  options?: { selected?: boolean; height?: number; fontSize?: string },
): SxProps<Theme> {
  const fill = getTagScopeColor(scope, scopeColors);
  const selected = options?.selected ?? false;
  const accent = ensureContrastOnBackground(fill, TAG_UI_DARK_SURFACE, 4.5);
  const onFill = getContrastingForeground(fill);

  if (selected) {
    return {
      height: options?.height ?? 28,
      borderRadius: '999px',
      fontSize: options?.fontSize ?? '0.8125rem',
      fontWeight: 600,
      backgroundColor: fill,
      color: onFill,
      border: `1px solid ${fill}`,
      '& .MuiChip-label': { px: 1.25 },
      '& .MuiChip-deleteIcon': {
        color: onFill,
        opacity: 0.85,
        '&:hover': { color: onFill, opacity: 1 },
      },
      '&:hover': {
        backgroundColor: fill,
        filter: 'brightness(1.08)',
      },
    };
  }

  return {
    height: options?.height ?? 28,
    borderRadius: '999px',
    fontSize: options?.fontSize ?? '0.8125rem',
    fontWeight: 600,
    backgroundColor: 'transparent',
    color: accent,
    border: `1px solid ${accent}`,
    '& .MuiChip-label': { px: 1.25 },
    '& .MuiChip-deleteIcon': {
      color: accent,
      opacity: 0.85,
      '&:hover': { color: accent, opacity: 1 },
    },
    '&:hover': {
      backgroundColor: `${fill}24`,
      borderColor: accent,
    },
  };
}

export function getManagedTagChipSx(
  tag: ManagedTag,
  scopeColors: TagScopeColors,
  options?: { selected?: boolean; height?: number; fontSize?: string },
): SxProps<Theme> {
  return getTagScopeChipSx(tag.scope, scopeColors, options);
}

export function getManagedTagOptionSx(
  tag: ManagedTag,
  scopeColors: TagScopeColors,
  highlighted: boolean,
): SxProps<Theme> {
  const color = getTagScopeColor(tag.scope, scopeColors);
  const accent = ensureContrastOnBackground(color, TAG_UI_DARK_SURFACE, 4.5);

  return {
    display: 'flex',
    alignItems: 'center',
    gap: 1,
    px: 1.25,
    py: 0.85,
    borderRadius: '10px',
    cursor: 'pointer',
    backgroundColor: highlighted ? `${color}28` : 'transparent',
    outline: highlighted ? `1px solid ${accent}` : 'none',
    '&:hover': {
      backgroundColor: `${color}28`,
    },
  };
}

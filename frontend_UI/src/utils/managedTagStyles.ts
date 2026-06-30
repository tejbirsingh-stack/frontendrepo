import type { SxProps, Theme } from '@mui/material';
import { cv } from '../theme/cssVars';
import type { ManagedTag, TagScope } from '../types/managedTag';
import type { TagScopeColors } from '../types/tagScopeColors';
import { getTagScopeColor } from './tagScopeColorsStorage';
import { normalizeTagName } from './tagRegistryStorage';

export function findManagedTagByName(
  name: string,
  managedTags: ManagedTag[],
): ManagedTag | undefined {
  const normalized = normalizeTagName(name);
  return managedTags.find((tag) => tag.name === normalized);
}

export function getTagScopeChipSx(
  scope: TagScope,
  scopeColors: TagScopeColors,
  options?: { selected?: boolean; height?: number; fontSize?: string },
): SxProps<Theme> {
  const color = getTagScopeColor(scope, scopeColors);
  const selected = options?.selected ?? false;

  return {
    height: options?.height ?? 28,
    borderRadius: '999px',
    fontSize: options?.fontSize ?? '0.8125rem',
    fontWeight: 600,
    backgroundColor: selected ? `${color}40` : `${color}20`,
    color: selected ? cv.textOnCta : color,
    border: `1px solid ${selected ? color : `${color}55`}`,
    '& .MuiChip-label': { px: 1.25 },
    '& .MuiChip-deleteIcon': {
      color: selected ? cv.textOnCta : color,
      opacity: 0.72,
      '&:hover': { color: selected ? cv.textOnCta : color, opacity: 1 },
    },
    ...(selected
      ? {
          '&:hover': {
            backgroundColor: `${color}55`,
          },
        }
      : {
          '&:hover': {
            backgroundColor: `${color}30`,
          },
        }),
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

  return {
    display: 'flex',
    alignItems: 'center',
    gap: 1,
    px: 1.25,
    py: 0.85,
    borderRadius: '10px',
    cursor: 'pointer',
    backgroundColor: highlighted ? `${color}18` : 'transparent',
    '&:hover': {
      backgroundColor: `${color}18`,
    },
  };
}

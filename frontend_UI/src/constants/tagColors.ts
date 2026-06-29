import type { TagScopeColors } from '../types/tagScopeColors';

/** Hex-only swatches for tag category color pickers (alpha suffixes require hex). */
export const TAG_PICKER_HEX_COLORS = [
  '#8e44ad',
  '#b86ef0',
  '#d28cff',
  '#16a085',
  '#06b6d4',
  '#3b82f6',
  '#f59e0b',
  '#ef4444',
  '#ec4899',
  '#6b7280',
] as const;

export const DEFAULT_TAG_SCOPE_COLORS: TagScopeColors = {
  company: '#8e44ad',
  project: '#16a085',
  personal: '#b86ef0',
};

/** @deprecated Use tag scope colors instead of per-tag colors. */
export const TAG_COLOR_OPTIONS = TAG_PICKER_HEX_COLORS;

/** @deprecated Use DEFAULT_TAG_SCOPE_COLORS.personal instead. */
export const DEFAULT_TAG_COLOR = DEFAULT_TAG_SCOPE_COLORS.personal;

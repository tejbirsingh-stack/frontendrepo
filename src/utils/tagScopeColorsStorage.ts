import { DEFAULT_TAG_SCOPE_COLORS, TAG_PICKER_HEX_COLORS } from '../constants/tagColors';
import type { TagScope } from '../types/managedTag';
import type { TagScopeColors } from '../types/tagScopeColors';

const STORAGE_KEY = 'noah-tag-scope-colors';

const TAG_SCOPES: TagScope[] = ['company', 'project', 'personal'];

export function normalizeHexColor(value: string): string {
  const trimmed = value.trim();
  if (!trimmed.startsWith('#')) return trimmed.toLowerCase();
  return `#${trimmed.slice(1).toLowerCase()}`;
}

function isHexColor(value: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(value.trim());
}

function pickFallbackScopeColor(usedColors: Set<string>, scope: TagScope): string {
  const available = TAG_PICKER_HEX_COLORS.find((color) => !usedColors.has(color));
  return available ?? DEFAULT_TAG_SCOPE_COLORS[scope];
}

function ensureUniqueTagScopeColors(colors: TagScopeColors): TagScopeColors {
  const usedColors = new Set<string>();
  const result = {} as TagScopeColors;

  for (const scope of TAG_SCOPES) {
    let color = colors[scope];

    if (usedColors.has(color)) {
      color = pickFallbackScopeColor(usedColors, scope);
    }

    result[scope] = color;
    usedColors.add(color);
  }

  return result;
}

function sanitizeTagScopeColors(colors: Partial<TagScopeColors>): TagScopeColors {
  const normalized: TagScopeColors = {
    company: isHexColor(colors.company ?? '')
      ? normalizeHexColor(colors.company!)
      : DEFAULT_TAG_SCOPE_COLORS.company,
    project: isHexColor(colors.project ?? '')
      ? normalizeHexColor(colors.project!)
      : DEFAULT_TAG_SCOPE_COLORS.project,
    personal: isHexColor(colors.personal ?? '')
      ? normalizeHexColor(colors.personal!)
      : DEFAULT_TAG_SCOPE_COLORS.personal,
  };

  return ensureUniqueTagScopeColors(normalized);
}

export function loadTagScopeColors(): TagScopeColors {
  if (typeof window === 'undefined') return { ...DEFAULT_TAG_SCOPE_COLORS };

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_TAG_SCOPE_COLORS };

    const parsed = JSON.parse(raw) as Partial<TagScopeColors>;
    return sanitizeTagScopeColors(parsed);
  } catch {
    return { ...DEFAULT_TAG_SCOPE_COLORS };
  }
}

export function saveTagScopeColors(colors: TagScopeColors) {
  if (typeof window === 'undefined') return;

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitizeTagScopeColors(colors)));
}

export function getTagScopeColor(scope: TagScope, scopeColors: TagScopeColors): string {
  return scopeColors[scope] ?? DEFAULT_TAG_SCOPE_COLORS[scope];
}

export function getTagScopeColorOptions(
  scope: TagScope,
  scopeColors: TagScopeColors,
): Array<{ color: string; disabled: boolean; reservedBy?: TagScope }> {
  const activeColor = normalizeHexColor(getTagScopeColor(scope, scopeColors));

  return TAG_PICKER_HEX_COLORS.map((color) => {
    const normalizedColor = normalizeHexColor(color);
    const isSelected = activeColor === normalizedColor;

    const reservedBy = TAG_SCOPES.find((entry) => {
      if (entry === scope) return false;
      return normalizeHexColor(scopeColors[entry]) === normalizedColor;
    });

    const disabled = Boolean(reservedBy) && !isSelected;

    return {
      color,
      disabled,
      reservedBy: disabled ? reservedBy : undefined,
    };
  });
}

export { TAG_SCOPES };

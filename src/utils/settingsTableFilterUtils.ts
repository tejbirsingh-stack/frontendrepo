export const FILTER_ALL_OPTION = 'All';

export function createDefaultFilterSelection(): Set<string> {
  return new Set([FILTER_ALL_OPTION]);
}

export function isFilterAllSelected(selected: Set<string>): boolean {
  return selected.size === 0 || (selected.size === 1 && selected.has(FILTER_ALL_OPTION));
}

export function toggleFilterValue(current: Set<string>, value: string): Set<string> {
  if (value === FILTER_ALL_OPTION) {
    return createDefaultFilterSelection();
  }

  const next = new Set(current);
  next.delete(FILTER_ALL_OPTION);

  if (next.has(value)) {
    next.delete(value);
  } else {
    next.add(value);
  }

  if (next.size === 0) {
    return createDefaultFilterSelection();
  }

  return next;
}

export function hasActiveFilterSelections(...selections: Set<string>[]): boolean {
  return selections.some((selection) => !isFilterAllSelected(selection));
}

export function matchesSetFilter(value: string, selected: Set<string>): boolean {
  if (isFilterAllSelected(selected)) return true;
  return selected.has(value);
}

export function uniqueSorted(values: string[]): string[] {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

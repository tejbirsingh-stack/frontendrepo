import { useCallback, useMemo, useState } from 'react';

export type PlatformSortDirection = 'asc' | 'desc';

export type PlatformSortState<Field extends string = string> = {
  sortBy: Field;
  sortDir: PlatformSortDirection;
  /** Sort by `field`, flipping direction when it is already the active column. */
  toggleSort: (field: Field) => void;
  setSort: (field: Field, direction: PlatformSortDirection) => void;
  /** Direction to render on a header, or `false` when the column is inactive. */
  directionFor: (field: Field) => PlatformSortDirection | false;
  reset: () => void;
  /** Query params for server-side sorting. */
  params: { sortBy: Field; sortDir: PlatformSortDirection };
};

/**
 * Shared sort state for platform tables.
 * Numeric and date columns start descending, text columns ascending.
 */
export function usePlatformTableSort<Field extends string>(
  defaultField: Field,
  defaultDirection: PlatformSortDirection = 'desc',
  descendingFirstFields: readonly Field[] = [],
): PlatformSortState<Field> {
  const [sortBy, setSortBy] = useState<Field>(defaultField);
  const [sortDir, setSortDir] = useState<PlatformSortDirection>(defaultDirection);

  const descendingFirst = useMemo(() => new Set<string>(descendingFirstFields), [descendingFirstFields]);

  const setSort = useCallback((field: Field, direction: PlatformSortDirection) => {
    setSortBy(field);
    setSortDir(direction);
  }, []);

  const toggleSort = useCallback(
    (field: Field) => {
      setSortBy((currentField) => {
        setSortDir((currentDir) => {
          if (currentField === field) return currentDir === 'asc' ? 'desc' : 'asc';
          return descendingFirst.has(field) ? 'desc' : 'asc';
        });
        return field;
      });
    },
    [descendingFirst],
  );

  const directionFor = useCallback(
    (field: Field): PlatformSortDirection | false => (sortBy === field ? sortDir : false),
    [sortBy, sortDir],
  );

  const reset = useCallback(() => {
    setSortBy(defaultField);
    setSortDir(defaultDirection);
  }, [defaultField, defaultDirection]);

  return {
    sortBy,
    sortDir,
    toggleSort,
    setSort,
    directionFor,
    reset,
    params: { sortBy, sortDir },
  };
}

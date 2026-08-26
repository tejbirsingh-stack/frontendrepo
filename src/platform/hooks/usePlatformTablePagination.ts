import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from 'react';

export const PLATFORM_ROWS_PER_PAGE_OPTIONS = [10, 25, 50] as const;
export const PLATFORM_DEFAULT_ROWS_PER_PAGE = 10;

export type PlatformTablePaginationState = {
  page: number;
  rowsPerPage: number;
  setPage: (page: number) => void;
  onPageChange: (_event: unknown, newPage: number) => void;
  onRowsPerPageChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  resetPage: () => void;
  /** Offset for server-side APIs (`page * rowsPerPage`). */
  offset: number;
  limit: number;
};

/**
 * Shared page / rows-per-page state for platform tables.
 * Pass `resetDeps` to jump back to page 0 when filters change.
 */
export function usePlatformTablePagination(
  resetDeps: unknown[] = [],
  defaultRowsPerPage: number = PLATFORM_DEFAULT_ROWS_PER_PAGE,
): PlatformTablePaginationState {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(defaultRowsPerPage);

  const resetPage = useCallback(() => setPage(0), []);

  useEffect(() => {
    setPage(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, resetDeps);

  const onPageChange = useCallback((_event: unknown, newPage: number) => {
    setPage(newPage);
  }, []);

  const onRowsPerPageChange = useCallback(
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setRowsPerPage(parseInt(event.target.value, 10));
      setPage(0);
    },
    [],
  );

  return {
    page,
    rowsPerPage,
    setPage,
    onPageChange,
    onRowsPerPageChange,
    resetPage,
    offset: page * rowsPerPage,
    limit: rowsPerPage,
  };
}

/** Slice a full list for client-side pagination. */
export function usePaginatedRows<T>(rows: T[], page: number, rowsPerPage: number): T[] {
  return useMemo(
    () => rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [rows, page, rowsPerPage],
  );
}

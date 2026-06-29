import {
  Box,
  Checkbox,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import TruncatedText from '../TruncatedText';
import { cv } from '../../theme/cssVars';

export interface SettingsTableColumn<T> {
  id: string;
  label: string;
  width?: string | number;
  minWidth?: string | number;
  align?: 'left' | 'right' | 'center';
  render: (row: T) => React.ReactNode;
}

interface SettingsDataTableProps<T> {
  columns: SettingsTableColumn<T>[];
  rows: T[];
  emptyMessage?: string;
  getRowId: (row: T) => string;
  selectable?: boolean;
  selectedRowIds?: Set<string>;
  onSelectionChange?: (selectedIds: Set<string>) => void;
}

const CHECKBOX_COLUMN_WIDTH = 36;

const headerCellSx = {
  fontSize: '0.6875rem',
  fontWeight: 600,
  letterSpacing: '0.06em',
  textTransform: 'uppercase' as const,
  color: cv.textMuted,
  borderBottom: `1px solid ${cv.border}`,
  py: 1.5,
  px: 2.5,
  whiteSpace: 'nowrap' as const,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
};

const firstColumnCellSx = {
  pl: 1.5,
  pr: 2.5,
  whiteSpace: 'nowrap' as const,
};

const bodyCellSx = {
  fontSize: '0.875rem',
  color: cv.textPrimary,
  borderBottom: `1px solid ${cv.dividerSubtle}`,
  py: 1.5,
  px: 2.5,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
};

const checkboxCellSx = {
  width: CHECKBOX_COLUMN_WIDTH,
  minWidth: CHECKBOX_COLUMN_WIDTH,
  maxWidth: CHECKBOX_COLUMN_WIDTH,
  pl: 2,
  pr: 0,
  py: 1.5,
  overflow: 'visible',
  borderBottom: `1px solid ${cv.dividerSubtle}`,
  verticalAlign: 'middle' as const,
};

const checkboxHeaderCellSx = {
  ...checkboxCellSx,
  borderBottom: `1px solid ${cv.border}`,
};

const checkboxSx = {
  color: cv.textMuted,
  p: 0.25,
  flexShrink: 0,
  '& .MuiSvgIcon-root': { fontSize: 20 },
  '&.Mui-checked': { color: cv.brandPurple },
  '&.MuiCheckbox-indeterminate': { color: cv.brandPurple },
};

function resolveColumnWidth(
  width: string | number | undefined,
  selectable: boolean,
): string | number | undefined {
  if (width === undefined) return undefined;
  if (!selectable || typeof width !== 'string') return width;

  const percentMatch = /^([\d.]+)%$/.exec(width);
  if (!percentMatch) return width;

  const fraction = parseFloat(percentMatch[1]) / 100;
  return `calc((100% - ${CHECKBOX_COLUMN_WIDTH}px) * ${fraction})`;
}

export default function SettingsDataTable<T>({
  columns,
  rows,
  emptyMessage = 'No records found.',
  getRowId,
  selectable = false,
  selectedRowIds = new Set(),
  onSelectionChange,
}: SettingsDataTableProps<T>) {
  const visibleRowIds = rows.map(getRowId);
  const selectedVisibleCount = visibleRowIds.filter((id) => selectedRowIds.has(id)).length;
  const allVisibleSelected = rows.length > 0 && selectedVisibleCount === rows.length;
  const someVisibleSelected = selectedVisibleCount > 0 && !allVisibleSelected;

  const handleToggleAll = () => {
    if (!onSelectionChange) return;

    if (allVisibleSelected) {
      const next = new Set(selectedRowIds);
      visibleRowIds.forEach((id) => next.delete(id));
      onSelectionChange(next);
      return;
    }

    const next = new Set(selectedRowIds);
    visibleRowIds.forEach((id) => next.add(id));
    onSelectionChange(next);
  };

  const handleToggleRow = (rowId: string) => {
    if (!onSelectionChange) return;

    const next = new Set(selectedRowIds);
    if (next.has(rowId)) {
      next.delete(rowId);
    } else {
      next.add(rowId);
    }
    onSelectionChange(next);
  };

  const columnCount = columns.length + (selectable ? 1 : 0);

  return (
    <TableContainer sx={{ width: '100%', overflowX: 'auto' }}>
      <Table
        size="small"
        sx={{
          width: '100%',
          tableLayout: 'fixed',
          minWidth: selectable ? 960 + CHECKBOX_COLUMN_WIDTH : 960,
        }}
      >
        <colgroup>
          {selectable ? <col style={{ width: `${CHECKBOX_COLUMN_WIDTH}px` }} /> : null}
          {columns.map((column) => {
            const colWidth = resolveColumnWidth(column.width, selectable);
            return (
              <col
                key={column.id}
                style={{
                  width: colWidth,
                  ...(column.minWidth ? { minWidth: column.minWidth } : {}),
                }}
              />
            );
          })}
        </colgroup>
        <TableHead>
          <TableRow>
            {selectable ? (
              <TableCell sx={checkboxHeaderCellSx}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
                  <Checkbox
                    size="small"
                    checked={allVisibleSelected}
                    indeterminate={someVisibleSelected}
                    onChange={handleToggleAll}
                    aria-label="Select all rows"
                    sx={checkboxSx}
                  />
                </Box>
              </TableCell>
            ) : null}
            {columns.map((column, index) => (
              <TableCell
                key={column.id}
                align={column.align ?? 'left'}
                sx={{
                  ...headerCellSx,
                  ...(selectable && index === 0 ? firstColumnCellSx : {}),
                  width: resolveColumnWidth(column.width, selectable),
                  minWidth: column.minWidth,
                }}
              >
                {column.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columnCount} sx={{ py: 4, borderBottom: 'none' }}>
                <Typography sx={{ textAlign: 'center', color: cv.textSecondary, fontSize: '0.875rem' }}>
                  {emptyMessage}
                </Typography>
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => {
              const rowId = getRowId(row);
              const selected = selectedRowIds.has(rowId);
              return (
                <TableRow
                  key={rowId}
                  hover
                  selected={selected}
                  sx={{
                    '&.Mui-selected': { backgroundColor: cv.insetHighlight },
                    '&.Mui-selected:hover': { backgroundColor: cv.surfaceRaised },
                  }}
                >
                  {selectable ? (
                    <TableCell sx={checkboxCellSx}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
                        <Checkbox
                          size="small"
                          checked={selected}
                          onChange={() => handleToggleRow(rowId)}
                          aria-label={`Select row ${rowId}`}
                          sx={checkboxSx}
                        />
                      </Box>
                    </TableCell>
                  ) : null}
                  {columns.map((column, index) => (
                    <TableCell
                      key={column.id}
                      align={column.align ?? 'left'}
                      sx={{
                        ...bodyCellSx,
                        ...(selectable && index === 0 ? firstColumnCellSx : {}),
                      }}
                    >
                      {column.render(row)}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export function StatusChip({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const isActive = normalized === 'active';
  const isPending = normalized === 'pending' || normalized.includes('pending');

  return (
    <Box
      component="span"
      sx={{
        display: 'inline-flex',
        px: 1,
        py: 0.25,
        borderRadius: '999px',
        fontSize: '0.75rem',
        fontWeight: 600,
        color: isActive ? cv.successText : isPending ? cv.warning : cv.textSecondary,
        backgroundColor: isActive
          ? cv.successSurface
          : isPending
            ? cv.warningSurface
            : cv.insetHighlight,
      }}
    >
      {status}
    </Box>
  );
}

export function SettingsUserCell({
  name,
  initials,
  isCurrentUser = false,
}: {
  name: string;
  initials: string;
  isCurrentUser?: boolean;
}) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0 }}>
      <Box
        sx={{
          width: 32,
          height: 32,
          borderRadius: '999px',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          fontSize: '0.75rem',
          fontWeight: 700,
          color: cv.textPrimary,
          background: cv.brandGradient,
        }}
      >
        {initials}
      </Box>
      <TruncatedText
        text={isCurrentUser ? `${name} (you)` : name}
        tooltip={name}
        sx={{
          fontSize: '0.875rem',
          fontWeight: 500,
          color: cv.textPrimary,
        }}
      >
        {name}
        {isCurrentUser ? (
          <Box component="span" sx={{ color: cv.textSecondary, fontWeight: 400 }}>
            {' '}
            (you)
          </Box>
        ) : null}
      </TruncatedText>
    </Box>
  );
}

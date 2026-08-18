import ClearIcon from '@mui/icons-material/Clear';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import SearchIcon from '@mui/icons-material/Search';
import {
  Box,
  Chip,
  IconButton,
  InputAdornment,
  LinearProgress,
  MenuItem,
  Paper,
  TableCell,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useId, type ChangeEvent, type ReactNode } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  PLATFORM_ROWS_PER_PAGE_OPTIONS,
} from '../hooks/usePlatformTablePagination';
import type { PlatformSortDirection } from '../hooks/usePlatformTableSort';
import { cv } from '../../theme/cssVars';

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <Box
      sx={{
        mb: 3,
        display: 'flex',
        alignItems: { xs: 'flex-start', sm: 'flex-end' },
        justifyContent: 'space-between',
        gap: 2,
        flexWrap: 'wrap',
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography
          sx={{
            fontSize: { xs: '1.5rem', md: '1.75rem' },
            fontWeight: 700,
            letterSpacing: '-0.03em',
            lineHeight: 1.15,
          }}
        >
          {title}
        </Typography>
        {subtitle ? (
          <Typography sx={{ color: cv.textSecondary, mt: 0.75, fontSize: '0.9rem', maxWidth: 560 }}>
            {subtitle}
          </Typography>
        ) : null}
      </Box>
      {actions ? <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>{actions}</Box> : null}
    </Box>
  );
}

function InfoTip({ title }: { title: string }) {
  return (
    <Tooltip title={title} arrow placement="top" enterDelay={200}>
      <Box
        component="span"
        sx={{
          display: 'inline-flex',
          color: cv.textMuted,
          cursor: 'help',
          ml: 0.5,
          verticalAlign: 'middle',
          '&:hover': { color: cv.brandOrchid },
        }}
        aria-label={title}
      >
        <InfoOutlinedIcon sx={{ fontSize: 14 }} />
      </Box>
    </Tooltip>
  );
}

export function StatCard({
  label,
  value,
  hint,
  tone = 'default',
  icon,
  tooltip,
  sparkline,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: 'default' | 'success' | 'warning' | 'danger' | 'brand';
  icon?: ReactNode;
  tooltip?: string;
  sparkline?: ReactNode;
}) {
  const accent =
    tone === 'success'
      ? cv.success
      : tone === 'warning'
        ? cv.warning
        : tone === 'danger'
          ? cv.destructive
          : tone === 'brand'
            ? cv.brandOrchid
            : cv.brandPurple;

  const card = (
    <Paper
      elevation={0}
      sx={{
        p: 2.25,
        borderRadius: '6px',
        border: `1px solid ${cv.border}`,
        background: `linear-gradient(165deg, ${cv.surfaceRaised} 0%, ${cv.surface} 55%)`,
        boxShadow: cv.cardShadow,
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        transition: 'border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: accent,
          opacity: 0.95,
        },
        '&:hover': {
          borderColor: cv.borderStrong,
          transform: 'translateY(-2px)',
          boxShadow: cv.brandShadowSoft,
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography
            sx={{
              fontSize: '0.75rem',
              color: cv.textMuted,
              mb: 0.75,
              fontWeight: 600,
              letterSpacing: '0.02em',
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            {label}
            {tooltip ? <InfoTip title={tooltip} /> : null}
          </Typography>
          <Typography sx={{ fontSize: '1.6rem', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.1 }}>
            {value}
          </Typography>
          {hint ? (
            <Typography sx={{ fontSize: '0.75rem', color: cv.textMuted, mt: 0.85 }}>{hint}</Typography>
          ) : null}
        </Box>
        {icon ? (
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '6px',
              display: 'grid',
              placeItems: 'center',
              background: cv.purpleSurface,
              color: accent,
              border: `1px solid ${cv.purpleChipBorder}`,
              flexShrink: 0,
            }}
          >
            {icon}
          </Box>
        ) : null}
      </Box>
      {sparkline}
    </Paper>
  );

  return card;
}

export function Panel({
  children,
  title,
  subtitle,
  action,
  tooltip,
  sx,
}: {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  tooltip?: string;
  sx?: Record<string, unknown>;
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.25,
        borderRadius: '6px',
        border: `1px solid ${cv.border}`,
        background: cv.surface,
        boxShadow: cv.cardShadow,
        height: '100%',
        ...sx,
      }}
    >
      {title ? (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 1.5,
            mb: children ? 1.75 : 0,
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography
              sx={{
                fontWeight: 600,
                fontSize: '0.95rem',
                letterSpacing: '-0.01em',
                display: 'inline-flex',
                alignItems: 'center',
              }}
            >
              {title}
              {tooltip ? <InfoTip title={tooltip} /> : null}
            </Typography>
            {subtitle ? (
              <Typography sx={{ fontSize: '0.75rem', color: cv.textMuted, mt: 0.35 }}>
                {subtitle}
              </Typography>
            ) : null}
          </Box>
          {action}
        </Box>
      ) : null}
      {children}
    </Paper>
  );
}

export function StatusChip({
  status,
  label,
}: {
  status?: string | null;
  label?: string;
}) {
  const value = (label || status || 'unknown').toLowerCase();
  const tone =
    value.includes('active') || value.includes('resolved') || value.includes('success')
      ? { bg: cv.successSurface, color: cv.successText, border: cv.success }
      : value.includes('suspend') || value.includes('error') || value.includes('danger')
        ? { bg: cv.destructiveSurface, color: cv.destructive, border: cv.destructiveBorder }
        : value.includes('warn') || value.includes('open') || value.includes('quarantine')
          ? { bg: cv.warningSurface, color: cv.warning, border: cv.warning }
          : { bg: cv.purpleSurface, color: cv.textSecondary, border: cv.border };

  return (
    <Chip
      size="small"
      label={label || status || '—'}
      sx={{
        height: 24,
        fontSize: '0.7rem',
        fontWeight: 600,
        textTransform: 'capitalize',
        borderRadius: '6px',
        background: tone.bg,
        color: tone.color,
        border: `1px solid ${tone.border}`,
      }}
    />
  );
}

export function MetricBar({
  label,
  usedLabel,
  percent,
  tooltip,
}: {
  label: string;
  usedLabel: string;
  percent: number;
  tooltip?: string;
}) {
  const clamped = Math.max(0, Math.min(100, Number.isFinite(percent) ? percent : 0));
  const hot = clamped >= 85;
  const bar = (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, mb: 0.75 }}>
        <Typography sx={{ fontSize: '0.8125rem', color: cv.textSecondary }}>{label}</Typography>
        <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600 }}>{usedLabel}</Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={clamped}
        sx={{
          height: 8,
          borderRadius: 999,
          background: cv.surfaceMuted,
          '& .MuiLinearProgress-bar': {
            borderRadius: 999,
            background: hot ? cv.destructive : cv.brandGradient,
          },
        }}
      />
    </Box>
  );

  if (!tooltip) return bar;
  return (
    <Tooltip title={tooltip} arrow placement="top">
      <Box>{bar}</Box>
    </Tooltip>
  );
}

export function QuickLinkCard({
  to,
  title,
  description,
  meta,
  icon,
}: {
  to: string;
  title: string;
  description: string;
  meta?: string;
  icon?: ReactNode;
}) {
  return (
    <Box
      component={RouterLink}
      to={to}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        p: 2,
        borderRadius: '6px',
        border: `1px solid ${cv.border}`,
        background: cv.surface,
        boxShadow: cv.cardShadow,
        textDecoration: 'none',
        color: cv.textPrimary,
        minHeight: 132,
        transition: 'border-color 0.15s ease, background 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease',
        '&:hover': {
          borderColor: cv.brandOrchid,
          background: cv.purpleSurface,
          transform: 'translateY(-2px)',
          boxShadow: cv.brandShadowSoft,
        },
        '&:focus-visible': {
          outline: `2px solid ${cv.brandOrchid}`,
          outlineOffset: 2,
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 1 }}>
        {icon ? (
          <Box
            sx={{
              width: 34,
              height: 34,
              borderRadius: '6px',
              display: 'grid',
              placeItems: 'center',
              background: cv.purpleSurface,
              color: cv.brandOrchid,
              border: `1px solid ${cv.purpleChipBorder}`,
              flexShrink: 0,
            }}
          >
            {icon}
          </Box>
        ) : null}
        <Typography sx={{ fontWeight: 600, fontSize: '0.9375rem' }}>{title}</Typography>
      </Box>
      <Typography sx={{ fontSize: '0.8125rem', color: cv.textSecondary, flex: 1, mb: meta ? 1.25 : 0 }}>
        {description}
      </Typography>
      {meta ? (
        <Typography sx={{ fontSize: '0.75rem', color: cv.brandOrchid, fontWeight: 600 }}>
          {meta}
        </Typography>
      ) : null}
    </Box>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <Box
      sx={{
        py: 3,
        px: 1,
        textAlign: 'center',
        borderRadius: '6px',
        border: `1px dashed ${cv.border}`,
        background: cv.surfaceMuted,
      }}
    >
      <Typography sx={{ color: cv.textMuted, fontSize: '0.875rem' }}>{message}</Typography>
    </Box>
  );
}

export function PlatformTablePagination({
  count,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  rowsPerPageOptions = [...PLATFORM_ROWS_PER_PAGE_OPTIONS],
}: Readonly<{
  count: number;
  page: number;
  rowsPerPage: number;
  onPageChange: (event: unknown, newPage: number) => void;
  onRowsPerPageChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  rowsPerPageOptions?: number[];
}>) {
  const jumpFieldId = useId();

  if (count === 0) {
    return null;
  }

  const pageCount = Math.max(1, Math.ceil(count / rowsPerPage));
  const pageOptions = Array.from({ length: pageCount }, (_, index) => index);

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        flexWrap: 'wrap',
        gap: 1,
        mt: 1,
        pt: 0.5,
        borderTop: `1px solid ${cv.border}`,
      }}
    >
      {pageCount > 1 ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography
            component="label"
            htmlFor={jumpFieldId}
            sx={{ fontSize: '0.8125rem', color: cv.textSecondary, whiteSpace: 'nowrap' }}
          >
            Go to page
          </Typography>
          <TextField
            select
            size="small"
            id={jumpFieldId}
            value={Math.min(page, pageCount - 1)}
            onChange={(event) => onPageChange(event, Number(event.target.value))}
            slotProps={{
              select: { MenuProps: { slotProps: { paper: { sx: { maxHeight: 320 } } } } },
            }}
            sx={{
              minWidth: 88,
              '& .MuiInputBase-input': { fontSize: '0.8125rem', py: 0.75 },
            }}
          >
            {pageOptions.map((pageIndex) => (
              <MenuItem key={pageIndex} value={pageIndex} sx={{ fontSize: '0.8125rem' }}>
                {pageIndex + 1} of {pageCount}
              </MenuItem>
            ))}
          </TextField>
        </Box>
      ) : null}
      <TablePagination
        component="div"
        count={count}
        page={page}
        onPageChange={onPageChange}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={onRowsPerPageChange}
        rowsPerPageOptions={rowsPerPageOptions}
        showFirstButton
        showLastButton
        sx={{
          color: cv.textSecondary,
          borderTop: 'none',
          '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': {
            fontSize: '0.8125rem',
            color: cv.textSecondary,
          },
          '.MuiTablePagination-select': {
            color: cv.textPrimary,
          },
          '.MuiIconButton-root': {
            color: cv.textSecondary,
            '&.Mui-disabled': { color: cv.textMuted },
          },
        }}
      />
    </Box>
  );
}

export type PlatformTableColumn<Field extends string = string> = {
  /** Stable key for the column. */
  id: string;
  label?: ReactNode;
  align?: 'left' | 'center' | 'right';
  /** Sort key sent to the API. Omit to make the column unsortable. */
  sortField?: Field;
  tooltip?: string;
  width?: number | string;
};

export function PlatformTableHead<Field extends string>({
  columns,
  sortBy,
  sortDir,
  onSort,
}: Readonly<{
  columns: ReadonlyArray<PlatformTableColumn<Field>>;
  sortBy?: Field;
  sortDir?: PlatformSortDirection;
  onSort?: (field: Field) => void;
}>) {
  return (
    <TableHead>
      <TableRow>
        {columns.map((column) => {
          const sortable = Boolean(column.sortField && onSort);
          const active = sortable && column.sortField === sortBy;
          const direction = active ? (sortDir ?? 'asc') : undefined;
          const header = column.tooltip ? (
            <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center' }}>
              {column.label}
              <InfoTip title={column.tooltip} />
            </Box>
          ) : (
            column.label
          );

          return (
            <TableCell
              key={column.id}
              align={column.align}
              sortDirection={active ? (direction ?? false) : false}
              sx={{ width: column.width }}
            >
              {sortable ? (
                <TableSortLabel
                  active={active}
                  direction={direction ?? 'asc'}
                  onClick={() => onSort?.(column.sortField as Field)}
                  sx={{
                    color: 'inherit',
                    '&:hover': { color: cv.textPrimary },
                    '&.Mui-active': { color: cv.textPrimary },
                    '&.Mui-focusVisible': {
                      outline: `2px solid ${cv.brandOrchid}`,
                      outlineOffset: 2,
                      borderRadius: '4px',
                    },
                    '& .MuiTableSortLabel-icon': {
                      opacity: active ? 1 : 0.35,
                      color: active ? cv.brandOrchid : 'inherit',
                      fontSize: '1rem',
                    },
                  }}
                >
                  {header}
                </TableSortLabel>
              ) : (
                header
              )}
            </TableCell>
          );
        })}
      </TableRow>
    </TableHead>
  );
}

export function FilterBar({
  children,
  actions,
}: Readonly<{ children: ReactNode; actions?: ReactNode }>) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 1.5,
        mb: 2,
        borderRadius: '6px',
        border: `1px solid ${cv.border}`,
        background: cv.surface,
        boxShadow: cv.cardShadow,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 1.5,
        flexWrap: 'wrap',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, flexWrap: 'wrap', minWidth: 0 }}>
        {children}
      </Box>
      {actions ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>{actions}</Box>
      ) : null}
    </Paper>
  );
}

export function SearchField({
  value,
  onChange,
  placeholder = 'Search',
  label,
  minWidth = 260,
}: Readonly<{
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  minWidth?: number;
}>) {
  return (
    <TextField
      size="small"
      value={value}
      label={label}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      slotProps={{
        htmlInput: { 'aria-label': label || placeholder },
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon sx={{ fontSize: 18, color: cv.textMuted }} />
            </InputAdornment>
          ),
          endAdornment: value ? (
            <InputAdornment position="end">
              <IconButton
                size="small"
                aria-label="Clear search"
                onClick={() => onChange('')}
                sx={{ color: cv.textMuted, '&:hover': { color: cv.textPrimary } }}
              >
                <ClearIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </InputAdornment>
          ) : null,
        },
      }}
      sx={{ minWidth, '& .MuiInputBase-input': { fontSize: '0.8125rem' } }}
    />
  );
}

export type FilterOption = { value: string; label: string };

export function FilterSelect({
  label,
  value,
  options,
  onChange,
  minWidth = 150,
}: Readonly<{
  label: string;
  value: string;
  options: ReadonlyArray<FilterOption>;
  onChange: (value: string) => void;
  minWidth?: number;
}>) {
  const active = value !== '';
  return (
    <TextField
      select
      size="small"
      label={label}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      sx={{
        minWidth,
        '& .MuiInputBase-input': { fontSize: '0.8125rem' },
        ...(active
          ? {
              '& .MuiOutlinedInput-notchedOutline': { borderColor: cv.brandOrchid },
              '& .MuiInputLabel-root': { color: cv.brandOrchid },
            }
          : {}),
      }}
    >
      {options.map((option) => (
        <MenuItem key={option.value} value={option.value} sx={{ fontSize: '0.8125rem' }}>
          {option.label}
        </MenuItem>
      ))}
    </TextField>
  );
}

export function ActiveFilterChips({
  filters,
  onClear,
  onClearAll,
}: Readonly<{
  filters: ReadonlyArray<{ key: string; label: string }>;
  onClear: (key: string) => void;
  onClearAll?: () => void;
}>) {
  if (filters.length === 0) return null;
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap', mb: 2 }}>
      <Typography sx={{ fontSize: '0.75rem', color: cv.textMuted, fontWeight: 600 }}>
        Filters
      </Typography>
      {filters.map((filter) => (
        <Chip
          key={filter.key}
          size="small"
          label={filter.label}
          onDelete={() => onClear(filter.key)}
          deleteIcon={<ClearIcon sx={{ fontSize: 14 }} />}
          sx={{
            height: 24,
            fontSize: '0.7rem',
            fontWeight: 600,
            borderRadius: '6px',
            background: cv.purpleSurface,
            color: cv.textSecondary,
            border: `1px solid ${cv.purpleChipBorder}`,
            '& .MuiChip-deleteIcon': {
              color: cv.textMuted,
              '&:hover': { color: cv.destructive },
            },
          }}
        />
      ))}
      {onClearAll ? (
        <Chip
          size="small"
          label="Clear all"
          onClick={onClearAll}
          sx={{
            height: 24,
            fontSize: '0.7rem',
            fontWeight: 600,
            borderRadius: '6px',
            background: 'transparent',
            color: cv.brandOrchid,
            border: `1px dashed ${cv.purpleChipBorder}`,
            '&:hover': { background: cv.purpleSurface },
          }}
        />
      ) : null}
    </Box>
  );
}

export function TableLoadingBar({ loading }: Readonly<{ loading: boolean }>) {
  return (
    <Box sx={{ height: 2, mb: 0.5 }}>
      {loading ? (
        <LinearProgress
          sx={{
            height: 2,
            borderRadius: 999,
            background: 'transparent',
            '& .MuiLinearProgress-bar': { background: cv.brandGradient },
          }}
        />
      ) : null}
    </Box>
  );
}

export function formatBytes(value: string | number | bigint | undefined): string {
  const n = typeof value === 'bigint' ? Number(value) : Number(value || 0);
  if (!Number.isFinite(n) || n <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let v = n;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i += 1;
  }
  return `${v.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export function formatPercent(used?: string | number, quota?: string | number): number {
  const u = Number(used || 0);
  const q = Number(quota || 0);
  if (!q || !Number.isFinite(u) || !Number.isFinite(q)) return 0;
  return Math.round((u / q) * 1000) / 10;
}

export function formatMoneyCents(cents?: number | null): string {
  const n = Number(cents || 0) / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n);
}

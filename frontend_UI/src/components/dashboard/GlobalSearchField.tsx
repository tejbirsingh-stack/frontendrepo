import { useRef, type RefObject } from 'react';
import { cv } from '../../theme/cssVars';
import {
  Box,
  InputAdornment,
  TextField,
  type SxProps,
  type Theme,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { useDashboard } from '../../context/DashboardContext';
import { getModKeyLabel } from '../../constants/dashboardShortcuts';
import { useResolvedKeyboardShortcuts } from '../../hooks/useResolvedKeyboardShortcuts';
import { searchFieldInputSx } from '../../utils/searchFieldStyles';

interface GlobalSearchFieldProps {
  inputRef?: RefObject<HTMLInputElement | null>;
  showShortcutHint?: boolean;
  placeholder?: string;
  sx?: SxProps<Theme>;
}

function formatFocusSearchPlaceholder(shortcut: string): string {
  if (shortcut.length === 1) {
    return `Search for anything, or press '${shortcut}'`;
  }

  return `Search for anything, or press ${shortcut}`;
}

export default function GlobalSearchField({
  inputRef: inputRefProp,
  showShortcutHint = true,
  placeholder,
  sx,
}: GlobalSearchFieldProps) {
  const { globalSearchQuery, setGlobalSearchQuery } = useDashboard();
  const { getShortcut } = useResolvedKeyboardShortcuts();
  const localRef = useRef<HTMLInputElement>(null);
  const inputRef = inputRefProp ?? localRef;

  const primaryShortcut = getShortcut('dashboard-focus-search') ?? '/';
  const modShortcut = getShortcut('dashboard-focus-search-mod') ?? `${getModKeyLabel()} S`;
  const resolvedPlaceholder =
    placeholder ?? formatFocusSearchPlaceholder(primaryShortcut);

  return (
    <TextField
      fullWidth
      inputRef={inputRef}
      value={globalSearchQuery}
      onChange={(event) => setGlobalSearchQuery(event.target.value)}
      placeholder={resolvedPlaceholder}
      size="small"
      aria-label="Global search"
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon sx={{ fontSize: 20, color: cv.textMuted }} />
            </InputAdornment>
          ),
          endAdornment: showShortcutHint ? (
            <InputAdornment position="end">
              <Box
                component="kbd"
                sx={{
                  display: { xs: 'none', sm: 'inline-flex' },
                  alignItems: 'center',
                  px: 0.75,
                  py: 0.25,
                  borderRadius: '6px',
                  border: '1px solid var(--noah-border)',
                  color: cv.textMuted,
                  fontSize: '0.6875rem',
                  fontFamily: 'inherit',
                  lineHeight: 1.2,
                  whiteSpace: 'nowrap',
                }}
              >
                {modShortcut}
              </Box>
            </InputAdornment>
          ) : undefined,
          sx: {
            borderRadius: '999px',
            fontSize: '0.875rem',
            py: 0.25,
            backgroundColor: cv.surface,
            ...searchFieldInputSx,
            '& fieldset': { borderColor: cv.border },
            '&:hover fieldset': { borderColor: cv.borderFocus },
            '&.Mui-focused fieldset': {
              borderColor: cv.borderFocus,
              borderWidth: 1,
            },
          },
        },
      }}
      sx={sx}
    />
  );
}

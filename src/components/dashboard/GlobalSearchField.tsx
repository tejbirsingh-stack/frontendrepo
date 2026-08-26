import { useRef, useState, useEffect, type RefObject } from 'react';
import { cv } from '../../theme/cssVars';
import {
  Box,
  InputAdornment,
  TextField,
  type SxProps,
  type Theme,
} from '@mui/material';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import SearchIcon from '@mui/icons-material/Search';
import { useDashboard } from '../../context/DashboardContext';
import { getModKeyLabel } from '../../constants/dashboardShortcuts';
import { useResolvedKeyboardShortcuts } from '../../hooks/useResolvedKeyboardShortcuts';
import { useAiEntitled } from '../../hooks/useAiEntitled';
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
  const aiEntitled = useAiEntitled();
  const [inputValue, setInputValue] = useState(globalSearchQuery);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
  };

  useEffect(() => {
    // If the input is 1–2 characters, wait until the 3-character floor
    if (inputValue.length > 0 && inputValue.length <= 2) {
      return;
    }

    // Debounce the search API call
    const handler = setTimeout(() => {
      setGlobalSearchQuery(inputValue);
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [inputValue, setGlobalSearchQuery]);

  const { getShortcut } = useResolvedKeyboardShortcuts();
  const localRef = useRef<HTMLInputElement>(null);
  const inputRef = inputRefProp ?? localRef;

  const primaryShortcut = getShortcut('dashboard-focus-search') ?? '/';
  const modShortcut = getShortcut('dashboard-focus-search-mod') ?? `${getModKeyLabel()} S`;
  const resolvedPlaceholder =
    placeholder ??
    (aiEntitled
      ? 'Search titles and spoken content'
      : formatFocusSearchPlaceholder(primaryShortcut));

  return (
    <TextField
      fullWidth
      inputRef={inputRef}
      value={inputValue}
      onChange={handleChange}
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
          endAdornment:
            showShortcutHint || aiEntitled ? (
              <InputAdornment position="end" sx={{ gap: 0.75 }}>
                {showShortcutHint ? (
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
                ) : null}
                {aiEntitled ? (
                  <Box
                    aria-hidden
                    title="AI search available"
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 24,
                      height: 24,
                      borderRadius: '8px',
                      flexShrink: 0,
                      color: cv.textPrimary,
                      backgroundColor: cv.purpleSelectionHover,
                      boxShadow: `inset 0 0 0 1px ${cv.purpleSelectionStrong}`,
                    }}
                  >
                    <AutoAwesomeOutlinedIcon sx={{ fontSize: 14 }} />
                  </Box>
                ) : null}
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

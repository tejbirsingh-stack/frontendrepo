import { useRef, useState, useEffect, type RefObject, type KeyboardEvent } from 'react';
import { cv } from '../../theme/cssVars';
import {
  Box,
  ClickAwayListener,
  IconButton,
  InputAdornment,
  TextField,
  Tooltip,
  Typography,
  type SxProps,
  type Theme,
} from '@mui/material';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import SearchIcon from '@mui/icons-material/Search';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import VideocamOutlinedIcon from '@mui/icons-material/VideocamOutlined';
import AudioFileOutlinedIcon from '@mui/icons-material/AudioFileOutlined';
import { useDashboard } from '../../context/DashboardContext';
import { getModKeyLabel } from '../../constants/dashboardShortcuts';
import { useResolvedKeyboardShortcuts } from '../../hooks/useResolvedKeyboardShortcuts';
import { env } from '../../config/env';
import { searchFieldInputSx } from '../../utils/searchFieldStyles';

interface GlobalSearchFieldProps {
  inputRef?: RefObject<HTMLInputElement | null>;
  showShortcutHint?: boolean;
  placeholder?: string;
  sx?: SxProps<Theme>;
}

type DummySearchType = 'video' | 'image' | 'document' | 'audio';

interface DummySearchResult {
  id: string;
  title: string;
  type: DummySearchType;
  subtitle: string;
  /** Optional image URL; falls back to a type placeholder when missing. */
  thumbnail?: string;
}

const DUMMY_SEARCH_RESULTS: DummySearchResult[] = [
  {
    id: 'dummy-1',
    title: 'Onboarding welcome clip',
    type: 'video',
    subtitle: 'Video · 0:42',
  },
  {
    id: 'dummy-2',
    title: 'Sample hero still',
    type: 'image',
    subtitle: 'Image · PNG',
  },
  {
    id: 'dummy-3',
    title: 'Noah starter brand kit',
    type: 'document',
    subtitle: 'File · PDF',
  },
  {
    id: 'dummy-4',
    title: 'Product walkthrough voiceover',
    type: 'audio',
    subtitle: 'Audio · 2:18',
  },
  {
    id: 'dummy-5',
    title: 'Campaign launch montage',
    type: 'video',
    subtitle: 'Video · 1:05',
  },
];

const typeMeta: Record<
  DummySearchType,
  { label: string; accent: string; Icon: typeof VideocamOutlinedIcon }
> = {
  video: {
    label: 'Video',
    accent: cv.blueAccentSurface,
    Icon: VideocamOutlinedIcon,
  },
  image: {
    label: 'Image',
    accent: cv.greenAccentSurface,
    Icon: ImageOutlinedIcon,
  },
  document: {
    label: 'File',
    accent: cv.surfaceHover,
    Icon: InsertDriveFileOutlinedIcon,
  },
  audio: {
    label: 'Audio',
    accent: cv.purpleAccentSurface,
    Icon: AudioFileOutlinedIcon,
  },
};

function formatFocusSearchPlaceholder(shortcut: string): string {
  if (shortcut.length === 1) {
    return `Search for anything, or press '${shortcut}'`;
  }

  return `Search for anything, or press ${shortcut}`;
}

function SearchResultThumbnail({ result }: Readonly<{ result: DummySearchResult }>) {
  const meta = typeMeta[result.type];
  const TypeIcon = meta.Icon;

  if (result.thumbnail) {
    return (
      <Box
        component="img"
        src={result.thumbnail}
        alt=""
        sx={{
          width: 44,
          height: 44,
          borderRadius: '8px',
          objectFit: 'cover',
          flexShrink: 0,
          backgroundColor: cv.surfaceMuted,
        }}
      />
    );
  }

  return (
    <Box
      aria-hidden
      sx={{
        width: 44,
        height: 44,
        borderRadius: '8px',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: meta.accent,
        border: `1px solid ${cv.border}`,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {result.type === 'video' ? (
        <Box
          sx={{
            width: 22,
            height: 22,
            borderRadius: '50%',
            backgroundColor: 'rgba(255,255,255,0.18)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <PlayArrowRoundedIcon sx={{ fontSize: 16, color: cv.textPrimary, ml: '1px' }} />
        </Box>
      ) : (
        <TypeIcon sx={{ fontSize: 22, color: cv.textSecondary }} />
      )}
    </Box>
  );
}

export default function GlobalSearchField({
  inputRef: inputRefProp,
  showShortcutHint = true,
  placeholder,
  sx,
}: Readonly<GlobalSearchFieldProps>) {
  const {
    globalSearchQuery,
    setGlobalSearchQuery,
    aiSearchEnabled,
    setAiSearchEnabled,
  } = useDashboard();
  const aiFeatureOn = env.aiEnabled;
  const [inputValue, setInputValue] = useState(globalSearchQuery);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const next = event.target.value;
    setInputValue(next);
    setDropdownOpen(next.trim().length > 0);
    setActiveIndex(-1);
  };

  useEffect(() => {
    setInputValue(globalSearchQuery);
  }, [globalSearchQuery]);

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
    (aiFeatureOn && aiSearchEnabled
      ? 'Search titles and spoken content'
      : formatFocusSearchPlaceholder(primaryShortcut));

  const showDropdown = dropdownOpen && inputValue.trim().length > 0;
  const filteredResults = DUMMY_SEARCH_RESULTS.filter((item) =>
    item.title.toLowerCase().includes(inputValue.trim().toLowerCase()),
  );
  const resultsToShow =
    filteredResults.length > 0 ? filteredResults : DUMMY_SEARCH_RESULTS;

  const closeDropdown = () => {
    setDropdownOpen(false);
    setActiveIndex(-1);
  };

  const handleClear = () => {
    setInputValue('');
    setGlobalSearchQuery('');
    closeDropdown();
    inputRef.current?.focus();
  };

  const handleSelect = (result: DummySearchResult) => {
    setInputValue(result.title);
    setGlobalSearchQuery(result.title);
    closeDropdown();
  };

  const hasQuery = inputValue.length > 0;
  const showEndAdornment = hasQuery || showShortcutHint || aiFeatureOn;

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((prev) => (prev + 1) % resultsToShow.length);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((prev) =>
        prev <= 0 ? resultsToShow.length - 1 : prev - 1,
      );
      return;
    }

    if (event.key === 'Enter' && activeIndex >= 0) {
      event.preventDefault();
      handleSelect(resultsToShow[activeIndex]);
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      closeDropdown();
    }
  };

  return (
    <ClickAwayListener onClickAway={closeDropdown}>
      <Box ref={containerRef} sx={[{ position: 'relative', width: '100%' }, ...(sx ? [sx] : [])]}>
        <TextField
          fullWidth
          inputRef={inputRef}
          value={inputValue}
          onChange={handleChange}
          onFocus={() => {
            if (inputValue.trim().length > 0) setDropdownOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={resolvedPlaceholder}
          size="small"
          aria-label="Global search"
          aria-expanded={showDropdown}
          aria-controls={showDropdown ? 'global-search-results' : undefined}
          aria-autocomplete="list"
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: 20, color: cv.textMuted }} />
                </InputAdornment>
              ),
              endAdornment: showEndAdornment ? (
                <InputAdornment position="end" sx={{ gap: 0.5 }}>
                  {hasQuery ? (
                    <IconButton
                      size="small"
                      aria-label="Clear search"
                      onClick={handleClear}
                      edge="end"
                      sx={{
                        width: 28,
                        height: 28,
                        color: cv.textMuted,
                        '&:hover': {
                          color: cv.textPrimary,
                          backgroundColor: cv.surfaceHover,
                        },
                      }}
                    >
                      <CloseRoundedIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  ) : null}
                  {!hasQuery && showShortcutHint ? (
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
                  {aiFeatureOn ? (
                    <Tooltip
                      title={
                        aiSearchEnabled
                          ? 'AI search on — click to search titles only'
                          : 'AI search off — click to search titles and spoken content'
                      }
                      placement="bottom"
                      enterDelay={300}
                    >
                      <IconButton
                        size="small"
                        aria-label={aiSearchEnabled ? 'Disable AI search' : 'Enable AI search'}
                        aria-pressed={aiSearchEnabled}
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          setAiSearchEnabled(!aiSearchEnabled);
                        }}
                        edge="end"
                        sx={{
                          width: 28,
                          height: 28,
                          borderRadius: '8px',
                          flexShrink: 0,
                          color: aiSearchEnabled ? cv.textPrimary : cv.textMuted,
                          backgroundColor: aiSearchEnabled
                            ? cv.purpleSelectionHover
                            : 'transparent',
                          boxShadow: aiSearchEnabled
                            ? `inset 0 0 0 1px ${cv.purpleSelectionStrong}`
                            : 'none',
                          '&:hover': {
                            color: cv.textPrimary,
                            backgroundColor: aiSearchEnabled
                              ? cv.purpleSelectionBg
                              : cv.surfaceHover,
                          },
                        }}
                      >
                        <AutoAwesomeOutlinedIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Tooltip>
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
        />

        {showDropdown ? (
          <Box
            id="global-search-results"
            role="listbox"
            aria-label="Search results"
            sx={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              left: 0,
              right: 0,
              zIndex: 1300,
              maxHeight: 360,
              overflowY: 'auto',
              borderRadius: '12px',
              border: `1px solid ${cv.border}`,
              background: 'var(--noah-drawer-surface)',
              backdropFilter: 'blur(24px) saturate(160%)',
              WebkitBackdropFilter: 'blur(24px) saturate(160%)',
              boxShadow: cv.popoverShadow,
              py: 0.75,
            }}
          >
            <Typography
              sx={{
                px: 1.75,
                pt: 0.5,
                pb: 1,
                fontSize: '0.6875rem',
                fontWeight: 600,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                color: cv.textMuted,
              }}
            >
              Results
            </Typography>

            {resultsToShow.map((result, index) => {
              const meta = typeMeta[result.type];
              const isActive = index === activeIndex;

              return (
                <Box
                  key={result.id}
                  component="button"
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => handleSelect(result)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.25,
                    width: '100%',
                    px: 1.5,
                    py: 1,
                    border: 'none',
                    background: isActive ? cv.surfaceHover : 'transparent',
                    color: cv.textPrimary,
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontFamily: 'inherit',
                    '&:hover': {
                      backgroundColor: cv.surfaceHover,
                    },
                  }}
                >
                  <SearchResultThumbnail result={result} />
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography
                      sx={{
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        color: cv.textPrimary,
                        lineHeight: 1.3,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {result.title}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: '0.75rem',
                        color: cv.textMuted,
                        lineHeight: 1.35,
                        mt: 0.15,
                      }}
                    >
                      {result.subtitle}
                    </Typography>
                  </Box>
                  <Box
                    component="span"
                    sx={{
                      flexShrink: 0,
                      px: 0.75,
                      py: 0.25,
                      borderRadius: '6px',
                      fontSize: '0.6875rem',
                      fontWeight: 600,
                      color: cv.textSecondary,
                      backgroundColor: meta.accent,
                      border: `1px solid ${cv.border}`,
                    }}
                  >
                    {meta.label}
                  </Box>
                </Box>
              );
            })}
          </Box>
        ) : null}
      </Box>
    </ClickAwayListener>
  );
}

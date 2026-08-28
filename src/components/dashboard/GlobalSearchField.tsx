import {
  useRef,
  useState,
  useEffect,
  type RefObject,
  type KeyboardEvent,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { cv } from '../../theme/cssVars';
import {
  Box,
  CircularProgress,
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
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import { useDashboard } from '../../context/DashboardContext';
import { getModKeyLabel } from '../../constants/dashboardShortcuts';
import { useResolvedKeyboardShortcuts } from '../../hooks/useResolvedKeyboardShortcuts';
import { env } from '../../config/env';
import { searchFieldInputSx } from '../../utils/searchFieldStyles';
import { getLibraryItems } from '../../api/library.service';
import { mergeLibraryWithAiHits } from '../../api/mergeLibraryWithAiHits';
import type { MediaItem, MediaType } from '../../data/mockMedia';
import { getMediaFileName } from '../../utils/mediaFileName';
import { getMediaViewerPath } from '../../utils/mediaNavigation';

export const GLOBAL_SEARCH_CLEAR_EVENT = 'noah-clear-global-search';

interface GlobalSearchFieldProps {
  inputRef?: RefObject<HTMLInputElement | null>;
  showShortcutHint?: boolean;
  placeholder?: string;
  sx?: SxProps<Theme>;
}

const POPOVER_RESULT_LIMIT = 8;
const MIN_SEARCH_LENGTH = 3;

const typeMeta: Record<
  MediaType,
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
  folder: {
    label: 'Folder',
    accent: cv.surfaceHover,
    Icon: FolderOutlinedIcon,
  },
};

function formatFocusSearchPlaceholder(shortcut: string): string {
  if (shortcut.length === 1) {
    return `Search for anything, or press '${shortcut}'`;
  }

  return `Search for anything, or press ${shortcut}`;
}

function getSearchResultSubtitle(item: MediaItem): string {
  const meta = typeMeta[item.type];
  const typeLabel = item.isProject ? 'Project' : meta.label;

  if (item.type === 'video' || item.type === 'audio') {
    return item.duration ? `${typeLabel} · ${item.duration}` : typeLabel;
  }

  if (item.type === 'folder') {
    const count = item.itemCount ?? 0;
    return count > 0 ? `${typeLabel} · ${count} items` : typeLabel;
  }

  const fileName = getMediaFileName(item);
  const extension = fileName.includes('.')
    ? fileName.split('.').pop()?.toUpperCase()
    : undefined;

  return extension ? `${typeLabel} · ${extension}` : typeLabel;
}

function SearchResultThumbnail({ item }: Readonly<{ item: MediaItem }>) {
  const meta = typeMeta[item.type];
  const TypeIcon = meta.Icon;

  if (item.thumbnail) {
    return (
      <Box
        component="img"
        src={item.thumbnail}
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
      {item.type === 'video' ? (
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
  const navigate = useNavigate();
  const { activeWorkspaceId, aiSearchEnabled, setAiSearchEnabled } = useDashboard();
  const aiFeatureOn = env.aiEnabled;
  const [inputValue, setInputValue] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [searchResults, setSearchResults] = useState<MediaItem[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRequestIdRef = useRef(0);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const next = event.target.value;
    setInputValue(next);
    setDropdownOpen(next.trim().length > 0);
    setActiveIndex(-1);
  };

  const closeDropdown = () => {
    setDropdownOpen(false);
    setActiveIndex(-1);
  };

  useEffect(() => {
    const handleClearEvent = () => {
      searchRequestIdRef.current += 1;
      setInputValue('');
      setSearchResults([]);
      setSearchLoading(false);
      closeDropdown();
    };

    window.addEventListener(GLOBAL_SEARCH_CLEAR_EVENT, handleClearEvent);
    return () => window.removeEventListener(GLOBAL_SEARCH_CLEAR_EVENT, handleClearEvent);
  }, []);

  useEffect(() => {
    const query = inputValue.trim();

    if (!query || !activeWorkspaceId || query.length < MIN_SEARCH_LENGTH) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }

    const requestId = ++searchRequestIdRef.current;
    const handler = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await getLibraryItems({
          workspaceId: activeWorkspaceId,
          view: 'all',
          q: query,
          pageSize: POPOVER_RESULT_LIMIT,
        });

        const items =
          env.aiEnabled && aiSearchEnabled && query.length >= MIN_SEARCH_LENGTH
            ? await mergeLibraryWithAiHits(res.items, query)
            : res.items;

        if (searchRequestIdRef.current !== requestId) return;

        setSearchResults(items.slice(0, POPOVER_RESULT_LIMIT));
      } catch {
        if (searchRequestIdRef.current !== requestId) return;
        setSearchResults([]);
      } finally {
        if (searchRequestIdRef.current === requestId) {
          setSearchLoading(false);
        }
      }
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [inputValue, activeWorkspaceId, aiSearchEnabled]);

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
  const trimmedQuery = inputValue.trim();
  const queryTooShort =
    trimmedQuery.length > 0 && trimmedQuery.length < MIN_SEARCH_LENGTH;
  const resultsToShow = searchResults;

  const handleClear = () => {
    searchRequestIdRef.current += 1;
    setInputValue('');
    setSearchResults([]);
    setSearchLoading(false);
    closeDropdown();
    inputRef.current?.focus();
  };

  const handleSelect = (result: MediaItem) => {
    const openPath = getMediaViewerPath(result);
    const documentUrl =
      result.videoSrc ||
      (result.id ? `/api/media/${encodeURIComponent(result.id)}/stream` : undefined);

    handleClear();

    if (openPath) {
      navigate(openPath);
      return;
    }

    if (result.type === 'document' && documentUrl) {
      window.open(documentUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const hasQuery = inputValue.length > 0;
  const showEndAdornment = hasQuery || showShortcutHint || aiFeatureOn;

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      if (showDropdown) {
        closeDropdown();
      } else if (hasQuery) {
        handleClear();
      }
      return;
    }

    if (!showDropdown || resultsToShow.length === 0) return;

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
    }
  };

  return (
    <ClickAwayListener onClickAway={closeDropdown}>
      <Box
        ref={containerRef}
        component="form"
        autoComplete="off"
        onSubmit={(event) => event.preventDefault()}
        sx={[{ position: 'relative', width: '100%' }, ...(sx ? [sx] : [])]}
      >
        <Box
          component="input"
          type="text"
          name="noah-global-search-decoy"
          tabIndex={-1}
          aria-hidden="true"
          sx={{
            position: 'absolute',
            opacity: 0,
            width: 0,
            height: 0,
            pointerEvents: 'none',
          }}
          readOnly
        />
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
          aria-autocomplete="none"
          slotProps={{
            htmlInput: {
              autoComplete: 'off',
              autoCorrect: 'off',
              autoCapitalize: 'off',
              spellCheck: 'false',
              name: 'noah-global-search-field',
              id: 'noah-global-search-input',
              'data-lpignore': 'true',
              'data-1p-ignore': 'true',
              'data-form-type': 'other',
            },
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

            {queryTooShort ? (
              <Typography
                sx={{
                  px: 1.75,
                  py: 1.5,
                  fontSize: '0.8125rem',
                  color: cv.textMuted,
                }}
              >
                Type at least {MIN_SEARCH_LENGTH} characters to search
              </Typography>
            ) : null}

            {!queryTooShort && searchLoading ? (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 1,
                  px: 1.75,
                  py: 2,
                  color: cv.textMuted,
                }}
              >
                <CircularProgress size={16} sx={{ color: cv.textMuted }} />
                <Typography sx={{ fontSize: '0.8125rem' }}>Searching…</Typography>
              </Box>
            ) : null}

            {!queryTooShort && !searchLoading && resultsToShow.length === 0 ? (
              <Typography
                sx={{
                  px: 1.75,
                  py: 1.5,
                  fontSize: '0.8125rem',
                  color: cv.textMuted,
                }}
              >
                No results found
              </Typography>
            ) : null}

            {!queryTooShort && !searchLoading
              ? resultsToShow.map((result, index) => {
                  const meta = typeMeta[result.type];
                  const isActive = index === activeIndex;
                  const badgeLabel = result.isProject ? 'Project' : meta.label;

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
                      <SearchResultThumbnail item={result} />
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
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {getSearchResultSubtitle(result)}
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
                        {badgeLabel}
                      </Box>
                    </Box>
                  );
                })
              : null}
          </Box>
        ) : null}
      </Box>
    </ClickAwayListener>
  );
}

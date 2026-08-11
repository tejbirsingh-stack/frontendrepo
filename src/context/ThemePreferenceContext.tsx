import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { createAppTheme, colors, type AppColors, type ThemeMode } from '../theme/theme';

const STORAGE_KEY = 'noah-theme-preference';

const AppColorsContext = createContext<AppColors>(colors);

interface ThemePreferenceContextValue {
  mode: ThemeMode;
  /** Effective UI mode (forced dark on auth screens overrides stored preference). */
  effectiveMode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
  /** Keep document + MUI on dark until the returned disposer runs. */
  acquireForcedDark: () => () => void;
}

const ThemePreferenceContext = createContext<ThemePreferenceContextValue | null>(null);

function readStoredMode(): ThemeMode {
  if (typeof window === 'undefined') return 'dark';

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {
    // Ignore storage errors.
  }

  return 'dark';
}

function applyDocumentTheme(mode: ThemeMode): void {
  if (typeof document === 'undefined') return;

  document.documentElement.dataset.theme = mode;

  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.setAttribute('content', mode === 'light' ? '#f4f5f9' : '#121212');
  }
}

export function ThemePreferenceProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(() => readStoredMode());
  const [forcedDarkCount, setForcedDarkCount] = useState(0);

  const effectiveMode: ThemeMode = forcedDarkCount > 0 ? 'dark' : mode;

  useEffect(() => {
    applyDocumentTheme(effectiveMode);
  }, [effectiveMode]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      // Ignore storage errors.
    }
  }, [mode]);

  const setMode = useCallback((nextMode: ThemeMode) => {
    setModeState(nextMode);
  }, []);

  const toggleMode = useCallback(() => {
    setModeState((current) => (current === 'light' ? 'dark' : 'light'));
  }, []);

  const acquireForcedDark = useCallback(() => {
    setForcedDarkCount((count) => count + 1);
    return () => {
      setForcedDarkCount((count) => Math.max(0, count - 1));
    };
  }, []);

  const muiTheme = useMemo(() => createAppTheme(effectiveMode), [effectiveMode]);

  const preferenceValue = useMemo(
    () => ({
      mode,
      effectiveMode,
      setMode,
      toggleMode,
      acquireForcedDark,
    }),
    [mode, effectiveMode, setMode, toggleMode, acquireForcedDark],
  );

  return (
    <ThemePreferenceContext.Provider value={preferenceValue}>
      <AppColorsContext.Provider value={colors}>
        <ThemeProvider theme={muiTheme}>
          <CssBaseline />
          {children}
        </ThemeProvider>
      </AppColorsContext.Provider>
    </ThemePreferenceContext.Provider>
  );
}

export function useThemePreference(): ThemePreferenceContextValue {
  const context = useContext(ThemePreferenceContext);
  if (!context) {
    throw new Error('useThemePreference must be used within ThemePreferenceProvider');
  }
  return context;
}

/** Force document + MUI dark theme for the lifetime of the calling component (auth screens). */
export function useForcedDarkTheme(): void {
  const { acquireForcedDark } = useThemePreference();

  useEffect(() => acquireForcedDark(), [acquireForcedDark]);
}

/** Prefer cv (CSS variables) in module-level styles; use this hook inside components when needed. */
export function useAppColors(): AppColors {
  return useContext(AppColorsContext);
}

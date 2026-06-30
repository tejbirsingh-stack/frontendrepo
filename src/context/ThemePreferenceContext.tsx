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
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
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

  useEffect(() => {
    applyDocumentTheme(mode);

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

  const muiTheme = useMemo(() => createAppTheme(mode), [mode]);

  const preferenceValue = useMemo(
    () => ({
      mode,
      setMode,
      toggleMode,
    }),
    [mode, setMode, toggleMode],
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

/** Prefer cv (CSS variables) in module-level styles; use this hook inside components when needed. */
export function useAppColors(): AppColors {
  return useContext(AppColorsContext);
}

import { Navigate, useLocation } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { useForcedDarkTheme } from '../../context/ThemePreferenceContext';
import { usePlatformAuth } from './PlatformAuthContext';

export function PlatformProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isInitializing } = usePlatformAuth();
  const location = useLocation();

  if (isInitializing) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/platform/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}

export function PlatformGuestRoute({ children }: { children: React.ReactNode }) {
  useForcedDarkTheme();
  const { isAuthenticated, isInitializing } = usePlatformAuth();

  if (isInitializing) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/platform" replace />;
  }

  return children;
}

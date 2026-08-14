import { Navigate, useLocation } from 'react-router-dom';
import AuthPageSkeleton from '../components/loading/AuthPageSkeleton';
import { useForcedDarkTheme } from '../context/ThemePreferenceContext';
import { useAuth } from './AuthContext';
import { APP_HOME_PATH, getPostAuthRedirect } from './paths';

export default function GuestRoute({ children }: { children: React.ReactNode }) {
  useForcedDarkTheme();
  const { isAuthenticated, isInitializing } = useAuth();
  const location = useLocation();
  const redirectPath = getPostAuthRedirect(
    typeof location.state === 'object' &&
      location.state !== null &&
      'from' in location.state
      ? (location.state as { from?: unknown }).from
      : APP_HOME_PATH,
  );

  if (isInitializing) {
    return <AuthPageSkeleton />;
  }

  if (isAuthenticated && location.pathname !== '/reset-password') {
    return <Navigate to={redirectPath} replace />;
  }

  return children;
}

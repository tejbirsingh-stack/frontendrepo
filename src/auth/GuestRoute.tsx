import { Navigate, useLocation } from 'react-router-dom';
import AuthPageSkeleton from '../components/loading/AuthPageSkeleton';
import { useAuth } from './AuthContext';

export default function GuestRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isInitializing } = useAuth();
  const location = useLocation();
  const redirectPath =
    typeof location.state === 'object' &&
    location.state !== null &&
    'from' in location.state &&
    typeof (location.state as { from?: unknown }).from === 'string'
      ? (location.state as { from: string }).from
      : '/home';

  if (isInitializing) {
    return <AuthPageSkeleton />;
  }

  if (isAuthenticated) {
    return <Navigate to={redirectPath} replace />;
  }

  return children;
}

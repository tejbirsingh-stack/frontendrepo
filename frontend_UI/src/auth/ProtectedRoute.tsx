import { Navigate, useLocation } from 'react-router-dom';
import { getSkeletonForPath } from '../components/loading/RouteLoadingFallback';
import { useAuth } from './AuthContext';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isInitializing } = useAuth();
  const location = useLocation();

  if (isInitializing) {
    return getSkeletonForPath(location.pathname);
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace state={{ from: `${location.pathname}${location.search}` }} />;
  }

  return children;
}

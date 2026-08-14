import { Navigate, useLocation } from 'react-router-dom';
import { getSkeletonForPath } from '../components/loading/RouteLoadingFallback';
import { useAuth } from './AuthContext';
import PlanExpiredModal from '../components/common/PlanExpiredModal';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isInitializing } = useAuth();
  const location = useLocation();

  if (isInitializing) {
    return getSkeletonForPath(location.pathname);
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />;
  }

  return (
    <>
      <PlanExpiredModal />
      {children}
    </>
  );
}

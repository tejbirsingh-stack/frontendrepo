import { useLocation } from 'react-router-dom';
import AuthPageSkeleton from './AuthPageSkeleton';
import DashboardShellSkeleton from './DashboardShellSkeleton';
import MediaViewerSkeleton from './MediaViewerSkeleton';

function getSkeletonForPath(pathname: string) {
  if (pathname === '/' || pathname === '/signup') {
    return <AuthPageSkeleton />;
  }

  if (pathname.startsWith('/media/')) {
    return <MediaViewerSkeleton />;
  }

  return <DashboardShellSkeleton />;
}

export default function RouteLoadingFallback() {
  const { pathname } = useLocation();
  return getSkeletonForPath(pathname);
}

export { getSkeletonForPath };

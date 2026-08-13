import { Box } from '@mui/material';
import { useLocation } from 'react-router-dom';
import { cv } from '../../theme/cssVars';
import AuthPageSkeleton from './AuthPageSkeleton';
import DashboardShellSkeleton from './DashboardShellSkeleton';
import MediaViewerSkeleton from './MediaViewerSkeleton';

function getSkeletonForPath(pathname: string) {
  if (pathname === '/') {
    return <Box sx={{ minHeight: '100vh', backgroundColor: cv.bg }} />;
  }

  if (pathname === '/login' || pathname === '/signup') {
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

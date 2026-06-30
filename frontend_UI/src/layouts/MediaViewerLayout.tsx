import { Outlet } from 'react-router-dom';
import MediaViewerSkeleton from '../components/loading/MediaViewerSkeleton';
import PageSuspense from '../components/loading/PageSuspense';
import { DashboardProvider } from '../context/DashboardContext';

export default function MediaViewerLayout() {
  return (
    <DashboardProvider>
      <PageSuspense fallback={<MediaViewerSkeleton />}>
        <Outlet />
      </PageSuspense>
    </DashboardProvider>
  );
}

import { useEffect, useState } from 'react';
import { cv } from '../theme/cssVars';
import { Box, useMediaQuery, useTheme } from '@mui/material';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import DashboardContentSkeleton from '../components/loading/DashboardContentSkeleton';
import PageSuspense from '../components/loading/PageSuspense';
import SettingsContentSkeleton from '../components/loading/SettingsContentSkeleton';
import { getMediaFolderPath } from '../utils/mediaNavigation';
import Sidebar from '../components/dashboard/Sidebar';
import SidebarDrawer from '../components/dashboard/SidebarDrawer';
import SettingsSidebar from '../components/settings/SettingsSidebar';
import SettingsSidebarDrawer from '../components/settings/SettingsSidebarDrawer';
import Header from '../components/dashboard/Header';
import MediaUploadDetailsModal from '../components/dashboard/MediaUploadDetailsModal';
import { SIDEBAR_DESKTOP_BREAKPOINT } from '../constants/layout';
import { DashboardProvider, useDashboard } from '../context/DashboardContext';
import type { MediaUploadDetails } from '../types/mediaUpload';

function DashboardLayoutContent() {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isSettingsRoute = location.pathname.startsWith('/home/settings');
  const isDesktopSidebar = useMediaQuery(
    theme.breakpoints.up(SIDEBAR_DESKTOP_BREAKPOINT),
  );
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const {
    pendingMediaUpload,
    pendingMediaUploadCount,
    completeMediaUpload,
    cancelMediaUpload,
  } = useDashboard();

  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [location.pathname]);

  const handleCompleteMediaUpload = (details: MediaUploadDetails) => {
    const parentFolderId = pendingMediaUpload?.parentFolderId ?? null;
    completeMediaUpload(details);
    if (pendingMediaUploadCount <= 1) {
      navigate(parentFolderId ? getMediaFolderPath(parentFolderId) : '/home');
    }
  };

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          height: '100vh',
          overflow: 'hidden',
          backgroundColor: cv.bg,
        }}
      >
        {isSettingsRoute ? (
          <SettingsSidebar variant="persistent" />
        ) : (
          <Sidebar variant="persistent" />
        )}

        {!isDesktopSidebar &&
          (isSettingsRoute ? (
            <SettingsSidebarDrawer
              open={mobileSidebarOpen}
              onClose={() => setMobileSidebarOpen(false)}
            />
          ) : (
            <SidebarDrawer
              open={mobileSidebarOpen}
              onClose={() => setMobileSidebarOpen(false)}
            />
          ))}

        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            minWidth: 0,
            height: '100vh',
            overflow: 'hidden',
          }}
        >
          <Header
            showMenuButton={!isDesktopSidebar}
            onMenuClick={() => setMobileSidebarOpen(true)}
          />
          <PageSuspense
            fallback={
              isSettingsRoute ? <SettingsContentSkeleton /> : <DashboardContentSkeleton />
            }
          >
            <Outlet />
          </PageSuspense>
        </Box>
      </Box>

      <MediaUploadDetailsModal
        open={Boolean(pendingMediaUpload)}
        pendingUpload={pendingMediaUpload}
        queueCount={pendingMediaUploadCount}
        onClose={cancelMediaUpload}
        onUpload={handleCompleteMediaUpload}
      />
    </>
  );
}

export default function DashboardLayout() {
  return (
    <DashboardProvider>
      <DashboardLayoutContent />
    </DashboardProvider>
  );
}

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
import FloatingUploadProgressWidget from '../components/dashboard/FloatingUploadProgressWidget';
import { SIDEBAR_DESKTOP_BREAKPOINT } from '../constants/layout';
import { DashboardProvider, useDashboard } from '../context/DashboardContext';
import { useUploadManager } from '../context/UploadManagerContext';
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
  const { enqueueFiles } = useUploadManager();
  const {
    pendingMediaUpload,
    pendingMediaUploadCount,
    activeWorkspaceId,
    cancelMediaUpload,
    popPendingMediaUpload,
  } = useDashboard();

  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [location.pathname]);

  const handleCompleteMediaUpload = async (
    details: MediaUploadDetails,
  ) => {
    if (!pendingMediaUpload) return;

    const parentFolderId = pendingMediaUpload.parentFolderId ?? null;
    const linkedProjectId = pendingMediaUpload.linkedProjectId ?? null;

    let durationSecs: number | undefined;
    if (details.duration) {
      const parts = details.duration.split(':').map(Number);
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        durationSecs = parts[0] * 60 + parts[1];
      } else if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
        durationSecs = parts[0] * 3600 + parts[1] * 60 + parts[2];
      } else if (!isNaN(Number(details.duration))) {
        durationSecs = Number(details.duration);
      }
    }

    const targetFolderId = details.folderId || parentFolderId || undefined;

    // Enqueue file for background chunked upload & floating progress widget
    await enqueueFiles([pendingMediaUpload.file], {
      title: details.title.trim(),
      summary: details.summary?.trim() || undefined,
      thumbnail: details.thumbnail || undefined,
      folderId: targetFolderId,
      tagIds: details.tagIds,
      visibility: details.visibility,
      durationSeconds: durationSecs,
      ownerType: parentFolderId ? 'FOLDER' : 'WORKSPACE',
      ownerId: parentFolderId || activeWorkspaceId || undefined,
      linkedProjectId: linkedProjectId || undefined,
      parentFolderId: parentFolderId,
      aiFeatures: details.aiFeatures,
    });

    // Close/advance current modal item
    popPendingMediaUpload();

    if (pendingMediaUploadCount <= 1) {
      if (linkedProjectId) {
        navigate(`/home/project/${linkedProjectId}`);
      } else if (parentFolderId || details.folderId) {
        navigate(getMediaFolderPath((parentFolderId || details.folderId) as string));
      } else {
        navigate('/home');
      }
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

      <FloatingUploadProgressWidget />
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

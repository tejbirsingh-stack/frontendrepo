import { Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import RouteLoadingFallback from './components/loading/RouteLoadingFallback';
import RouteErrorBoundary from './components/errors/RouteErrorBoundary';
import StampStickerFilterDefs from './components/media/StampStickerFilterDefs';
import GuestRoute from './auth/GuestRoute';
import ProtectedRoute from './auth/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';
import MediaViewerLayout from './layouts/MediaViewerLayout';
import SettingsLayout from './layouts/SettingsLayout';
import {
  DashboardPage,
  FolderPage,
  LoginPage,
  NotFoundPage,
  SignUpPage,
  SettingsSectionPage,
  TagsManagementPage,
  TrashPage,
  VideoPlayerPage,
  MfaAuthPage,
  ResetPasswordPage,
  VerifyEmailPage,
} from './routes/lazyPages';

function App() {
  return (
    <BrowserRouter>
      <StampStickerFilterDefs />
      <Suspense fallback={<RouteLoadingFallback />}>
        <Routes>
          <Route
            path="/"
            element={
              <GuestRoute>
                <LoginPage />
              </GuestRoute>
            }
          />
          <Route
            path="/mfaAuth"
            element={
              <GuestRoute>
                <MfaAuthPage />
              </GuestRoute>
            }
          />
          <Route
            path="/signup"
            element={
              <GuestRoute>
                <SignUpPage />
              </GuestRoute>
            }
          />
          <Route
            path="/reset-password"
            element={<ResetPasswordPage />}
          />
          <Route
            path="/verify-email"
            element={<VerifyEmailPage />}
          />
          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <RouteErrorBoundary>
                  <DashboardLayout />
                </RouteErrorBoundary>
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage libraryView="recent" />} />
            <Route path="favorites" element={<DashboardPage libraryView="favorites" />} />
            <Route path="duplicates" element={<DashboardPage libraryView="duplicates" />} />
            <Route path="folder/:folderId" element={<FolderPage />} />
            <Route path="tags" element={<TagsManagementPage />} />
            <Route path="trash" element={<TrashPage />} />
            <Route path="settings" element={<SettingsLayout />}>
              <Route index element={<Navigate to="profile/personal" replace />} />
              <Route path=":group/:section" element={<SettingsSectionPage />} />
            </Route>
          </Route>
          <Route
            path="/media/:mediaId"
            element={
              <ProtectedRoute>
                <RouteErrorBoundary>
                  <MediaViewerLayout />
                </RouteErrorBoundary>
              </ProtectedRoute>
            }
          >
            <Route index element={<VideoPlayerPage />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;

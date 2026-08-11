import { Box, GlobalStyles } from '@mui/material';
import { Navigate, Route, Routes } from 'react-router-dom';
import { PlatformAuthProvider } from './auth/PlatformAuthContext';
import { PlatformGuestRoute, PlatformProtectedRoute } from './auth/PlatformRoutes';
import PlatformLayout from './layouts/PlatformLayout';
import PlatformLoginPage from './pages/PlatformLoginPage';
import PlatformDashboardPage from './pages/PlatformDashboardPage';
import PlatformOrganizationsPage from './pages/PlatformOrganizationsPage';
import PlatformOrganizationDetailPage from './pages/PlatformOrganizationDetailPage';
import PlatformUsersPage from './pages/PlatformUsersPage';
import PlatformWorkspacesPage from './pages/PlatformWorkspacesPage';
import PlatformPlansPage from './pages/PlatformPlansPage';
import PlatformBillingPage from './pages/PlatformBillingPage';
import PlatformUsagePage from './pages/PlatformUsagePage';
import PlatformActivityPage from './pages/PlatformActivityPage';
import PlatformReportingPage from './pages/PlatformReportingPage';
import PlatformLandingPage from './pages/PlatformLandingPage';
import PlatformDefaultContentPage from './pages/PlatformDefaultContentPage';

/** Applied globally while PlatformApp is mounted so portaled Dialogs get the same size. */
const PLATFORM_BUTTON_STYLES = {
  '.MuiButton-root': {
    height: 40,
    minHeight: 40,
    maxHeight: 40,
    paddingTop: 0,
    paddingBottom: 0,
    boxSizing: 'border-box',
  },
} as const;

export default function PlatformApp() {
  return (
    <Box>
      <GlobalStyles styles={PLATFORM_BUTTON_STYLES} />
      <PlatformAuthProvider>
        <Routes>
          <Route
            path="login"
            element={
              <PlatformGuestRoute>
                <PlatformLoginPage />
              </PlatformGuestRoute>
            }
          />
          <Route
            element={
              <PlatformProtectedRoute>
                <PlatformLayout />
              </PlatformProtectedRoute>
            }
          >
            <Route index element={<PlatformDashboardPage />} />
            <Route path="organizations" element={<PlatformOrganizationsPage />} />
            <Route path="organizations/:orgId" element={<PlatformOrganizationDetailPage />} />
            <Route path="users" element={<PlatformUsersPage />} />
            <Route path="workspaces" element={<PlatformWorkspacesPage />} />
            <Route path="plans" element={<PlatformPlansPage />} />
            <Route path="billing" element={<PlatformBillingPage />} />
            <Route path="usage" element={<PlatformUsagePage />} />
            <Route path="activity" element={<PlatformActivityPage />} />
            <Route path="reporting" element={<PlatformReportingPage />} />
            <Route path="landing" element={<PlatformLandingPage />} />
            <Route path="default-content" element={<PlatformDefaultContentPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/platform" replace />} />
        </Routes>
      </PlatformAuthProvider>
    </Box>
  );
}

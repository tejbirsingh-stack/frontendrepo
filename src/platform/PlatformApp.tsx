import { Navigate, Route, Routes } from 'react-router-dom';
import { PlatformAuthProvider } from './auth/PlatformAuthContext';
import { PlatformGuestRoute, PlatformProtectedRoute } from './auth/PlatformRoutes';
import PlatformLayout from './layouts/PlatformLayout';
import PlatformLoginPage from './pages/PlatformLoginPage';
import PlatformDashboardPage from './pages/PlatformDashboardPage';
import PlatformOrganizationsPage from './pages/PlatformOrganizationsPage';
import PlatformOrganizationDetailPage from './pages/PlatformOrganizationDetailPage';
import PlatformPlansPage from './pages/PlatformPlansPage';
import PlatformBillingPage from './pages/PlatformBillingPage';
import PlatformUsagePage from './pages/PlatformUsagePage';
import PlatformModerationPage from './pages/PlatformModerationPage';
import PlatformMediaPage from './pages/PlatformMediaPage';
import PlatformActivityPage from './pages/PlatformActivityPage';
import PlatformReportingPage from './pages/PlatformReportingPage';
import PlatformLandingPage from './pages/PlatformLandingPage';

export default function PlatformApp() {
  return (
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
          <Route path="plans" element={<PlatformPlansPage />} />
          <Route path="billing" element={<PlatformBillingPage />} />
          <Route path="usage" element={<PlatformUsagePage />} />
          <Route path="moderation" element={<PlatformModerationPage />} />
          <Route path="media" element={<PlatformMediaPage />} />
          <Route path="activity" element={<PlatformActivityPage />} />
          <Route path="reporting" element={<PlatformReportingPage />} />
          <Route path="landing" element={<PlatformLandingPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/platform" replace />} />
      </Routes>
    </PlatformAuthProvider>
  );
}

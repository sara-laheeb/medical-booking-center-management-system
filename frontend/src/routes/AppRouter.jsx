/**
 * Application Router
 * Defines all client-side routes including public pages (landing, login, register),
 * the authenticated app shell, and protected inner routes (dashboard, appointments).
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from '../pages/LandingPage';
import DesignSystemPage from '../pages/DesignSystemPage';
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import AppLayout from '../layouts/AppLayout';
import ProtectedRoute from './ProtectedRoute';
import AppOverviewPage from '../pages/app/AppOverviewPage';
import DashboardPage from '../pages/dashboard/DashboardPage';
import AppointmentsPage from '../pages/appointments/AppointmentsPage';

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Marketing & System Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/design-system" element={<DesignSystemPage />} />

        {/* Public Authentication Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected Enterprise SaaS Application Shell */}
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="appointments" element={<AppointmentsPage />} />
          <Route path="patients" element={<AppOverviewPage />} />
          <Route path="doctors" element={<AppOverviewPage />} />
          <Route path="records" element={<AppOverviewPage />} />
          <Route path="pharmacy" element={<AppOverviewPage />} />
          <Route path="billing" element={<AppOverviewPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRouter;



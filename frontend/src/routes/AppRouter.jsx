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
import PatientsPage from '../pages/patients/PatientsPage';
import DoctorsPage from '../pages/doctors/DoctorsPage';
import RecordsPage from '../pages/records/RecordsPage';
import PharmacyPage from '../pages/pharmacy/PharmacyPage';
import DoctorPrescriptionsPage from '../pages/pharmacy/DoctorPrescriptionsPage';
import BillingPage from '../pages/billing/BillingPage';
import BookAppointmentPage from '../pages/patient/BookAppointmentPage';
import PatientAppointmentsPage from '../pages/patient/PatientAppointmentsPage';
import PatientRecordsPage from '../pages/patient/PatientRecordsPage';
import PatientPrescriptionsPage from '../pages/patient/PatientPrescriptionsPage';
import PatientNotificationsPage from '../pages/patient/PatientNotificationsPage';
import PatientProfilePage from '../pages/patient/PatientProfilePage';

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
          <Route
            path="appointments"
            element={
              <ProtectedRoute allowedRoles={['admin', 'doctor', 'receptionist', 'patient']}>
                <AppointmentsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="patients"
            element={
              <ProtectedRoute allowedRoles={['admin', 'doctor', 'receptionist']}>
                <PatientsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="doctors"
            element={
              <ProtectedRoute allowedRoles={['admin', 'receptionist']}>
                <DoctorsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="records"
            element={
              <ProtectedRoute allowedRoles={['admin', 'doctor', 'patient']}>
                <RecordsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="prescriptions"
            element={
              <ProtectedRoute allowedRoles={['admin', 'doctor']}>
                <DoctorPrescriptionsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="pharmacy"
            element={
              <ProtectedRoute allowedRoles={['admin', 'pharmacist']}>
                <PharmacyPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="billing"
            element={
              <ProtectedRoute allowedRoles={['admin', 'receptionist', 'accountant']}>
                <BillingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="overview"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AppOverviewPage />
              </ProtectedRoute>
            }
          />
          {/* Patient Portal Routes */}
          <Route
            path="book-appointment"
            element={
              <ProtectedRoute allowedRoles={['patient', 'admin', 'receptionist']}>
                <BookAppointmentPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="my-appointments"
            element={
              <ProtectedRoute allowedRoles={['patient']}>
                <PatientAppointmentsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="my-records"
            element={
              <ProtectedRoute allowedRoles={['patient']}>
                <PatientRecordsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="my-prescriptions"
            element={
              <ProtectedRoute allowedRoles={['patient']}>
                <PatientPrescriptionsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="notifications"
            element={
              <ProtectedRoute allowedRoles={['patient', 'admin', 'doctor', 'receptionist', 'pharmacist']}>
                <PatientNotificationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="profile"
            element={
              <ProtectedRoute allowedRoles={['patient', 'admin', 'doctor', 'receptionist', 'pharmacist']}>
                <PatientProfilePage />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRouter;



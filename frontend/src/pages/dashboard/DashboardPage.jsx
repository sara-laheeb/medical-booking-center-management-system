/**
 * Master Role-Based & Specialty-Specific Dashboard
 * Automatically switches the dashboard experience based on authenticated user role:
 * - Admin: Executive cross-module analytics & revenue
 * - Doctor: Personalized clinical suite adapted to their medical specialty (Dental, Ophthalmic, Pediatric, Cosmetic, General)
 * - Receptionist: Waiting room check-in queue, on-duty doctors, walk-in booking
 * - Pharmacist: Prescription fulfillment queue & critical low stock alerts
 * - Patient: Health portal with next appointments, active prescriptions & records
 */

import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';

import AdminDashboard from './AdminDashboard';
import DoctorDashboard from './DoctorDashboard';
import ReceptionistDashboard from './ReceptionistDashboard';
import PharmacistDashboard from './PharmacistDashboard';
import PatientDashboard from './PatientDashboard';

export default function DashboardPage() {
  const { role: authRole } = useAuth();
  const { lang } = useLanguage();
  const isAr = lang === 'ar';

  // Allows previewing other roles if admin, while defaulting strictly to user's real role
  const [activeRoleView, setActiveRoleView] = useState(authRole || 'admin');

  // If user role changed in session, keep in sync
  const currentRole = authRole === 'admin' ? activeRoleView : (authRole || 'patient');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Admin Role Preview Bar — only visible to Admins for testing/demonstration */}
      {authRole === 'admin' && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '8px 16px',
            background: 'var(--bg-subtle)',
            borderRadius: 'var(--r-md)',
            border: '1px dashed var(--brand)',
            fontSize: 12,
            flexWrap: 'wrap',
            gap: 8,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontWeight: 700, color: 'var(--brand)' }}>🛠 Admin Role Preview:</span>
            <span style={{ color: 'var(--text-secondary)' }}>
              {isAr ? 'معاينة تجربة المستخدم للأدوار المختلفة' : 'Test interface for different center roles'}
            </span>
          </div>

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {[
              { id: 'admin', label: isAr ? 'الإدارة' : 'Admin' },
              { id: 'doctor', label: isAr ? 'طبيب متخصص' : 'Doctor (Specialty)' },
              { id: 'receptionist', label: isAr ? 'الاستقبال' : 'Receptionist' },
              { id: 'pharmacist', label: isAr ? 'الصيدلية' : 'Pharmacist' },
              { id: 'patient', label: isAr ? 'المريض' : 'Patient' },
            ].map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setActiveRoleView(r.id)}
                style={{
                  padding: '3px 10px',
                  borderRadius: 14,
                  fontSize: 11.5,
                  fontWeight: currentRole === r.id ? 700 : 500,
                  border: currentRole === r.id ? '1px solid var(--brand)' : '1px solid var(--border)',
                  background: currentRole === r.id ? 'var(--brand)' : 'var(--bg-surface)',
                  color: currentRole === r.id ? '#ffffff' : 'var(--ink)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Render Role-Specific Dashboard */}
      {currentRole === 'doctor' && <DoctorDashboard />}
      {currentRole === 'receptionist' && <ReceptionistDashboard />}
      {currentRole === 'pharmacist' && <PharmacistDashboard />}
      {currentRole === 'patient' && <PatientDashboard />}
      {currentRole === 'admin' && <AdminDashboard />}
    </div>
  );
}

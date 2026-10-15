import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, loading, role } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: 'var(--bg-canvas)',
          gap: 16,
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 14,
            background: 'linear-gradient(150deg, var(--p-400), var(--p-700))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 800,
            fontSize: 18,
            boxShadow: 'var(--shadow-brand)',
            animation: 'pulse 1.8s ease-in-out infinite',
          }}
        >
          ✚
        </div>
        <div className="skel" style={{ width: 140, height: 16, borderRadius: 4 }} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return (
      <div style={{ padding: 'var(--sp-8)' }}>
        <div className="alert alert-error">
          <b>{t.auth?.accessDenied || 'Access Restricted'}</b>
          <span className="body-text">
            {t.auth?.accessDeniedDesc ||
              `Your role (${role}) does not have permission to view this section.`}
          </span>
        </div>
      </div>
    );
  }

  return children;
}

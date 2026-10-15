/**
 * Authentication Context & Provider
 * Manages client-side authentication state, token persistence in localStorage,
 * active user profile, and session verification lifecycle.
 */

import { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem('medicare_token') || null;
    } catch {
      return null;
    }
  });

  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('medicare_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(true);

  // Sync token and user to localStorage
  const persistSession = useCallback((newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
    try {
      if (newToken) {
        localStorage.setItem('medicare_token', newToken);
      } else {
        localStorage.removeItem('medicare_token');
      }
      if (newUser) {
        localStorage.setItem('medicare_user', JSON.stringify(newUser));
      } else {
        localStorage.removeItem('medicare_user');
      }
    } catch {
      // Ignore storage errors in restricted contexts
    }
  }, []);

  const logout = useCallback(() => {
    persistSession(null, null);
  }, [persistSession]);

  // Verify stored session on mount
  useEffect(() => {
    let isMounted = true;

    async function verifySession() {
      if (!token) {
        if (isMounted) setLoading(false);
        return;
      }

      try {
        const liveUser = await authService.getMe();
        if (isMounted) {
          setUser(liveUser);
          try {
            localStorage.setItem('medicare_user', JSON.stringify(liveUser));
          } catch {
            // Ignore storage errors
          }
        }
      } catch {
        // Token is invalid or expired
        if (isMounted) {
          persistSession(null, null);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    verifySession();

    const handleExpired = () => {
      if (isMounted) {
        persistSession(null, null);
      }
    };

    window.addEventListener('medicare_auth_expired', handleExpired);
    return () => {
      isMounted = false;
      window.removeEventListener('medicare_auth_expired', handleExpired);
    };
  }, [token, persistSession]);

  const login = useCallback(
    async (email, password) => {
      const data = await authService.login({ email, password });
      persistSession(data.token, data.user);
      return data.user;
    },
    [persistSession]
  );

  const register = useCallback(
    async ({ name, email, password, role = 'patient' }) => {
      const data = await authService.register({ name, email, password, role });
      persistSession(data.token, data.user);
      return data.user;
    },
    [persistSession]
  );

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      isAuthenticated: Boolean(token && user),
      role: user?.role || null,
      login,
      register,
      logout,
    }),
    [user, token, loading, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;

/**
 * Application Root Component
 * Wraps the route hierarchy with global context providers:
 * - LanguageProvider: Bi-directional Arabic RTL / English LTR support
 * - AuthProvider: User session and token management
 */

import { LanguageProvider } from './i18n/LanguageContext';
import { AuthProvider } from './context/AuthContext';
import AppRouter from './routes/AppRouter';

/**
 * Root React application shell component.
 */
export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </LanguageProvider>
  );
}

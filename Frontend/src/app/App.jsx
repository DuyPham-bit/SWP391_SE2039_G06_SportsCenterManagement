import React from 'react';
import { AuthProvider } from '../entities/session/index.js';
import { ToastProvider } from '../shared/ui/toast/index.js';
import { LanguageProvider } from '../shared/i18n/index.js';
import AppRouter from './router/AppRouter.jsx';
import { isLandingRoute, normalizeRouteHash } from './router/routeNormalization.js';
import { SplashScreen } from '../widgets/app-splash/index.js';

// Decided once at launch: the landing page plays its own intro instead of the app splash.
const SPLASH_ENABLED = typeof window !== 'undefined' && !isLandingRoute(normalizeRouteHash(window.location.hash || '#/').split('?')[0]);

export default function App() {
  return (
    <LanguageProvider>
      <ToastProvider>
        <AuthProvider>
          <AppRouter />
          <SplashScreen enabled={SPLASH_ENABLED} />
        </AuthProvider>
      </ToastProvider>
    </LanguageProvider>
  );
}

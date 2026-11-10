import React from 'react';
import { AuthProvider } from '../entities/session/index.js';
import { ToastProvider } from '../shared/ui/toast/ToastContext.jsx';
import { LanguageProvider } from '../shared/i18n/LanguageContext.jsx';
import AppRouter from './router/AppRouter.jsx';

export default function App() {
  return (
    <LanguageProvider>
      <ToastProvider>
        <AuthProvider>
          <AppRouter />
        </AuthProvider>
      </ToastProvider>
    </LanguageProvider>
  );
}

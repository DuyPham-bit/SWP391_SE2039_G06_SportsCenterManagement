import React from 'react';
import { AuthProvider } from './providers/AuthContext.jsx';
import { ToastProvider } from './providers/ToastContext.jsx';
import { LanguageProvider } from './providers/LanguageContext.jsx';
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

import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/tokens.css';
import { LanguageProvider } from '../shared/i18n/index.js';
import { CampusMapPage } from '../pages/campus-map/index.js';

// Entry of the standalone /3d-campus.html: providers here (app layer), the screen itself in pages/campus-map.
ReactDOM.createRoot(document.getElementById('campus-root')).render(
  <React.StrictMode>
    <LanguageProvider>
      <CampusMapPage />
    </LanguageProvider>
  </React.StrictMode>
);

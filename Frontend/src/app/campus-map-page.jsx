import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/tokens.css';
import { LanguageProvider } from '../shared/i18n/LanguageContext.jsx';
import { CampusMapExplorer } from '../features/campus-map/index.js';

// Standalone full-viewport campus map (/3d-campus.html), same module and data as the landing section.
ReactDOM.createRoot(document.getElementById('campus-root')).render(
  <React.StrictMode>
    <LanguageProvider>
      <CampusMapExplorer page />
    </LanguageProvider>
  </React.StrictMode>
);

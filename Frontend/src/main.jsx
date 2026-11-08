import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app/App.jsx';
// Colour tokens first: theme.css, tiya-theme.css and Tailwind utilities all read these variables.
import './app/styles/tokens.css';
import './app/styles/theme.css';
import './app/styles/tiya-theme.css';
// Loaded last to keep the cascade order the runtime CDN build used (utilities win over theme rules).
import './app/styles/tailwind.css';
import { installMotion } from './shared/lib/motion.js';

installMotion();

const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

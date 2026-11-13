// Bảo vệ React DOM không bị crash do Google Translate & Browser Extensions can thiệp vào TextNode
if (typeof window !== 'undefined' && typeof Node === 'function' && Node.prototype) {
  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function (child) {
    if (child && child.parentNode !== this) {
      if (typeof console !== 'undefined' && console.warn) {
        console.warn('[Extension Guard] Ngăn crash DOM removeChild từ extension ngoài:', child);
      }
      return child;
    }
    return originalRemoveChild.apply(this, arguments);
  };

  const originalInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function (newNode, referenceNode) {
    if (referenceNode && referenceNode.parentNode !== this) {
      if (typeof console !== 'undefined' && console.warn) {
        console.warn('[Extension Guard] Ngăn crash DOM insertBefore từ extension ngoài:', referenceNode);
      }
      return newNode;
    }
    return originalInsertBefore.apply(this, arguments);
  };
}

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

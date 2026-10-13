import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './styles/theme.css';

// Gán React và ReactDOM lên window để hỗ trợ tất cả các component dùng cú pháp:
// const { useState, useEffect } = React;
window.React = React;
window.ReactDOM = ReactDOM;

const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

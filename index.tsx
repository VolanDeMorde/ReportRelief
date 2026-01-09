
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

/**
 * PWA Service Worker Registration
 * Handles common security restrictions in sandboxed or preview environments.
 */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Using 'sw.js' directly to allow the browser to resolve the origin naturally
    navigator.serviceWorker.register('sw.js')
      .then(reg => {
        console.log('Service Worker registered successfully. Scope:', reg.scope);
      })
      .catch(err => {
        // Origin errors are common in web-based IDEs and preview sandboxes.
        // We log these as warnings so they don't impact the main application flow.
        const isOriginError = err.name === 'SecurityError' || err.message?.includes('origin');
        
        if (isOriginError) {
          console.warn(
            'Service Worker: Origin mismatch or restricted environment detected. ' +
            'Offline features and "Install App" will be unavailable in this preview, ' +
            'but will work correctly when the app is deployed to a standard domain (HTTPS).'
          );
        } else {
          console.error('Service Worker registration failed:', err);
        }
      });
  });
}

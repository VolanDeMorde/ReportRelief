import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
// Self-hosted font and icons (bundled by Vite): no requests to Google Fonts or a
// CDN, so visitors' IP addresses aren't sent to third parties (GDPR).
import '@fontsource-variable/plus-jakarta-sans/wght.css';
import '@fortawesome/fontawesome-free/css/fontawesome.min.css';
import '@fortawesome/fontawesome-free/css/solid.min.css';
import '@fortawesome/fontawesome-free/css/brands.min.css';
import './styles.css';
import { validateEnv } from './utils/validateEnv';

// S18: Validate env vars before mounting — throws in dev if any are missing
validateEnv();

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Could not find root element to mount to');
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
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    // Absolute path: the app now has routes like /privacy, and the SW must be scoped to /
    navigator.serviceWorker.register('/sw.js').catch((err) => {
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

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { registerSW } from 'virtual:pwa-register';
import { initWebVitals } from './utils/webVitals';
import { initSentry } from './config/sentry.config';
import logger from './utils/logger';

// Initialize Sentry for error tracking (production only)
initSentry();

const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm("Nouvelle version disponible ! Mettre à jour ?")) {
      updateSW(true);
      logger.info('App updated to new version');
    }
  },
  onOfflineReady() {
    logger.info("App ready to work offline");
  },
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Initialize Web Vitals monitoring
if (typeof window !== 'undefined') {
  initWebVitals();
  logger.info('Union Digitale initialized', {
    version: import.meta.env.VITE_APP_VERSION || '0.0.0',
    environment: import.meta.env.MODE,
  });
}

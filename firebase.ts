import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import type { Analytics } from 'firebase/analytics';

// Prefer environment variables to avoid hardcoding secrets in the bundle
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Initialize app once (supports Vite hot reload)
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// ── Analytics (opt-in) ──────────────────────────────────────────────────────
// Google Analytics sets cookies, so UK/EU law (PECR / ePrivacy) requires consent
// first. The SDK is only downloaded and started after the user opts in.
const ANALYTICS_CONSENT_KEY = 'rr_analytics_consent';
const analyticsAvailable = Boolean(firebaseConfig.measurementId);
let analytics: Analytics | null = null;

export type AnalyticsConsent = 'granted' | 'denied';

const getAnalyticsConsent = (): AnalyticsConsent | null => {
  try {
    const value = localStorage.getItem(ANALYTICS_CONSENT_KEY);
    return value === 'granted' || value === 'denied' ? value : null;
  } catch {
    return null;
  }
};

const startAnalytics = async (): Promise<void> => {
  if (!analyticsAvailable) return;
  const { getAnalytics, isSupported, setAnalyticsCollectionEnabled } =
    await import('firebase/analytics');
  if (!(await isSupported())) return;
  analytics ??= getAnalytics(app);
  setAnalyticsCollectionEnabled(analytics, true);
};

/** Records the user's choice and starts/stops analytics accordingly. */
const setAnalyticsConsent = async (granted: boolean): Promise<void> => {
  try {
    localStorage.setItem(ANALYTICS_CONSENT_KEY, granted ? 'granted' : 'denied');
  } catch {
    /* storage blocked — choice applies to this session only */
  }

  if (granted) {
    await startAnalytics();
  } else if (analytics) {
    const { setAnalyticsCollectionEnabled } = await import('firebase/analytics');
    setAnalyticsCollectionEnabled(analytics, false);
  }
};

if (getAnalyticsConsent() === 'granted') {
  startAnalytics().catch((err) => console.warn('Analytics failed to start:', err));
}

export {
  app,
  auth,
  db,
  provider,
  signInWithPopup,
  onAuthStateChanged,
  doc,
  setDoc,
  getDoc,
  analyticsAvailable,
  getAnalyticsConsent,
  setAnalyticsConsent,
};

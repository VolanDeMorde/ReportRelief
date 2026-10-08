import React, { Suspense, lazy } from 'react';
import { useAppState } from './hooks/useAppState';
import AnalyticsConsent from './components/AnalyticsConsent';

// ── Lazy-loaded pages ──────────────────────────────────────────────────────
const LandingPage = lazy(() => import('./components/LandingPage'));
const AboutPage = lazy(() => import('./components/AboutPage'));
const FAQPage = lazy(() => import('./components/FAQPage'));
const TrashPage = lazy(() => import('./components/TrashPage'));
const PrivacyPage = lazy(() => import('./components/PrivacyPage'));
const DashboardPage = lazy(() => import('./components/DashboardPage'));
const PricingModal = lazy(() => import('./components/PricingModal'));

// ── Page loader ────────────────────────────────────────────────────────────
const PageLoader: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950">
    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
      <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce"></span>
      <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.2s]"></span>
      <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.4s]"></span>
      Loading
    </div>
  </div>
);

// ── App ────────────────────────────────────────────────────────────────────
const App: React.FC = () => {
  const state = useAppState();
  const {
    currentView,
    setCurrentView,
    currentUser,
    isAuthLoading,
    isDarkMode,
    setIsDarkMode,
    deletedReports,
    handleLogin,
    handleLogout,
    handleRestoreReport,
  } = state;

  // Shared page props (header controls for static pages)
  // Navigation callbacks shared by the static pages (and their footers).
  const navProps = {
    onStart: () => setCurrentView('dashboard'),
    onGoAbout: () => setCurrentView('about'),
    onGoFAQ: () => setCurrentView('faq'),
    onGoPrivacy: () => setCurrentView('privacy'),
  };

  const staticPageProps = {
    isDarkMode,
    toggleDarkMode: () => setIsDarkMode(!isDarkMode),
    currentUser,
    isAuthLoading,
    onLogin: handleLogin,
    onLogout: handleLogout,
  };

  return (
    <Suspense fallback={<PageLoader />}>
      <AnalyticsConsent />

      {currentView === 'landing' && <LandingPage {...navProps} {...staticPageProps} />}

      {currentView === 'faq' && (
        <FAQPage onBack={() => setCurrentView('landing')} {...navProps} {...staticPageProps} />
      )}

      {currentView === 'about' && (
        <AboutPage onBack={() => setCurrentView('landing')} {...navProps} {...staticPageProps} />
      )}

      {currentView === 'privacy' && (
        <PrivacyPage onBack={() => setCurrentView('landing')} {...navProps} {...staticPageProps} />
      )}

      {currentView === 'trash' && (
        <TrashPage
          onBack={() => setCurrentView('dashboard')}
          deletedReports={deletedReports}
          onRestore={handleRestoreReport}
          {...staticPageProps}
        />
      )}

      {/* Only mounted on /app, so landing-page visitors don't download the dashboard. */}
      {currentView === 'dashboard' && <DashboardPage {...state} />}

      {/* App-wide confirmation toast (e.g. after account deletion) */}
      {state.notice && (
        <div
          role="status"
          className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 max-w-[calc(100%-2rem)] bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-2xl print:hidden"
        >
          <i className="fas fa-circle-check"></i>
          <span className="text-sm font-semibold">{state.notice}</span>
          <button
            onClick={() => state.setNotice(null)}
            aria-label="Dismiss"
            className="opacity-70 hover:opacity-100"
          >
            <i className="fas fa-xmark"></i>
          </button>
        </div>
      )}

      {/* Rendered here (not in the dashboard) because the landing page opens it too. */}
      {state.showPricingModal && <PricingModal onClose={() => state.setShowPricingModal(false)} />}
    </Suspense>
  );
};

export default App;

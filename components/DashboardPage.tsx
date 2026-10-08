import React from 'react';
import { FREE_TIER_LIMIT } from '../constants';
import type { AppState, DashboardTab } from '../hooks/useAppState';
import PrivacyBanner from './PrivacyBanner';
import Footer from './Footer';
import DashboardHeader from './dashboard/DashboardHeader';
import GenerateTab from './dashboard/GenerateTab';
import ReportsTab from './dashboard/ReportsTab';
import ProfileTab from './dashboard/ProfileTab';

/**
 * The signed-in workspace at /app: header, usage bar, tab bar, the three tabs,
 * undo toast and back-to-top button. Each tab is its own component in ./dashboard.
 */
const DashboardPage: React.FC<AppState> = (state) => {
  const {
    setCurrentView,
    currentUser,
    userTier,
    generationCount,
    dashboardTab,
    setDashboardTab,
    setShowPricingModal,
    showFab,
    undoDelete,
    setUndoDelete,
    handleUndoDelete,
    scrollToTop,
  } = state;

  // S4: remaining generations for free users
  const remainingGenerations =
    userTier === 'free' && generationCount !== null
      ? Math.max(0, FREE_TIER_LIMIT - generationCount)
      : null;

  return (
    <div className="min-h-screen flex flex-col">
      <DashboardHeader {...state} />

      {/* ── Main ────────────────────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-24 w-full grow">
        <PrivacyBanner />

        {/* S4: Free-tier usage bar at top of dashboard */}
        {currentUser && userTier === 'free' && remainingGenerations !== null && (
          <div
            className={`mb-6 p-4 rounded-2xl border flex items-center gap-4 ${
              remainingGenerations === 0
                ? 'bg-red-50 dark:bg-red-950/20 border-red-100 dark:border-red-900/30'
                : remainingGenerations <= 3
                  ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/30'
                  : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800'
            }`}
          >
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  Free Tier Usage
                </span>
                <span
                  className={`text-[9px] font-black uppercase tracking-wider ${
                    remainingGenerations === 0
                      ? 'text-red-600'
                      : remainingGenerations <= 3
                        ? 'text-amber-600'
                        : 'text-slate-500'
                  }`}
                >
                  {generationCount}/{FREE_TIER_LIMIT} used · {remainingGenerations} remaining
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    remainingGenerations === 0
                      ? 'bg-red-500'
                      : remainingGenerations <= 3
                        ? 'bg-amber-500'
                        : 'bg-indigo-500'
                  }`}
                  style={{
                    width: `${Math.min(100, ((generationCount ?? 0) / FREE_TIER_LIMIT) * 100)}%`,
                  }}
                ></div>
              </div>
            </div>
            {remainingGenerations <= 3 && (
              <button
                onClick={() => setShowPricingModal(true)}
                className="shrink-0 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest gradient-bg text-white shadow hover:scale-105 transition-transform"
              >
                Upgrade
              </button>
            )}
          </div>
        )}

        <div className="flex flex-col gap-10">
          {/* Tab bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Dashboard
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                Move between report generation, saved reports, and your profile.
              </p>
            </div>
            <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-1">
              {(['generate', 'reports', 'profile'] as DashboardTab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setDashboardTab(tab)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors ${dashboardTab === tab ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* ── Generate Tab ──────────────────────────────────────────── */}
          {dashboardTab === 'generate' && <GenerateTab {...state} />}

          {/* ── Reports Tab ───────────────────────────────────────────── */}
          {dashboardTab === 'reports' && <ReportsTab {...state} />}

          {/* ── Profile Tab ───────────────────────────────────────────── */}
          {dashboardTab === 'profile' && <ProfileTab {...state} />}
        </div>
      </main>

      <Footer
        onGoAbout={() => setCurrentView('about')}
        onGoFAQ={() => setCurrentView('faq')}
        onGoPrivacy={() => setCurrentView('privacy')}
        compact
      />

      {/* S8: Undo-delete toast */}
      {undoDelete && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-5 py-3 rounded-2xl shadow-2xl animate-fade-in">
          <i className="fas fa-trash-alt text-sm opacity-60"></i>
          <span className="text-xs font-semibold">
            <strong>{undoDelete.label}</strong> moved to trash
          </span>
          <button
            onClick={handleUndoDelete}
            className="ml-2 text-xs font-black uppercase tracking-widest text-indigo-400 dark:text-indigo-600 hover:underline"
          >
            Undo
          </button>
          <button
            onClick={() => setUndoDelete(null)}
            className="text-xs opacity-40 hover:opacity-70"
          >
            <i className="fas fa-xmark"></i>
          </button>
        </div>
      )}

      {/* FAB: back to top */}
      {showFab && (
        <button
          onClick={scrollToTop}
          aria-label="Back to top"
          className="fixed bottom-8 right-8 z-100 gradient-bg text-white shadow-2xl flex items-center justify-center gap-2 px-5 py-4 rounded-2xl hover:scale-110 active:scale-95 transition-all print:hidden"
        >
          <i className="fas fa-arrow-up"></i>
        </button>
      )}
    </div>
  );
};

export default DashboardPage;

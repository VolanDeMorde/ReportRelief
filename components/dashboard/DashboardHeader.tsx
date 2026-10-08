import React, { useState } from 'react';
import { type AppState } from '../../hooks/useAppState';
import { FREE_TIER_LIMIT } from '../../constants';

type DashboardHeaderProps = Pick<
  AppState,
  | 'setCurrentView'
  | 'currentUser'
  | 'isAuthLoading'
  | 'userTier'
  | 'generationCount'
  | 'isOnline'
  | 'reports'
  | 'deletedReports'
  | 'isDarkMode'
  | 'setIsDarkMode'
  | 'searchInput'
  | 'setSearchInput'
  | 'setShowPricingModal'
  | 'showAccountMenu'
  | 'toggleAccountMenu'
  | 'accountMenuRef'
  | 'handleShareAll'
  | 'handleLogin'
  | 'handleLogout'
  | 'handleManageSubscription'
>;

/** Sticky dashboard header: logo, nav, search, account menu. */
const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  setCurrentView,
  currentUser,
  isAuthLoading,
  userTier,
  generationCount,
  isOnline,
  reports,
  deletedReports,
  isDarkMode,
  setIsDarkMode,
  searchInput,
  setSearchInput,
  setShowPricingModal,
  showAccountMenu,
  toggleAccountMenu,
  accountMenuRef,
  handleShareAll,
  handleLogin,
  handleLogout,
  handleManageSubscription,
}) => {
  // S13: mobile search state
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  return (
    <header className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50 print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => setCurrentView('landing')}
        >
          <div className="w-10 h-10 gradient-bg rounded-2xl flex items-center justify-center shadow-lg">
            <i className="fas fa-leaf text-white text-lg"></i>
          </div>
          <div className="hidden xs:block">
            <h1 className="text-lg font-black text-slate-900 dark:text-white tracking-tighter">
              ReportRelief
            </h1>
            <div className="flex items-center gap-1.5">
              <span
                className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`}
              ></span>
              <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                {isOnline ? 'Active' : 'Offline'}
              </p>
            </div>
          </div>
        </div>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          <button
            onClick={() => setShowPricingModal(true)}
            className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            Pricing
          </button>
          {currentUser && (
            <button
              onClick={() => setCurrentView('trash')}
              className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Trash
              {deletedReports.length > 0 && (
                <span className="ml-2 inline-flex items-center justify-center text-[9px] font-black text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/40 rounded-full px-2 py-0.5">
                  {deletedReports.length}
                </span>
              )}
            </button>
          )}
          {currentUser && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {currentUser.displayName || currentUser.email}
              </span>
              {userTier === 'paid' ? (
                <span className="px-2 py-0.5 rounded-full bg-linear-to-r from-purple-500 to-pink-500 text-white text-[9px] font-black uppercase tracking-wider shadow-sm">
                  Pro
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[9px] font-bold uppercase tracking-wider">
                  Free
                </span>
              )}
            </div>
          )}
        </nav>

        {/* Right controls */}
        <div className="flex gap-2 items-center">
          {/* Desktop search */}
          <div className="hidden md:flex items-center bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700">
            <i className="fas fa-search text-slate-400 text-[10px] mr-2"></i>
            <input
              type="text"
              placeholder="Find student..."
              className="bg-transparent border-none outline-none text-[11px] font-semibold dark:text-white w-32"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              aria-label="Search reports"
            />
          </div>

          {/* S13: Mobile search toggle */}
          <button
            onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
            className="md:hidden w-10 h-10 flex items-center justify-center text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 transition-colors"
            aria-label="Search"
          >
            <i className="fas fa-search text-xs"></i>
          </button>

          <div className="flex gap-1.5">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="w-10 h-10 flex items-center justify-center text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              <i className={`fas ${isDarkMode ? 'fa-sun' : 'fa-moon'} text-xs`}></i>
            </button>

            {!isAuthLoading && (
              <div className="relative" ref={accountMenuRef}>
                <button
                  onClick={toggleAccountMenu}
                  className="px-3 py-2 text-[10px] font-black text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  title="Account"
                >
                  <i className="fas fa-user-circle text-xs mr-1"></i>
                  Account
                </button>
                {showAccountMenu && (
                  <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Account
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                          {currentUser
                            ? currentUser.displayName || currentUser.email
                            : 'Not signed in'}
                        </p>
                        {currentUser &&
                          (userTier === 'paid' ? (
                            <span className="px-1.5 py-0.5 rounded-full bg-linear-to-r from-purple-500 to-pink-500 text-white text-[8px] font-black uppercase tracking-wider shadow-sm">
                              Pro
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[8px] font-bold uppercase tracking-wider">
                              Free
                            </span>
                          ))}
                      </div>
                      {/* S4: Usage counter for free users in account menu */}
                      {currentUser && userTier === 'free' && generationCount !== null && (
                        <div className="mt-2">
                          <div className="flex justify-between text-[9px] font-black uppercase tracking-wider text-slate-400 mb-1">
                            <span>Monthly Usage</span>
                            <span>
                              {generationCount}/{FREE_TIER_LIMIT}
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${generationCount >= FREE_TIER_LIMIT ? 'bg-red-500' : generationCount >= FREE_TIER_LIMIT * 0.7 ? 'bg-amber-500' : 'bg-indigo-500'}`}
                              style={{
                                width: `${Math.min(100, (generationCount / FREE_TIER_LIMIT) * 100)}%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="p-2">
                      {currentUser ? (
                        <>
                          {userTier === 'paid' && (
                            <button
                              onClick={async () => {
                                await handleManageSubscription();
                              }}
                              className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors mb-1"
                            >
                              <i className="fas fa-cog text-xs mr-2"></i>Manage Subscription
                            </button>
                          )}
                          <button
                            onClick={handleLogout}
                            className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                          >
                            <i className="fas fa-sign-out-alt text-xs mr-2"></i>Log out
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={handleLogin}
                          className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        >
                          <i className="fab fa-google text-xs mr-2"></i>Log in with Google
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {reports.length > 0 && (
              <button
                onClick={handleShareAll}
                className="w-10 h-10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                aria-label="Share all reports"
              >
                <i className="fas fa-share-nodes text-xs"></i>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* S13: Mobile search bar (expands below header) */}
      {mobileSearchOpen && (
        <div className="md:hidden px-4 pb-3 border-t border-slate-100 dark:border-slate-800 pt-3">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 gap-2">
            <i className="fas fa-search text-slate-400 text-[10px]"></i>
            <input
              type="text"
              placeholder="Find student or subject..."
              className="bg-transparent border-none outline-none text-[11px] font-semibold dark:text-white flex-1"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              autoFocus
              aria-label="Search reports (mobile)"
            />
            {searchInput && (
              <button
                onClick={() => setSearchInput('')}
                className="text-slate-400 hover:text-slate-600 text-xs"
              >
                <i className="fas fa-xmark"></i>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default DashboardHeader;

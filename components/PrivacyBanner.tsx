import React, { useState, useEffect } from 'react';
import { auth } from '../firebase';

const DISMISSED_KEY = 'rr_privacy_banner_dismissed';
const LOCAL_STORAGE_WARNING_KEY = 'rr_local_storage_warning_dismissed';

const PrivacyBanner: React.FC = () => {
  const [visible, setVisible] = useState(false);
  // V6: Show a secondary warning when data is stored locally (no account)
  const [showLocalWarning, setShowLocalWarning] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(DISMISSED_KEY);
    if (!dismissed) {
      setVisible(true);
    }

    // Show the local-storage warning only for unauthenticated users who
    // haven't dismissed it yet, and only when they have reports saved locally.
    const isLoggedIn = !!auth.currentUser;
    const localReports = localStorage.getItem('rb-reports');
    const localWarningDismissed = localStorage.getItem(LOCAL_STORAGE_WARNING_KEY);

    if (!isLoggedIn && localReports && !localWarningDismissed) {
      try {
        const parsed = JSON.parse(localReports);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setShowLocalWarning(true);
        }
      } catch {
        /* ignore malformed data */
      }
    }
  }, []);

  const handleDismiss = () => {
    setVisible(false);
    localStorage.setItem(DISMISSED_KEY, 'true');
  };

  const handleDismissLocalWarning = () => {
    setShowLocalWarning(false);
    localStorage.setItem(LOCAL_STORAGE_WARNING_KEY, 'true');
  };

  return (
    <>
      {/* Standard privacy notice */}
      {visible && (
        <div className="mb-6 rounded-2xl border border-emerald-200 dark:border-emerald-900/40 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 p-4 sm:p-5 flex items-start gap-4 animate-fade-in print:hidden">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0">
            <i className="fas fa-shield-halved text-emerald-600 dark:text-emerald-400"></i>
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-black text-emerald-800 dark:text-emerald-300 mb-1">
              🔒 Your Student Data Stays Private
            </h4>
            <p className="text-xs text-emerald-700 dark:text-emerald-400 leading-relaxed font-medium">
              Your reports are stored only in your own account, and only you can access them.{' '}
              Details sent to Google Gemini to write a report are{' '}
              <strong>not used to train or improve AI models</strong> (we use Google's paid API).
              You can delete your account and all its data at any time from the Profile tab.
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="shrink-0 w-8 h-8 rounded-lg text-emerald-400 hover:text-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 flex items-center justify-center transition-colors"
            aria-label="Dismiss privacy notice"
          >
            <i className="fas fa-times text-xs"></i>
          </button>
        </div>
      )}

      {/* V6: Local storage data warning for unauthenticated users */}
      {showLocalWarning && (
        <div className="mb-6 rounded-2xl border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-950/20 p-4 sm:p-5 flex items-start gap-4 animate-fade-in print:hidden">
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0">
            <i className="fas fa-triangle-exclamation text-amber-600 dark:text-amber-400"></i>
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-black text-amber-800 dark:text-amber-300 mb-1">
              ⚠️ Reports Saved Locally (No Account)
            </h4>
            <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed font-medium">
              Your reports are currently saved in this browser only. On a{' '}
              <strong>shared or public computer</strong>, anyone with access could read student data
              from browser storage. <strong>Sign in</strong> to securely store your reports in your
              private cloud account and access them from any device.
            </p>
          </div>
          <button
            onClick={handleDismissLocalWarning}
            className="shrink-0 w-8 h-8 rounded-lg text-amber-400 hover:text-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/50 flex items-center justify-center transition-colors"
            aria-label="Dismiss storage warning"
          >
            <i className="fas fa-times text-xs"></i>
          </button>
        </div>
      )}
    </>
  );
};

export default PrivacyBanner;

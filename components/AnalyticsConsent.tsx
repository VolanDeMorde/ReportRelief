import React, { useState } from 'react';
import { analyticsAvailable, getAnalyticsConsent, setAnalyticsConsent } from '../firebase';

interface AnalyticsConsentProps {
  /** 'banner' shows a bottom bar until the user chooses; 'settings' is an inline control. */
  variant?: 'banner' | 'settings';
}

const AnalyticsConsent: React.FC<AnalyticsConsentProps> = ({ variant = 'banner' }) => {
  const [consent, setConsent] = useState(getAnalyticsConsent);

  if (!analyticsAvailable) return null;

  const choose = (granted: boolean) => {
    setConsent(granted ? 'granted' : 'denied');
    setAnalyticsConsent(granted).catch((err) =>
      console.warn('Analytics consent update failed:', err)
    );
  };

  if (variant === 'settings') {
    return (
      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
        <span className="font-semibold">
          Usage analytics: {consent === 'granted' ? 'On' : 'Off'}
        </span>
        <button
          onClick={() => choose(consent !== 'granted')}
          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        >
          {consent === 'granted' ? 'Turn off' : 'Turn on'}
        </button>
      </div>
    );
  }

  if (consent !== null) return null;

  return (
    <div
      role="dialog"
      aria-label="Analytics consent"
      className="fixed bottom-4 inset-x-4 sm:inset-x-auto sm:right-6 sm:max-w-md z-50 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl p-5 print:hidden"
    >
      <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
        Can we use Google Analytics cookies to understand how ReportRelief is used? This never
        includes student data. You can change this later on the Privacy page.
      </p>
      <div className="mt-4 flex gap-3 justify-end">
        <button
          onClick={() => choose(false)}
          className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        >
          Decline
        </button>
        <button
          onClick={() => choose(true)}
          className="px-4 py-2 rounded-xl text-xs font-bold text-white gradient-bg hover:opacity-90 transition-opacity"
        >
          Accept
        </button>
      </div>
    </div>
  );
};

export default AnalyticsConsent;

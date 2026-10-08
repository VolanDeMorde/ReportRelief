import React from 'react';
import AnalyticsConsent from './AnalyticsConsent';
import type { User } from 'firebase/auth';
import Footer from './Footer';

interface PrivacyPageProps {
  onBack: () => void;
  onGoAbout: () => void;
  onGoFAQ: () => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  currentUser: User | null;
  isAuthLoading: boolean;
  onLogin: () => Promise<void>;
  onLogout: () => Promise<void>;
}

const PrivacyPage: React.FC<PrivacyPageProps> = ({
  onBack,
  onGoAbout,
  onGoFAQ,
  isDarkMode,
  toggleDarkMode,
  currentUser,
  isAuthLoading,
  onLogin,
  onLogout,
}) => {
  const lastUpdated = 'July 2026';

  return (
    <div className="min-h-screen relative overflow-x-hidden transition-colors duration-300">
      {/* Header */}
      <header className="max-w-7xl mx-auto px-6 py-8 flex items-center justify-between relative z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            aria-label="Go back"
          >
            <i className="fas fa-arrow-left text-xs"></i>
          </button>
          <div className="w-10 h-10 gradient-bg rounded-2xl flex items-center justify-center shadow-lg">
            <i className="fas fa-leaf text-white"></i>
          </div>
          <span className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            ReportRelief
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleDarkMode}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 transition-all hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <i className={`fas ${isDarkMode ? 'fa-sun' : 'fa-moon'} text-xs`}></i>
          </button>
          {!isAuthLoading &&
            (currentUser ? (
              <button
                onClick={onLogout}
                className="px-4 py-2 rounded-xl font-black text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[10px] uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Log Out
              </button>
            ) : (
              <button
                onClick={onLogin}
                className="px-4 py-2 rounded-xl font-black text-white gradient-bg shadow-lg text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-transform"
              >
                Log In
              </button>
            ))}
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-6 pb-32 pt-8">
        {/* Hero */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-widest mb-6">
            <i className="fas fa-shield-halved text-[8px]"></i>
            Legal
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tighter leading-none mb-4">
            Privacy <span className="gradient-text">Policy</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            Last updated: <strong>{lastUpdated}</strong>
          </p>
        </div>

        {/* Policy Sections */}
        <div className="space-y-10 text-slate-700 dark:text-slate-300">
          <section>
            <h2 className="text-xl font-black text-slate-900 dark:text-white mb-3">
              1. Who We Are
            </h2>
            <p className="text-sm leading-relaxed">
              ReportRelief ("we", "us", or "our") is a web application that helps teachers generate
              professional student reports using AI. This Privacy Policy explains what data we
              collect, how we use it, and your rights.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-slate-900 dark:text-white mb-3">
              2. Data We Collect
            </h2>
            <ul className="text-sm leading-relaxed space-y-3 list-none">
              <li className="flex gap-3">
                <i className="fas fa-circle-dot text-indigo-500 mt-1 shrink-0 text-xs"></i>
                <span>
                  <strong>Account data</strong> — your name and email address, collected via Google
                  Sign-In, to create and manage your account.
                </span>
              </li>
              <li className="flex gap-3">
                <i className="fas fa-circle-dot text-indigo-500 mt-1 shrink-0 text-xs"></i>
                <span>
                  <strong>Report data</strong> — student names, subjects, year groups, teacher
                  observations, and generated report text that you choose to save. This is stored in
                  your private Firebase Firestore account.
                </span>
              </li>
              <li className="flex gap-3">
                <i className="fas fa-circle-dot text-indigo-500 mt-1 shrink-0 text-xs"></i>
                <span>
                  <strong>Usage data</strong> — report generation counts, subscription status, and
                  last login time, used to enforce tier limits and maintain your account.
                </span>
              </li>
              <li className="flex gap-3">
                <i className="fas fa-circle-dot text-indigo-500 mt-1 shrink-0 text-xs"></i>
                <span>
                  <strong>Payment data</strong> — processed entirely by Stripe. We never see or
                  store card numbers. Stripe may share subscription status with us to unlock Pro
                  features.
                </span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-black text-slate-900 dark:text-white mb-3">
              3. How We Use Your Data
            </h2>
            <ul className="text-sm leading-relaxed space-y-2 list-none">
              <li className="flex gap-3">
                <i className="fas fa-check text-emerald-500 mt-1 shrink-0 text-xs"></i>
                <span>To generate AI-powered student reports on your behalf</span>
              </li>
              <li className="flex gap-3">
                <i className="fas fa-check text-emerald-500 mt-1 shrink-0 text-xs"></i>
                <span>To authenticate and secure your account</span>
              </li>
              <li className="flex gap-3">
                <i className="fas fa-check text-emerald-500 mt-1 shrink-0 text-xs"></i>
                <span>To enforce usage limits and manage subscriptions</span>
              </li>
              <li className="flex gap-3">
                <i className="fas fa-check text-emerald-500 mt-1 shrink-0 text-xs"></i>
                <span>To provide customer support when requested</span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-black text-slate-900 dark:text-white mb-3">
              4. AI & Student Data
            </h2>
            <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30">
              <p className="text-sm leading-relaxed font-medium text-emerald-800 dark:text-emerald-300">
                🔒 <strong>Student data sent to Gemini is not used to train AI models.</strong> We
                use Google's paid Gemini API, under whose terms Google does not use prompts or
                responses to train or improve its models. Google may retain them for a limited
                period solely to detect abuse and policy violations. Generated reports are stored
                only in your account (see section 6).
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-black text-slate-900 dark:text-white mb-3">
              5. Data Sharing
            </h2>
            <p className="text-sm leading-relaxed">
              We do not sell, rent, or share your personal data with third parties except:
            </p>
            <ul className="text-sm leading-relaxed space-y-2 mt-3 list-none">
              <li className="flex gap-3">
                <i className="fas fa-circle-dot text-slate-400 mt-1 shrink-0 text-xs"></i>
                <span>
                  <strong>Firebase / Google</strong> — for authentication, database, and hosting
                  services
                </span>
              </li>
              <li className="flex gap-3">
                <i className="fas fa-circle-dot text-slate-400 mt-1 shrink-0 text-xs"></i>
                <span>
                  <strong>Stripe</strong> — for payment processing
                </span>
              </li>
              <li className="flex gap-3">
                <i className="fas fa-circle-dot text-slate-400 mt-1 shrink-0 text-xs"></i>
                <span>
                  <strong>Google Gemini API (paid tier)</strong> — for AI report generation; not
                  used for model training
                </span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-black text-slate-900 dark:text-white mb-3">
              6. Data Retention
            </h2>
            <p className="text-sm leading-relaxed">
              Reports you generate are stored in your account until you delete them. Soft-deleted
              reports are permanently purged after <strong>24 hours</strong>. You can delete your
              account at any time from
              <strong>Profile → Delete account</strong>; this immediately and permanently deletes
              your profile and every report. Stripe keeps payment records as required by financial
              regulations.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-slate-900 dark:text-white mb-3">
              7. Your Rights (GDPR / UK GDPR)
            </h2>
            <p className="text-sm leading-relaxed mb-3">
              Depending on your location, you may have the right to:
            </p>
            <ul className="text-sm leading-relaxed space-y-2 list-none">
              {[
                'Access the personal data we hold about you',
                'Request correction of inaccurate data',
                'Erase your data ("right to be forgotten") — do it yourself any time via Profile → Delete account',
                'Object to or restrict processing',
                'Data portability — export your reports any time with "Export CSV"',
              ].map((right, i) => (
                <li key={i} className="flex gap-3">
                  <i className="fas fa-check text-indigo-500 mt-1 shrink-0 text-xs"></i>
                  <span>{right}</span>
                </li>
              ))}
            </ul>
            <p className="text-sm leading-relaxed mt-3">
              To exercise any of these rights, contact us at the email below.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-slate-900 dark:text-white mb-3">
              8. Cookies & Local Storage
            </h2>
            <p className="text-sm leading-relaxed">
              We use browser{' '}
              <code className="font-mono text-xs bg-slate-100 dark:bg-slate-800 px-1 rounded">
                localStorage
              </code>{' '}
              to store your dark-mode preference, form presets, dismissed banner state and analytics
              choice. Google Analytics (via Firebase) is <strong>off unless you accept it</strong>;
              if enabled it sets first-party analytics cookies and never receives student data.
            </p>
            <AnalyticsConsent variant="settings" />
          </section>

          <section>
            <h2 className="text-xl font-black text-slate-900 dark:text-white mb-3">
              9. Children's Data
            </h2>
            <p className="text-sm leading-relaxed">
              ReportRelief is a tool for <strong>teachers</strong>, not students. We do not
              knowingly collect personal data from children under 13. Student names and details
              entered into reports are controlled by the teacher (the data controller) and are
              stored solely in their account. Teachers are responsible for ensuring they have
              appropriate consent or legal basis under applicable education data law (e.g. FERPA,
              GDPR) before entering student data.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-slate-900 dark:text-white mb-3">10. Contact</h2>
            <p className="text-sm leading-relaxed">
              For privacy questions, data requests, or to report a concern, contact us at:{' '}
              <a
                href="mailto:privacy@reportrelief.app"
                className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
              >
                privacy@reportrelief.app
              </a>
            </p>
          </section>
        </div>
      </main>

      <Footer onGoAbout={onGoAbout} onGoFAQ={onGoFAQ} compact />
    </div>
  );
};

export default PrivacyPage;

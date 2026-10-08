import React from 'react';
import type { User } from 'firebase/auth';
import Footer from './Footer';

interface AboutPageProps {
  onBack: () => void;
  onStart: () => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  currentUser: User | null;
  isAuthLoading: boolean;
  onLogin: () => Promise<void>;
  onLogout: () => Promise<void>;
  onGoFAQ: () => void;
  onGoPrivacy: () => void;
}

const AboutPage: React.FC<AboutPageProps> = ({
  onBack,
  onStart,
  isDarkMode,
  toggleDarkMode,
  currentUser,
  isAuthLoading,
  onLogin,
  onLogout,
  onGoFAQ,
  onGoPrivacy,
}) => {
  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 flex flex-col transition-colors duration-500">
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800 sticky top-0 z-50 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4 cursor-pointer group" onClick={onBack}>
            <div className="w-10 h-10 gradient-bg rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <i className="fas fa-arrow-left text-white text-lg"></i>
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-900 dark:text-white tracking-tighter">
                About ReportRelief
              </h1>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={toggleDarkMode}
              className="w-11 h-11 flex items-center justify-center text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl hover:scale-105 transition-all"
            >
              <i className={`fas ${isDarkMode ? 'fa-sun' : 'fa-moon'}`}></i>
            </button>
            {!isAuthLoading &&
              (currentUser ? (
                <button
                  onClick={onLogout}
                  className="px-4 py-2 rounded-2xl font-black text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Log Out
                </button>
              ) : (
                <button
                  onClick={onLogin}
                  className="px-4 py-2 rounded-2xl font-black text-white gradient-bg shadow-lg text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-transform"
                >
                  Log In
                </button>
              ))}
            <button
              onClick={onStart}
              className="px-6 py-2.5 rounded-2xl font-black text-white gradient-bg shadow-lg text-sm transition-transform hover:scale-105 uppercase tracking-widest"
            >
              Start Reporting
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-20 flex-grow w-full">
        {/* Hero */}
        <div className="text-center mb-16">
          <div className="w-16 h-16 rounded-[24px] bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-6">
            <i className="fas fa-chalkboard-teacher text-3xl"></i>
          </div>
          <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-4">
            Built by a Teacher, For Teachers.
          </h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
            The story behind ReportRelief.
          </p>
        </div>

        {/* Our Story */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[40px] p-10 md:p-12 shadow-sm">
          <div className="space-y-5 text-slate-600 dark:text-slate-300 text-base leading-relaxed">
            <p>Hi, I'm an ICT teacher based in Cyprus.</p>
            <p>
              Like you, I love the classroom 'aha' moments, but I absolutely dread Report Season.
              For years, I spent my weekends staring at spreadsheets, drinking too much coffee, and
              trying to think of 30 different ways to say 'He is a pleasure to teach.'
            </p>
            <p>
              I realized I was spending more time on paperwork than on planning actual lessons. That
              didn't feel right.
            </p>
            <p>
              So, I used my background in IT to build a solution. ReportRelief wasn't originally
              meant to be a product—it was just a tool I built to save my own sanity. But after I
              finished my last batch of reports in 2 hours instead of 2 days, I knew I had to share
              it.
            </p>
            <p className="font-semibold text-slate-800 dark:text-slate-100">
              My mission is simple: Give teachers their weekends back.
            </p>
          </div>
        </div>

        {/* Values */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[28px] p-6 shadow-sm">
            <p className="text-xs uppercase tracking-widest text-slate-400 font-black mb-3">
              Authentic
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Built by a teacher who uses it every term.
            </p>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[28px] p-6 shadow-sm">
            <p className="text-xs uppercase tracking-widest text-slate-400 font-black mb-3">
              Private
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Your student data is never used to train our models.
            </p>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[28px] p-6 shadow-sm">
            <p className="text-xs uppercase tracking-widest text-slate-400 font-black mb-3">Fast</p>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Turns hours of writing into minutes of review.
            </p>
          </div>
        </div>

        {/* Privacy & Data Policy Section */}
        <div className="mt-16" id="privacy">
          <div className="text-center mb-10">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-5">
              <i className="fas fa-shield-halved text-2xl"></i>
            </div>
            <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-3">
              Privacy & Data Policy
            </h3>
            <p className="text-slate-500 dark:text-slate-400 font-medium max-w-xl mx-auto">
              We believe student data belongs to the teacher — not to tech companies. Here's exactly
              how we handle your information.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[32px] overflow-hidden shadow-sm">
            {[
              {
                icon: 'fa-robot',
                iconColor: 'text-rose-500',
                title: 'No AI Training on Your Data',
                desc: 'Student names and observations are sent securely to Google Gemini to write each report. On the paid Gemini API we use, Google does not use this data to train or improve its models; it may keep it for a limited time only to detect abuse.',
              },
              {
                icon: 'fa-database',
                iconColor: 'text-indigo-500',
                title: 'Your Data, Your Account',
                desc: 'Reports you save are stored in Firebase Firestore under your account. Only you can read or change them through the app, enforced by server-side security rules. You can delete your account and all its data at any time from the Profile tab.',
              },
              {
                icon: 'fa-trash-clock',
                iconColor: 'text-amber-500',
                title: 'Soft-Delete & Auto-Purge',
                desc: 'Deleted reports go to Trash for 24 hours before being permanently purged. You can restore them at any time within that window.',
              },
              {
                icon: 'fa-lock',
                iconColor: 'text-emerald-500',
                title: 'Encrypted in Transit',
                desc: 'All communication between your browser and our backend uses HTTPS (TLS 1.3). Firebase Cloud Functions enforce CORS restrictions so only authorized origins can make requests.',
              },
              {
                icon: 'fa-cookie-bite',
                iconColor: 'text-orange-500',
                title: 'Minimal Cookies & Storage',
                desc: 'We use localStorage for your preferences (dark mode, form presets) and Firebase Auth tokens. Google Analytics is off unless you opt in, and you can turn it off at any time on the Privacy page.',
              },
            ].map((item, i) => (
              <div
                key={i}
                className={`p-7 flex items-start gap-5 ${i > 0 ? 'border-t border-slate-100 dark:border-slate-800' : ''}`}
              >
                <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center shrink-0">
                  <i className={`fas ${item.icon} ${item.iconColor}`}></i>
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white mb-1">
                    {item.title}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Contact Section */}
        <div className="mt-16 bg-slate-900 dark:bg-slate-800 rounded-[40px] p-10 md:p-12 text-center text-white relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full gradient-bg opacity-10"></div>
          <div className="relative z-10">
            <h3 className="text-2xl font-black mb-3">Questions or Feedback?</h3>
            <p className="text-slate-300 font-medium mb-6 max-w-lg mx-auto">
              We're a small, teacher-led team and we genuinely read every message. Whether it's a
              bug, a feature idea, or just to say hello — we'd love to hear from you.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="mailto:hello@reportrelief.app"
                className="px-8 py-3.5 bg-white text-slate-900 font-black rounded-2xl hover:scale-105 active:scale-95 transition-all text-sm flex items-center gap-2"
              >
                <i className="fas fa-envelope"></i>
                hello@reportrelief.app
              </a>
              {onGoFAQ && (
                <button
                  onClick={onGoFAQ}
                  className="px-8 py-3.5 border border-white/30 text-white font-black rounded-2xl hover:bg-white/10 transition-all text-sm flex items-center gap-2"
                >
                  <i className="fas fa-question-circle"></i>
                  Read the FAQ
                </button>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer onGoFAQ={onGoFAQ} onGoPrivacy={onGoPrivacy} />
    </div>
  );
};

export default AboutPage;

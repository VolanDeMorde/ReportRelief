import React from 'react';

interface FooterProps {
  onGoAbout?: () => void;
  onGoFAQ?: () => void;
  onGoPrivacy?: () => void;
  compact?: boolean;
}

const Footer: React.FC<FooterProps> = ({ onGoAbout, onGoFAQ, onGoPrivacy, compact = false }) => {
  const currentYear = new Date().getFullYear();

  if (compact) {
    return (
      <footer className="py-8 text-center border-t border-slate-100 dark:border-slate-800 print:hidden">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 gradient-bg rounded-lg flex items-center justify-center">
              <i className="fas fa-leaf text-white text-[10px]"></i>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
              ReportRelief © {currentYear}
            </span>
          </div>
          <div className="flex items-center gap-4">
            {onGoAbout && (
              <button
                onClick={onGoAbout}
                className="text-[9px] font-bold uppercase tracking-widest text-slate-400 hover:text-indigo-500 transition-colors"
              >
                About
              </button>
            )}
            {onGoFAQ && (
              <button
                onClick={onGoFAQ}
                className="text-[9px] font-bold uppercase tracking-widest text-slate-400 hover:text-indigo-500 transition-colors"
              >
                FAQ
              </button>
            )}
            {onGoPrivacy && (
              <button
                onClick={onGoPrivacy}
                className="text-[9px] font-bold uppercase tracking-widest text-slate-400 hover:text-indigo-500 transition-colors"
              >
                Privacy
              </button>
            )}
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 print:hidden">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 gradient-bg rounded-2xl flex items-center justify-center shadow-lg">
                <i className="fas fa-leaf text-white"></i>
              </div>
              <span className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                ReportRelief
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
              AI-powered report writing built by a teacher, for teachers. Save hours every term.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-4">
              Product
            </h4>
            <ul className="space-y-2.5">
              {onGoFAQ && (
                <li>
                  <button
                    onClick={onGoFAQ}
                    className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  >
                    FAQ & Help
                  </button>
                </li>
              )}
              {onGoAbout && (
                <li>
                  <button
                    onClick={onGoAbout}
                    className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  >
                    About Us
                  </button>
                </li>
              )}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-4">
              Legal
            </h4>
            <ul className="space-y-2.5">
              {onGoPrivacy && (
                <li>
                  <button
                    onClick={onGoPrivacy}
                    className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  >
                    Privacy Policy
                  </button>
                </li>
              )}
              <li>
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Terms of Service
                </span>
              </li>
              <li>
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  GDPR Compliance
                </span>
              </li>
            </ul>
          </div>

          {/* Data & Trust */}
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-4">
              Your Data
            </h4>
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <i className="fas fa-shield-halved text-emerald-500 text-xs mt-0.5"></i>
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  Student data is never used to train AI models
                </span>
              </div>
              <div className="flex items-start gap-2">
                <i className="fas fa-database text-emerald-500 text-xs mt-0.5"></i>
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  Reports stored in your personal Firebase account
                </span>
              </div>
              <div className="flex items-start gap-2">
                <i className="fas fa-trash-clock text-emerald-500 text-xs mt-0.5"></i>
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  You can delete your account and data at any time
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
            © {currentYear} ReportRelief. All rights reserved. Built in Cyprus 🇨🇾
          </p>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400">
              <i className="fas fa-lock text-emerald-500"></i>
              <span>256-bit SSL</span>
            </div>
            <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400">
              <i className="fas fa-shield-check text-emerald-500"></i>
              <span>GDPR Compliant</span>
            </div>
            <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400">
              <i className="fas fa-fire text-orange-500"></i>
              <span>Firebase Secured</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

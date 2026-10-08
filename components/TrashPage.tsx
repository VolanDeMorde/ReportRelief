import React, { useEffect, useMemo, useState } from 'react';
import type { GeneratedReport } from '../types';
import type { User } from 'firebase/auth';

interface TrashPageProps {
  onBack: () => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  currentUser: User | null;
  isAuthLoading: boolean;
  onLogin: () => Promise<void>;
  onLogout: () => Promise<void>;
  deletedReports: GeneratedReport[];
  onRestore: (id: string) => void;
}

const formatRemaining = (ms: number): string => {
  if (ms <= 0) return 'Expired';
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0 || days > 0) parts.push(`${hours}h`);
  parts.push(`${minutes}m`, `${seconds}s`);
  return parts.join(' ');
};

const TrashPage: React.FC<TrashPageProps> = ({
  onBack,
  isDarkMode,
  toggleDarkMode,
  currentUser,
  isAuthLoading,
  onLogin,
  onLogout,
  deletedReports,
  onRestore,
}) => {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  const sortedDeleted = useMemo(() => {
    return [...deletedReports].sort((a, b) => (b.deletedAt || 0) - (a.deletedAt || 0));
  }, [deletedReports]);

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
                Trash
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
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-16 flex-grow w-full">
        <div className="text-center mb-12">
          <div className="w-16 h-16 rounded-[24px] bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-6">
            <i className="fas fa-trash text-2xl"></i>
          </div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Recently Deleted
          </h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
            Restore items within 24 hours before they are permanently removed.
          </p>
        </div>

        {sortedDeleted.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[40px] p-14 text-center">
            <h3 className="text-xl font-black text-slate-800 dark:text-slate-200">
              Trash is empty
            </h3>
            <p className="text-slate-400 dark:text-slate-500 mt-2 text-sm">
              Deleted reports will appear here for 24 hours.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedDeleted.map((report) => {
              const remainingMs = (report.deleteAfter || 0) - now;
              return (
                <div
                  key={report.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-[28px] border border-amber-200/60 dark:border-amber-900/40 bg-white dark:bg-slate-900 p-6 shadow-sm"
                >
                  <div>
                    <p className="text-sm font-black text-slate-900 dark:text-white">
                      {report.studentName}
                    </p>
                    <p className="text-[10px] uppercase tracking-widest text-slate-400">
                      {report.subject} • {report.year}
                      {report.gradeLevel ? ` - ${report.gradeLevel}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400">
                      Deletes in {formatRemaining(remainingMs)}
                    </span>
                    <button
                      onClick={() => onRestore(report.id)}
                      className="text-[10px] font-black uppercase tracking-widest text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-xl px-3 py-2 hover:bg-amber-100/60 dark:hover:bg-amber-900/30 transition-colors"
                    >
                      Restore
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <footer className="py-10 text-center opacity-50">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">
          ReportRelief • Trash
        </p>
      </footer>
    </div>
  );
};

export default TrashPage;

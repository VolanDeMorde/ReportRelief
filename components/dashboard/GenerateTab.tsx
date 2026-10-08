import React, { Suspense, lazy } from 'react';
import { type AppState } from '../../hooks/useAppState';
import ClassStats from './ClassStats';
import InlineLoader from './InlineLoader';

const ReportForm = lazy(() => import('../ReportForm'));

type GenerateTabProps = Pick<
  AppState,
  | 'setCurrentView'
  | 'currentUser'
  | 'reports'
  | 'deletedReports'
  | 'analytics'
  | 'isLoading'
  | 'error'
  | 'setError'
  | 'bulkProgress'
  | 'handleGenerateReport'
  | 'handleBulkGenerate'
  | 'handleRestoreReport'
>;

/** Generate tab: report form, live preview of the latest reports, class stats. */
const GenerateTab: React.FC<GenerateTabProps> = ({
  setCurrentView,
  currentUser,
  reports,
  deletedReports,
  analytics,
  isLoading,
  error,
  setError,
  bulkProgress,
  handleGenerateReport,
  handleBulkGenerate,
  handleRestoreReport,
}) => {
  return (
    <section className="scroll-mt-28 grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-10">
      <aside className="w-full shrink-0 print:hidden">
        <div className="lg:sticky lg:top-24 space-y-6">
          <Suspense fallback={<InlineLoader label="Loading form" />}>
            <ReportForm
              key={currentUser?.uid ?? 'signed-out'}
              onSubmit={handleGenerateReport}
              onBulkSubmit={handleBulkGenerate}
              isLoading={isLoading}
            />
          </Suspense>

          {bulkProgress && (
            <div className="p-6 bg-white dark:bg-slate-900 rounded-[28px] border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Generating...
                </span>
                <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400">
                  {bulkProgress.current}/{bulkProgress.total}
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="gradient-bg h-full rounded-full transition-all duration-300"
                  style={{ width: `${(bulkProgress.current / bulkProgress.total) * 100}%` }}
                ></div>
              </div>
            </div>
          )}

          {error && (
            <div className="p-5 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-2xl flex gap-3">
              <i className="fas fa-circle-exclamation text-red-500 mt-1"></i>
              <div className="flex-1 text-xs">
                <p className="font-black text-red-900 dark:text-red-400 uppercase">Attention</p>
                <p className="text-red-600 dark:text-red-300 mt-1">{error}</p>
              </div>
              <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
                <i className="fas fa-xmark text-xs"></i>
              </button>
            </div>
          )}

          <ClassStats analytics={analytics} totalReports={reports.length} />
        </div>
      </aside>

      <div className="w-full min-w-0 space-y-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[40px] p-6 sm:p-8 shadow-sm">
          <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Generate
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
            Create a new report from this workspace.
          </p>
          <div className="mt-6 rounded-4xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/30 p-6">
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
              Use the form on the left to generate a new report.
            </p>
          </div>
          {currentUser && deletedReports.length > 0 && (
            <div className="mt-6 rounded-4xl border border-amber-200/60 dark:border-amber-900/40 bg-amber-50/40 dark:bg-amber-900/10 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-amber-600 dark:text-amber-400">
                    Recently Deleted
                  </h3>
                  <p className="text-[10px] text-amber-700/70 dark:text-amber-300/70">
                    You can restore within 24 hours.
                  </p>
                </div>
                <button
                  onClick={() => setCurrentView('trash')}
                  className="text-[10px] font-black uppercase tracking-widest text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-xl px-3 py-2 hover:bg-amber-100/60 dark:hover:bg-amber-900/30 transition-colors"
                >
                  View Trash ({deletedReports.length})
                </button>
              </div>
              <div className="space-y-3">
                {deletedReports.slice(0, 3).map((report) => (
                  <div
                    key={report.id}
                    className="flex items-center justify-between gap-3 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-amber-100/60 dark:border-amber-900/40 px-4 py-3"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                        {report.studentName}
                      </p>
                      <p className="text-[10px] uppercase tracking-widest text-slate-400">
                        {report.subject} • {report.year}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRestoreReport(report.id)}
                      className="text-[10px] font-black uppercase tracking-widest text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-xl px-3 py-2 hover:bg-amber-100/60 dark:hover:bg-amber-900/30 transition-colors"
                    >
                      Restore
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default GenerateTab;

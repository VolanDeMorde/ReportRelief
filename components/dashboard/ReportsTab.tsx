import React, { Suspense, lazy } from 'react';
import { GRADE_NAV_ORDER, type AppState, type SortOption } from '../../hooks/useAppState';

const ReportCard = lazy(() => import('../ReportCard'));

type ReportsTabProps = Pick<
  AppState,
  | 'reports'
  | 'filteredReportsByGrade'
  | 'reportsArchiveByYear'
  | 'sortOption'
  | 'setSortOption'
  | 'selectedGrade'
  | 'setSelectedGrade'
  | 'isLoading'
  | 'hasMoreReports'
  | 'isLoadingMore'
  | 'handleLoadMore'
  | 'handleUpdateReport'
  | 'handleDeleteReport'
  | 'handleExportCsv'
>;

/** Saved reports tab: search/sort/grade filters, export, paginated report cards. */
const ReportsTab: React.FC<ReportsTabProps> = ({
  reports,
  filteredReportsByGrade,
  reportsArchiveByYear,
  sortOption,
  setSortOption,
  selectedGrade,
  setSelectedGrade,
  isLoading,
  hasMoreReports,
  isLoadingMore,
  handleLoadMore,
  handleUpdateReport,
  handleDeleteReport,
  handleExportCsv,
}) => {
  return (
    <section className="scroll-mt-28 space-y-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[40px] p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                Reports
                <span className="text-[11px] bg-slate-50 dark:bg-slate-950 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-400 font-bold">
                  {filteredReportsByGrade.length}
                </span>
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                All previous reports saved in one place. Switch grades below.
              </p>
            </div>
            {reports.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                {/* S5: Export CSV button */}
                <button
                  onClick={handleExportCsv}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
                  title={`Export ${filteredReportsByGrade.length} reports to CSV`}
                >
                  <i className="fas fa-file-csv text-[9px]"></i>
                  Export CSV
                </button>
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5">
                  <i className="fas fa-arrow-down-wide-short text-slate-400 text-[10px]"></i>
                  <select
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value as SortOption)}
                    className="bg-transparent border-none outline-none text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 cursor-pointer"
                    aria-label="Sort reports"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="name-asc">Name (A-Z)</option>
                    <option value="name-desc">Name (Z-A)</option>
                    <option value="mark-high">Mark (High-Low)</option>
                    <option value="mark-low">Mark (Low-High)</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Grade filter chips */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedGrade('all')}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-colors ${selectedGrade === 'all' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
            >
              All Grades
            </button>
            {GRADE_NAV_ORDER.map((grade) => (
              <button
                key={grade}
                onClick={() => setSelectedGrade(grade)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-colors ${selectedGrade === grade ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
              >
                {grade}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          {filteredReportsByGrade.length === 0 && !isLoading ? (
            <div className="border border-slate-200 dark:border-slate-800 rounded-4xl p-14 text-center bg-slate-50/60 dark:bg-slate-950/30">
              <div className="w-16 h-16 bg-white dark:bg-slate-900 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-slate-200 dark:border-slate-800">
                <i className="fas fa-wind text-2xl text-slate-200 dark:text-slate-700"></i>
              </div>
              <h3 className="text-xl font-black text-slate-800 dark:text-slate-200">
                Nothing here yet
              </h3>
              <p className="text-slate-400 dark:text-slate-500 max-w-xs mx-auto mt-2 text-sm">
                {selectedGrade === 'all'
                  ? 'Saved reports will appear here once you generate them.'
                  : `No reports for ${selectedGrade}.`}
              </p>
            </div>
          ) : (
            <>
              {reportsArchiveByYear.map(([year, reportsInYear]) => (
                <div key={year} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                      {year}
                    </h4>
                    <span className="text-[10px] font-black text-slate-400 dark:text-slate-500">
                      {reportsInYear.length}
                    </span>
                  </div>
                  <div className="space-y-4">
                    {reportsInYear.map((report) => (
                      <Suspense
                        key={report.id}
                        fallback={
                          <div className="h-24 rounded-3xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
                        }
                      >
                        <ReportCard
                          report={report}
                          onDelete={handleDeleteReport}
                          onUpdateReport={handleUpdateReport}
                        />
                      </Suspense>
                    ))}
                  </div>
                </div>
              ))}

              {/* S9: Load more button */}
              {hasMoreReports && (
                <div className="flex justify-center pt-4">
                  <button
                    onClick={handleLoadMore}
                    disabled={isLoadingMore}
                    className="flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                  >
                    {isLoadingMore ? (
                      <>
                        <i className="fas fa-spinner fa-spin text-xs"></i> Loading...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-chevron-down text-xs"></i> Load More Reports
                      </>
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
};

export default ReportsTab;

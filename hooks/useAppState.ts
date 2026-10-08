import type { YearGroup } from '../types';
import { deleteAccount } from '../services/accountService';
import { exportReportsToCsv } from '../utils/exportCsv';
import { filterAndSortReports } from '../utils/reportFilters';
import { useAccount } from './useAccount';
import { useReportFilters, YEAR_GROUP_ORDER } from './useReportFilters';
import { useReportGeneration } from './useReportGeneration';
import { useReports } from './useReports';
import { useRouting } from './useRouting';
import { useTheme } from './useTheme';
import { useUiState } from './useUiState';

export type { View } from './useRouting';
export type { DashboardTab } from './useUiState';
export type { SortOption } from '../utils/reportFilters';
export { YEAR_GROUP_ORDER };

export const GRADE_NAV_ORDER: YearGroup[] = [...YEAR_GROUP_ORDER];

/**
 * Composes the app's feature hooks into the single state object the pages use.
 * Each concern lives in its own hook; this file only wires them together and
 * holds the few actions that span several of them.
 */
export const useAppState = () => {
  const ui = useUiState();
  const { setError, setNotice } = ui;
  const routing = useRouting();
  const theme = useTheme();
  const account = useAccount({ onError: setError });
  const reports = useReports({
    currentUser: account.currentUser,
    isAuthLoading: account.isAuthLoading,
    onError: setError,
    onReportsFound: routing.autoOpenDashboard,
  });
  const generation = useReportGeneration({ addReport: reports.addReport, onError: setError });
  const filters = useReportFilters(reports.reports);

  const handleShareAll = async () => {
    const text = reports.reports
      .map((r) => `${r.studentName} (${r.subject}): ${r.mark}% - ${r.reportText}`)
      .join('\n\n---\n\n');
    try {
      if (navigator.share) await navigator.share({ title: 'Class Reports', text });
      else await navigator.clipboard.writeText(text);
    } catch (err) {
      // AbortError = user closed the share sheet; anything else is a real failure.
      if (!(err instanceof DOMException && err.name === 'AbortError')) {
        setError('Could not share or copy the reports. Please try again.');
      }
    }
  };

  /** Exports the current search/grade selection, including reports not loaded yet. */
  const handleExportCsv = async () => {
    try {
      exportReportsToCsv(
        filterAndSortReports(await reports.getAllActiveReports(), filters.filters)
      );
    } catch (err) {
      console.error('CSV export failed:', err);
      setError('Could not export your reports. Please try again.');
    }
  };

  /** Deletes the account; errors propagate so the confirmation UI can show them. */
  const handleDeleteAccount = async () => {
    await deleteAccount();
    routing.navigate('landing');
    setNotice('Your account and all of your reports have been permanently deleted.');
  };

  return {
    ...ui,
    currentView: routing.currentView,
    setCurrentView: routing.setCurrentView,
    ...theme,
    ...account,
    reports: reports.reports,
    deletedReports: reports.deletedReports,
    hasMoreReports: reports.hasMoreReports,
    isLoadingMore: reports.isLoadingMore,
    handleLoadMore: reports.handleLoadMore,
    undoDelete: reports.undoDelete,
    setUndoDelete: reports.setUndoDelete,
    handleUpdateReport: reports.handleUpdateReport,
    handleDeleteReport: reports.handleDeleteReport,
    handleUndoDelete: reports.handleUndoDelete,
    handleRestoreReport: reports.handleRestoreReport,
    ...generation,
    searchInput: filters.searchInput,
    setSearchInput: filters.setSearchInput,
    sortOption: filters.sortOption,
    setSortOption: filters.setSortOption,
    selectedGrade: filters.selectedGrade,
    setSelectedGrade: filters.setSelectedGrade,
    filteredReportsByGrade: filters.filteredReportsByGrade,
    reportsArchiveByYear: filters.reportsArchiveByYear,
    analytics: filters.analytics,
    handleShareAll,
    handleExportCsv,
    handleDeleteAccount,
  };
};

export type AppState = ReturnType<typeof useAppState>;

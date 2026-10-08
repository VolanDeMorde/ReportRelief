import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { User } from 'firebase/auth';
import type { DocumentSnapshot } from 'firebase/firestore';
import type { GeneratedReport } from '../types';
import {
  createReport,
  fetchAllActiveReports,
  listenToReports,
  loadMoreReports,
  restoreReport,
  softDeleteReport,
  upsertReportWithId,
} from '../services/reportService';

const LEGACY_REPORTS_KEY = 'rb-reports';
const UNDO_TOAST_MS = 6000;

export interface UndoDelete {
  reportId: string;
  label: string;
  report?: GeneratedReport;
}

interface UseReportsOptions {
  currentUser: User | null;
  isAuthLoading: boolean;
  onError: (message: string) => void;
  /** Called once when a returning user's reports first load. */
  onReportsFound: () => void;
}

/**
 * The user's saved reports: live Firestore sync of the newest page, older pages
 * loaded on demand, trash, undo-delete, and the one-off import of reports that
 * older app versions kept in localStorage.
 *
 * All async handlers report failures through `onError` and never reject.
 */
export const useReports = ({
  currentUser,
  isAuthLoading,
  onError,
  onReportsFound,
}: UseReportsOptions) => {
  const [reports, setReports] = useState<GeneratedReport[]>([]);
  const [deletedReports, setDeletedReports] = useState<GeneratedReport[]>([]);
  // S9: pagination
  const [olderReports, setOlderReports] = useState<GeneratedReport[]>([]);
  const [hasMoreReports, setHasMoreReports] = useState(false);
  const [lastReportDoc, setLastReportDoc] = useState<DocumentSnapshot | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  // S8: undo-delete toast
  const [undoDelete, setUndoDelete] = useState<UndoDelete | null>(null);
  // True once the user has paged past the live first page; the live listener
  // then must not reset the pagination cursor.
  const hasLoadedOlderRef = useRef(false);

  // Legacy: reports saved in localStorage by older versions (signed-out view only).
  // Reports are deliberately NOT written to localStorage any more: generation
  // requires sign-in, so the only data that could end up there is a signed-in
  // teacher's cloud reports, which would leak to the next person on a shared computer.
  useEffect(() => {
    if (isAuthLoading || currentUser) return;
    try {
      const saved = localStorage.getItem(LEGACY_REPORTS_KEY);
      const parsed: unknown = saved ? JSON.parse(saved) : null;
      if (Array.isArray(parsed) && parsed.length > 0) {
        setReports(parsed as GeneratedReport[]);
        onReportsFound();
      }
    } catch (e) {
      console.error('Could not read locally saved reports', e);
    }
  }, [isAuthLoading, currentUser, onReportsFound]);

  // Firestore real-time sync (signed in)
  useEffect(() => {
    if (!currentUser) return;
    let isFirstSnapshot = true;
    const unsubscribe = listenToReports(currentUser.uid, (synced, trashed, hasMore, lastDoc) => {
      setReports(synced);
      setDeletedReports(trashed);
      if (!hasLoadedOlderRef.current) {
        setHasMoreReports(hasMore);
        setLastReportDoc(lastDoc);
      }
      // Keep loaded older pages; drop any that are now in the live page.
      const liveIds = new Set(synced.map((r) => r.id));
      setOlderReports((prev) => prev.filter((r) => !liveIds.has(r.id)));
      // Only on initial load, not on every later change (e.g. restoring from Trash).
      if (isFirstSnapshot && synced.length > 0) onReportsFound();
      isFirstSnapshot = false;
    });
    return () => {
      unsubscribe();
      // Clear the previous user's data from memory on sign-out / user switch.
      setReports([]);
      setDeletedReports([]);
      setOlderReports([]);
      hasLoadedOlderRef.current = false;
      setHasMoreReports(false);
      setLastReportDoc(null);
      setUndoDelete(null);
    };
  }, [currentUser, onReportsFound]);

  // Offer to import legacy localStorage reports on first sign-in
  useEffect(() => {
    if (!currentUser) return;
    const migrationKey = `rb-reports-migrated-${currentUser.uid}`;
    try {
      if (localStorage.getItem(migrationKey) === 'true') return;
      const saved = localStorage.getItem(LEGACY_REPORTS_KEY);
      const parsed: unknown = saved ? JSON.parse(saved) : null;
      if (!Array.isArray(parsed) || parsed.length === 0) {
        localStorage.removeItem(LEGACY_REPORTS_KEY);
        localStorage.setItem(migrationKey, 'true');
        return;
      }
      const legacy = parsed as GeneratedReport[];
      // Older versions could leave another teacher's reports in this browser
      // (shared computers), so never import them silently.
      const sample = legacy
        .slice(0, 3)
        .map((r) => r.studentName)
        .join(', ');
      const ok = window.confirm(
        `This browser has ${legacy.length} report(s) saved without an account ` +
          `(e.g. ${sample}${legacy.length > 3 ? ', …' : ''}).\n\n` +
          `Add them to your account? Choose Cancel if they aren't yours.`
      );
      if (!ok) {
        localStorage.setItem(migrationKey, 'true');
        return;
      }
      (async () => {
        for (const r of legacy) await upsertReportWithId(currentUser.uid, r);
        localStorage.removeItem(LEGACY_REPORTS_KEY);
        localStorage.setItem(migrationKey, 'true');
      })().catch((e) => {
        // Left in localStorage so the import is offered again next sign-in.
        console.error('Migration failed', e);
        onError(
          "Some locally saved reports could not be added to your account. We'll try again next time you sign in."
        );
      });
    } catch (e) {
      console.error('Migration failed', e);
    }
  }, [currentUser, onError]);

  // S8: auto-dismiss the undo toast
  useEffect(() => {
    if (!undoDelete) return;
    const timer = setTimeout(() => setUndoDelete(null), UNDO_TOAST_MS);
    return () => clearTimeout(timer);
  }, [undoDelete]);

  // Live first page + any older pages the user has loaded.
  const allReports = useMemo(() => {
    if (!olderReports.length) return reports;
    const liveIds = new Set(reports.map((r) => r.id));
    return [...reports, ...olderReports.filter((r) => !liveIds.has(r.id))];
  }, [reports, olderReports]);

  /** Saves a newly generated report (throws on failure; callers handle it). */
  const addReport = useCallback(
    async (report: GeneratedReport) => {
      if (currentUser) await createReport(currentUser.uid, report);
      else setReports((prev) => [report, ...prev]);
    },
    [currentUser]
  );

  const handleUpdateReport = async (updated: GeneratedReport) => {
    if (!currentUser) {
      setReports((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      return;
    }
    try {
      await upsertReportWithId(currentUser.uid, updated);
      // Older pages aren't live, so patch them locally.
      setOlderReports((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    } catch (err) {
      console.error('Saving report failed:', err);
      onError(
        `Your changes to ${updated.studentName}'s report could not be saved. Please try again.`
      );
    }
  };

  // S8: soft-delete with undo toast
  const handleDeleteReport = async (id: string) => {
    const report = allReports.find((r) => r.id === id);
    if (currentUser) {
      try {
        await softDeleteReport(currentUser.uid, id);
      } catch (err) {
        console.error('Deleting report failed:', err);
        onError('The report could not be deleted. Please try again.');
        return;
      }
      setOlderReports((prev) => prev.filter((r) => r.id !== id));
    } else {
      setReports((prev) => prev.filter((r) => r.id !== id));
    }
    if (report) setUndoDelete({ reportId: id, label: report.studentName, report });
  };

  const handleUndoDelete = async () => {
    if (!undoDelete) return;
    const restored = undoDelete.report;
    if (currentUser) {
      try {
        await restoreReport(currentUser.uid, undoDelete.reportId);
      } catch (err) {
        console.error('Undo delete failed:', err);
        onError('The report could not be restored. You can still restore it from Trash.');
        setUndoDelete(null);
        return;
      }
      // Reports from older pages aren't covered by the live listener; put them back locally.
      if (restored && !reports.some((r) => r.id === restored.id)) {
        setOlderReports((prev) => [{ ...restored, deletedAt: null, deleteAfter: null }, ...prev]);
      }
    } else if (restored) {
      setReports((prev) => [restored, ...prev]);
    }
    setUndoDelete(null);
  };

  const handleRestoreReport = async (id: string) => {
    if (!currentUser) return;
    try {
      await restoreReport(currentUser.uid, id);
    } catch (err) {
      console.error('Restore failed:', err);
      onError('The report could not be restored. Please try again.');
    }
  };

  // S9: load the next page of older reports
  const handleLoadMore = async () => {
    if (!currentUser || !lastReportDoc || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const {
        reports: older,
        hasMore,
        lastDoc,
      } = await loadMoreReports(currentUser.uid, lastReportDoc);
      hasLoadedOlderRef.current = true;
      setOlderReports((prev) => [...prev, ...older]);
      setHasMoreReports(hasMore);
      setLastReportDoc(lastDoc);
    } catch (err) {
      console.error('loadMoreReports failed:', err);
      onError('Older reports could not be loaded. Please try again.');
    } finally {
      setIsLoadingMore(false);
    }
  };

  /** Every active report, fetching pages that haven't been loaded yet (throws on failure). */
  const getAllActiveReports = async (): Promise<GeneratedReport[]> =>
    currentUser && hasMoreReports ? fetchAllActiveReports(currentUser.uid) : allReports;

  return {
    // `reports` includes loaded older pages so every view, export and stat covers them.
    reports: allReports,
    deletedReports,
    hasMoreReports,
    isLoadingMore,
    handleLoadMore,
    undoDelete,
    setUndoDelete,
    addReport,
    getAllActiveReports,
    handleUpdateReport,
    handleDeleteReport,
    handleUndoDelete,
    handleRestoreReport,
  };
};

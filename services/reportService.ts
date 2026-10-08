import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  startAfter,
  updateDoc,
  where,
  type DocumentSnapshot,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { GeneratedReport } from '../types';

const DAY_MS = 24 * 60 * 60 * 1000;

// S9: number of active reports streamed per page
export const REPORTS_PAGE_SIZE = 50;

const getReportsRef = (uid: string) => collection(db, 'users', uid, 'reports');

const stripUndefinedFields = <T extends object>(value: T): Partial<T> => {
  return Object.fromEntries(
    Object.entries(value).filter(([, fieldValue]) => fieldValue !== undefined)
  ) as Partial<T>;
};

/**
 * S9: Live listener limited to the 50 most-recent active reports.
 * Returns the unsubscribe function AND the last visible snapshot document
 * so the caller can pass it to loadMoreReports() to fetch older pages.
 */
export const listenToReports = (
  uid: string,
  onChange: (
    activeReports: GeneratedReport[],
    deletedReports: GeneratedReport[],
    hasMore: boolean,
    lastDoc: DocumentSnapshot | null
  ) => void
): (() => void) => {
  // Active reports: paginated (most-recent 50)
  const activeQuery = query(
    getReportsRef(uid),
    orderBy('timestamp', 'desc'),
    limit(REPORTS_PAGE_SIZE)
  );

  // Deleted reports only. Filtered server-side so we don't stream the whole
  // collection; sorted client-side to avoid needing a composite index.
  const deletedQuery = query(getReportsRef(uid), where('deletedAt', '!=', null));

  let activeReports: GeneratedReport[] = [];
  let deletedReports: GeneratedReport[] = [];
  let lastVisible: DocumentSnapshot | null = null;
  let hasMore = false;

  const unsubActive = onSnapshot(activeQuery, (snap) => {
    activeReports = snap.docs
      .map((d) => ({ id: d.id, ...(d.data() as Omit<GeneratedReport, 'id'>) }))
      .filter((r) => !r.deletedAt);

    hasMore = snap.docs.length === REPORTS_PAGE_SIZE;
    lastVisible = snap.docs[snap.docs.length - 1] ?? null;

    onChange(activeReports, deletedReports, hasMore, lastVisible);
  });

  const unsubDeleted = onSnapshot(deletedQuery, (snap) => {
    const now = Date.now();

    // Expire soft-deleted docs that have passed their TTL (backstop for the
    // scheduled purgeDeletedReports function).
    snap.docs.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.deleteAfter && data.deleteAfter <= now) {
        deleteDoc(doc(db, 'users', uid, 'reports', docSnap.id)).catch(() => {});
      }
    });

    deletedReports = snap.docs
      .map((d) => ({ id: d.id, ...(d.data() as Omit<GeneratedReport, 'id'>) }))
      .filter((r) => !!r.deletedAt && !(r.deleteAfter && r.deleteAfter <= now))
      .sort((a, b) => b.timestamp - a.timestamp);

    onChange(activeReports, deletedReports, hasMore, lastVisible);
  });

  return () => {
    unsubActive();
    unsubDeleted();
  };
};

/**
 * S9: Fetches the next page of active reports after the cursor document.
 * Call this when the user clicks "Load More" in the Reports tab.
 */
export const loadMoreReports = async (
  uid: string,
  cursor: DocumentSnapshot
): Promise<{ reports: GeneratedReport[]; hasMore: boolean; lastDoc: DocumentSnapshot | null }> => {
  const q = query(
    getReportsRef(uid),
    orderBy('timestamp', 'desc'),
    startAfter(cursor),
    limit(REPORTS_PAGE_SIZE)
  );
  const snap = await getDocs(q);
  const reports = snap.docs
    .map((d) => ({ id: d.id, ...(d.data() as Omit<GeneratedReport, 'id'>) }))
    .filter((r) => !r.deletedAt);

  return {
    reports,
    hasMore: snap.docs.length === REPORTS_PAGE_SIZE,
    lastDoc: snap.docs[snap.docs.length - 1] ?? null,
  };
};

/** Every active (not trashed) report, newest first — used for full CSV export. */
export const fetchAllActiveReports = async (uid: string): Promise<GeneratedReport[]> => {
  const snap = await getDocs(query(getReportsRef(uid), orderBy('timestamp', 'desc')));
  return snap.docs
    .map((d) => ({ id: d.id, ...(d.data() as Omit<GeneratedReport, 'id'>) }))
    .filter((r) => !r.deletedAt);
};

export const createReport = async (uid: string, report: GeneratedReport): Promise<string> => {
  const docRef = await addDoc(getReportsRef(uid), {
    ...stripUndefinedFields(report),
    deletedAt: null,
    deleteAfter: null,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
};

export const softDeleteReport = async (uid: string, reportId: string): Promise<void> => {
  const now = Date.now();
  await updateDoc(doc(db, 'users', uid, 'reports', reportId), {
    deletedAt: now,
    deleteAfter: now + DAY_MS,
  });
};

export const restoreReport = async (uid: string, reportId: string): Promise<void> => {
  await updateDoc(doc(db, 'users', uid, 'reports', reportId), {
    deletedAt: null,
    deleteAfter: null,
  });
};

export const upsertReportWithId = async (uid: string, report: GeneratedReport): Promise<void> => {
  // B6: Use merge:true but do NOT force deletedAt/deleteAfter to null.
  // If the document doesn't yet exist, Firestore will create it without those
  // fields (undefined fields are stripped), preserving the intended delete state.
  // createdAt is intentionally not written here — this runs on every edit and
  // would overwrite the original creation time (createReport sets it).
  await setDoc(doc(db, 'users', uid, 'reports', report.id), stripUndefinedFields(report), {
    merge: true,
  });
};

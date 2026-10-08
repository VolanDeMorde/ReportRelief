/**
 * S19: Tests for services/reportService.ts
 *
 * All Firebase SDK calls are replaced with vitest mocks using inline
 * factory functions (required because vi.mock is hoisted and cannot
 * reference variables declared in the outer scope).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Firebase mocks (inline factories — hoisting-safe) ────────────────────
vi.mock('../../firebase', () => ({ db: {} }));

vi.mock('firebase/firestore', () => {
  return {
    collection: vi.fn(() => ({ _id: 'mock-collection' })),
    addDoc: vi.fn(async () => ({ id: 'new-doc-id' })),
    deleteDoc: vi.fn(async () => {}),
    doc: vi.fn(() => ({ _id: 'mock-doc-ref' })),
    getDocs: vi.fn(async () => ({ docs: [], empty: true })),
    limit: vi.fn((n: number) => ({ _limit: n })),
    onSnapshot: vi.fn(() => vi.fn()), // returns a mock unsubscribe fn
    orderBy: vi.fn((f: string, d: string) => ({ _orderBy: f, _dir: d })),
    query: vi.fn((...args: unknown[]) => ({ _args: args })),
    serverTimestamp: vi.fn(() => 'SERVER_TIMESTAMP'),
    setDoc: vi.fn(async () => {}),
    startAfter: vi.fn((doc: unknown) => ({ _startAfter: doc })),
    updateDoc: vi.fn(async () => {}),
    where: vi.fn((f: string, op: string, v: unknown) => ({ _where: [f, op, v] })),
  };
});

// ── Helpers to access mock instances after import ─────────────────────────
import * as firestoreMocks from 'firebase/firestore';

const mockOnSnapshot = vi.mocked(firestoreMocks.onSnapshot);
const mockLimit = vi.mocked(firestoreMocks.limit);
const mockOrderBy = vi.mocked(firestoreMocks.orderBy);
const mockStartAfter = vi.mocked(firestoreMocks.startAfter);
const mockGetDocs = vi.mocked(firestoreMocks.getDocs);
const mockAddDoc = vi.mocked(firestoreMocks.addDoc);
const mockUpdateDoc = vi.mocked(firestoreMocks.updateDoc);

beforeEach(() => {
  vi.clearAllMocks();
  // Reset default return values after clearAllMocks
  mockOnSnapshot.mockReturnValue(vi.fn() as any);
  mockGetDocs.mockResolvedValue({ docs: [], empty: true } as any);
  mockAddDoc.mockResolvedValue({ id: 'new-doc-id' } as any);
});

// ── REPORTS_PAGE_SIZE constant ─────────────────────────────────────────────
describe('REPORTS_PAGE_SIZE', () => {
  it('is a positive integer', async () => {
    const { REPORTS_PAGE_SIZE } = await import('../../services/reportService');
    expect(REPORTS_PAGE_SIZE).toBeGreaterThan(0);
    expect(Number.isInteger(REPORTS_PAGE_SIZE)).toBe(true);
  });

  it('is exactly 50', async () => {
    const { REPORTS_PAGE_SIZE } = await import('../../services/reportService');
    expect(REPORTS_PAGE_SIZE).toBe(50);
  });
});

// ── listenToReports ───────────────────────────────────────────────────────
describe('listenToReports', () => {
  it('applies a limit of REPORTS_PAGE_SIZE to the active query', async () => {
    const { listenToReports, REPORTS_PAGE_SIZE } = await import('../../services/reportService');
    listenToReports('uid-123', vi.fn());
    expect(mockLimit).toHaveBeenCalledWith(REPORTS_PAGE_SIZE);
  });

  it('orders by timestamp descending', async () => {
    const { listenToReports } = await import('../../services/reportService');
    listenToReports('uid-123', vi.fn());
    expect(mockOrderBy).toHaveBeenCalledWith('timestamp', 'desc');
  });

  it('returns an unsubscribe function', async () => {
    const { listenToReports } = await import('../../services/reportService');
    const unsub = listenToReports('uid-123', vi.fn());
    expect(typeof unsub).toBe('function');
  });

  it('attaches two separate onSnapshot listeners (active + deleted)', async () => {
    const { listenToReports } = await import('../../services/reportService');
    listenToReports('uid-123', vi.fn());
    expect(mockOnSnapshot).toHaveBeenCalledTimes(2);
  });
});

// ── loadMoreReports ───────────────────────────────────────────────────────
describe('fetchAllActiveReports', () => {
  it('returns every non-deleted report without a page limit', async () => {
    const { fetchAllActiveReports } = await import('../../services/reportService');
    mockGetDocs.mockResolvedValueOnce({
      docs: [
        { id: 'a', data: () => ({ studentName: 'A', deletedAt: null }) },
        { id: 'b', data: () => ({ studentName: 'B', deletedAt: 123 }) },
        { id: 'c', data: () => ({ studentName: 'C' }) },
      ],
    } as any);
    const result = await fetchAllActiveReports('uid-123');
    expect(result.map((r) => r.id)).toEqual(['a', 'c']);
    expect(mockLimit).not.toHaveBeenCalled();
  });
});

describe('loadMoreReports', () => {
  it('passes the cursor to startAfter', async () => {
    const { loadMoreReports } = await import('../../services/reportService');
    const fakeCursor = { id: 'cursor-doc' };
    await loadMoreReports('uid-123', fakeCursor as any);
    expect(mockStartAfter).toHaveBeenCalledWith(fakeCursor);
  });

  it('applies REPORTS_PAGE_SIZE limit', async () => {
    const { loadMoreReports, REPORTS_PAGE_SIZE } = await import('../../services/reportService');
    await loadMoreReports('uid-123', {} as any);
    expect(mockLimit).toHaveBeenCalledWith(REPORTS_PAGE_SIZE);
  });

  it('returns hasMore=false when fewer than PAGE_SIZE docs returned', async () => {
    mockGetDocs.mockResolvedValueOnce({
      docs: Array(10).fill({ id: 'x', data: () => ({}) }),
      empty: false,
    } as any);
    const { loadMoreReports } = await import('../../services/reportService');
    const result = await loadMoreReports('uid-123', {} as any);
    expect(result.hasMore).toBe(false);
  });

  it('returns hasMore=true when exactly PAGE_SIZE docs returned', async () => {
    const { loadMoreReports, REPORTS_PAGE_SIZE } = await import('../../services/reportService');
    mockGetDocs.mockResolvedValueOnce({
      docs: Array(REPORTS_PAGE_SIZE).fill({ id: 'x', data: () => ({}) }),
      empty: false,
    } as any);
    const result = await loadMoreReports('uid-123', {} as any);
    expect(result.hasMore).toBe(true);
  });

  it('returns lastDoc as the last element in the page', async () => {
    const lastDoc = { id: 'last', data: () => ({}) };
    mockGetDocs.mockResolvedValueOnce({
      docs: [{ id: 'first', data: () => ({}) }, lastDoc],
      empty: false,
    } as any);
    const { loadMoreReports } = await import('../../services/reportService');
    const result = await loadMoreReports('uid-123', {} as any);
    expect(result.lastDoc).toBe(lastDoc);
  });

  it('filters out soft-deleted docs from the result', async () => {
    mockGetDocs.mockResolvedValueOnce({
      docs: [
        { id: 'a', data: () => ({ deletedAt: Date.now() }) },
        { id: 'b', data: () => ({ deletedAt: Date.now() }) },
      ],
      empty: false,
    } as any);
    const { loadMoreReports } = await import('../../services/reportService');
    const result = await loadMoreReports('uid-123', {} as any);
    expect(result.reports).toHaveLength(0);
  });

  it('includes non-deleted docs in the result', async () => {
    mockGetDocs.mockResolvedValueOnce({
      docs: [
        { id: 'a', data: () => ({ deletedAt: null, studentName: 'Alice' }) },
        { id: 'b', data: () => ({ deletedAt: Date.now(), studentName: 'Bob' }) }, // deleted
      ],
      empty: false,
    } as any);
    const { loadMoreReports } = await import('../../services/reportService');
    const result = await loadMoreReports('uid-123', {} as any);
    expect(result.reports).toHaveLength(1);
    expect(result.reports[0]?.studentName).toBe('Alice');
  });
});

// ── createReport ──────────────────────────────────────────────────────────
describe('createReport', () => {
  it('returns the new document id from addDoc', async () => {
    mockAddDoc.mockResolvedValueOnce({ id: 'abc-123' } as any);
    const { createReport } = await import('../../services/reportService');
    const id = await createReport('uid-123', {
      id: '',
      studentName: 'Alice',
      subject: 'Maths',
    } as any);
    expect(id).toBe('abc-123');
  });

  it('strips undefined fields before writing to Firestore', async () => {
    const { createReport } = await import('../../services/reportService');
    await createReport('uid-123', {
      id: '',
      studentName: 'Bob',
      subject: 'Science',
      studentPhoto: undefined,
      imageEvidence: undefined,
    } as any);
    const callPayload = mockAddDoc.mock.calls[0]?.[1] as Record<string, unknown>;
    expect(callPayload).not.toHaveProperty('studentPhoto');
    expect(callPayload).not.toHaveProperty('imageEvidence');
  });
});

// ── softDeleteReport ──────────────────────────────────────────────────────
describe('softDeleteReport', () => {
  it('sets deletedAt and deleteAfter (24h TTL)', async () => {
    const { softDeleteReport } = await import('../../services/reportService');
    await softDeleteReport('uid-123', 'report-abc');
    const payload = mockUpdateDoc.mock.calls[0]?.[1] as unknown as {
      deletedAt: number;
      deleteAfter: number;
    };
    expect(typeof payload.deletedAt).toBe('number');
    expect(payload.deleteAfter - payload.deletedAt).toBe(24 * 60 * 60 * 1000);
  });
});

// ── restoreReport ─────────────────────────────────────────────────────────
describe('restoreReport', () => {
  it('clears both deletedAt and deleteAfter to null', async () => {
    const { restoreReport } = await import('../../services/reportService');
    await restoreReport('uid-123', 'report-abc');
    const payload = mockUpdateDoc.mock.calls[0]?.[1] as unknown as Record<string, unknown>;
    expect(payload.deletedAt).toBeNull();
    expect(payload.deleteAfter).toBeNull();
  });
});

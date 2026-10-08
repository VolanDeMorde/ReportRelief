import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import type { User } from 'firebase/auth';
import { Curriculum, ReportTone, YearGroup, type GeneratedReport } from '../../types';

type Listener = (
  active: GeneratedReport[],
  trashed: GeneratedReport[],
  hasMore: boolean,
  lastDoc: null
) => void;

const service = vi.hoisted(() => ({
  listener: null as Listener | null,
  unsubscribe: vi.fn(),
  softDeleteReport: vi.fn(async () => {}),
  restoreReport: vi.fn(async () => {}),
}));

vi.mock('../../services/reportService', () => ({
  listenToReports: vi.fn((_uid: string, onChange: Listener) => {
    service.listener = onChange;
    return service.unsubscribe;
  }),
  loadMoreReports: vi.fn(),
  fetchAllActiveReports: vi.fn(),
  createReport: vi.fn(async () => 'id'),
  upsertReportWithId: vi.fn(async () => {}),
  softDeleteReport: service.softDeleteReport,
  restoreReport: service.restoreReport,
}));

import { useReports } from '../useReports';

const report = (id: string): GeneratedReport => ({
  id,
  studentName: `Student ${id}`,
  year: YearGroup.YEAR_3,
  subject: 'Maths',
  mark: 60,
  reportText: '',
  actionPlan: [],
  tone: ReportTone.FRIENDLY,
  curriculum: Curriculum.UK_NATIONAL,
  timestamp: 0,
  language: 'English',
});

const teacher = { uid: 'teacher-1' } as User;

const setup = (initialUser: User | null) => {
  const onError = vi.fn();
  const onReportsFound = vi.fn();
  const hook = renderHook(
    ({ currentUser }: { currentUser: User | null }) =>
      useReports({ currentUser, isAuthLoading: false, onError, onReportsFound }),
    { initialProps: { currentUser: initialUser } }
  );
  return { ...hook, onError, onReportsFound };
};

beforeEach(() => {
  vi.clearAllMocks();
  service.listener = null;
  localStorage.clear();
});

describe('useReports', () => {
  it('shows live reports and opens the dashboard once on first load', () => {
    const { result, onReportsFound } = setup(teacher);
    act(() => service.listener?.([report('a'), report('b')], [], false, null));
    act(() => service.listener?.([report('a')], [report('b')], false, null));
    expect(result.current.reports.map((r) => r.id)).toEqual(['a']);
    expect(result.current.deletedReports.map((r) => r.id)).toEqual(['b']);
    expect(onReportsFound).toHaveBeenCalledTimes(1);
  });

  it("clears the teacher's reports from memory on sign-out and never writes them to localStorage", () => {
    const { result, rerender } = setup(teacher);
    act(() => service.listener?.([report('a')], [report('t')], false, null));

    rerender({ currentUser: null });

    expect(service.unsubscribe).toHaveBeenCalled();
    expect(result.current.reports).toEqual([]);
    expect(result.current.deletedReports).toEqual([]);
    expect(localStorage.getItem('rb-reports')).toBeNull();
  });

  it('reports a failed delete instead of showing the undo toast', async () => {
    service.softDeleteReport.mockRejectedValueOnce(new Error('offline'));
    const { result, onError } = setup(teacher);
    act(() => service.listener?.([report('a')], [], false, null));

    await act(() => result.current.handleDeleteReport('a'));

    expect(onError).toHaveBeenCalledWith(expect.stringContaining('could not be deleted'));
    expect(result.current.undoDelete).toBeNull();
  });

  it('offers undo after a successful delete', async () => {
    const { result } = setup(teacher);
    act(() => service.listener?.([report('a')], [], false, null));

    await act(() => result.current.handleDeleteReport('a'));
    expect(result.current.undoDelete).toMatchObject({ reportId: 'a', label: 'Student a' });

    await act(() => result.current.handleUndoDelete());
    expect(service.restoreReport).toHaveBeenCalledWith('teacher-1', 'a');
    expect(result.current.undoDelete).toBeNull();
  });
});

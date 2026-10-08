import { describe, it, expect, vi } from 'vitest';
import { effectiveGenerationCount } from '../useAccount';
import { computeMarkStats, groupByYear } from '../useReportFilters';
import { toGeneratedReport } from '../useReportGeneration';
import { viewFromPath } from '../useRouting';
import { USAGE_WINDOW_MS } from '../../constants';
import {
  Curriculum,
  Focus,
  Gender,
  ReportLength,
  ReportTone,
  YearGroup,
  type GeneratedReport,
  type StudentInput,
} from '../../types';

// firebase is imported transitively by the hooks; tests here don't touch it.
vi.mock('../../firebase', () => ({ db: {}, auth: {}, app: {}, provider: {} }));

const report = (overrides: Partial<GeneratedReport>): GeneratedReport => ({
  id: 'id',
  studentName: 'S',
  year: YearGroup.YEAR_3,
  subject: 'Maths',
  mark: 50,
  reportText: '',
  actionPlan: [],
  tone: ReportTone.FRIENDLY,
  curriculum: Curriculum.UK_NATIONAL,
  timestamp: 0,
  language: 'English',
  ...overrides,
});

describe('effectiveGenerationCount', () => {
  const now = 1_000_000_000_000;
  it('returns null when the user has no usage yet', () => {
    expect(effectiveGenerationCount(undefined, undefined, now)).toBeNull();
  });
  it('returns the stored count inside the window', () => {
    expect(effectiveGenerationCount(7, now - 1000, now)).toBe(7);
  });
  it('treats an expired window as 0 (server resets on the next generation)', () => {
    expect(effectiveGenerationCount(10, now - USAGE_WINDOW_MS, now)).toBe(0);
    expect(effectiveGenerationCount(10, undefined, now)).toBe(0);
  });
});

describe('computeMarkStats', () => {
  it('returns zeros for no reports', () => {
    expect(computeMarkStats([])).toEqual({ avg: 0, high: 0, low: 0 });
  });
  it('computes rounded mean, high and low', () => {
    expect(
      computeMarkStats([report({ mark: 50 }), report({ mark: 71 }), report({ mark: 90 })])
    ).toEqual({ avg: 70, high: 90, low: 50 });
  });
});

describe('groupByYear', () => {
  it('groups in school order and omits empty years, keeping input order within a year', () => {
    const groups = groupByYear([
      report({ id: 'a', year: YearGroup.YEAR_10 }),
      report({ id: 'b', year: YearGroup.RECEPTION }),
      report({ id: 'c', year: YearGroup.YEAR_10 }),
    ]);
    expect(groups.map(([year, list]) => [year, list.map((r) => r.id)])).toEqual([
      [YearGroup.RECEPTION, ['b']],
      [YearGroup.YEAR_10, ['a', 'c']],
    ]);
  });
});

describe('viewFromPath', () => {
  it.each([
    ['/', 'landing'],
    ['/app', 'dashboard'],
    ['/app/', 'dashboard'],
    ['/privacy', 'privacy'],
    ['/faq', 'faq'],
    ['/about', 'about'],
    ['/trash', 'trash'],
    ['/nope', 'landing'],
  ])('%s → %s', (path, view) => {
    expect(viewFromPath(path)).toBe(view);
  });
});

describe('toGeneratedReport', () => {
  const input: StudentInput = {
    name: 'Ada',
    year: YearGroup.YEAR_4,
    gradeLevel: '4B',
    classGroup: 'Maple',
    gender: Gender.FEMALE,
    focus: Focus.BALANCED,
    subject: 'Maths',
    details: 'notes',
    tone: ReportTone.FORMAL,
    length: ReportLength.SHORT,
    curriculum: Curriculum.UK_NATIONAL,
    language: 'French',
    imageEvidence: 'data:image/jpeg;base64,AAA',
    studentPhoto: 'data:image/jpeg;base64,BBB',
  };

  it('copies the report fields and the AI response', () => {
    const r = toGeneratedReport(input, { mark: 77, reportText: 'Great', actionPlan: ['One'] });
    expect(r).toMatchObject({
      studentName: 'Ada',
      year: YearGroup.YEAR_4,
      gradeLevel: '4B',
      classGroup: 'Maple',
      subject: 'Maths',
      tone: ReportTone.FORMAL,
      curriculum: Curriculum.UK_NATIONAL,
      language: 'French',
      mark: 77,
      reportText: 'Great',
      actionPlan: ['One'],
      studentPhoto: input.studentPhoto,
    });
    expect(r.id).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('does not store the work-sample image or the private observations', () => {
    const r = toGeneratedReport(input, {
      mark: 1,
      reportText: '',
      actionPlan: [],
    }) as unknown as Record<string, unknown>;
    expect(r.imageEvidence).toBeUndefined();
    expect(r.details).toBeUndefined();
  });

  it('gives every report a unique id', () => {
    const a = toGeneratedReport(input, { mark: 1, reportText: '', actionPlan: [] });
    const b = toGeneratedReport(input, { mark: 1, reportText: '', actionPlan: [] });
    expect(a.id).not.toBe(b.id);
  });
});

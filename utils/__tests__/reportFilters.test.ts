import { describe, it, expect } from 'vitest';
import { filterAndSortReports } from '../reportFilters';
import { Curriculum, ReportTone, YearGroup, type GeneratedReport } from '../../types';

const report = (overrides: Partial<GeneratedReport>): GeneratedReport => ({
  id: overrides.studentName ?? 'id',
  studentName: 'Student',
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

const reports = [
  report({
    studentName: 'Cara',
    subject: 'Science',
    mark: 70,
    timestamp: 2,
    year: YearGroup.YEAR_4,
  }),
  report({ studentName: 'Ada', subject: 'Maths', mark: 90, timestamp: 1 }),
  report({ studentName: 'Ben', subject: 'Art', mark: 40, timestamp: 3 }),
];

const names = (list: GeneratedReport[]) => list.map((r) => r.studentName);
const all = { searchQuery: '', sortOption: 'newest' as const, selectedGrade: 'all' as const };

describe('filterAndSortReports', () => {
  it('sorts newest first by default', () => {
    expect(names(filterAndSortReports(reports, all))).toEqual(['Ben', 'Cara', 'Ada']);
  });

  it.each([
    ['oldest', ['Ada', 'Cara', 'Ben']],
    ['name-asc', ['Ada', 'Ben', 'Cara']],
    ['name-desc', ['Cara', 'Ben', 'Ada']],
    ['mark-high', ['Ada', 'Cara', 'Ben']],
    ['mark-low', ['Ben', 'Cara', 'Ada']],
  ] as const)('sorts by %s', (sortOption, expected) => {
    expect(names(filterAndSortReports(reports, { ...all, sortOption }))).toEqual(expected);
  });

  it('searches name and subject, case-insensitively', () => {
    expect(names(filterAndSortReports(reports, { ...all, searchQuery: 'SCI' }))).toEqual(['Cara']);
    expect(names(filterAndSortReports(reports, { ...all, searchQuery: ' ada ' }))).toEqual(['Ada']);
  });

  it('filters by year group', () => {
    expect(
      names(filterAndSortReports(reports, { ...all, selectedGrade: YearGroup.YEAR_4 }))
    ).toEqual(['Cara']);
  });

  it('does not mutate the input array', () => {
    const copy = [...reports];
    filterAndSortReports(reports, { ...all, sortOption: 'name-asc' });
    expect(reports).toEqual(copy);
  });
});

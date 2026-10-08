/** Search / sort / grade filtering for the saved-reports list and CSV export. */
import type { GeneratedReport, YearGroup } from '../types';

export type SortOption = 'newest' | 'oldest' | 'name-asc' | 'name-desc' | 'mark-high' | 'mark-low';

export interface ReportFilters {
  searchQuery: string;
  sortOption: SortOption;
  selectedGrade: YearGroup | 'all';
}

const compare: Record<SortOption, (a: GeneratedReport, b: GeneratedReport) => number> = {
  newest: (a, b) => b.timestamp - a.timestamp,
  oldest: (a, b) => a.timestamp - b.timestamp,
  'name-asc': (a, b) => a.studentName.localeCompare(b.studentName),
  'name-desc': (a, b) => b.studentName.localeCompare(a.studentName),
  'mark-high': (a, b) => b.mark - a.mark,
  'mark-low': (a, b) => a.mark - b.mark,
};

/** Returns a new array: reports matching the search and grade, sorted. */
export const filterAndSortReports = (
  reports: GeneratedReport[],
  { searchQuery, sortOption, selectedGrade }: ReportFilters
): GeneratedReport[] => {
  const q = searchQuery.trim().toLowerCase();
  return reports
    .filter((r) => selectedGrade === 'all' || r.year === selectedGrade)
    .filter(
      (r) => !q || r.studentName.toLowerCase().includes(q) || r.subject.toLowerCase().includes(q)
    )
    .sort(compare[sortOption] ?? compare.newest);
};

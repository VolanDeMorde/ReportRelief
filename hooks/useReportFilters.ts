import { useEffect, useMemo, useState } from 'react';
import { YearGroup, type GeneratedReport } from '../types';
import { filterAndSortReports, type ReportFilters, type SortOption } from '../utils/reportFilters';

export const YEAR_GROUP_ORDER: YearGroup[] = [
  YearGroup.NURSERY,
  YearGroup.RECEPTION,
  YearGroup.YEAR_1,
  YearGroup.YEAR_2,
  YearGroup.YEAR_3,
  YearGroup.YEAR_4,
  YearGroup.YEAR_5,
  YearGroup.YEAR_6,
  YearGroup.YEAR_7,
  YearGroup.YEAR_8,
  YearGroup.YEAR_9,
  YearGroup.YEAR_10,
  YearGroup.YEAR_11,
  YearGroup.YEAR_12,
  YearGroup.YEAR_13,
];

const SEARCH_DEBOUNCE_MS = 250;

export interface MarkStats {
  avg: number;
  high: number;
  low: number;
}

export const computeMarkStats = (reports: GeneratedReport[]): MarkStats => {
  if (!reports.length) return { avg: 0, high: 0, low: 0 };
  const marks = reports.map((r) => r.mark);
  return {
    avg: Math.round(marks.reduce((a, b) => a + b, 0) / marks.length),
    high: Math.max(...marks),
    low: Math.min(...marks),
  };
};

/** Groups reports by year group, in school order, omitting empty groups. */
export const groupByYear = (
  reports: GeneratedReport[]
): Array<readonly [YearGroup, GeneratedReport[]]> =>
  YEAR_GROUP_ORDER.map((year) => [year, reports.filter((r) => r.year === year)] as const).filter(
    ([, inYear]) => inYear.length > 0
  );

/** Search (debounced), sort and grade filter for the saved-reports list, plus stats. */
export const useReportFilters = (reports: GeneratedReport[]) => {
  // S10: raw input + debounced value
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [selectedGrade, setSelectedGrade] = useState<YearGroup | 'all'>('all');

  useEffect(() => {
    const timer = setTimeout(() => setSearchQuery(searchInput), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const filters: ReportFilters = useMemo(
    () => ({ searchQuery, sortOption, selectedGrade }),
    [searchQuery, sortOption, selectedGrade]
  );

  const filteredReportsByGrade = useMemo(
    () => filterAndSortReports(reports, filters),
    [reports, filters]
  );
  const reportsArchiveByYear = useMemo(
    () => groupByYear(filteredReportsByGrade),
    [filteredReportsByGrade]
  );
  const analytics = useMemo(() => computeMarkStats(reports), [reports]);

  return {
    searchInput,
    setSearchInput,
    sortOption,
    setSortOption,
    selectedGrade,
    setSelectedGrade,
    filters,
    filteredReportsByGrade,
    reportsArchiveByYear,
    analytics,
  };
};

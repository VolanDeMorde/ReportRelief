/**
 * S5: CSV export utility
 *
 * Exports an array of GeneratedReport objects to a downloadable CSV file.
 * Uses a simple manual CSV builder (no dependencies) with proper quoting.
 */

import { GeneratedReport } from '../types';

/**
 * Escapes a cell value for CSV: wraps in quotes and doubles internal quotes.
 * Text starting with = + - @ (or tab/CR) would be run as a formula by Excel/Sheets
 * (CSV injection), so it is prefixed with an apostrophe. Numbers are left as-is.
 */
const csvCell = (value: string | number | undefined | null): string => {
  let str = String(value ?? '');
  if (typeof value === 'string' && /^[=+\-@\t\r]/.test(str)) str = `'${str}`;
  // Wrap in double-quotes; escape existing double-quotes by doubling them
  return `"${str.replace(/"/g, '""')}"`;
};

/** Strips markdown bold markers (**text**) for clean CSV output. */
const stripMarkdown = (text: string): string => text.replace(/\*\*(.*?)\*\*/g, '$1');

const CSV_HEADERS = [
  'Student Name',
  'Subject',
  'Year Group',
  'Grade Level',
  'Class Group',
  'Mark (%)',
  'Tone',
  'Curriculum',
  'Language',
  'Report Text',
  'Action Plan',
  'Date Generated',
];

/**
 * Triggers a browser download of the provided reports as a CSV file.
 *
 * @param reports    - The reports to export
 * @param filename   - Output filename (defaults to "reports-<date>.csv")
 */
export const exportReportsToCsv = (reports: GeneratedReport[], filename?: string): void => {
  if (reports.length === 0) return;

  const rows = reports.map((r) => [
    csvCell(r.studentName),
    csvCell(r.subject),
    csvCell(r.year),
    csvCell(r.gradeLevel),
    csvCell(r.classGroup),
    csvCell(r.mark),
    csvCell(r.tone),
    csvCell(r.curriculum),
    csvCell(r.language),
    csvCell(stripMarkdown(r.reportText)),
    csvCell(r.actionPlan.map((p, i) => `${i + 1}. ${stripMarkdown(p)}`).join(' | ')),
    csvCell(new Date(r.timestamp).toLocaleDateString()),
  ]);

  const csv = [CSV_HEADERS.map(csvCell).join(','), ...rows.map((row) => row.join(','))].join(
    '\r\n'
  );

  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const today = new Date().toISOString().split('T')[0];
  a.href = url;
  a.download = filename ?? `reportrelief-export-${today}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

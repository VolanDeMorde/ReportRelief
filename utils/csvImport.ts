/**
 * Maps rows from a teacher's CSV (parsed by PapaParse with `header: true`)
 * onto StudentInput objects for bulk generation.
 */
import { Gender, type StudentInput } from '../types';

export type CsvRow = Record<string, string | undefined>;

/** First non-empty, trimmed value among the given column names. */
const pick = (row: CsvRow, ...columns: string[]): string | undefined => {
  for (const column of columns) {
    const value = row[column]?.trim();
    if (value) return value;
  }
  return undefined;
};

/**
 * Parses a gender cell. Matches whole words/prefixes so "Female" is not read
 * as male (it contains an "m"). Anything unrecognised becomes neutral.
 */
export const parseGender = (value: string | undefined): Gender => {
  const v = value?.trim().toLowerCase() ?? '';
  if (/^(f|female|girl|woman|she)\b/.test(v)) return Gender.FEMALE;
  if (/^(m|male|boy|man|he)\b/.test(v)) return Gender.MALE;
  return Gender.NEUTRAL;
};

/** Parses a 0–100 mark; returns undefined for blank or invalid values. */
export const parseMark = (value: string | undefined): number | undefined => {
  if (!value?.trim()) return undefined;
  const n = Number(value.replace('%', '').trim());
  return Number.isFinite(n) && n >= 0 && n <= 100 ? n : undefined;
};

/**
 * Converts CSV rows to report inputs, using `defaults` (the current form) for
 * anything the CSV doesn't specify. Rows without a student name are skipped.
 */
export const csvRowsToStudentInputs = (rows: CsvRow[], defaults: StudentInput): StudentInput[] =>
  rows.flatMap((row) => {
    const name = pick(row, 'Name', 'Student', 'student_name');
    if (!name) return [];
    return [
      {
        ...defaults,
        name,
        subject: pick(row, 'Subject') ?? defaults.subject,
        gradeLevel: pick(row, 'Class', 'Grade', 'gradeLevel') ?? defaults.gradeLevel,
        classGroup: pick(row, 'ClassGroup', 'Class') ?? defaults.classGroup,
        gender: parseGender(pick(row, 'Gender')),
        targetMark: parseMark(pick(row, 'Mark', 'GradePercent')) ?? defaults.targetMark,
        details: pick(row, 'Details', 'Notes', 'observations') ?? '',
        language: pick(row, 'Language') ?? defaults.language,
        // Per-student images can't come from a CSV; don't reuse the form's.
        imageEvidence: undefined,
        studentPhoto: undefined,
      },
    ];
  });

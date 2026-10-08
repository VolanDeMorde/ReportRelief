import { describe, it, expect } from 'vitest';
import { csvRowsToStudentInputs, parseGender, parseMark } from '../csvImport';
import {
  Curriculum,
  Focus,
  Gender,
  ReportLength,
  ReportTone,
  YearGroup,
  type StudentInput,
} from '../../types';

const defaults: StudentInput = {
  name: '',
  year: YearGroup.YEAR_4,
  gradeLevel: '4B',
  classGroup: 'Maple',
  gender: Gender.FEMALE,
  subject: 'Maths',
  focus: Focus.BALANCED,
  tone: ReportTone.FRIENDLY,
  length: ReportLength.MEDIUM,
  curriculum: Curriculum.UK_NATIONAL,
  details: 'form details',
  language: 'English',
  targetMark: 85,
  imageEvidence: 'data:image/jpeg;base64,AAA',
  studentPhoto: 'data:image/jpeg;base64,BBB',
  includeActionPlan: true,
};

describe('parseGender', () => {
  it.each(['Female', 'female', 'F', 'f', 'Girl', ' FEMALE '])('%s → female', (v) => {
    expect(parseGender(v)).toBe(Gender.FEMALE);
  });
  it.each(['Male', 'male', 'M', 'm', 'Boy'])('%s → male', (v) => {
    expect(parseGender(v)).toBe(Gender.MALE);
  });
  it.each(['', undefined, 'Non-binary', 'X', 'they'])('%s → neutral', (v) => {
    expect(parseGender(v)).toBe(Gender.NEUTRAL);
  });
});

describe('parseMark', () => {
  it('parses plain and percent values', () => {
    expect(parseMark('72')).toBe(72);
    expect(parseMark(' 72% ')).toBe(72);
  });
  it.each(['', '  ', 'abc', '101', '-5', undefined])('rejects %s', (v) => {
    expect(parseMark(v)).toBeUndefined();
  });
});

/** Converts a single row and fails the test if it was skipped. */
const convertOne = (row: Record<string, string>): StudentInput => {
  const [student] = csvRowsToStudentInputs([row], defaults);
  if (!student) throw new Error('row was unexpectedly skipped');
  return student;
};

describe('csvRowsToStudentInputs', () => {
  it('maps columns and falls back to form defaults', () => {
    const student = convertOne({
      Name: 'Ada',
      Gender: 'Female',
      Mark: '91',
      Notes: 'Loves algebra',
    });
    expect(student).toMatchObject({
      name: 'Ada',
      gender: Gender.FEMALE,
      targetMark: 91,
      details: 'Loves algebra',
      subject: 'Maths',
      year: YearGroup.YEAR_4,
      language: 'English',
    });
  });

  it('skips rows without a student name', () => {
    const result = csvRowsToStudentInputs(
      [{ Name: '' }, { Notes: 'orphan' }, { Student: 'Bo' }],
      defaults
    );
    expect(result.map((s) => s.name)).toEqual(['Bo']);
  });

  it('does not copy the form images onto every student', () => {
    const student = convertOne({ Name: 'Ada' });
    expect(student.imageEvidence).toBeUndefined();
    expect(student.studentPhoto).toBeUndefined();
  });

  it('does not reuse the form details for students without notes', () => {
    const student = convertOne({ Name: 'Ada' });
    expect(student.details).toBe('');
  });

  it('keeps the default mark when the CSV mark is invalid', () => {
    const student = convertOne({ Name: 'Ada', Mark: 'n/a' });
    expect(student.targetMark).toBe(85);
  });
});

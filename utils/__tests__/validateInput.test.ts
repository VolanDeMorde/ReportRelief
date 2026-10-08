/**
 * S19: Tests for the Cloud Function's input validation logic.
 *
 * Because the actual Cloud Function runs in Node with Firebase Admin,
 * we extract and re-test the pure validation logic here independently —
 * this gives us a safety net against regressions when inputs change.
 *
 * The test module mirrors the validateInput() function from functions/src/index.ts
 * so it runs entirely in-process without any Firebase or Google API calls.
 */
import { describe, it, expect } from 'vitest';

// ── Replicated validation constants (must stay in sync with functions/src/index.ts) ──
const ALLOWED_YEAR_GROUPS = [
  'Nursery',
  'Reception',
  'Year 1',
  'Year 2',
  'Year 3',
  'Year 4',
  'Year 5',
  'Year 6',
  'Year 7',
  'Year 8',
  'Year 9',
  'Year 10',
  'Year 11',
  'Year 12',
  'Year 13',
];
const ALLOWED_TONES = ['Formal', 'Friendly', 'Academic', 'Nurturing', 'NURTURING'];
const ALLOWED_FOCUSES = ['Strengths & Achievements', 'Balanced Overview', 'Growth Areas & Support'];
const ALLOWED_CURRICULA = ['UK National', 'Common Core', 'IB PYP', 'General'];
const ALLOWED_GENDERS = ['Male', 'Female', 'Non-binary/Neutral'];
const ALLOWED_LENGTHS = ['Short', 'Medium', 'Long'];
const DETAILS_MAX_LENGTH = 3000;

interface StudentInput {
  name?: unknown;
  subject?: unknown;
  year?: unknown;
  tone?: unknown;
  focus?: unknown;
  curriculum?: unknown;
  gender?: unknown;
  length?: unknown;
  details?: unknown;
  language?: unknown;
  targetMark?: unknown;
  gradeLevel?: unknown;
  classGroup?: unknown;
}

interface ValidationError {
  statusCode: number;
  message: string;
}

// Replicated validateInput logic (pure, no Firebase dependencies)
const validateInput = (input: StudentInput) => {
  const errors: string[] = [];

  if (!input.name || typeof input.name !== 'string' || !String(input.name).trim()) {
    errors.push("'name' is required.");
  }
  if (!input.subject || typeof input.subject !== 'string' || !String(input.subject).trim()) {
    errors.push("'subject' is required.");
  }
  if (!ALLOWED_YEAR_GROUPS.includes(input.year as string)) {
    errors.push(`'year' must be one of: ${ALLOWED_YEAR_GROUPS.join(', ')}.`);
  }
  if (!ALLOWED_TONES.includes(input.tone as string)) {
    errors.push(`'tone' must be one of: ${ALLOWED_TONES.join(', ')}.`);
  }
  if (!ALLOWED_FOCUSES.includes(input.focus as string)) {
    errors.push(`'focus' must be one of: ${ALLOWED_FOCUSES.join(', ')}.`);
  }
  if (!ALLOWED_CURRICULA.includes(input.curriculum as string)) {
    errors.push(`'curriculum' must be one of: ${ALLOWED_CURRICULA.join(', ')}.`);
  }
  if (!ALLOWED_GENDERS.includes(input.gender as string)) {
    errors.push(`'gender' must be one of: ${ALLOWED_GENDERS.join(', ')}.`);
  }
  if (!ALLOWED_LENGTHS.includes(input.length as string)) {
    errors.push(`'length' must be one of: ${ALLOWED_LENGTHS.join(', ')}.`);
  }
  if (typeof input.details !== 'string') {
    errors.push("'details' must be a string.");
  } else if ((input.details as string).length > DETAILS_MAX_LENGTH) {
    errors.push(`'details' must not exceed ${DETAILS_MAX_LENGTH} characters.`);
  }
  if (input.targetMark !== undefined) {
    const mark = Number(input.targetMark);
    if (isNaN(mark) || mark < 0 || mark > 100) {
      errors.push("'targetMark' must be a number between 0 and 100.");
    }
  }

  if (errors.length > 0) {
    const err: ValidationError = { statusCode: 400, message: errors.join(' ') };
    throw err;
  }

  return {
    ...input,
    name: String(input.name).trim(),
    subject: String(input.subject).trim(),
    details: String(input.details).trim(),
    language:
      typeof input.language === 'string'
        ? (input.language as string).trim().slice(0, 50)
        : 'English',
    gradeLevel:
      typeof input.gradeLevel === 'string'
        ? (input.gradeLevel as string).trim().slice(0, 30)
        : undefined,
    classGroup:
      typeof input.classGroup === 'string'
        ? (input.classGroup as string).trim().slice(0, 50)
        : undefined,
  };
};

// ── Fixtures ──────────────────────────────────────────────────────────────
const VALID_INPUT: StudentInput = {
  name: 'Alice Smith',
  subject: 'Mathematics',
  year: 'Year 5',
  tone: 'Friendly',
  focus: 'Balanced Overview',
  curriculum: 'UK National',
  gender: 'Female',
  length: 'Medium',
  details: 'Alice consistently demonstrates strong arithmetic skills.',
  language: 'English',
  targetMark: 85,
};

// ── Tests ─────────────────────────────────────────────────────────────────
describe('validateInput (Cloud Function logic)', () => {
  describe('valid inputs', () => {
    it('accepts a fully valid input object', () => {
      expect(() => validateInput(VALID_INPUT)).not.toThrow();
    });

    it('returns sanitised data with trimmed strings', () => {
      const result = validateInput({
        ...VALID_INPUT,
        name: '  Alice Smith  ',
        subject: '  Maths  ',
      });
      expect(result.name).toBe('Alice Smith');
      expect(result.subject).toBe('Maths');
    });

    it('defaults language to "English" when not provided', () => {
      const result = validateInput({ ...VALID_INPUT, language: undefined });
      expect(result.language).toBe('English');
    });

    it('truncates language to 50 characters', () => {
      const longLang = 'A'.repeat(100);
      const result = validateInput({ ...VALID_INPUT, language: longLang });
      expect(result.language.length).toBe(50);
    });

    it('truncates gradeLevel to 30 characters', () => {
      const result = validateInput({ ...VALID_INPUT, gradeLevel: 'X'.repeat(50) });
      expect(result.gradeLevel?.length).toBe(30);
    });

    it('truncates classGroup to 50 characters', () => {
      const result = validateInput({ ...VALID_INPUT, classGroup: 'X'.repeat(80) });
      expect(result.classGroup?.length).toBe(50);
    });

    it('accepts targetMark of 0', () => {
      expect(() => validateInput({ ...VALID_INPUT, targetMark: 0 })).not.toThrow();
    });

    it('accepts targetMark of 100', () => {
      expect(() => validateInput({ ...VALID_INPUT, targetMark: 100 })).not.toThrow();
    });

    it('accepts the legacy "NURTURING" tone value', () => {
      expect(() => validateInput({ ...VALID_INPUT, tone: 'NURTURING' })).not.toThrow();
    });

    it('accepts all allowed curricula', () => {
      for (const curriculum of ALLOWED_CURRICULA) {
        expect(() => validateInput({ ...VALID_INPUT, curriculum })).not.toThrow();
      }
    });

    it('accepts all allowed year groups', () => {
      for (const year of ALLOWED_YEAR_GROUPS) {
        expect(() => validateInput({ ...VALID_INPUT, year })).not.toThrow();
      }
    });

    it('accepts empty string for optional gradeLevel', () => {
      expect(() => validateInput({ ...VALID_INPUT, gradeLevel: '' })).not.toThrow();
    });
  });

  describe('invalid inputs — required fields', () => {
    it('throws when name is missing', () => {
      expect(() => validateInput({ ...VALID_INPUT, name: '' })).toThrow(/'name' is required/);
    });

    it('throws when name is only whitespace', () => {
      expect(() => validateInput({ ...VALID_INPUT, name: '   ' })).toThrow(/'name' is required/);
    });

    it('throws when subject is missing', () => {
      expect(() => validateInput({ ...VALID_INPUT, subject: '' })).toThrow(/'subject' is required/);
    });

    it('throws when year is not in the allowed list', () => {
      expect(() => validateInput({ ...VALID_INPUT, year: 'Grade 5' })).toThrow(
        /'year' must be one of/
      );
    });

    it('throws when tone is not in the allowed list', () => {
      expect(() => validateInput({ ...VALID_INPUT, tone: 'Sarcastic' })).toThrow(
        /'tone' must be one of/
      );
    });

    it('throws when focus is not in the allowed list', () => {
      expect(() => validateInput({ ...VALID_INPUT, focus: 'Random Focus' })).toThrow(
        /'focus' must be one of/
      );
    });

    it('throws when curriculum is not in the allowed list', () => {
      expect(() => validateInput({ ...VALID_INPUT, curriculum: 'French Bac' })).toThrow(
        /'curriculum' must be one of/
      );
    });

    it('throws when gender is not in the allowed list', () => {
      expect(() => validateInput({ ...VALID_INPUT, gender: 'Robot' })).toThrow(
        /'gender' must be one of/
      );
    });

    it('throws when length is not in the allowed list', () => {
      expect(() => validateInput({ ...VALID_INPUT, length: 'Extra Long' })).toThrow(
        /'length' must be one of/
      );
    });
  });

  describe('invalid inputs — details', () => {
    it('throws when details is not a string', () => {
      expect(() => validateInput({ ...VALID_INPUT, details: 42 as any })).toThrow(
        /'details' must be a string/
      );
    });

    it('throws when details exceeds 3000 characters', () => {
      const longDetails = 'x'.repeat(3001);
      expect(() => validateInput({ ...VALID_INPUT, details: longDetails })).toThrow(
        /must not exceed/
      );
    });

    it('accepts details at exactly 3000 characters', () => {
      const maxDetails = 'x'.repeat(3000);
      expect(() => validateInput({ ...VALID_INPUT, details: maxDetails })).not.toThrow();
    });
  });

  describe('invalid inputs — targetMark', () => {
    it('throws when targetMark is negative', () => {
      expect(() => validateInput({ ...VALID_INPUT, targetMark: -1 })).toThrow(/'targetMark'/);
    });

    it('throws when targetMark is above 100', () => {
      expect(() => validateInput({ ...VALID_INPUT, targetMark: 101 })).toThrow(/'targetMark'/);
    });

    it('throws when targetMark is NaN', () => {
      expect(() => validateInput({ ...VALID_INPUT, targetMark: NaN })).toThrow(/'targetMark'/);
    });

    it('does not throw when targetMark is undefined', () => {
      expect(() => validateInput({ ...VALID_INPUT, targetMark: undefined })).not.toThrow();
    });
  });

  describe('error aggregation', () => {
    it('reports all validation errors at once, not just the first', () => {
      let error: ValidationError | null = null;
      try {
        validateInput({
          name: '',
          subject: '',
          year: 'Bad',
          tone: 'Bad',
          focus: 'Bad',
          curriculum: 'Bad',
          gender: 'Bad',
          length: 'Bad',
          details: '',
        });
      } catch (e) {
        error = e as ValidationError;
      }
      expect(error).not.toBeNull();
      expect(error!.statusCode).toBe(400);
      // Multiple distinct error messages combined
      expect(error!.message).toContain("'name' is required");
      expect(error!.message).toContain("'year' must be one of");
    });
  });
});

/**
 * Server-side validation of report-generation requests, plus small parsing helpers.
 * Pure functions only (no Firebase imports) so they can be unit-tested.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface StudentInput {
  name: string;
  subject: string;
  year: string;
  tone: string;
  focus: string;
  curriculum: string;
  gender: string;
  length: string;
  details: string;
  language?: string;
  targetMark?: number | string;
  gradeLevel?: string;
  classGroup?: string;
  imageEvidence?: string;
  includeActionPlan?: boolean;
}

export interface ValidationError {
  statusCode: number;
  message: string;
}

// ---------------------------------------------------------------------------
// Server-side input validation helpers
// ---------------------------------------------------------------------------
export const ALLOWED_YEAR_GROUPS: string[] = [
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
export const ALLOWED_TONES: string[] = [
  'Formal',
  'Friendly',
  'Academic',
  'Nurturing',
  'NURTURING', // legacy value kept for backwards-compatibility
];
export const ALLOWED_FOCUSES: string[] = [
  'Strengths & Achievements',
  'Balanced Overview',
  'Growth Areas & Support',
];
export const ALLOWED_CURRICULA: string[] = ['UK National', 'Common Core', 'IB PYP', 'General'];
export const ALLOWED_GENDERS: string[] = ['Male', 'Female', 'Non-binary/Neutral'];
export const ALLOWED_LENGTHS: string[] = ['Short', 'Medium', 'Long'];
export const DETAILS_MAX_LENGTH = 3000;
export const NAME_MAX_LENGTH = 100;
export const SUBJECT_MAX_LENGTH = 100;
// Base64 data URL cap (~1.5 MB of image data). The client compresses images well below this.
export const IMAGE_DATA_URL_MAX_LENGTH = 2_000_000;
export const IMAGE_DATA_URL_PATTERN = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/;

export const PRONOUNS: Record<string, string> = {
  Male: 'he/him',
  Female: 'she/her',
  'Non-binary/Neutral': 'they/them',
};

export const validateInput = (body: unknown): StudentInput => {
  if (!body || typeof body !== 'object') {
    const err: ValidationError = {
      statusCode: 400,
      message: 'Request body must be a JSON object.',
    };
    throw err;
  }
  const input = body as Partial<StudentInput>;
  const errors: string[] = [];

  if (!input.name || typeof input.name !== 'string' || !input.name.trim()) {
    errors.push("'name' is required.");
  } else if (input.name.length > NAME_MAX_LENGTH) {
    errors.push(`'name' must not exceed ${NAME_MAX_LENGTH} characters.`);
  }
  if (!input.subject || typeof input.subject !== 'string' || !input.subject.trim()) {
    errors.push("'subject' is required.");
  } else if (input.subject.length > SUBJECT_MAX_LENGTH) {
    errors.push(`'subject' must not exceed ${SUBJECT_MAX_LENGTH} characters.`);
  }
  if (!ALLOWED_YEAR_GROUPS.includes(input.year ?? '')) {
    errors.push(`'year' must be one of: ${ALLOWED_YEAR_GROUPS.join(', ')}.`);
  }
  if (!ALLOWED_TONES.includes(input.tone ?? '')) {
    errors.push(`'tone' must be one of: ${ALLOWED_TONES.join(', ')}.`);
  }
  if (!ALLOWED_FOCUSES.includes(input.focus ?? '')) {
    errors.push(`'focus' must be one of: ${ALLOWED_FOCUSES.join(', ')}.`);
  }
  if (!ALLOWED_CURRICULA.includes(input.curriculum ?? '')) {
    errors.push(`'curriculum' must be one of: ${ALLOWED_CURRICULA.join(', ')}.`);
  }
  if (!ALLOWED_GENDERS.includes(input.gender ?? '')) {
    errors.push(`'gender' must be one of: ${ALLOWED_GENDERS.join(', ')}.`);
  }
  if (!ALLOWED_LENGTHS.includes(input.length ?? '')) {
    errors.push(`'length' must be one of: ${ALLOWED_LENGTHS.join(', ')}.`);
  }
  if (typeof input.details !== 'string') {
    errors.push("'details' must be a string.");
  } else if (input.details.length > DETAILS_MAX_LENGTH) {
    errors.push(`'details' must not exceed ${DETAILS_MAX_LENGTH} characters.`);
  }
  if (input.targetMark !== undefined && input.targetMark !== null && input.targetMark !== '') {
    const mark = Number(input.targetMark);
    if (isNaN(mark) || mark < 0 || mark > 100) {
      errors.push("'targetMark' must be a number between 0 and 100.");
    }
  }
  if (
    input.imageEvidence !== undefined &&
    input.imageEvidence !== null &&
    input.imageEvidence !== ''
  ) {
    if (
      typeof input.imageEvidence !== 'string' ||
      input.imageEvidence.length > IMAGE_DATA_URL_MAX_LENGTH ||
      !IMAGE_DATA_URL_PATTERN.test(input.imageEvidence)
    ) {
      errors.push("'imageEvidence' must be a JPEG, PNG or WebP data URL under 1.5 MB.");
    }
  }

  if (errors.length > 0) {
    const err: ValidationError = { statusCode: 400, message: errors.join(' ') };
    throw err;
  }

  const hasTargetMark =
    input.targetMark !== undefined && input.targetMark !== null && input.targetMark !== '';

  return {
    name: String(input.name).trim(),
    subject: String(input.subject).trim(),
    year: input.year as string,
    tone: input.tone as string,
    focus: input.focus as string,
    curriculum: input.curriculum as string,
    gender: input.gender as string,
    length: input.length as string,
    details: String(input.details).trim(),
    language:
      typeof input.language === 'string' && input.language.trim()
        ? input.language.trim().slice(0, 50)
        : 'English',
    targetMark: hasTargetMark ? Number(input.targetMark) : undefined,
    gradeLevel:
      typeof input.gradeLevel === 'string' ? input.gradeLevel.trim().slice(0, 30) : undefined,
    classGroup:
      typeof input.classGroup === 'string' ? input.classGroup.trim().slice(0, 50) : undefined,
    imageEvidence: input.imageEvidence || undefined,
    includeActionPlan: input.includeActionPlan !== false,
  };
};

export const extractJsonText = (rawText: string | undefined): string => {
  if (!rawText) return '{}';
  const trimmed = String(rawText).trim();

  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fencedMatch && fencedMatch[1]) return fencedMatch[1].trim();

  const firstBrace = trimmed.indexOf('{');
  const lastBrace = trimmed.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }

  return trimmed;
};

export const clampMark = (value: unknown): number => {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.round(Math.min(100, Math.max(0, n)));
};

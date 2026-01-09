
export enum Sentiment {
  POSITIVE = 'Positive',
  NEUTRAL = 'Neutral',
  NEGATIVE = 'Negative'
}

export enum Gender {
  MALE = 'Male',
  FEMALE = 'Female',
  NEUTRAL = 'Non-binary/Neutral'
}

export enum ReportTone {
  FORMAL = 'Formal',
  FRIENDLY = 'Friendly',
  ACADEMIC = 'Academic',
  NURTURING = 'NURTURING'
}

export enum ReportLength {
  SHORT = 'Short',
  MEDIUM = 'Medium',
  LONG = 'Long'
}

export enum YearGroup {
  NURSERY = 'Nursery',
  RECEPTION = 'Reception',
  YEAR_1 = 'Year 1',
  YEAR_2 = 'Year 2',
  YEAR_3 = 'Year 3',
  YEAR_4 = 'Year 4',
  YEAR_5 = 'Year 5',
  YEAR_6 = 'Year 6',
  YEAR_7 = 'Year 7',
  YEAR_8 = 'Year 8',
  YEAR_9 = 'Year 9',
  YEAR_10 = 'Year 10',
  YEAR_11 = 'Year 11',
  YEAR_12 = 'Year 12',
  YEAR_13 = 'Year 13'
}

export enum Curriculum {
  UK_NATIONAL = 'UK National',
  US_COMMON_CORE = 'Common Core',
  IB_PYP = 'IB PYP',
  GENERAL = 'General'
}

export interface StudentInput {
  name: string;
  year: YearGroup;
  gradeLevel?: string; // e.g. "3B" or "Red Class"
  gender: Gender;
  sentiment: Sentiment;
  subject: string;
  details: string;
  tone: ReportTone;
  length: ReportLength;
  curriculum: Curriculum;
  language: string;
  targetMark?: number;
  imageEvidence?: string; // base64 (work analysis)
  studentPhoto?: string;  // base64 (profile photo)
}

export interface GeneratedReport {
  id: string;
  studentName: string;
  year: YearGroup;
  gradeLevel?: string;
  subject: string;
  mark: number;
  reportText: string;
  actionPlan: string[];
  tone: ReportTone;
  curriculum: Curriculum;
  timestamp: number;
  language: string;
  studentPhoto?: string;
}

import { useState } from 'react';
import type { GeneratedReport, StudentInput } from '../types';
import {
  generateStudentReport,
  ReportGenerationError,
  type ReportResponse,
} from '../services/geminiService';
import { runWithConcurrency } from '../utils/concurrency';
import { clearFormDraft } from '../utils/formDraft';
import { getErrorMessage } from '../utils/errors';

// Students generated in parallel during bulk generation. Kept low to stay well
// within Gemini rate limits; the server-side quota transaction handles concurrency.
const BULK_CONCURRENCY = 3;

const OFFLINE_MESSAGE = "You're offline. Please connect to the internet.";

const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
};

/** Combines the form input and the AI response into a report to save. */
export const toGeneratedReport = (
  input: StudentInput,
  { mark, reportText, actionPlan }: ReportResponse
): GeneratedReport => ({
  id: generateUUID(),
  studentName: input.name,
  year: input.year,
  gradeLevel: input.gradeLevel,
  classGroup: input.classGroup,
  subject: input.subject,
  mark,
  reportText,
  actionPlan,
  tone: input.tone,
  curriculum: input.curriculum,
  timestamp: Date.now(),
  language: input.language,
  studentPhoto: input.studentPhoto,
});

export interface BulkProgress {
  current: number;
  total: number;
}

interface UseReportGenerationOptions {
  /** Persists a generated report; may throw. */
  addReport: (report: GeneratedReport) => Promise<void>;
  onError: (message: string | null) => void;
}

/** Single and bulk (CSV) report generation. Handlers never reject. */
export const useReportGeneration = ({ addReport, onError }: UseReportGenerationOptions) => {
  const [isLoading, setIsLoading] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<BulkProgress | null>(null);

  const handleGenerateReport = async (input: StudentInput) => {
    if (!navigator.onLine) return onError(OFFLINE_MESSAGE);
    setIsLoading(true);
    onError(null);
    try {
      await addReport(toGeneratedReport(input, await generateStudentReport(input)));
      // S7: clear draft after successful generation
      clearFormDraft();
    } catch (err) {
      onError(getErrorMessage(err, 'Something went wrong. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkGenerate = async (inputs: StudentInput[]) => {
    if (!navigator.onLine) return onError(OFFLINE_MESSAGE);
    setIsLoading(true);
    onError(null);
    setBulkProgress({ current: 0, total: inputs.length });

    let completed = 0;
    let quotaReached = false;
    const failedNames: string[] = [];

    await runWithConcurrency(
      inputs,
      BULK_CONCURRENCY,
      async (input) => {
        try {
          // Saved as each one completes, so a closed tab doesn't lose
          // already-generated (and already-counted) reports.
          await addReport(toGeneratedReport(input, await generateStudentReport(input)));
        } catch (err) {
          console.error(`Failed for ${input.name}:`, err);
          failedNames.push(input.name);
          if (err instanceof ReportGenerationError && err.status === 429) quotaReached = true;
        } finally {
          completed++;
          setBulkProgress({ current: completed, total: inputs.length });
        }
      },
      // No point sending the rest once the monthly limit is reached.
      () => quotaReached
    );

    setBulkProgress(null);
    setIsLoading(false);

    const notStarted = inputs.length - completed;
    const succeeded = completed - failedNames.length;
    if (quotaReached) {
      onError(
        `Monthly report limit reached: ${succeeded} of ${inputs.length} reports were generated. ` +
          `${failedNames.length + notStarted} students still need reports.`
      );
    } else if (failedNames.length > 0) {
      onError(
        `Batch complete: ${succeeded}/${inputs.length} generated. ` +
          `Failed: ${failedNames.join(', ')}. Try regenerating those students individually.`
      );
    }
  };

  return { isLoading, bulkProgress, handleGenerateReport, handleBulkGenerate };
};

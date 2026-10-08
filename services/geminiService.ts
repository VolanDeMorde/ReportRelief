import { StudentInput } from '../types';
import { auth } from '../firebase';

/** A failed generation request; `status` is the HTTP status (e.g. 429 = monthly limit reached). */
export class ReportGenerationError extends Error {
  constructor(
    message: string,
    readonly status?: number
  ) {
    super(message);
    this.name = 'ReportGenerationError';
  }
}

const NETWORK_ERROR_MESSAGE =
  "We're having trouble generating this report right now. Please check your internet connection and try again in a moment.";

export type ReportResponse = { mark: number; reportText: string; actionPlan: string[] };

const getFunctionUrl = (): string => {
  const url = import.meta.env.VITE_FUNCTION_URL;
  if (!url) {
    throw new Error('Missing VITE_FUNCTION_URL. Set it to your Firebase function URL.');
  }
  return url;
};

// In-memory cache key for identical requests. Must include EVERY field that
// changes the output (gender, includeActionPlan, ...), otherwise a changed input
// returns a stale report. Photos are excluded (they don't affect the text).
const computeInputHash = (input: StudentInput): string => {
  const { studentPhoto: _photo, imageEvidence: _evidence, ...rest } = input;
  return JSON.stringify(rest);
};

const reportCache = new Map<string, ReportResponse>();

export const generateStudentReport = async (input: StudentInput): Promise<ReportResponse> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new ReportGenerationError('Please sign in to generate reports.', 401);
    }

    // 1. Check local session cache to save duplicate API calls & expenses
    const cacheKey = computeInputHash(input);
    const cached = input.imageEvidence ? undefined : reportCache.get(cacheKey);
    if (cached) return cached;

    const token = await user.getIdToken();
    const response = await fetch(getFunctionUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const errorBody = (await response.json().catch(() => ({}))) as {
        error?: string;
        message?: string;
      };
      const message =
        errorBody.error || errorBody.message || `Report generation failed (${response.status}).`;
      throw new ReportGenerationError(message, response.status);
    }

    const result = (await response.json()) as ReportResponse;

    // Store in cache for future identical requests
    if (!input.imageEvidence && result) {
      reportCache.set(cacheKey, result);
    }

    return result;
  } catch (error) {
    console.error('Gemini Error:', error);
    // Server responses and our own checks already carry user-facing messages.
    if (error instanceof ReportGenerationError) throw error;
    // Anything else (e.g. fetch's "Failed to fetch") isn't meant for teachers.
    throw new ReportGenerationError(NETWORK_ERROR_MESSAGE);
  }
};

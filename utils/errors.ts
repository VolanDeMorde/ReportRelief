/** Helpers for working with `unknown` values caught in `catch` blocks. */

/** The error's message if it has a non-empty one, otherwise `fallback`. */
export const getErrorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error && error.message ? error.message : fallback;

/** Firebase-style `code` property (e.g. "auth/popup-blocked"), or '' if absent. */
export const getErrorCode = (error: unknown): string =>
  typeof error === 'object' && error !== null && 'code' in error
    ? String((error as { code: unknown }).code)
    : '';

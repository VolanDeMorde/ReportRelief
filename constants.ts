/**
 * Plan limits, mirrored from functions/src/index.ts for display only.
 * The Cloud Function is the source of truth and enforces them.
 */
export const FREE_TIER_LIMIT = 10;
export const PAID_TIER_LIMIT = 500;
/** Usage counters reset this long after the first generation in a window. */
export const USAGE_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

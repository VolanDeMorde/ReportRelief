/**
 * S7: Unsent report-form draft, kept in sessionStorage so it survives navigating
 * between pages (and reloads) within the tab, but not closing the tab.
 * Images are never stored (they can exceed the storage quota).
 */
import type { StudentInput } from '../types';

const DRAFT_KEY = 'rr-form-draft';

export const loadFormDraft = (): Partial<StudentInput> | null => {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === 'object' ? (parsed as Partial<StudentInput>) : null;
  } catch {
    return null;
  }
};

export const saveFormDraft = (draft: StudentInput): void => {
  const { imageEvidence: _evidence, studentPhoto: _photo, ...rest } = draft;
  try {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(rest));
  } catch {
    /* storage full or blocked — drafts are best-effort */
  }
};

export const clearFormDraft = (): void => {
  try {
    sessionStorage.removeItem(DRAFT_KEY);
  } catch {
    /* storage blocked */
  }
};

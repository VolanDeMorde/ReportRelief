import { reauthenticateWithPopup, signOut } from 'firebase/auth';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app, auth, provider } from '../firebase';
import { getErrorCode, getErrorMessage } from '../utils/errors';
import { clearFormDraft } from '../utils/formDraft';

/** Thrown when the user closes the Google re-authentication popup. */
export class DeletionCancelledError extends Error {
  constructor() {
    super('Account deletion was cancelled.');
    this.name = 'DeletionCancelledError';
  }
}

// App data kept in this browser that belongs to the account holder. Display
// preferences (dark mode, analytics choice, dismissed banners) are left alone.
const PERSONAL_STORAGE_KEYS = ['rb-reports', 'rr_form_presets'];
const PERSONAL_STORAGE_PREFIXES = ['rb-reports-migrated-'];

const clearLocalPersonalData = (): void => {
  try {
    for (const key of PERSONAL_STORAGE_KEYS) localStorage.removeItem(key);
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && PERSONAL_STORAGE_PREFIXES.some((prefix) => key.startsWith(prefix))) {
        localStorage.removeItem(key);
      }
    }
  } catch {
    /* storage blocked */
  }
  clearFormDraft();
};

/**
 * Permanently deletes the signed-in user's account and all their data.
 *
 * 1. Re-authenticates with Google (the server requires a sign-in in the last 5 minutes).
 * 2. Calls the `deleteAccount` Cloud Function, which deletes Firestore data and the Auth user.
 * 3. Clears this browser's copies of the user's data and signs out.
 *
 * Server refusals (e.g. an active subscription) are thrown with a user-facing message.
 */
export const deleteAccount = async (): Promise<void> => {
  const user = auth.currentUser;
  if (!user) throw new Error('You must be signed in to delete your account.');

  try {
    await reauthenticateWithPopup(user, provider);
  } catch (error) {
    const code = getErrorCode(error);
    if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
      throw new DeletionCancelledError();
    }
    if (code === 'auth/user-mismatch') {
      throw new Error('Please confirm with the same Google account you are signed in with.', {
        cause: error,
      });
    }
    throw new Error(getErrorMessage(error, 'Could not confirm your identity. Please try again.'), {
      cause: error,
    });
  }

  // Make sure the callable sends a token carrying the fresh sign-in time.
  await user.getIdToken(true);

  try {
    await httpsCallable(getFunctions(app), 'deleteAccount')();
  } catch (error) {
    // HttpsError messages from deleteAccount are written for end users; 'internal'
    // means an unexpected server error whose message isn't meant for display.
    const message =
      getErrorCode(error) === 'functions/internal'
        ? 'Account deletion failed. Please try again.'
        : getErrorMessage(error, 'Account deletion failed. Please try again.');
    throw new Error(message, { cause: error });
  }

  clearLocalPersonalData();
  // The Auth user no longer exists; this just clears the local session.
  await signOut(auth).catch(() => undefined);
};

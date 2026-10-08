import { signInWithPopup, onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth, db, provider, doc, setDoc } from '../firebase';
import { getErrorCode, getErrorMessage } from '../utils/errors';

let pendingLogin: Promise<User> | null = null;

/**
 * Save user profile to Firestore.
 * Only writes client-owned profile fields (email, displayName, lastLogin).
 * Tier, usage counters and Stripe fields are server-managed (see firestore.rules);
 * a missing tier is treated as 'free' by the Cloud Function and the UI.
 */
export const saveUserProfile = async (user: User): Promise<void> => {
  try {
    await setDoc(
      doc(db, 'users', user.uid),
      {
        email: user.email,
        displayName: user.displayName || 'Teacher',
        lastLogin: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error('Failed to save user profile:', error);
    throw new Error('Could not save user profile to database.', { cause: error });
  }
};

/**
 * Handle Google sign-in: authenticate and save profile
 */
export const loginWithGoogle = async (): Promise<User> => {
  if (pendingLogin) return pendingLogin;

  pendingLogin = (async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Sign-in already succeeded; a profile write failure must not surface as "Login failed".
      await saveUserProfile(user).catch(() => {});
      return user;
    } catch (error) {
      const code = getErrorCode(error);
      console.error('Login failed:', getErrorMessage(error, code));

      if (code === 'auth/cancelled-popup-request' || code === 'auth/popup-closed-by-user') {
        throw error;
      }

      if (code === 'auth/popup-blocked') {
        throw new Error('Popup blocked by browser. Please allow popups and try again.', {
          cause: error,
        });
      }

      if (code === 'auth/unauthorized-domain') {
        throw new Error('This domain is not authorized for Firebase login.', { cause: error });
      }

      throw new Error('Login failed. Please try again.', { cause: error });
    } finally {
      pendingLogin = null;
    }
  })();

  return pendingLogin;
};

/**
 * Handle Google sign-out
 */
export const logoutUser = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Logout failed:', error);
    throw new Error('Logout failed. Please try again.', { cause: error });
  }
};

/**
 * Listen for auth state changes (login/logout)
 */
export const subscribeToAuthState = (callback: (user: User | null) => void): (() => void) => {
  return onAuthStateChanged(auth, (user) => {
    callback(user);
  });
};

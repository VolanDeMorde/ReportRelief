import { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { loginWithGoogle, logoutUser, subscribeToAuthState } from '../services/authService';
import { createPortalLink } from '../services/portalService';
import { getErrorCode, getErrorMessage } from '../utils/errors';
import { clearFormDraft } from '../utils/formDraft';
import { USAGE_WINDOW_MS } from '../constants';

export type UserTier = 'free' | 'paid';

/**
 * Generations used in the current window. The server only resets the stored
 * counter on the next generation, so a window that has already expired counts as 0.
 */
export const effectiveGenerationCount = (
  count: number | undefined,
  lastResetDate: number | undefined,
  now: number = Date.now()
): number | null => {
  if (count === undefined) return null;
  if (!lastResetDate || now - lastResetDate >= USAGE_WINDOW_MS) return 0;
  return count;
};

/** Signed-in user, plan/usage, and sign-in/out + billing portal actions. */
export const useAccount = ({ onError }: { onError: (message: string) => void }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [userTier, setUserTier] = useState<UserTier>('free');
  // S4: free-tier usage tracking
  const [generationCount, setGenerationCount] = useState<number | null>(null);

  useEffect(
    () =>
      subscribeToAuthState((user) => {
        setCurrentUser(user);
        setIsAuthLoading(false);
      }),
    []
  );

  // Plan + usage from users/{uid} (written only by Cloud Functions)
  useEffect(() => {
    if (!currentUser) {
      setUserTier('free');
      setGenerationCount(null);
      return;
    }
    return onSnapshot(doc(db, 'users', currentUser.uid), (snap) => {
      const data = snap.data() as
        { tier?: string; generation_count?: number; last_reset_date?: number } | undefined;
      setUserTier(data?.tier === 'paid' ? 'paid' : 'free');
      setGenerationCount(effectiveGenerationCount(data?.generation_count, data?.last_reset_date));
    });
  }, [currentUser]);

  const handleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (err) {
      const code = getErrorCode(err);
      if (code === 'auth/cancelled-popup-request' || code === 'auth/popup-closed-by-user') return;
      onError(getErrorMessage(err, 'Login failed'));
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      clearFormDraft();
    } catch (err) {
      onError(getErrorMessage(err, 'Logout failed'));
    }
  };

  const handleManageSubscription = async () => {
    try {
      await createPortalLink();
    } catch (err) {
      onError(getErrorMessage(err, 'Failed to open subscription portal'));
    }
  };

  return {
    currentUser,
    isAuthLoading,
    userTier,
    generationCount,
    handleLogin,
    handleLogout,
    handleManageSubscription,
  };
};

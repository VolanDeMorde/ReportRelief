import { addDoc, collection, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase';

const STRIPE_CUSTOMERS_COLLECTION = 'users';
const CHECKOUT_TIMEOUT_MS = 30_000;

/**
 * Create a Stripe Checkout Session via the Firebase Extension.
 * Writes to users/{uid}/checkout_sessions and waits for the Stripe extension
 * to populate a redirect URL (or error).
 *
 * The onSnapshot listener is always cleaned up — either when the URL arrives,
 * when an error occurs, or after a 30-second timeout (V4 fix).
 *
 * Throws an Error on failure so callers can surface it via UI, not alert() (V5 fix).
 */
export const startCheckout = async (priceId: string): Promise<void> => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('You must be signed in to subscribe.');
  }

  if (!priceId || !priceId.startsWith('price_')) {
    throw new Error('Invalid Stripe Price ID. Expected a value starting with "price_".');
  }

  const docRef = await addDoc(
    collection(db, STRIPE_CUSTOMERS_COLLECTION, user.uid, 'checkout_sessions'),
    {
      price: priceId,
      success_url: window.location.origin,
      cancel_url: window.location.origin,
    }
  );

  return new Promise<void>((resolve, reject) => {
    // Guard: clean up if Stripe extension never responds
    const timeoutId = setTimeout(() => {
      unsubscribe();
      reject(new Error('Checkout session timed out. Please try again.'));
    }, CHECKOUT_TIMEOUT_MS);

    const unsubscribe = onSnapshot(
      docRef,
      (snap) => {
        const data = snap.data();
        if (!data) return;

        const { url, error } = data as { url?: string; error?: { message?: string } };

        if (error?.message) {
          clearTimeout(timeoutId);
          unsubscribe();
          reject(new Error('Checkout failed: ' + error.message));
          return;
        }

        if (url) {
          clearTimeout(timeoutId);
          unsubscribe();
          resolve();
          window.location.assign(url);
        }
      },
      (err) => {
        clearTimeout(timeoutId);
        reject(err);
      }
    );
  });
};

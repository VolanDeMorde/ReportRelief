import { getFunctions, httpsCallable } from 'firebase/functions';
import { app, auth } from '../firebase';
import { getErrorMessage } from '../utils/errors';

// Region of the firestore-stripe-payments extension (LOCATION in extensions/*.env)
const STRIPE_EXTENSION_REGION = 'europe-west1';

/**
 * Create a Stripe Customer Portal link via the Firebase Extension.
 * User can cancel, update payment methods, view invoices, etc.
 */
export const createPortalLink = async (): Promise<void> => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('You must be signed in to manage your subscription.');
  }

  try {
    const functionRef = httpsCallable(
      getFunctions(app, STRIPE_EXTENSION_REGION),
      'ext-firestore-stripe-payments-createPortalLink'
    );
    const { data } = await functionRef({
      returnUrl: window.location.origin,
      locale: 'auto',
    });

    const { url } = data as { url: string };

    if (!url) {
      throw new Error('No portal URL returned');
    }

    window.location.assign(url);
  } catch (error) {
    console.error('Portal link error:', error);
    throw new Error(getErrorMessage(error, 'Failed to create portal link'), { cause: error });
  }
};

/** Pure helpers for Stripe subscription documents mirrored by the Stripe extension. */

export interface SubscriptionDoc {
  status?: string;
  cancel_at_period_end?: boolean;
}

/** Statuses that grant Pro access. */
export const isPaidStatus = (status: string | undefined): boolean =>
  status === 'active' || status === 'trialing';

/** Statuses under which Stripe will still try to charge the customer. */
const BILLABLE_STATUSES = new Set(['active', 'trialing', 'past_due', 'unpaid', 'incomplete']);

/**
 * Returns the first subscription that would keep billing after the account is
 * deleted (i.e. not already set to cancel at the end of the period), or undefined.
 * Account deletion is refused while one exists: we can't cancel it ourselves
 * (the extension is configured not to delete Stripe customers), and deleting the
 * account would leave the user paying with no way to manage the subscription.
 */
export const findBlockingSubscription = (subs: SubscriptionDoc[]): SubscriptionDoc | undefined =>
  subs.find((s) => BILLABLE_STATUSES.has(s.status ?? '') && s.cancel_at_period_end !== true);

/** Tier/status derived from all of a user's subscriptions. */
export const deriveTier = (
  statuses: Array<string | undefined>,
  fallbackStatus: string | undefined
): { tier: 'paid' | 'free'; subscriptionStatus: string; isSubscribed: boolean } => {
  const paidStatus = statuses.find(isPaidStatus);
  return paidStatus
    ? { tier: 'paid', subscriptionStatus: paidStatus, isSubscribed: true }
    : { tier: 'free', subscriptionStatus: fallbackStatus ?? 'free', isSubscribed: false };
};

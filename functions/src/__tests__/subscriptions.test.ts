import { describe, it, expect } from 'vitest';
import { deriveTier, findBlockingSubscription, isPaidStatus } from '../subscriptions';

describe('isPaidStatus', () => {
  it.each([
    ['active', true],
    ['trialing', true],
    ['past_due', false],
    ['canceled', false],
    [undefined, false],
  ])('%s → %s', (status, expected) => {
    expect(isPaidStatus(status)).toBe(expected);
  });
});

describe('findBlockingSubscription', () => {
  it('allows deletion with no subscriptions', () => {
    expect(findBlockingSubscription([])).toBeUndefined();
  });

  it('allows deletion when every subscription is ended or set to cancel', () => {
    expect(
      findBlockingSubscription([
        { status: 'canceled' },
        { status: 'active', cancel_at_period_end: true },
      ])
    ).toBeUndefined();
  });

  it.each(['active', 'trialing', 'past_due', 'unpaid', 'incomplete'])(
    'blocks deletion for a renewing %s subscription',
    (status) => {
      expect(findBlockingSubscription([{ status }])).toEqual({ status });
    }
  );
});

describe('deriveTier', () => {
  it('is paid if any subscription is active, even if the latest event is a cancellation', () => {
    expect(deriveTier(['canceled', 'active'], 'canceled')).toEqual({
      tier: 'paid',
      subscriptionStatus: 'active',
      isSubscribed: true,
    });
  });

  it('is free otherwise, reporting the latest status', () => {
    expect(deriveTier(['canceled'], 'canceled')).toEqual({
      tier: 'free',
      subscriptionStatus: 'canceled',
      isSubscribed: false,
    });
    expect(deriveTier([], undefined).subscriptionStatus).toBe('free');
  });
});

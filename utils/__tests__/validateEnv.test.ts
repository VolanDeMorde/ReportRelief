/**
 * S19: Tests for utils/validateEnv.ts
 *
 * Exercises the real module: vi.stubEnv patches import.meta.env per test.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { validateEnv } from '../validateEnv';

const REQUIRED_KEYS = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
  'VITE_FUNCTION_URL',
  'VITE_STRIPE_PRICE_MONTHLY',
  'VITE_STRIPE_PRICE_YEARLY',
];

/** Sets every required key, then applies overrides, in dev or prod mode. */
const stubEnv = (overrides: Record<string, string> = {}, isDev = true) => {
  for (const key of REQUIRED_KEYS) vi.stubEnv(key, 'test-value');
  for (const [key, value] of Object.entries(overrides)) vi.stubEnv(key, value);
  vi.stubEnv('DEV', isDev);
};

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('validateEnv', () => {
  it('passes when all required variables are set (dev)', () => {
    stubEnv();
    expect(() => validateEnv()).not.toThrow();
  });

  it('does not warn when all variables are set (prod)', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    stubEnv({}, false);
    validateEnv();
    expect(warn).not.toHaveBeenCalled();
  });

  it.each(REQUIRED_KEYS)('throws in dev when %s is missing', (key) => {
    stubEnv({ [key]: '' });
    expect(() => validateEnv()).toThrow(key);
  });

  it('treats whitespace-only values as missing', () => {
    stubEnv({ VITE_FIREBASE_APP_ID: '   ' });
    expect(() => validateEnv()).toThrow('VITE_FIREBASE_APP_ID');
  });

  it('lists every missing key in a single error', () => {
    stubEnv({ VITE_FIREBASE_API_KEY: '', VITE_FUNCTION_URL: '' });
    expect(() => validateEnv()).toThrow(/VITE_FIREBASE_API_KEY[\s\S]*VITE_FUNCTION_URL/);
  });

  it('warns instead of throwing in production', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    stubEnv({ VITE_FIREBASE_PROJECT_ID: '' }, false);
    expect(() => validateEnv()).not.toThrow();
    expect(warn).toHaveBeenCalledOnce();
    expect(warn.mock.calls[0]?.[0]).toContain('VITE_FIREBASE_PROJECT_ID');
  });

  it('does not require the unused Stripe publishable key', () => {
    stubEnv();
    vi.stubEnv('VITE_STRIPE_PUBLISHABLE_KEY', '');
    expect(() => validateEnv()).not.toThrow();
  });
});

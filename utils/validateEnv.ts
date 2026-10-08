/**
 * S18: Environment variable validation
 *
 * Validates all required VITE_ environment variables at startup.
 * Throws a descriptive error in development; logs a warning in production.
 * Call this once at the top of main.tsx / index.tsx before mounting React.
 */

interface EnvVar {
  key: string;
  /** Brief description for the error message */
  description: string;
}

const REQUIRED_ENV_VARS: EnvVar[] = [
  { key: 'VITE_FIREBASE_API_KEY', description: 'Firebase API key' },
  { key: 'VITE_FIREBASE_AUTH_DOMAIN', description: 'Firebase auth domain' },
  { key: 'VITE_FIREBASE_PROJECT_ID', description: 'Firebase project ID' },
  { key: 'VITE_FIREBASE_STORAGE_BUCKET', description: 'Firebase storage bucket' },
  { key: 'VITE_FIREBASE_MESSAGING_SENDER_ID', description: 'Firebase messaging sender ID' },
  { key: 'VITE_FIREBASE_APP_ID', description: 'Firebase app ID' },
  { key: 'VITE_FUNCTION_URL', description: 'generateReport Cloud Function URL' },
  { key: 'VITE_STRIPE_PRICE_MONTHLY', description: 'Stripe monthly price ID (price_...)' },
  { key: 'VITE_STRIPE_PRICE_YEARLY', description: 'Stripe yearly price ID (price_...)' },
];

export const validateEnv = (): void => {
  const missing: string[] = [];

  for (const { key, description } of REQUIRED_ENV_VARS) {
    const value = import.meta.env[key];
    if (!value || value.trim() === '') {
      missing.push(`  • ${key} — ${description}`);
    }
  }

  if (missing.length === 0) return;

  const message =
    `[ReportRelief] Missing required environment variables:\n${missing.join('\n')}\n\n` +
    `Create a .env file in the project root and add the missing variables.\n` +
    `See .env.example for reference.`;

  if (import.meta.env.DEV) {
    // Hard error in development so the developer sees it immediately
    throw new Error(message);
  } else {
    // Soft warning in production (app may partially function)
    console.warn(message);
  }
};

import { defineConfig } from 'vitest/config';

// Own config so Vitest doesn't pick up the web app's vite.config.ts (jsdom, setup files).
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/__tests__/**/*.test.ts'],
  },
});

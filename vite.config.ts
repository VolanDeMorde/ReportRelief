/// <reference types="vitest/config" />
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react()],
    define: {},
    css: {
      postcss: './postcss.config.js',
    },
    build: {
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'react-dom/client'],
            'vendor-parser': ['papaparse'],
            'vendor-firebase': [
              'firebase/app',
              'firebase/auth',
              'firebase/firestore',
              'firebase/functions',
            ],
          },
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    // S19: Vitest configuration
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      include: ['**/__tests__/**/*.test.{ts,tsx}', '**/*.test.{ts,tsx}'],
      exclude: ['node_modules', 'dist', 'functions'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'html'],
        include: ['utils/**', 'services/**', 'hooks/**'],
        exclude: ['**/*.test.ts', 'src/test/**'],
      },
    },
  };
});

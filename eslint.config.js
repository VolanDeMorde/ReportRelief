import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

export default tseslint.config(
  {
    ignores: [
      'dist/',
      'node_modules/',
      'backups/',
      'coverage/',
      '.venv/',
      '**/*.config.*',
      'public/sw.js',
      'functions/lib/',
      'functions/node_modules/',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx,js}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.browser },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      // Catch common bugs
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'no-console': ['warn', { allow: ['warn', 'error'] }],

      // React-specific
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
  {
    // Cloud Functions (Node)
    files: ['functions/src/**/*.ts'],
    languageOptions: { globals: { ...globals.node } },
  },
  {
    // Type-aware promise checks: every promise must be awaited, returned, or
    // explicitly handled (catch / `void`). Async JSX handlers are allowed because
    // the handlers themselves catch and report their errors.
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.json', './functions/tsconfig.check.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': [
        'error',
        { checksVoidReturn: { attributes: false } },
      ],
    },
  },
  {
    // Test files and Node scripts
    files: ['**/__tests__/**', 'src/test/**', 'scripts/**'],
    languageOptions: { globals: { ...globals.node } },
    rules: { '@typescript-eslint/no-explicit-any': 'off', 'no-console': 'off' },
  }
);

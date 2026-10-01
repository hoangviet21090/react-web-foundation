import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import hooks from 'eslint-plugin-react-hooks';
import refresh from 'eslint-plugin-react-refresh';
import prettier from 'eslint-config-prettier';
import { navigationConventions } from './scripts/eslint-rules/navigation.mjs';

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'coverage/**',
      'node_modules/**',
      'playwright-report/**',
      'test-results/**',
    ],
  },
  {
    files: ['**/*.{js,mjs}'],
    ...js.configs.recommended,
    languageOptions: { globals: globals.node },
  },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: { 'react-hooks': hooks, 'react-refresh': refresh },
    rules: {
      ...hooks.configs.recommended.rules,
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      '@typescript-eslint/no-misused-promises': [
        'error',
        { checksVoidReturn: { attributes: false } },
      ],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-console': ['error', { allow: ['warn', 'error'] }],
      'react-refresh/only-export-components': [
        'error',
        {
          allowConstantExport: true,
          allowExportNames: ['buttonVariants', 'badgeVariants'],
        },
      ],
    },
  },
  {
    files: ['src/**/*.test.{ts,tsx}', 'tests/**'],
    languageOptions: {
      parserOptions: { projectService: false, project: './tsconfig.test.json' },
    },
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/unbound-method': 'off',
    },
  },
  {
    files: ['src/**/domain/**/*.{ts,tsx}', 'src/**/application/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-globals': [
        'error',
        'fetch',
        'window',
        'document',
        'localStorage',
        'sessionStorage',
        'navigator',
      ],
    },
  },
  {
    files: ['src/app/**/*.{ts,tsx}', 'src/features/*/presentation/**/*.{ts,tsx}'],
    ignores: ['src/app/routing/routes.ts'],
    ...navigationConventions,
  },
  prettier,
);

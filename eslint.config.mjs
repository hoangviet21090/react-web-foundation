import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import hooks from 'eslint-plugin-react-hooks';
import refresh from 'eslint-plugin-react-refresh';
import prettier from 'eslint-config-prettier';

const outerLayers =
  '(?:components|pages|layouts|routes|hooks|store|services|config|providers|contexts|mocks|utils|constants|schemas|locales|types)';
const externalImport = '^(?:[^.@/]|@(?!/))';
const outerImport = '(?:^@/|^(?:\\./|\\.\\./)+)' + outerLayers + '(?:/|$)';
const coreGlobals = ['fetch', 'window', 'document', 'localStorage', 'sessionStorage', 'navigator'];

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
    languageOptions: { parserOptions: { projectService: false, project: './tsconfig.test.json' } },
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/unbound-method': 'off',
    },
  },
  {
    files: ['src/entities/**/*.ts', 'src/usecases/**/*.ts'],
    rules: {
      'no-restricted-globals': ['error', ...coreGlobals],
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              regex: externalImport,
              message:
                'Entities and use cases use plain TypeScript; framework code belongs in the outer layers.',
            },
            {
              regex: outerImport,
              message:
                'Keep entities and use cases independent of UI, store and concrete services. Pass service capabilities into use cases.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/entities/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { regex: externalImport, message: 'Entities use plain TypeScript.' },
            {
              regex: outerImport,
              message: 'Entities must not import UI, services or application configuration.',
            },
            {
              regex: '(?:^@/|^(?:\\./|\\.\\./)+)usecases(?:/|$)',
              message: 'Entities do not depend on use cases.',
            },
          ],
        },
      ],
    },
  },
  prettier,
);

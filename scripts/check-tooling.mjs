import ts from 'typescript';
import { checkSourceArchitecture } from './architecture-rules.mjs';
import { virtualCompilerHost } from './virtual-source.mjs';
import { namingViolations } from './naming-rules.mjs';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { Linter } from 'eslint';
import { navigationConventions } from './eslint-rules/navigation.mjs';
const cli = path.resolve('node_modules/@commitlint/cli/cli.js');
const run = (message) => spawnSync(process.execPath, [cli], { input: message, encoding: 'utf8' });
assert.equal(
  run('chore: bootstrap web foundation\n').status,
  0,
  'Valid conventional commit must pass.',
);
assert.notEqual(
  run('Invalid commit without type\n').status,
  0,
  'Invalid conventional commit must fail.',
);
assert.ok(
  fs.existsSync('.husky/pre-commit') &&
    fs.existsSync('.husky/commit-msg') &&
    fs.existsSync('.husky/pre-push'),
);
console.info('Commit convention and hook files verified.');

const navigationLinter = new Linter();
const navigationConfig = {
  ...navigationConventions,
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
};
for (const code of [
  'const link = <Link to="/projects" />;',
  "const link = <Navigate to={'/login'} />;",
  "navigate('/projects');",
  "redirect('/login');",
  "router.navigate('/projects');",
  "window.location.assign('/projects');",
  "const route = { path: '/projects' };",
  "navigate({ pathname: '/projects' });",
  'navigate(' +
    String.fromCharCode(96) +
    '/projects/' +
    '$' +
    '{id}' +
    String.fromCharCode(96) +
    ');',
]) {
  const messages = navigationLinter.verify(code, navigationConfig);
  assert.ok(
    messages.some((message) => message.ruleId === 'no-restricted-syntax'),
    'Must reject hardcoded navigation: ' + code,
  );
  assert.ok(
    messages.every((message) => !message.fatal),
    'Lint selector must parse.',
  );
}
for (const code of [
  'const link = <Link to={APP_ROUTES.projects.path} />;',
  'const link = <Link to={backHref} />;',
  'const link = <a href="#content" />;',
  'const link = <a href="https://example.test/docs" />;',
  'navigate(projectsHref({ page: 2 }));',
  "const route = { path: '*', children: [] };",
])
  assert.deepEqual(navigationLinter.verify(code, navigationConfig), []);
console.info('Navigation convention positive/negative checks verified.');

for (const [file, source] of [
  ['src/shared/hooks/use-focus.ts', 'export function useFocus() {}'],
  ['src/app/store/store-hooks.ts', 'export const useAppSelector = bind();'],
  ['src/features/projects/domain/project.ts', 'export interface Project {}'],
  ['src/shared/infrastructure/http/response.ts', 'export interface ApiResponse<T> { result: T }'],
  ['src/shared/infrastructure/i18n/i18next.d.ts', ''],
  ['src/features/README.md', ''],
  ['src/shared/lib/format-money.test.ts', ''],
])
  assert.deepEqual(namingViolations(file, source), [], file);
for (const [file, source] of [
  ['src/shared/useFocus.ts', 'export function useFocus() {}'],
  ['src/Shared/hooks/use-focus.ts', 'export function useFocus() {}'],
  ['src/shared/hooks/helpers.ts', 'export function useFocus() {}'],
  ['src/shared/hooks/helpers.ts', 'export const useFocus = factory();'],
  ['src/shared/hooks/helpers.ts', "export { useFocus } from './use-focus';"],
  ['src/features/projects/domain/project.ts', 'export interface project_model {}'],
  ['src/features/projects/presentation/pages/projects-page.ts', ''],
])
  assert.ok(namingViolations(file, source).length > 0, file);
console.info('Naming positive/negative checks verified.');

const appConfiguration = ts.readConfigFile('tsconfig.app.json', ts.sys.readFile);
const compilerOptions = ts.parseJsonConfigFileContent(
  appConfiguration.config,
  ts.sys,
  process.cwd(),
).options;
const sourceRoot = path.resolve('src');
const architectureCases = [
  {
    source: 'features/sample/domain/sample.ts',
    code: 'export interface Sample { id: string }',
    valid: true,
  },
  {
    source: 'features/sample/application/read.ts',
    code: "import type { Sample } from '../domain/sample'; export type Read = () => Sample;",
    extra: { 'src/features/sample/domain/sample.ts': 'export interface Sample { id: string }' },
    valid: true,
  },
  {
    source: 'features/sample/domain/sample.ts',
    code: "import type { ReactNode } from 'react'; export type Sample = ReactNode;",
    problem: 'plain TypeScript',
  },
  {
    source: 'features/sample/domain/sample.d.ts',
    code: "import type { ReactNode } from 'react'; export type Sample = ReactNode;",
    problem: 'plain TypeScript',
  },
  {
    source: 'features/sample/services/service.ts',
    code: 'export const value = 1;',
    problem: 'Feature source must belong',
  },
  {
    source: 'shared/misc/helper.ts',
    code: 'export const value = 1;',
    problem: 'Shared source must belong',
  },
  {
    source: 'features/sample/presentation/page.ts',
    code: "import { hidden } from '../../../../tests/hidden'; export const value = hidden;",
    extra: { 'tests/hidden.ts': 'export const hidden = 1;' },
    problem: 'outside src',
  },
  {
    source: 'features/sample/presentation/page.ts',
    code: "export type Value = import('../../../../tests/hidden').Hidden;",
    extra: { 'tests/hidden.ts': 'export interface Hidden {}' },
    problem: 'outside src',
  },
  {
    source: 'features/sample/presentation/page.ts',
    code: "export { hidden } from '../../../../scripts/hidden';",
    extra: { 'scripts/hidden.ts': 'export const hidden = 1;' },
    problem: 'outside src',
  },
  {
    source: 'features/sample/presentation/page.ts',
    code: "import { value } from './hidden.test'; export const result = value;",
    extra: { 'src/features/sample/presentation/hidden.test.ts': 'export const value = 1;' },
    problem: 'import tests',
  },
  {
    source: 'features/sample/presentation/page.ts',
    code: "import { hidden } from '../infrastructure/adapter'; export const value = hidden;",
    extra: { 'src/features/sample/infrastructure/adapter.ts': 'export const hidden = 1;' },
    problem: 'concrete feature adapters',
  },
  {
    source: 'features/sample/infrastructure/adapter.ts',
    code: "import { hidden } from '../presentation/view'; export const value = hidden;",
    extra: { 'src/features/sample/presentation/view.ts': 'export const hidden = 1;' },
    problem: 'Infrastructure cannot import presentation',
  },
  {
    source: 'features/sample/presentation/page.ts',
    code: "import { hidden } from '../../other/domain/other'; export const value = hidden;",
    extra: { 'src/features/other/domain/other.ts': 'export const hidden = 1;' },
    problem: 'separate features',
  },
  {
    source: 'features/sample/presentation/page.ts',
    code: 'export const value = import(variable);',
    problem: 'Non-literal dynamic imports',
  },
  {
    source: 'features/sample/presentation/page.ts',
    code: "export { value } from './missing';",
    problem: 'could not be resolved',
  },
  {
    source: 'features/sample/domain/first.ts',
    code: "import { second } from './second'; export const first = second;",
    extra: {
      'src/features/sample/domain/second.ts':
        "import { first } from './first'; export const second = first;",
    },
    problem: 'Circular dependency',
  },
];
for (const scenario of architectureCases) {
  const file = path.resolve(sourceRoot, scenario.source);
  const sources = new Map([
    [file, scenario.code],
    ...Object.entries(scenario.extra ?? {}).map(([name, source]) => [path.resolve(name), source]),
  ]);
  const host = virtualCompilerHost(compilerOptions, sources);
  const result = checkSourceArchitecture({
    root: sourceRoot,
    files: [...sources.keys()].filter((file) => file.startsWith(sourceRoot + path.sep)),
    compilerOptions,
    host,
  });
  if (scenario.valid) assert.deepEqual(result.failures, [], scenario.source);
  else
    assert.ok(
      result.failures.some((failure) => failure.includes(scenario.problem)),
      scenario.source + ': ' + result.failures.join('\n'),
    );
}
console.info(
  'Architecture positive/negative checks verified: zones, layers, imports outside src, test/declaration/dynamic imports and cycles.',
);

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

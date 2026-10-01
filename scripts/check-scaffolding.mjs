import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import ts from 'typescript';
import { ESLint } from 'eslint';
import { featureFiles } from './feature-template.mjs';
import { namingViolations } from './naming-rules.mjs';
import { formattedFeatureFiles, createFeature } from './feature-scaffold.mjs';
import { virtualCompilerHost } from './virtual-source.mjs';
import { checkSourceArchitecture } from './architecture-rules.mjs';

for (const name of [
  '../escape',
  'auth/ports',
  '',
  'Invalid',
  'a--b',
  'a'.repeat(51),
  'con',
  'prn',
  'aux',
  'nul',
  'com1',
  'lpt9',
]) {
  assert.throws(() => featureFiles(name));
}
const configuration = ts.readConfigFile('tsconfig.app.json', ts.sys.readFile);
if (configuration.error) throw new Error('Cannot read app compiler configuration.');
const parsed = ts.parseJsonConfigFileContent(configuration.config, ts.sys, process.cwd());
assert.deepEqual(parsed.errors, []);
const diagnosticsText = (diagnostics) =>
  ts.formatDiagnosticsWithColorAndContext(diagnostics, {
    getCanonicalFileName: (file) => file,
    getCurrentDirectory: () => process.cwd(),
    getNewLine: () => '\n',
  });
for (const name of ['catalog', 'inventory-items']) {
  const files = await formattedFeatureFiles(name);
  const sources = new Map(
    Object.entries(files)
      .filter(([file]) => /\.tsx?$/.test(file))
      .map(([file, source]) => [path.resolve('src/features', name, file), source]),
  );
  assert.ok(Object.keys(files).some((file) => file.startsWith('application/ports/')));
  assert.ok(Object.keys(files).some((file) => file.startsWith('infrastructure/mappers/')));
  for (const [file, source] of Object.entries(files)) {
    assert.deepEqual(namingViolations('src/features/' + name + '/' + file, source), [], file);
  }
  const host = virtualCompilerHost(parsed.options, sources);
  const program = ts.createProgram([...parsed.fileNames, ...sources.keys()], parsed.options, host);
  const diagnostics = ts.getPreEmitDiagnostics(program);
  assert.equal(diagnostics.length, 0, diagnosticsText(diagnostics));
  const architecture = checkSourceArchitecture({
    root: path.resolve('src'),
    files: [...sources.keys()],
    compilerOptions: parsed.options,
    host,
  });
  assert.deepEqual(architecture.failures, []);
  const linter = new ESLint({
    overrideConfig: [
      {
        files: ['**/*.{ts,tsx}'],
        languageOptions: {
          parserOptions: { projectService: false, project: false, programs: [program] },
        },
      },
    ],
  });
  for (const [file, source] of sources) {
    const results = await linter.lintText(source, { filePath: file });
    assert.ok(
      results.every((result) => result.errorCount === 0 && result.warningCount === 0),
      results
        .flatMap((result) => result.messages.map((message) => file + ': ' + message.message))
        .join('\n'),
    );
  }
  const coreSources = [...sources.keys()].filter((file) =>
    /[\\/](?:domain|application)[\\/]/.test(file),
  );
  const coreOptions = { ...parsed.options, lib: ['lib.es2022.d.ts'], types: [] };
  const coreProgram = ts.createProgram(
    coreSources,
    coreOptions,
    virtualCompilerHost(coreOptions, sources),
  );
  const coreDiagnostics = ts.getPreEmitDiagnostics(coreProgram);
  assert.equal(coreDiagnostics.length, 0, diagnosticsText(coreDiagnostics));
}

// Exercise actual writes outside production source, including failure rollback and exclusive destinations.
const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'foundation-scaffolding-'));
try {
  const root = path.join(temporaryRoot, 'features');
  const stagingRoot = path.join(temporaryRoot, 'staging');
  fs.mkdirSync(root);
  await createFeature('catalog', { root, stagingRoot, dryRun: true });
  assert.deepEqual(fs.readdirSync(root), []);
  let copies = 0;
  await assert.rejects(
    createFeature('catalog', {
      root,
      stagingRoot,
      copyFile: (...args) => {
        if (++copies === 3) throw new Error('Injected filesystem failure');
        fs.copyFileSync(...args);
      },
    }),
    /Injected filesystem failure/,
  );
  assert.deepEqual(
    fs.readdirSync(root),
    [],
    'Failed generation must remove its own partial output.',
  );
  const files = await createFeature('catalog', { root, stagingRoot });
  assert.equal(files.length, 14);
  const original = fs.readFileSync(path.join(root, 'catalog/domain/catalog.ts'), 'utf8');
  await assert.rejects(createFeature('catalog', { root, stagingRoot }), /Feature already exists/);
  assert.equal(fs.readFileSync(path.join(root, 'catalog/domain/catalog.ts'), 'utf8'), original);
} finally {
  if (temporaryRoot.startsWith(path.resolve(os.tmpdir()) + path.sep))
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
}
console.info(
  'Feature generator verified: safe names, formatted source, full types/lint/architecture/core checks, dry run, no overwrite and failed-write rollback.',
);

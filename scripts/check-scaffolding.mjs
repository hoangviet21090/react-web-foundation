import assert from 'node:assert/strict';
import ts from 'typescript';
import { featureFiles } from './feature-template.mjs';
import { namingViolations } from './naming-rules.mjs';
for (const name of ['../escape', 'auth/ports', '', 'Invalid', 'a--b', 'a'.repeat(51)]) {
  assert.throws(() => featureFiles(name));
}
for (const name of ['catalog', 'inventory-items']) {
  const files = featureFiles(name);
  assert.ok(Object.keys(files).some((file) => file.startsWith('application/ports/')));
  assert.ok(Object.keys(files).some((file) => file.startsWith('infrastructure/mappers/')));
  for (const [file, source] of Object.entries(files)) {
    const full = 'src/features/' + name + '/' + file;
    assert.deepEqual(namingViolations(full, source), [], full);
    if (file.endsWith('.md')) continue;
    assert.equal(
      ts.createSourceFile(full, source, ts.ScriptTarget.Latest, true).parseDiagnostics.length,
      0,
      full,
    );
  }
}
console.info(
  'Feature generator validated: safe names, architecture groups, naming and generated syntax.',
);

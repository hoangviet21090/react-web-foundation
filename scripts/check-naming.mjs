import fs from 'node:fs';
import path from 'node:path';
import { namingViolations } from './naming-rules.mjs';

function walk(dir) {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((entry) =>
      entry.isDirectory() ? walk(path.join(dir, entry.name)) : [path.join(dir, entry.name)],
    );
}
const failures = [];
const files = walk('src');
for (const file of files) {
  for (const message of namingViolations(file, fs.readFileSync(file, 'utf8'))) {
    failures.push(file + ': ' + message);
  }
}
if (failures.length) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
} else console.info('Naming OK: source folders/files, exported types and hook modules checked.');

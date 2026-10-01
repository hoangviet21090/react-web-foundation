import fs from 'node:fs';
import path from 'node:path';
import { featureFiles } from './feature-template.mjs';

const [name, ...flags] = process.argv.slice(2);
if (!name || flags.some((flag) => flag !== '--dry-run'))
  throw new Error('Usage: npm run feature:new -- <kebab-name> [--dry-run]');
const files = featureFiles(name);
const root = path.resolve('src/features');
const target = path.resolve(root, name);
if (!target.startsWith(root + path.sep)) throw new Error('Invalid destination.');
if (fs.existsSync(target)) throw new Error('Feature already exists. No files were written.');
if (flags.includes('--dry-run')) {
  console.info(
    Object.keys(files)
      .map((file) => path.join('src/features', name, file))
      .join('\n'),
  );
} else {
  fs.mkdirSync(target); // Reserve the feature directory; never merge/overwrite another module.
  for (const [file, content] of Object.entries(files)) {
    const destination = path.join(target, file);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.writeFileSync(destination, content, { flag: 'wx' });
  }
  console.info(
    'Created ' + name + '. Read its README to wire dependencies, routes, translations and mocks.',
  );
}

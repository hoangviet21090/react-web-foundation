import path from 'node:path';
import { createFeature } from './feature-scaffold.mjs';

const [name, ...flags] = process.argv.slice(2);
if (!name || flags.some((flag) => flag !== '--dry-run'))
  throw new Error('Usage: npm run feature:new -- <kebab-name> [--dry-run]');
const dryRun = flags.includes('--dry-run');
const files = await createFeature(name, { dryRun });
if (dryRun) console.info(files.map((file) => path.join('src/features', name, file)).join('\n'));
else
  console.info(
    'Created ' + name + '. Read its README to wire dependencies, routes, translations and mocks.',
  );

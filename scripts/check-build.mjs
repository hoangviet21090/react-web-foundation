import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve('dist');
function walk(dir) {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((entry) =>
      entry.isDirectory() ? walk(path.join(dir, entry.name)) : [path.join(dir, entry.name)],
    );
}
if (!fs.existsSync(path.join(root, 'index.html'))) throw new Error('Build output is missing.');
const files = walk(root);
if (files.some((file) => file.endsWith('.map')))
  throw new Error('Public source maps found in production output.');

if (files.some((file) => /mockServiceWorker|fixtures|handlers/.test(path.basename(file))))
  throw new Error('Mock assets found in production output.');
for (const file of files.filter((entry) => /\.js$/.test(entry))) {
  const content = fs.readFileSync(file, 'utf8');
  if (
    content.includes('CLM-DEMO-001') ||
    content.includes('mockServiceWorker.js') ||
    content.includes('foundation_mock_session') ||
    content.includes('mock-access-') ||
    content.includes('ReactQueryDevtools') ||
    content.includes('TanstackQueryDevtools')
  )
    throw new Error('Mock code found in ' + file);
}
const jsBytes = files
  .filter((file) => /\.js$/.test(file))
  .reduce((total, file) => total + fs.statSync(file).size, 0);
if (jsBytes > 1_200_000)
  throw new Error(
    'Production JS exceeds the initial 1.2 MB uncompressed budget; review splitting/dependencies.',
  );
console.info(
  'Production output verified: no mocks/devtools/source maps, ' +
    Math.round(jsBytes / 1024) +
    ' KiB total JS (uncompressed).',
);

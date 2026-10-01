import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

// Exercise the real Vite config in isolated processes: process env has precedence over .env files.
const defaults = {
  NODE_ENV: 'production',
  VITE_APP_NAME: 'Web Foundation',
  VITE_API_BASE_URL: '/api',
  VITE_API_TIMEOUT_MS: '15000',
  VITE_ENABLE_MOCKS: 'false',
  VITE_DEFAULT_LOCALE: 'vi',
};
const scenarios = [
  { name: 'default production', mode: 'production', values: {}, valid: true },
  {
    name: 'HTTPS staging',
    mode: 'staging',
    values: { VITE_API_BASE_URL: 'https://bff.example.test/api' },
    valid: true,
  },
  { name: 'explicit demo', mode: 'demo', values: { VITE_ENABLE_MOCKS: 'true' }, valid: true },
  { name: 'mock flag typo', values: { VITE_ENABLE_MOCKS: 'yes' }, key: 'VITE_ENABLE_MOCKS' },
  { name: 'release mocks', values: { VITE_ENABLE_MOCKS: 'true' }, key: 'VITE_ENABLE_MOCKS' },
  {
    name: 'timeout typo',
    values: { VITE_API_TIMEOUT_MS: 'private-config-value' },
    key: 'VITE_API_TIMEOUT_MS',
  },
  {
    name: 'insecure release API',
    values: { VITE_API_BASE_URL: 'http://bff.example.test/api' },
    key: 'VITE_API_BASE_URL',
  },
  {
    name: 'credentials in URL',
    values: { VITE_API_BASE_URL: 'https://private-config-value:password@bff.example.test/api' },
    key: 'VITE_API_BASE_URL',
  },
  { name: 'development bundle', values: { NODE_ENV: 'development' }, key: 'NODE_ENV' },
];
for (const scenario of scenarios) {
  const source = `
    import { resolveConfig } from 'vite';
    try {
      await resolveConfig({ configFile: 'vite.config.ts', mode: ${JSON.stringify(scenario.mode ?? 'production')} }, 'build');
    } catch (error) {
      console.error(error.message);
      process.exitCode = 1;
    }
  `;
  const result = spawnSync(process.execPath, ['--input-type=module', '-e', source], {
    env: { ...process.env, ...defaults, ...scenario.values },
    encoding: 'utf8',
    timeout: 30_000,
  });
  if (result.error) throw result.error;
  const output = result.stdout + result.stderr;
  assert.ok(!output.includes('private-config-value'), 'Configuration errors must redact values.');
  if (scenario.valid) assert.equal(result.status, 0, scenario.name + ': ' + output);
  else {
    assert.equal(result.status, 1, scenario.name + ' must fail before build.');
    assert.ok(output.includes(scenario.key), scenario.name + ' must identify the invalid key.');
  }
}
console.info(
  'Build configuration verified: valid modes accepted, invalid public configuration rejected without leaking values.',
);

const brandingSource = `
  import assert from 'node:assert/strict';
  import { build } from 'vite';
  import fs from 'node:fs';
  import os from 'node:os';
  import path from 'node:path';
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'foundation-production-'));
  try {
  const result = await build({
    mode: 'production',
    configFile: 'vite.config.ts',
    logLevel: 'silent',
    build: { outDir, emptyOutDir: false },
  });
  const outputs = Array.isArray(result) ? result : [result];
  const html = outputs.flatMap(item => item.output)
    .find(item => item.type === 'asset' && item.fileName === 'index.html');
  assert.ok(html && typeof html.source === 'string');
  assert.ok(html.source.includes('<title>Workspace $&amp; &lt;Portal&gt;</title>'));
  assert.ok(html.source.includes('<html lang="en">'));
  assert.equal(fs.readFileSync(path.join(outDir, 'favicon.svg'), 'utf8'), fs.readFileSync('public/favicon.svg', 'utf8'));
  assert.equal(fs.existsSync(path.join(outDir, 'mockServiceWorker.js')), false);
  } finally {
    if (outDir.startsWith(path.resolve(os.tmpdir()) + path.sep)) fs.rmSync(outDir, { recursive: true, force: true });
  }
`;
const branding = spawnSync(process.execPath, ['--input-type=module', '-e', brandingSource], {
  env: {
    ...process.env,
    ...defaults,
    VITE_APP_NAME: 'Workspace $& <Portal>',
    VITE_DEFAULT_LOCALE: 'en',
  },
  encoding: 'utf8',
  timeout: 60_000,
});
if (branding.error) throw branding.error;
assert.equal(
  branding.status,
  0,
  'Public branding must be escaped literally in the built HTML: ' +
    branding.stdout +
    branding.stderr,
);
console.info(
  'Custom branding/default locale and public assets verified in a production build without MSW.',
);

const demoSource = `
  import assert from 'node:assert/strict';
  import { build } from 'vite';
  const result = await build({ mode: 'demo', configFile: 'vite.config.ts', logLevel: 'silent', build: { write: false } });
  const outputs = (Array.isArray(result) ? result : [result]).flatMap(item => item.output);
  assert.ok(outputs.some(item => item.type === 'asset' && item.fileName === 'mockServiceWorker.js'));
`;
const demo = spawnSync(process.execPath, ['--input-type=module', '-e', demoSource], {
  env: { ...process.env, ...defaults, VITE_ENABLE_MOCKS: 'true' },
  encoding: 'utf8',
  timeout: 60_000,
});
if (demo.error) throw demo.error;
assert.equal(
  demo.status,
  0,
  'Explicit demo builds must include the pinned MSW worker: ' + demo.stdout + demo.stderr,
);
console.info('Explicit demo build verified with its isolated MSW worker.');

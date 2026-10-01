import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
// Pin CLI via package-lock and keep generated components on the app-owned cn utility.
const cli = path.resolve('node_modules/shadcn/dist/index.js');
const result = spawnSync(process.execPath, [cli, 'add', ...process.argv.slice(2)], {
  stdio: 'inherit',
});
if (result.status !== 0) process.exit(result.status ?? 1);
function normalizeUtilityImports(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) normalizeUtilityImports(file);
    else if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name)) {
      const source = fs.readFileSync(file, 'utf8');
      const normalized = source.replace(/from (['"])cn\1/g, "from '@/shared/lib/cn'");
      if (normalized !== source) fs.writeFileSync(file, normalized);
    }
  }
}
for (const dir of ['src/shared/ui', 'src/shared/components', 'src/shared/hooks']) {
  normalizeUtilityImports(dir);
}
console.info(
  'UI source added. Run npm run format, review tokens/accessibility, then npm run check.',
);

import { existsSync } from 'node:fs';
if (process.env.CI !== 'true' && process.env.HUSKY !== '0' && existsSync('.git')) {
  const { default: husky } = await import('husky');
  const result = husky();
  if (result) console.info(result);
}

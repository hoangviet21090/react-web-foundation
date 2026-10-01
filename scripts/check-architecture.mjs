import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { checkSourceArchitecture } from './architecture-rules.mjs';

function walk(directory) {
  return fs
    .readdirSync(directory, { withFileTypes: true })
    .flatMap((entry) =>
      entry.isDirectory()
        ? walk(path.join(directory, entry.name))
        : /\.(ts|tsx)$/.test(entry.name)
          ? [path.join(directory, entry.name)]
          : [],
    );
}
const config = ts.readConfigFile('tsconfig.app.json', ts.sys.readFile);
if (config.error) throw new Error(ts.flattenDiagnosticMessageText(config.error.messageText, '\n'));
const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, process.cwd());
if (parsed.errors.length)
  throw new Error(
    parsed.errors
      .map((error) => ts.flattenDiagnosticMessageText(error.messageText, '\n'))
      .join('\n'),
  );
const result = checkSourceArchitecture({
  root: path.resolve('src'),
  files: walk('src'),
  compilerOptions: parsed.options,
});
if (result.failures.length) {
  console.error(result.failures.join('\n'));
  process.exitCode = 1;
} else {
  console.info(
    'Architecture OK: ' +
      result.moduleCount +
      ' modules/declarations checked, valid zones, no forbidden imports or cycles.',
  );
}

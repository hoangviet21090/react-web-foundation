import path from 'node:path';
import ts from 'typescript';

/** Add generated files without writing a temporary feature into production source. */
export function virtualCompilerHost(options, sources) {
  const files = new Map([...sources].map(([file, content]) => [path.resolve(file), content]));
  const host = ts.createCompilerHost(options);
  const readFile = host.readFile.bind(host);
  const fileExists = host.fileExists.bind(host);
  const directoryExists = host.directoryExists.bind(host);
  const getSourceFile = host.getSourceFile.bind(host);
  host.readFile = (file) => files.get(path.resolve(file)) ?? readFile(file);
  host.fileExists = (file) => files.has(path.resolve(file)) || fileExists(file);
  host.directoryExists = (directory) =>
    [...files.keys()].some((file) => file.startsWith(path.resolve(directory) + path.sep)) ||
    directoryExists(directory);
  host.getSourceFile = (file, languageVersion, onError, shouldCreateNewSourceFile) =>
    files.has(path.resolve(file))
      ? ts.createSourceFile(file, files.get(path.resolve(file)), languageVersion, true)
      : getSourceFile(file, languageVersion, onError, shouldCreateNewSourceFile);
  return host;
}

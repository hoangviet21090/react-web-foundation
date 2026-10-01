import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const root = path.resolve('src');
const config = ts.readConfigFile('tsconfig.app.json', ts.sys.readFile);
const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, process.cwd());
const failures = [];
const graph = new Map();
const normalize = (value) => value.split(path.sep).join('/');
function walk(dir) {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((entry) =>
      entry.isDirectory()
        ? walk(path.join(dir, entry.name))
        : /\.(ts|tsx)$/.test(entry.name)
          ? [path.join(dir, entry.name)]
          : [],
    );
}
function classify(file) {
  const segments = normalize(path.relative(root, file)).split('/');
  return {
    zone: segments[0],
    feature: segments[0] === 'features' ? segments[1] : undefined,
    layer: segments[0] === 'features' ? segments[2] : segments[1],
  };
}
function violation(from, to, external) {
  const inner = ['domain', 'application'].includes(from.layer);
  if (inner && external)
    return 'Inner layers must use plain TypeScript; third-party imports belong to adapters.';
  if (external) return;
  if (from.zone === 'shared' && to.zone !== 'shared')
    return 'Shared code cannot import features or app.';
  if (from.zone === 'features' && !['features', 'shared'].includes(to.zone))
    return 'Features may only import their own layers and shared code.';
  if (from.feature && to.feature && from.feature !== to.feature)
    return 'Compose separate features in app; do not couple their internals.';
  if (from.layer === 'domain' && to.layer !== 'domain') return 'Domain only depends on domain.';
  if (from.layer === 'application' && !['domain', 'application'].includes(to.layer))
    return 'Application only depends on application/domain.';
  if (
    from.layer === 'infrastructure' &&
    ['presentation', 'ui', 'components', 'hooks', 'types', 'contexts', 'providers', 'lib'].includes(
      to.layer,
    )
  )
    return 'Infrastructure cannot import presentation or UI.';
  if (from.layer === 'presentation' && to.zone === 'features' && to.layer === 'infrastructure')
    return 'Presentation receives use cases through injection; no concrete adapters.';
}
for (const file of walk(root)) {
  if (/\.(test|spec)\./.test(file) || file.endsWith('.d.ts')) continue;
  const source = ts.createSourceFile(
    file,
    fs.readFileSync(file, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
  );
  const imports = [];
  function visit(node) {
    if (
      ts.isImportTypeNode(node) &&
      ts.isLiteralTypeNode(node.argument) &&
      ts.isStringLiteral(node.argument.literal)
    )
      imports.push(node.argument.literal.text);
    if (
      ts.isImportEqualsDeclaration(node) &&
      ts.isExternalModuleReference(node.moduleReference) &&
      node.moduleReference.expression &&
      ts.isStringLiteral(node.moduleReference.expression)
    )
      imports.push(node.moduleReference.expression.text);
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    )
      imports.push(node.moduleSpecifier.text);
    if (
      ts.isCallExpression(node) &&
      (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
        (ts.isIdentifier(node.expression) && node.expression.text === 'require'))
    ) {
      const arg = node.arguments[0];
      if (arg && ts.isStringLiteral(arg)) imports.push(arg.text);
      else
        failures.push(
          normalize(path.relative(root, file)) + ': non-literal dynamic imports are forbidden',
        );
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
  const edges = [];
  for (const specifier of imports) {
    const resolved = ts.resolveModuleName(specifier, file, parsed.options, ts.sys).resolvedModule;
    const local = resolved && path.resolve(resolved.resolvedFileName).startsWith(root + path.sep);
    const problem = violation(
      classify(file),
      local ? classify(resolved.resolvedFileName) : {},
      !local,
    );
    if (problem)
      failures.push(normalize(path.relative(root, file)) + ' -> ' + specifier + ': ' + problem);
    if (local) edges.push(path.resolve(resolved.resolvedFileName));
  }
  graph.set(file, edges);
}
const visited = new Set();
const active = new Set();
function visit(file, chain) {
  if (active.has(file)) {
    failures.push(
      'Circular dependency: ' +
        [...chain, file].map((p) => normalize(path.relative(root, p))).join(' -> '),
    );
    return;
  }
  if (visited.has(file)) return;
  active.add(file);
  for (const target of graph.get(file) ?? []) visit(target, [...chain, file]);
  active.delete(file);
  visited.add(file);
}
for (const file of graph.keys()) visit(file, []);
if (failures.length) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
} else
  console.info(
    'Architecture OK: ' + graph.size + ' modules checked, no forbidden imports or cycles.',
  );

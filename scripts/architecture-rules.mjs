import path from 'node:path';
import ts from 'typescript';

const featureLayers = new Set(['domain', 'application', 'infrastructure', 'presentation']);
const sharedLayers = new Set([
  'domain',
  'application',
  'infrastructure',
  'ui',
  'components',
  'hooks',
  'types',
  'contexts',
  'providers',
  'lib',
  'assets',
]);
const presentationLayers = new Set([
  'presentation',
  'ui',
  'components',
  'hooks',
  'types',
  'contexts',
  'providers',
  'lib',
  'assets',
]);
const normalize = (value) => value.split(path.sep).join('/');

export function classifySource(file, root) {
  const segments = normalize(path.relative(root, file)).split('/');
  const zone = segments[0];
  const result = {
    zone,
    feature: zone === 'features' ? segments[1] : undefined,
    layer: zone === 'features' ? segments[2] : segments[1],
  };
  if (segments.length === 1 && ['main.tsx', 'vite-env.d.ts'].includes(zone))
    return { ...result, zone: 'entry' };
  if (zone === 'features' && (segments.length < 4 || !featureLayers.has(result.layer)))
    return {
      ...result,
      error: 'Feature source must belong to domain/application/infrastructure/presentation.',
    };
  if (zone === 'shared' && (segments.length < 3 || !sharedLayers.has(result.layer)))
    return {
      ...result,
      error: 'Shared source must belong to a documented core, adapter or presentation group.',
    };
  if (!['app', 'features', 'shared', 'mocks'].includes(zone))
    return {
      ...result,
      error: 'Source must belong to app/features/shared/mocks or an approved entry point.',
    };
  return result;
}

export function dependencyViolation(from, to, external = false) {
  if (from.error) return from.error;
  if (to?.error) return to.error;
  if (['domain', 'application'].includes(from.layer) && external)
    return 'Inner layers must use plain TypeScript; third-party imports belong to adapters.';
  if (external) return;
  if (from.zone === 'shared' && to.zone !== 'shared')
    return 'Shared code cannot import features, app or mocks.';
  if (from.zone === 'features' && !['features', 'shared'].includes(to.zone))
    return 'Features may only import their own layers and shared code.';
  if (from.feature && to.feature && from.feature !== to.feature)
    return 'Compose separate features in app; do not couple their internals.';
  if (from.layer === 'domain' && to.layer !== 'domain') return 'Domain only depends on domain.';
  if (from.layer === 'application' && !['domain', 'application'].includes(to.layer))
    return 'Application only depends on application/domain.';
  if (from.layer === 'infrastructure' && presentationLayers.has(to.layer))
    return 'Infrastructure cannot import presentation or UI.';
  if (from.layer === 'presentation' && to.zone === 'features' && to.layer === 'infrastructure')
    return 'Presentation receives use cases through injection; no concrete feature adapters.';
}

function moduleReferences(source, fail) {
  const references = [];
  function visit(node) {
    if (
      ts.isImportTypeNode(node) &&
      ts.isLiteralTypeNode(node.argument) &&
      ts.isStringLiteral(node.argument.literal)
    )
      references.push(node.argument.literal.text);
    if (
      ts.isImportEqualsDeclaration(node) &&
      ts.isExternalModuleReference(node.moduleReference) &&
      node.moduleReference.expression &&
      ts.isStringLiteral(node.moduleReference.expression)
    )
      references.push(node.moduleReference.expression.text);
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    )
      references.push(node.moduleSpecifier.text);
    if (
      ts.isCallExpression(node) &&
      (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
        (ts.isIdentifier(node.expression) && node.expression.text === 'require'))
    ) {
      const argument = node.arguments[0];
      if (argument && ts.isStringLiteral(argument)) references.push(argument.text);
      else fail('Non-literal dynamic imports are forbidden.');
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
  return references;
}

function assetPath(specifier, file, root, host) {
  const clean = specifier.split(/[?#]/)[0];
  if (!/\.(?:css|svg|png|jpe?g|webp|gif|ico|woff2?|ttf|mp4|webm)$/.test(clean)) return;
  const candidate = clean.startsWith('@/')
    ? path.resolve(root, clean.slice(2))
    : clean.startsWith('.')
      ? path.resolve(path.dirname(file), clean)
      : undefined;
  if (candidate && host.fileExists(candidate)) return candidate;
}

/** Static analysis shared by the repository gate and virtual generator checks. */
export function checkSourceArchitecture({ root, files, compilerOptions, host = ts.sys }) {
  root = path.resolve(root);
  const failures = [];
  const graph = new Map();
  const describe = (file) => normalize(path.relative(root, file));
  const inside = (file) => file.startsWith(root + path.sep);
  for (const original of files) {
    const file = path.resolve(original);
    if (/\.(test|spec)\./.test(file)) continue;
    const from = classifySource(file, root);
    if (from.error) failures.push(describe(file) + ': ' + from.error);
    const content = host.readFile(file);
    if (content === undefined) {
      failures.push(describe(file) + ': Source could not be read.');
      continue;
    }
    const source = ts.createSourceFile(file, content, ts.ScriptTarget.Latest, true);
    const references = moduleReferences(source, (message) =>
      failures.push(describe(file) + ': ' + message),
    );
    const edges = [];
    for (const specifier of references) {
      const resolved = ts.resolveModuleName(specifier, file, compilerOptions, host).resolvedModule;
      const destination = resolved
        ? path.resolve(resolved.resolvedFileName)
        : assetPath(specifier, file, root, host);
      const localSpecifier =
        specifier.startsWith('.') || specifier.startsWith('/') || specifier.startsWith('@/');
      if (!destination) {
        failures.push(describe(file) + ' -> ' + specifier + ': Import could not be resolved.');
        continue;
      }
      const local = inside(destination);
      if (!local && (localSpecifier || !resolved?.isExternalLibraryImport)) {
        failures.push(
          describe(file) +
            ' -> ' +
            specifier +
            ': Production source cannot import files outside src.',
        );
        continue;
      }
      if (local && /\.(test|spec)\./.test(destination)) {
        failures.push(
          describe(file) + ' -> ' + specifier + ': Production source cannot import tests.',
        );
        continue;
      }
      const problem = dependencyViolation(
        from,
        local ? classifySource(destination, root) : undefined,
        !local,
      );
      if (problem) failures.push(describe(file) + ' -> ' + specifier + ': ' + problem);
      if (local && /\.(?:ts|tsx)$/.test(destination)) edges.push(destination);
    }
    graph.set(file, edges);
  }
  const visited = new Set();
  const active = new Set();
  function visit(file, chain) {
    if (active.has(file)) {
      failures.push('Circular dependency: ' + [...chain, file].map(describe).join(' -> '));
      return;
    }
    if (visited.has(file)) return;
    active.add(file);
    for (const target of graph.get(file) ?? []) visit(target, [...chain, file]);
    active.delete(file);
    visited.add(file);
  }
  for (const file of graph.keys()) visit(file, []);
  return { failures, moduleCount: graph.size };
}

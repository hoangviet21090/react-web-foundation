import path from 'node:path';
import ts from 'typescript';

const kebabCase = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;

/** Mechanical naming rules only; semantic ownership still needs architecture review. */
export function namingViolations(file, content = '') {
  const segments = file.replaceAll('\\', '/').split('/');
  const name = segments.pop();
  const errors = [];
  if (segments.some((segment) => !kebabCase.test(segment))) {
    errors.push('Folders must use lowercase kebab-case.');
  }
  if (name === 'README.md') return errors;
  if (!/\.(?:ts|tsx|json|css)$/.test(name)) return errors;
  const stem = name.replace(/(?:\.(?:d|test|spec))?\.(?:ts|tsx|json|css)$/, '');
  if (!kebabCase.test(stem)) errors.push('Source filenames must use lowercase kebab-case.');
  if (!/\.(?:ts|tsx)$/.test(name) || /\.(?:test|spec|d)\.(?:ts|tsx)$/.test(name)) return errors;

  const source = ts.createSourceFile(file, content, ts.ScriptTarget.Latest, true);
  const exports = [];
  for (const statement of source.statements) {
    const exported = statement.modifiers?.some(
      (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword,
    );
    if (exported) {
      if (ts.isFunctionDeclaration(statement) && statement.name) exports.push(statement.name.text);
      if (ts.isVariableStatement(statement)) {
        for (const declaration of statement.declarationList.declarations) {
          if (ts.isIdentifier(declaration.name)) exports.push(declaration.name.text);
        }
      }
      if (
        (ts.isInterfaceDeclaration(statement) ||
          ts.isTypeAliasDeclaration(statement) ||
          ts.isEnumDeclaration(statement) ||
          ts.isClassDeclaration(statement)) &&
        statement.name &&
        !/^[A-Z][a-zA-Z0-9]*$/.test(statement.name.text)
      )
        errors.push('Exported type/class names must use PascalCase.');
    }
    if (
      ts.isExportDeclaration(statement) &&
      statement.exportClause &&
      ts.isNamedExports(statement.exportClause)
    ) {
      exports.push(...statement.exportClause.elements.map((element) => element.name.text));
    }
  }
  if (
    exports.some((name) => /^use[A-Z]/.test(name)) &&
    !stem.startsWith('use-') &&
    !stem.endsWith('-hooks')
  ) {
    errors.push('Hook modules must use use-*.ts(x), or *-hooks.ts for related typed bindings.');
  }
  if (path.extname(file) === '.ts' && stem.endsWith('-page')) {
    errors.push('Page components use .tsx.');
  }
  return errors;
}

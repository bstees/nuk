import ts from 'typescript';

import type { AnalysisCategory, AnalysisFinding, AnalysisReport } from './types.ts';
import { sha256 } from './util.ts';

export const ANALYZER_VERSION = '1.0.0';

const NETWORK_GLOBALS = new Set([
  'EventSource',
  'WebSocket',
  'XMLHttpRequest',
  'fetch',
  'open',
  'sendBeacon',
]);
const NETWORK_CONSTRUCTORS = new Set(['EventSource', 'WebSocket', 'XMLHttpRequest']);
const STORAGE_GLOBALS = new Set([
  'CacheStorage',
  'Storage',
  'caches',
  'indexedDB',
  'localStorage',
  'sessionStorage',
]);
const DENIED_MODULES = new Map<string, readonly [AnalysisCategory, string]>([
  ['axios', ['network-access', 'Network client imports are not allowed.']],
  ['node:child_process', ['dynamic-execution', 'Process execution imports are not allowed.']],
  ['node:cluster', ['unsafe-construct', 'Process cluster imports are not allowed.']],
  ['node:dgram', ['network-access', 'Network socket imports are not allowed.']],
  ['node:dns', ['network-access', 'DNS imports are not allowed.']],
  ['node:fs', ['storage-access', 'File-system imports are not allowed.']],
  ['node:fs/promises', ['storage-access', 'File-system imports are not allowed.']],
  ['node:http', ['network-access', 'HTTP imports are not allowed.']],
  ['node:http2', ['network-access', 'HTTP imports are not allowed.']],
  ['node:https', ['network-access', 'HTTPS imports are not allowed.']],
  ['node:module', ['dynamic-execution', 'Dynamic module loading imports are not allowed.']],
  ['node:net', ['network-access', 'Network socket imports are not allowed.']],
  ['node:tls', ['network-access', 'Network socket imports are not allowed.']],
  ['node:vm', ['dynamic-execution', 'Virtual-machine execution imports are not allowed.']],
  ['node:worker_threads', ['dynamic-execution', 'Worker execution imports are not allowed.']],
]);

export interface AnalyzeOptions {
  readonly fileName: string;
  readonly source: string;
  readonly declaredDependencies?: readonly string[];
}

export function analyzeSource(options: AnalyzeOptions): AnalysisReport {
  const declaredDependencies = [...new Set(options.declaredDependencies ?? [])].sort();
  const findings: AnalysisFinding[] = [];
  const sourceFile = ts.createSourceFile(
    options.fileName,
    options.source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );

  const transpileResult = ts.transpileModule(options.source, {
    fileName: options.fileName,
    reportDiagnostics: true,
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2023,
    },
  });
  for (const diagnostic of transpileResult.diagnostics ?? []) {
    if (diagnostic.category === ts.DiagnosticCategory.Error) {
      addFinding(
        findings,
        sourceFile,
        diagnostic.start ?? 0,
        options.fileName,
        'FORGE001',
        'parse-error',
        ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
      );
    }
  }

  const visit = (node: ts.Node): void => {
    inspectNode(node, sourceFile, options.fileName, declaredDependencies, findings);
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);

  const uniqueFindings = deduplicateFindings(findings).sort(
    (left, right) =>
      left.line - right.line ||
      left.column - right.column ||
      left.ruleId.localeCompare(right.ruleId),
  );
  return {
    schemaVersion: '1.0.0',
    analyzerVersion: ANALYZER_VERSION,
    sourceDigest: sha256(options.source),
    passed: uniqueFindings.length === 0,
    declaredDependencies,
    findings: uniqueFindings,
  };
}

function inspectNode(
  node: ts.Node,
  sourceFile: ts.SourceFile,
  fileName: string,
  declaredDependencies: readonly string[],
  findings: AnalysisFinding[],
): void {
  if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) {
    const specifier = node.moduleSpecifier;
    if (specifier && ts.isStringLiteral(specifier)) {
      inspectModuleSpecifier(
        specifier.text,
        specifier,
        sourceFile,
        fileName,
        declaredDependencies,
        findings,
      );
    }
  }
  if (ts.isImportEqualsDeclaration(node)) {
    addFinding(
      findings,
      sourceFile,
      node.getStart(sourceFile),
      fileName,
      'FORGE102',
      'dynamic-execution',
      'Import-equals declarations are not allowed in generated browser components.',
    );
  }
  if (ts.isCallExpression(node)) {
    inspectCall(node, sourceFile, fileName, declaredDependencies, findings);
  }
  if (ts.isNewExpression(node)) {
    const name = expressionName(node.expression);
    if (name === 'Function') {
      addFinding(
        findings,
        sourceFile,
        node.getStart(sourceFile),
        fileName,
        'FORGE101',
        'dynamic-execution',
        'The Function constructor is not allowed.',
      );
    } else if (name && NETWORK_CONSTRUCTORS.has(name)) {
      addFinding(
        findings,
        sourceFile,
        node.getStart(sourceFile),
        fileName,
        'FORGE201',
        'network-access',
        `${name} network access is not allowed.`,
      );
    } else if (name === 'Worker' || name === 'SharedWorker') {
      addFinding(
        findings,
        sourceFile,
        node.getStart(sourceFile),
        fileName,
        'FORGE103',
        'dynamic-execution',
        `${name} execution is not allowed.`,
      );
    }
  }
  if (ts.isBinaryExpression(node) && isAssignmentOperator(node.operatorToken.kind)) {
    inspectAssignment(node, sourceFile, fileName, findings);
  }
  if (ts.isPropertyAssignment(node) && propertyNameText(node.name) === 'dangerouslySetInnerHTML') {
    addFinding(
      findings,
      sourceFile,
      node.getStart(sourceFile),
      fileName,
      'FORGE304',
      'inline-script-injection',
      'dangerouslySetInnerHTML is not allowed.',
    );
  }
  if (ts.isStringLiteralLike(node)) {
    const normalized = node.text.trim().toLowerCase();
    if (normalized.startsWith('javascript:') || normalized.startsWith('data:text/html')) {
      addFinding(
        findings,
        sourceFile,
        node.getStart(sourceFile),
        fileName,
        'FORGE305',
        'inline-script-injection',
        'Executable or HTML data URLs are not allowed.',
      );
    }
  }
}

function inspectCall(
  node: ts.CallExpression,
  sourceFile: ts.SourceFile,
  fileName: string,
  declaredDependencies: readonly string[],
  findings: AnalysisFinding[],
): void {
  if (node.expression.kind === ts.SyntaxKind.ImportKeyword) {
    addFinding(
      findings,
      sourceFile,
      node.getStart(sourceFile),
      fileName,
      'FORGE104',
      'dynamic-execution',
      'Dynamic import() is not allowed.',
    );
    return;
  }
  const name = expressionName(node.expression);
  if (!name) {
    return;
  }
  if (name === 'eval' || name === 'Function') {
    addFinding(
      findings,
      sourceFile,
      node.getStart(sourceFile),
      fileName,
      'FORGE101',
      'dynamic-execution',
      `${name} execution is not allowed.`,
    );
  }
  if ((name === 'setTimeout' || name === 'setInterval') && isStringLike(node.arguments[0])) {
    addFinding(
      findings,
      sourceFile,
      node.getStart(sourceFile),
      fileName,
      'FORGE105',
      'dynamic-execution',
      `${name} must not evaluate a string.`,
    );
  }
  if (name === 'require') {
    const argument = node.arguments[0];
    if (!argument || !ts.isStringLiteral(argument)) {
      addFinding(
        findings,
        sourceFile,
        node.getStart(sourceFile),
        fileName,
        'FORGE106',
        'dynamic-execution',
        'Non-literal require() is not allowed.',
      );
    } else {
      inspectModuleSpecifier(
        argument.text,
        argument,
        sourceFile,
        fileName,
        declaredDependencies,
        findings,
      );
    }
  }
  if (NETWORK_GLOBALS.has(name)) {
    addFinding(
      findings,
      sourceFile,
      node.getStart(sourceFile),
      fileName,
      'FORGE202',
      'network-access',
      `${name} network access is not allowed.`,
    );
  }
  if (name === 'navigator.sendBeacon' || name === 'window.fetch' || name === 'globalThis.fetch') {
    addFinding(
      findings,
      sourceFile,
      node.getStart(sourceFile),
      fileName,
      'FORGE202',
      'network-access',
      `${name} network access is not allowed.`,
    );
  }
  if (
    name === 'indexedDB.open' ||
    name === 'caches.open' ||
    name === 'navigator.storage.getDirectory'
  ) {
    addFinding(
      findings,
      sourceFile,
      node.getStart(sourceFile),
      fileName,
      'FORGE203',
      'storage-access',
      `${name} storage access is not allowed.`,
    );
  }
  const root = name.split('.')[0];
  if (root && STORAGE_GLOBALS.has(root)) {
    addFinding(
      findings,
      sourceFile,
      node.getStart(sourceFile),
      fileName,
      'FORGE203',
      'storage-access',
      `${root} storage access is not allowed.`,
    );
  }
  if (
    name.endsWith('.insertAdjacentHTML') ||
    name === 'document.write' ||
    name === 'document.writeln'
  ) {
    addFinding(
      findings,
      sourceFile,
      node.getStart(sourceFile),
      fileName,
      'FORGE301',
      'inline-script-injection',
      `${name} HTML injection is not allowed.`,
    );
  }
  if (name.endsWith('.setAttribute')) {
    const attribute = literalText(node.arguments[0])?.toLowerCase();
    if (attribute?.startsWith('on') || attribute === 'srcdoc') {
      addFinding(
        findings,
        sourceFile,
        node.getStart(sourceFile),
        fileName,
        'FORGE302',
        'inline-script-injection',
        `Setting the ${attribute} attribute is not allowed.`,
      );
    }
  }
  if (
    name.endsWith('.createElement') &&
    literalText(node.arguments[0])?.toLowerCase() === 'script'
  ) {
    addFinding(
      findings,
      sourceFile,
      node.getStart(sourceFile),
      fileName,
      'FORGE303',
      'inline-script-injection',
      'Creating script elements is not allowed.',
    );
  }
}

function inspectAssignment(
  node: ts.BinaryExpression,
  sourceFile: ts.SourceFile,
  fileName: string,
  findings: AnalysisFinding[],
): void {
  const name = expressionName(node.left);
  if (!name) {
    return;
  }
  const property = name.split('.').at(-1) ?? name;
  if (property === 'innerHTML' || property === 'outerHTML' || property === 'srcdoc') {
    addFinding(
      findings,
      sourceFile,
      node.getStart(sourceFile),
      fileName,
      'FORGE301',
      'inline-script-injection',
      `Assignment to ${property} is not allowed.`,
    );
  }
  if (name === 'document.cookie') {
    addFinding(
      findings,
      sourceFile,
      node.getStart(sourceFile),
      fileName,
      'FORGE204',
      'storage-access',
      'Cookie storage access is not allowed.',
    );
  }
  const root = name.split('.')[0];
  if (root && STORAGE_GLOBALS.has(root)) {
    addFinding(
      findings,
      sourceFile,
      node.getStart(sourceFile),
      fileName,
      'FORGE203',
      'storage-access',
      `${root} storage access is not allowed.`,
    );
  }
}

function inspectModuleSpecifier(
  specifier: string,
  node: ts.Node,
  sourceFile: ts.SourceFile,
  fileName: string,
  declaredDependencies: readonly string[],
  findings: AnalysisFinding[],
): void {
  if (isRelativeSpecifier(specifier)) {
    return;
  }
  const denied = DENIED_MODULES.get(specifier) ?? DENIED_MODULES.get(packageName(specifier));
  if (denied) {
    addFinding(
      findings,
      sourceFile,
      node.getStart(sourceFile),
      fileName,
      'FORGE401',
      denied[0],
      denied[1],
    );
  }
  const dependency = packageName(specifier);
  if (dependency.startsWith('node:')) {
    if (!denied) {
      addFinding(
        findings,
        sourceFile,
        node.getStart(sourceFile),
        fileName,
        'FORGE402',
        'unsafe-construct',
        `Node builtin "${specifier}" is not allowed in generated browser components.`,
      );
    }
    return;
  }
  if (!declaredDependencies.includes(dependency)) {
    addFinding(
      findings,
      sourceFile,
      node.getStart(sourceFile),
      fileName,
      'FORGE403',
      'undeclared-dependency',
      `Package "${dependency}" is not declared.`,
    );
  }
}

function expressionName(expression: ts.Expression): string | undefined {
  if (expression.kind === ts.SyntaxKind.ThisKeyword) {
    return 'this';
  }
  if (ts.isIdentifier(expression)) {
    return expression.text;
  }
  if (ts.isPropertyAccessExpression(expression)) {
    const base = expressionName(expression.expression);
    return base ? `${base}.${expression.name.text}` : expression.name.text;
  }
  if (ts.isElementAccessExpression(expression)) {
    const base = expressionName(expression.expression);
    const property = literalText(expression.argumentExpression);
    return base && property ? `${base}.${property}` : undefined;
  }
  return undefined;
}

function propertyNameText(name: ts.PropertyName): string | undefined {
  if (ts.isIdentifier(name) || ts.isStringLiteralLike(name) || ts.isNumericLiteral(name)) {
    return name.text;
  }
  return undefined;
}

function literalText(node: ts.Expression | undefined): string | undefined {
  return node && ts.isStringLiteralLike(node) ? node.text : undefined;
}

function isStringLike(node: ts.Expression | undefined): boolean {
  return Boolean(
    node && (ts.isStringLiteralLike(node) || ts.isNoSubstitutionTemplateLiteral(node)),
  );
}

function isAssignmentOperator(kind: ts.SyntaxKind): boolean {
  return kind >= ts.SyntaxKind.FirstAssignment && kind <= ts.SyntaxKind.LastAssignment;
}

function isRelativeSpecifier(specifier: string): boolean {
  return specifier.startsWith('.') || specifier.startsWith('/') || specifier.startsWith('#');
}

function packageName(specifier: string): string {
  if (specifier.startsWith('node:')) {
    return specifier;
  }
  const parts = specifier.split('/');
  return specifier.startsWith('@')
    ? `${parts[0] ?? ''}/${parts[1] ?? ''}`
    : (parts[0] ?? specifier);
}

function addFinding(
  findings: AnalysisFinding[],
  sourceFile: ts.SourceFile,
  position: number,
  file: string,
  ruleId: string,
  category: AnalysisCategory,
  message: string,
): void {
  const location = sourceFile.getLineAndCharacterOfPosition(position);
  findings.push({
    ruleId,
    category,
    severity: 'error',
    message,
    file,
    line: location.line + 1,
    column: location.character + 1,
  });
}

function deduplicateFindings(findings: readonly AnalysisFinding[]): AnalysisFinding[] {
  const seen = new Set<string>();
  return findings.filter((finding) => {
    const key = `${finding.ruleId}:${finding.file}:${String(finding.line)}:${String(finding.column)}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

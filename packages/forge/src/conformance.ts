import ts from 'typescript';

import type { ComponentSpec, ConformanceFinding, ConformanceReport } from './types.ts';
import { asJsonValue, sha256, stableJson } from './util.ts';

export const CONFORMANCE_CHECKER_VERSION = '1.0.0';

export function checkConformance(spec: ComponentSpec, source: string): ConformanceReport {
  const eventPrefix = spec.namespace.slice(0, -1);
  const configurationErrorEvent = `${eventPrefix}-config-error`;
  const dismissEvent = `${eventPrefix}-dismiss`;
  const sourceFile = ts.createSourceFile(
    `${spec.id}.ts`,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  const strings = new Set<string>();
  const calls = new Set<string>();
  const methods = new Set<string>();
  const assignments = new Map<string, Set<string>>();
  let extendsHTMLElement = false;
  let nativeButtonGuard = false;

  const visit = (node: ts.Node): void => {
    if (ts.isStringLiteralLike(node)) {
      strings.add(node.text);
    }
    if (ts.isCallExpression(node)) {
      const name = expressionName(node.expression);
      if (name) {
        calls.add(name);
      }
    }
    if (ts.isMethodDeclaration(node) && node.name && ts.isIdentifier(node.name)) {
      methods.add(node.name.text);
    }
    if (ts.isClassDeclaration(node)) {
      extendsHTMLElement ||=
        node.heritageClauses?.some((clause) =>
          clause.types.some((type) => type.expression.getText(sourceFile) === 'HTMLElement'),
        ) ?? false;
    }
    if (
      ts.isBinaryExpression(node) &&
      node.operatorToken.kind === ts.SyntaxKind.InstanceOfKeyword &&
      node.right.getText(sourceFile) === 'HTMLButtonElement'
    ) {
      nativeButtonGuard = true;
    }
    if (ts.isBinaryExpression(node) && isAssignmentOperator(node.operatorToken.kind)) {
      const name = expressionName(node.left);
      if (name) {
        const values = assignments.get(name) ?? new Set<string>();
        values.add(node.right.getText(sourceFile));
        assignments.set(name, values);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);

  const assignmentHas = (suffix: string, value: string): boolean =>
    [...assignments].some(([name, values]) => name.endsWith(suffix) && values.has(value));
  const hasCallSuffix = (suffix: string): boolean =>
    [...calls].some((name) => name.endsWith(suffix));

  const checks: Record<string, boolean> = {
    acceptanceTestsPresent: spec.acceptanceTests.length >= 4,
    accessibleNameValidation: strings.has('aria-label') && source.includes('.textContent'),
    configurationErrorsSurfaced: strings.has(configurationErrorEvent),
    customElementCollisionGuard:
      hasCallSuffix('customElements.get') ||
      (calls.has('customElements.get') && calls.has('customElements.define')),
    customElementDefined: calls.has('customElements.define'),
    dismissEventBubbles: strings.has(dismissEvent) && source.includes('bubbles: true'),
    dismissEventComposed: strings.has(dismissEvent) && source.includes('composed: true'),
    dismissStateImplemented:
      assignmentHas('.hidden', 'true') && strings.has('dismissed') && strings.has('visible'),
    forbiddenFocusMovement: !hasCallSuffix('.focus'),
    lightDomPreserved: !hasCallSuffix('.attachShadow'),
    lifecycleCleanup:
      methods.has('connectedCallback') &&
      methods.has('disconnectedCallback') &&
      hasCallSuffix('.addEventListener') &&
      hasCallSuffix('.removeEventListener'),
    nativeButtonGuard,
    nativeButtonTypeRequired: strings.has('type') && strings.has('button'),
    nativeDismissSelector: strings.has(':scope > button[data-dismiss]'),
    resetImplemented: methods.has('reset') && assignmentHas('.hidden', 'false'),
    roleSemantics: strings.has('role') && strings.has('status') && strings.has('alert'),
    scopedCustomElement: spec.id.startsWith(spec.namespace) && strings.has(spec.id),
    wcagTargetDeclared: spec.accessibility.target === 'WCAG 2.2 AA',
    extendsHTMLElement,
  };
  const messages: Readonly<Record<string, string>> = {
    acceptanceTestsPresent: 'Normalized acceptance tests are missing.',
    accessibleNameValidation: 'The native dismiss button accessible name is not validated.',
    configurationErrorsSurfaced: 'Invalid author markup does not surface a configuration error.',
    customElementCollisionGuard: 'Custom-element registration is not collision guarded.',
    customElementDefined: 'The custom element is not registered.',
    dismissEventBubbles: 'The dismiss event is not configured to bubble.',
    dismissEventComposed: 'The dismiss event is not composed across a shadow boundary.',
    dismissStateImplemented: 'Visible and dismissed state transitions are incomplete.',
    forbiddenFocusMovement: 'The implementation moves focus despite the specification.',
    lightDomPreserved: 'The proof component must preserve its semantic light-DOM content.',
    lifecycleCleanup: 'Event listener registration and lifecycle cleanup are incomplete.',
    nativeButtonGuard: 'The dismiss control is not verified as a native button.',
    nativeButtonTypeRequired: 'The dismiss control does not require type=button.',
    nativeDismissSelector: 'The required direct-child dismiss selector is missing.',
    resetImplemented: 'The public reset behavior is missing.',
    roleSemantics: 'The status/alert role contract is incomplete.',
    scopedCustomElement: 'The component is not scoped to the normalized custom-element prefix.',
    wcagTargetDeclared: 'The normalized target is not WCAG 2.2 AA.',
    extendsHTMLElement: 'The candidate does not extend HTMLElement.',
  };
  const findings: ConformanceFinding[] = Object.entries(checks)
    .filter(([, passed]) => !passed)
    .map(([ruleId]) => ({
      ruleId,
      message: messages[ruleId] ?? `Conformance check ${ruleId} failed.`,
    }));

  return {
    schemaVersion: '1.0.0',
    checkerVersion: CONFORMANCE_CHECKER_VERSION,
    specDigest: sha256(stableJson(asJsonValue(spec))),
    sourceDigest: sha256(source),
    passed: findings.length === 0,
    checks,
    findings,
  };
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
  if (
    ts.isElementAccessExpression(expression) &&
    ts.isStringLiteralLike(expression.argumentExpression)
  ) {
    const base = expressionName(expression.expression);
    return base
      ? `${base}.${expression.argumentExpression.text}`
      : expression.argumentExpression.text;
  }
  return undefined;
}

function isAssignmentOperator(kind: ts.SyntaxKind): boolean {
  return kind >= ts.SyntaxKind.FirstAssignment && kind <= ts.SyntaxKind.LastAssignment;
}

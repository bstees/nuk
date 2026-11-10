import type { ComponentSpec } from './types.ts';
import { assertRecord, assertString, assertStringArray } from './util.ts';

const COMPONENT_ID = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)+$/u;
const NAMESPACE = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*-$/u;
const SEMVER = /^\d+\.\d+\.\d+$/u;
const REQUIRED_LEVELS = ['accessibility', 'behavior', 'conformance', 'static'] as const;
const REQUIRED_FORBIDDEN_CAPABILITIES = [
  'dynamic-code-execution',
  'inline-script-injection',
  'network-access',
  'persistent-storage',
  'undeclared-dependency',
] as const;
const ALLOWED_CAPABILITIES = new Set(['dom-query', 'dom-attribute', 'dom-event']);

export function parseComponentSpec(value: unknown): ComponentSpec {
  assertRecord(value, 'component spec');
  if (value.schemaVersion !== '1.0.0') {
    throw new TypeError('component spec.schemaVersion must be "1.0.0".');
  }
  assertString(value.id, 'component spec.id');
  if (!COMPONENT_ID.test(value.id)) {
    throw new TypeError('component spec.id must be a lowercase custom-element name.');
  }
  assertString(value.version, 'component spec.version');
  if (!SEMVER.test(value.version)) {
    throw new TypeError('component spec.version must be a three-part semantic version.');
  }
  assertString(value.namespace, 'component spec.namespace');
  if (!NAMESPACE.test(value.namespace) || value.namespace.startsWith('xml')) {
    throw new TypeError(
      'component spec.namespace must be a lowercase custom-element prefix ending in "-".',
    );
  }
  if (!value.id.startsWith(value.namespace)) {
    throw new TypeError('component spec.id must begin with component spec.namespace.');
  }
  assertString(value.summary, 'component spec.summary');
  assertRecord(value.provenance, 'component spec.provenance');
  assertString(value.provenance.intakeRecord, 'component spec.provenance.intakeRecord');
  assertStringArray(value.provenance.sourceIds, 'component spec.provenance.sourceIds');
  if (value.provenance.sourceIds.length === 0) {
    throw new TypeError('component spec.provenance.sourceIds must not be empty.');
  }

  validateSemantics(value.semantics, value.id);
  validateStates(value.states);
  validateEvents(value.events);
  validateBehavior(value.behavior);
  validateAccessibility(value.accessibility);
  validateSecurity(value.security);
  validateAcceptanceTests(value.acceptanceTests);
  validateGeneration(value.generation);
  const spec = value as unknown as ComponentSpec;
  validateTemplateContract(spec);
  return spec;
}

function validateSemantics(value: unknown, componentId: string): void {
  assertRecord(value, 'component spec.semantics');
  if (value.hostElement !== componentId) {
    throw new TypeError('component spec.semantics.hostElement must equal component spec.id.');
  }
  assertStringArray(value.permittedRoles, 'component spec.semantics.permittedRoles');
  if (value.permittedRoles.length === 0) {
    throw new TypeError('component spec.semantics.permittedRoles must not be empty.');
  }
  if (!Array.isArray(value.requiredParts) || value.requiredParts.length === 0) {
    throw new TypeError('component spec.semantics.requiredParts must not be empty.');
  }
  for (const [index, part] of value.requiredParts.entries()) {
    assertRecord(part, `component spec.semantics.requiredParts[${String(index)}]`);
    assertString(part.name, `component spec.semantics.requiredParts[${String(index)}].name`);
    assertString(
      part.selector,
      `component spec.semantics.requiredParts[${String(index)}].selector`,
    );
    assertString(
      part.nativeElement,
      `component spec.semantics.requiredParts[${String(index)}].nativeElement`,
    );
    assertStringArray(
      part.requirements,
      `component spec.semantics.requiredParts[${String(index)}].requirements`,
    );
  }
}

function validateStates(value: unknown): void {
  if (!Array.isArray(value) || value.length === 0) {
    throw new TypeError('component spec.states must not be empty.');
  }
  for (const [index, state] of value.entries()) {
    assertRecord(state, `component spec.states[${String(index)}]`);
    assertString(state.name, `component spec.states[${String(index)}].name`);
    assertStringArray(state.values, `component spec.states[${String(index)}].values`);
    assertString(state.initial, `component spec.states[${String(index)}].initial`);
    if (!state.values.includes(state.initial)) {
      throw new TypeError(`component spec.states[${String(index)}].initial must be in values.`);
    }
  }
}

function validateEvents(value: unknown): void {
  if (!Array.isArray(value)) {
    throw new TypeError('component spec.events must be an array.');
  }
  for (const [index, event] of value.entries()) {
    assertRecord(event, `component spec.events[${String(index)}]`);
    assertString(event.name, `component spec.events[${String(index)}].name`);
    if (typeof event.bubbles !== 'boolean' || typeof event.composed !== 'boolean') {
      throw new TypeError(`component spec.events[${String(index)}] flags must be booleans.`);
    }
    assertRecord(event.detail, `component spec.events[${String(index)}].detail`);
  }
}

function validateBehavior(value: unknown): void {
  if (!Array.isArray(value) || value.length === 0) {
    throw new TypeError('component spec.behavior must not be empty.');
  }
  const ids = new Set<string>();
  for (const [index, rule] of value.entries()) {
    assertRecord(rule, `component spec.behavior[${String(index)}]`);
    assertString(rule.id, `component spec.behavior[${String(index)}].id`);
    assertString(rule.given, `component spec.behavior[${String(index)}].given`);
    assertString(rule.when, `component spec.behavior[${String(index)}].when`);
    assertStringArray(rule.then, `component spec.behavior[${String(index)}].then`);
    if (ids.has(rule.id)) {
      throw new TypeError(`component spec.behavior id "${rule.id}" is duplicated.`);
    }
    ids.add(rule.id);
  }
}

function validateAccessibility(value: unknown): void {
  assertRecord(value, 'component spec.accessibility');
  if (value.target !== 'WCAG 2.2 AA') {
    throw new TypeError('component spec.accessibility.target must be "WCAG 2.2 AA".');
  }
  for (const field of ['keyboard', 'naming', 'screenReader', 'forcedColors', 'reducedMotion']) {
    assertStringArray(value[field], `component spec.accessibility.${field}`);
  }
}

function validateSecurity(value: unknown): void {
  assertRecord(value, 'component spec.security');
  assertStringArray(value.allowedCapabilities, 'component spec.security.allowedCapabilities');
  assertStringArray(value.forbiddenCapabilities, 'component spec.security.forbiddenCapabilities');
  for (const capability of REQUIRED_FORBIDDEN_CAPABILITIES) {
    if (!value.forbiddenCapabilities.includes(capability)) {
      throw new TypeError(`component spec.security must forbid "${capability}".`);
    }
  }
  for (const capability of value.allowedCapabilities) {
    if (!ALLOWED_CAPABILITIES.has(capability)) {
      throw new TypeError(`component spec.security cannot allow "${capability}" in V1.`);
    }
    if (value.forbiddenCapabilities.includes(capability)) {
      throw new TypeError(`component spec.security both allows and forbids "${capability}".`);
    }
  }
}

function validateAcceptanceTests(value: unknown): void {
  if (!Array.isArray(value) || value.length === 0) {
    throw new TypeError('component spec.acceptanceTests must not be empty.');
  }
  const ids = new Set<string>();
  const levels = new Set<string>();
  for (const [index, test] of value.entries()) {
    assertRecord(test, `component spec.acceptanceTests[${String(index)}]`);
    assertString(test.id, `component spec.acceptanceTests[${String(index)}].id`);
    assertString(test.level, `component spec.acceptanceTests[${String(index)}].level`);
    assertString(test.assertion, `component spec.acceptanceTests[${String(index)}].assertion`);
    if (ids.has(test.id)) {
      throw new TypeError(`component spec.acceptanceTests id "${test.id}" is duplicated.`);
    }
    ids.add(test.id);
    levels.add(test.level);
  }
  for (const level of REQUIRED_LEVELS) {
    if (!levels.has(level)) {
      throw new TypeError(`component spec.acceptanceTests must include level "${level}".`);
    }
  }
}

function validateGeneration(value: unknown): void {
  assertRecord(value, 'component spec.generation');
  const expected = {
    generatorVersion: '1.0.0',
    templateId: 'dismissible-alert.v1',
    promptVersion: 'v1',
    skillVersion: 'v1',
  } as const;
  for (const [key, expectedValue] of Object.entries(expected)) {
    if (value[key] !== expectedValue) {
      throw new TypeError(`component spec.generation.${key} must be "${expectedValue}".`);
    }
  }
}

function validateTemplateContract(spec: ComponentSpec): void {
  const eventPrefix = spec.namespace.slice(0, -1);
  const expectedEvents = new Map([
    [`${eventPrefix}-dismiss`, 'dismissed'],
    [`${eventPrefix}-config-error`, 'code'],
  ]);
  if (spec.events.length !== expectedEvents.size) {
    throw new TypeError(
      'dismissible-alert.v1 requires exactly its dismiss and config-error events.',
    );
  }
  for (const [name, detailKey] of expectedEvents) {
    const event = spec.events.find((candidate) => candidate.name === name);
    if (!event?.bubbles || !event.composed || !(detailKey in event.detail)) {
      throw new TypeError(`dismissible-alert.v1 event "${name}" is incomplete.`);
    }
  }
  if (
    spec.semantics.permittedRoles.length !== 2 ||
    !spec.semantics.permittedRoles.includes('alert') ||
    !spec.semantics.permittedRoles.includes('status')
  ) {
    throw new TypeError('dismissible-alert.v1 permits exactly the alert and status roles.');
  }
  const dismissControl = spec.semantics.requiredParts.find(
    (part) => part.name === 'dismiss-control',
  );
  if (
    !dismissControl?.nativeElement ||
    dismissControl.nativeElement !== 'button' ||
    dismissControl.selector !== ':scope > button[data-dismiss]'
  ) {
    throw new TypeError('dismissible-alert.v1 requires its direct native dismiss button contract.');
  }
  const visibility = spec.states.find((state) => state.name === 'visibility');
  if (
    !visibility?.initial ||
    visibility.initial !== 'visible' ||
    !visibility.values.includes('visible') ||
    !visibility.values.includes('dismissed')
  ) {
    throw new TypeError('dismissible-alert.v1 requires visible and dismissed visibility states.');
  }
}

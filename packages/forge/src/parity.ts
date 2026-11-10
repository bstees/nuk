import ts from 'typescript';

import type { ComponentSpec } from './types.ts';
import { sha256 } from './util.ts';

export interface ParityCaseResult {
  readonly id: string;
  readonly passed: boolean;
  readonly detail: string;
}

export interface ParityReport {
  readonly schemaVersion: '1.0.0';
  readonly harnessVersion: '1.0.0';
  readonly contractBasis: 'normalized-public-behavior';
  readonly sourceDigest: string;
  readonly passed: boolean;
  readonly cases: readonly ParityCaseResult[];
}

type FakeListener = (event: FakeCustomEvent) => void;

class FakeCustomEvent {
  readonly type: string;
  readonly bubbles: boolean;
  readonly composed: boolean;
  readonly detail: unknown;

  constructor(
    type: string,
    init: {
      readonly bubbles?: boolean;
      readonly composed?: boolean;
      readonly detail?: unknown;
    } = {},
  ) {
    this.type = type;
    this.bubbles = init.bubbles ?? false;
    this.composed = init.composed ?? false;
    this.detail = init.detail;
  }
}

class FakeHTMLElement {
  readonly dataset: Record<string, string> = {};
  readonly dispatchedEvents: FakeCustomEvent[] = [];
  hidden = false;
  textContent: string | null = null;
  #attributes = new Map<string, string>();
  #listeners = new Map<string, Set<FakeListener>>();
  #queryResult: FakeHTMLElement | null = null;

  addEventListener(type: string, listener: FakeListener): void {
    const listeners = this.#listeners.get(type) ?? new Set<FakeListener>();
    listeners.add(listener);
    this.#listeners.set(type, listeners);
  }

  removeEventListener(type: string, listener: FakeListener): void {
    this.#listeners.get(type)?.delete(listener);
  }

  dispatchEvent(event: FakeCustomEvent): boolean {
    this.dispatchedEvents.push(event);
    for (const listener of this.#listeners.get(event.type) ?? []) {
      listener(event);
    }
    return true;
  }

  getAttribute(name: string): string | null {
    return this.#attributes.get(name) ?? null;
  }

  setAttribute(name: string, value: string): void {
    this.#attributes.set(name, value);
  }

  querySelector(): FakeHTMLElement | null {
    return this.#queryResult;
  }

  setQueryResult(result: FakeHTMLElement | null): void {
    this.#queryResult = result;
  }

  emit(type: string): void {
    this.dispatchEvent(new FakeCustomEvent(type));
  }

  listenerCount(type: string): number {
    return this.#listeners.get(type)?.size ?? 0;
  }
}

class FakeHTMLButtonElement extends FakeHTMLElement {}

interface RuntimeComponent extends FakeHTMLElement {
  connectedCallback(): void;
  disconnectedCallback(): void;
  dismiss(): void;
  reset(): void;
}

type RuntimeConstructor = new () => RuntimeComponent;

class FakeCustomElementRegistry {
  readonly #constructors = new Map<string, RuntimeConstructor>();

  define(name: string, constructor: RuntimeConstructor): void {
    if (this.#constructors.has(name)) {
      throw new Error(`Custom element "${name}" was defined twice.`);
    }
    this.#constructors.set(name, constructor);
  }

  get(name: string): RuntimeConstructor | undefined {
    return this.#constructors.get(name);
  }
}

let moduleSequence = 0;

export async function runBehaviorParity(
  spec: ComponentSpec,
  source: string,
): Promise<ParityReport> {
  const transpiled = ts.transpileModule(source, {
    fileName: `${spec.id}.ts`,
    reportDiagnostics: true,
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2023,
      useDefineForClassFields: true,
    },
  });
  const errors = (transpiled.diagnostics ?? []).filter(
    (diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error,
  );
  if (errors.length > 0) {
    const message = errors
      .map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'))
      .join('; ');
    throw new Error(`Candidate could not be transpiled for parity checks: ${message}`);
  }

  const registry = new FakeCustomElementRegistry();
  const replacements = new Map<PropertyKey, PropertyDescriptor | undefined>();
  for (const [key, value] of [
    ['HTMLElement', FakeHTMLElement],
    ['HTMLButtonElement', FakeHTMLButtonElement],
    ['CustomEvent', FakeCustomEvent],
    ['customElements', registry],
  ] as const) {
    replacements.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  }

  try {
    moduleSequence += 1;
    const encoded = Buffer.from(transpiled.outputText, 'utf8').toString('base64');
    await import(`data:text/javascript;base64,${encoded}#forge-${String(moduleSequence)}`);
    const Constructor = registry.get(spec.id);
    if (!Constructor) {
      throw new Error(`Candidate did not register ${spec.id}.`);
    }
    const eventPrefix = spec.namespace.slice(0, -1);
    const dismissEvent = `${eventPrefix}-dismiss`;
    const configEvent = `${eventPrefix}-config-error`;
    const cases = [
      runCase('BEH-001', 'native button activation dismisses once with the public event', () => {
        const { host, button } = validFixture(Constructor);
        host.connectedCallback();
        button.emit('click');
        button.emit('click');
        const events = host.dispatchedEvents.filter((event) => event.type === dismissEvent);
        const detail = events[0]?.detail as { readonly dismissed?: unknown } | undefined;
        return Boolean(
          host.hidden &&
          host.dataset.state === 'dismissed' &&
          events.length === 1 &&
          events[0]?.bubbles &&
          events[0]?.composed &&
          detail?.dismissed,
        );
      }),
      runCase('BEH-002', 'reset restores visible state without a dismiss event', () => {
        const { host } = validFixture(Constructor);
        host.connectedCallback();
        host.dismiss();
        const before = host.dispatchedEvents.length;
        host.reset();
        return (
          !host.hidden &&
          host.dataset.state === 'visible' &&
          host.dispatchedEvents.length === before
        );
      }),
      runCase(
        'BEH-003',
        'reconnection keeps at most one listener and disconnect cleans it up',
        () => {
          const { host, button } = validFixture(Constructor);
          host.connectedCallback();
          host.connectedCallback();
          const oneListener = button.listenerCount('click') === 1;
          host.disconnectedCallback();
          return oneListener && button.listenerCount('click') === 0;
        },
      ),
      runCase('ACC-003', 'invalid role and missing control surface configuration errors', () => {
        const invalidRole = new Constructor();
        invalidRole.setAttribute('role', 'dialog');
        invalidRole.connectedCallback();
        const missingControl = new Constructor();
        missingControl.connectedCallback();
        return [invalidRole, missingControl].every(
          (host) =>
            host.dispatchedEvents.filter((event) => event.type === configEvent).length === 1 &&
            !host.hidden,
        );
      }),
    ];
    return {
      schemaVersion: '1.0.0',
      harnessVersion: '1.0.0',
      contractBasis: 'normalized-public-behavior',
      sourceDigest: sha256(source),
      passed: cases.every((testCase) => testCase.passed),
      cases,
    };
  } finally {
    for (const [key, descriptor] of replacements) {
      if (descriptor) {
        Object.defineProperty(globalThis, key, descriptor);
      } else {
        Reflect.deleteProperty(globalThis, key);
      }
    }
  }
}

function validFixture(Constructor: RuntimeConstructor): {
  readonly host: RuntimeComponent;
  readonly button: FakeHTMLButtonElement;
} {
  const host = new Constructor();
  const button = new FakeHTMLButtonElement();
  button.setAttribute('type', 'button');
  button.setAttribute('aria-label', 'Dismiss notification');
  host.setQueryResult(button);
  return { host, button };
}

function runCase(id: string, detail: string, assertion: () => boolean): ParityCaseResult {
  try {
    const passed = assertion();
    return { id, passed, detail: passed ? detail : `${detail}: assertion returned false` };
  } catch (error) {
    return {
      id,
      passed: false,
      detail: `${detail}: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

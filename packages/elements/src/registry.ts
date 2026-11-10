import { NukButton, NukLink } from './actions.js';
import { NukCheckbox, NukRadio, NukSwitch } from './check-controls.js';
import { NukAlert, NukCard, NukStatus, NukTable } from './data-display.js';
import { NukDialog } from './dialog.js';
import { NukDisclosure } from './disclosure.js';
import { NukField } from './field.js';
import { NukCluster, NukGrid, NukStack } from './layout.js';
import { NukMenu, NukMenuItem } from './menu.js';
import { NukBreadcrumbs, NukNav } from './navigation.js';
import { NukTab, NukTabPanel, NukTabs } from './tabs.js';
import { NukSelect, NukTextField, NukTextarea } from './text-controls.js';
import { createTagNames, eventName, normalizeElementPrefix } from './prefix.js';
import type { ElementName, ElementTagNames } from './prefix.js';

export {
  createStructuralStyles,
  createTagNames,
  DEFAULT_ELEMENT_PREFIX,
  elementNames,
  eventName,
  normalizeElementPrefix,
  tagName,
} from './prefix.js';
export type { ElementName, ElementTagNames } from './prefix.js';

export const elementDefinitions = {
  alert: NukAlert,
  breadcrumbs: NukBreadcrumbs,
  button: NukButton,
  card: NukCard,
  checkbox: NukCheckbox,
  cluster: NukCluster,
  dialog: NukDialog,
  disclosure: NukDisclosure,
  field: NukField,
  grid: NukGrid,
  link: NukLink,
  menu: NukMenu,
  'menu-item': NukMenuItem,
  nav: NukNav,
  radio: NukRadio,
  select: NukSelect,
  stack: NukStack,
  status: NukStatus,
  switch: NukSwitch,
  tab: NukTab,
  'tab-panel': NukTabPanel,
  table: NukTable,
  tabs: NukTabs,
  'text-field': NukTextField,
  textarea: NukTextarea,
} as const satisfies Readonly<Record<ElementName, CustomElementConstructor>>;

const REGISTRATION_MARKER = Symbol.for('@nuk-ui/elements.registration');

interface RegistrationMarker {
  readonly component: ElementName;
  readonly prefix: string;
}

interface MarkedConstructor extends CustomElementConstructor {
  readonly [REGISTRATION_MARKER]?: RegistrationMarker;
  readonly nukComponentName?: ElementName;
  readonly nukElementPrefix?: string;
}

export interface DefineElementsOptions {
  /** Prefix with or without its trailing hyphen. Defaults to `nuk-`. */
  readonly prefix?: string;
  /** A scoped or global registry. Defaults to the current global `customElements` registry. */
  readonly registry?: CustomElementRegistry;
}

export interface DefinedElements {
  /** Normalized prefix including its trailing hyphen. */
  readonly prefix: `${string}-`;
  readonly tags: ElementTagNames;
  /** Return the public event name for this configured registry. */
  event(name: string): `${string}-${string}`;
}

function globalRegistry(): CustomElementRegistry {
  if (typeof customElements === 'undefined') {
    throw new Error(
      'No CustomElementRegistry is available. Call defineElements() in a browser, or pass a scoped registry.',
    );
  }
  return customElements;
}

function registeredConstructor(
  constructor: CustomElementConstructor,
  prefix: string,
  component: ElementName,
): CustomElementConstructor {
  const RegisteredElement = class extends constructor {};
  Object.defineProperties(RegisteredElement, {
    [REGISTRATION_MARKER]: {
      value: Object.freeze({ component, prefix } satisfies RegistrationMarker),
    },
    nukComponentName: { value: component },
    nukElementPrefix: { value: prefix },
  });
  return RegisteredElement;
}

/**
 * Register every nuk component under one prefix.
 *
 * Fresh subclasses are registered so the same behavior can safely appear under two different
 * prefixes in separate registries—or, when genuinely necessary, in the same page.
 */
export function defineElements(options: DefineElementsOptions = {}): DefinedElements {
  const prefix = normalizeElementPrefix(options.prefix);
  const registry = options.registry ?? globalRegistry();
  const tags = createTagNames(prefix);

  for (const [component, constructor] of Object.entries(elementDefinitions) as [
    ElementName,
    CustomElementConstructor,
  ][]) {
    const name = tags[component];
    const existing = registry.get(name) as MarkedConstructor | undefined;
    if (existing !== undefined) {
      const marker = existing[REGISTRATION_MARKER];
      if (marker?.component === component && marker.prefix === prefix) continue;
      throw new Error(`Cannot register ${name}: another constructor already owns that tag name.`);
    }
    registry.define(name, registeredConstructor(constructor, prefix, component));
  }

  return Object.freeze({
    event: (name: string) => eventName(prefix, name),
    prefix: `${prefix}-` as const,
    tags,
  });
}

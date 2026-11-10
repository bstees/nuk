export const DEFAULT_ELEMENT_PREFIX = 'nuk' as const;

export const elementNames = [
  'alert',
  'breadcrumbs',
  'button',
  'card',
  'checkbox',
  'cluster',
  'dialog',
  'disclosure',
  'field',
  'grid',
  'link',
  'menu',
  'menu-item',
  'nav',
  'radio',
  'select',
  'stack',
  'status',
  'switch',
  'tab',
  'tab-panel',
  'table',
  'tabs',
  'text-field',
  'textarea',
] as const;

export type ElementName = (typeof elementNames)[number];
export type ElementTagNames = Readonly<Record<ElementName, `${string}-${ElementName}`>>;

const PREFIX_PATTERN = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/u;

export function normalizeElementPrefix(value: string = DEFAULT_ELEMENT_PREFIX): string {
  const prefix = value.endsWith('-') ? value.slice(0, -1) : value;
  if (!PREFIX_PATTERN.test(prefix)) {
    throw new TypeError(
      `Invalid custom-element prefix "${value}". Use lowercase ASCII letters, digits, and internal hyphens; for example "nuk" or "acme-ui".`,
    );
  }
  if (prefix.startsWith('xml')) {
    throw new TypeError('Custom-element prefixes beginning with "xml" are reserved.');
  }
  return prefix;
}

export function tagName(prefix: string, component: ElementName): `${string}-${ElementName}` {
  return `${normalizeElementPrefix(prefix)}-${component}`;
}

export function eventName(prefix: string, event: string): `${string}-${string}` {
  if (!/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/u.test(event)) {
    throw new TypeError(`Invalid custom-element event suffix "${event}".`);
  }
  return `${normalizeElementPrefix(prefix)}-${event}`;
}

export function createTagNames(prefix: string = DEFAULT_ELEMENT_PREFIX): ElementTagNames {
  return Object.fromEntries(
    elementNames.map((component) => [component, tagName(prefix, component)]),
  ) as ElementTagNames;
}

/** Generate the small global fallback sheet for a non-default prefix. */
export function createStructuralStyles(prefix: string = DEFAULT_ELEMENT_PREFIX): string {
  const tags = Object.values(createTagNames(prefix));
  const blocks: ElementName[] = [
    'alert',
    'breadcrumbs',
    'card',
    'cluster',
    'disclosure',
    'field',
    'grid',
    'menu-item',
    'nav',
    'stack',
    'status',
    'tab-panel',
    'table',
    'tabs',
  ];
  const blockSelectors = blocks.map((component) => tagName(prefix, component)).join(',\n    ');
  const inlineBlocks: ElementName[] = [
    'button',
    'checkbox',
    'link',
    'radio',
    'select',
    'switch',
    'tab',
    'text-field',
    'textarea',
  ];
  const inlineSelectors = inlineBlocks
    .map((component) => tagName(prefix, component))
    .join(',\n    ');
  const hiddenBeforeUpgrade = [tagName(prefix, 'dialog'), tagName(prefix, 'menu')].join(', ');
  return `@layer nuk.elements {\n  :where(${tags.join(', ')}) { box-sizing: border-box; }\n  :where(${blockSelectors}) { display: block; }\n  :where(${inlineSelectors}) { display: inline-block; }\n  :where(${hiddenBeforeUpgrade}):not(:defined) { display: none; }\n  :where([hidden]) { display: none !important; }\n}\n`;
}

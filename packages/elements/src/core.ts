let idSequence = 0;

export function uniqueId(prefix: string): string {
  idSequence += 1;
  return `${prefix}-${idSequence.toString(36)}`;
}

export function booleanAttribute(element: Element, name: string): boolean {
  return element.hasAttribute(name);
}

export function reflectBoolean(element: Element, name: string, value: boolean): void {
  element.toggleAttribute(name, value);
}

export function reflectString(element: Element, name: string, value: string): void {
  if (value === '') {
    element.removeAttribute(name);
  } else {
    element.setAttribute(name, value);
  }
}

export function createTemplate(markup: string): HTMLTemplateElement {
  const template = document.createElement('template');
  template.innerHTML = markup;
  return template;
}

interface RegisteredElementConstructor extends CustomElementConstructor {
  readonly nukComponentName?: string;
  readonly nukElementPrefix?: string;
}

export abstract class NukElement extends HTMLElement {
  static readonly nukElementPrefix = 'nuk';

  protected readonly root: ShadowRoot;

  protected constructor(template: HTMLTemplateElement, styles: string, delegatesFocus = true) {
    super();
    this.root = this.attachShadow({ delegatesFocus, mode: 'open' });
    const style = document.createElement('style');
    style.textContent = styles;
    this.root.append(style, template.content.cloneNode(true));
  }

  /**
   * Dispatch a public event using the prefix selected when this element was registered.
   * Callers pass the semantic event suffix (`change`, not `nuk-change`).
   */
  protected emit(name: string, detail: unknown): boolean {
    const constructor = this.constructor as RegisteredElementConstructor;
    const prefix = constructor.nukElementPrefix ?? NukElement.nukElementPrefix;
    return this.dispatchEvent(
      new CustomEvent(`${prefix}-${name}`, {
        bubbles: true,
        cancelable: true,
        composed: true,
        detail,
      }),
    );
  }

  /** The logical component name is stable even when a registry uses a custom tag prefix. */
  get componentName(): string {
    const constructor = this.constructor as RegisteredElementConstructor;
    return (
      constructor.nukComponentName ?? this.localName.slice(this.localName.lastIndexOf('-') + 1)
    );
  }

  /** The configured prefix without its trailing hyphen. */
  get elementPrefix(): string {
    const constructor = this.constructor as RegisteredElementConstructor;
    return constructor.nukElementPrefix ?? NukElement.nukElementPrefix;
  }
}

export function isElementDisabled(element: Element): boolean {
  return element.hasAttribute('disabled') || element.getAttribute('aria-disabled') === 'true';
}

export function textFromSlot(slot: HTMLSlotElement): string {
  return slot
    .assignedNodes({ flatten: true })
    .map((node) => node.textContent ?? '')
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function setReflectedProperty(
  element: Element,
  attribute: string,
  value: string | null | undefined,
): void {
  if (value === null || value === undefined || value === '') {
    element.removeAttribute(attribute);
  } else {
    element.setAttribute(attribute, value);
  }
}

import {
  NukElement,
  booleanAttribute,
  createTemplate,
  reflectBoolean,
  reflectString,
} from './core.js';

const buttonTemplate = createTemplate(`<button part="button" type="button"><slot></slot></button>`);
const buttonStyles = `
  @layer nuk.components {
    :host { display: inline-block; font: inherit; }
    button {
      align-items: center;
      background: var(--nuk-color-accent, ButtonFace);
      border: var(--nuk-border-width, 1px) solid transparent;
      border-radius: var(--nuk-radius-sm, 0.25rem);
      color: var(--nuk-color-on-accent, ButtonText);
      cursor: pointer;
      display: inline-flex;
      font: inherit;
      font-weight: 650;
      gap: 0.5em;
      justify-content: center;
      min-block-size: 2.75em;
      padding-block: 0.55em;
      padding-inline: 1em;
      text-align: center;
    }
    button:hover:not(:disabled) { background: var(--nuk-color-accent-hover, Highlight); }
    button:focus-visible {
      outline: var(--nuk-focus-width, 0.1875rem) solid var(--nuk-color-focus, Highlight);
      outline-offset: 0.125rem;
    }
    button:disabled { cursor: not-allowed; opacity: 0.62; }
    :host([variant='secondary']) button {
      background: var(--nuk-color-surface, ButtonFace);
      border-color: var(--nuk-color-border, ButtonBorder);
      color: var(--nuk-color-text, ButtonText);
    }
    :host([variant='quiet']) button {
      background: transparent;
      color: var(--nuk-color-accent, LinkText);
    }
    @media (forced-colors: active) {
      button { border-color: ButtonBorder; forced-color-adjust: auto; }
      button:disabled { opacity: 1; }
    }
    @media (prefers-reduced-motion: no-preference) {
      button { transition: background-color var(--nuk-duration-fast, 120ms) ease; }
    }
  }
`;

export type NukButtonType = 'button' | 'reset' | 'submit';

export class NukButton extends NukElement {
  static readonly formAssociated = true;
  static readonly observedAttributes = ['disabled', 'label', 'type'];

  private readonly button: HTMLButtonElement;
  private readonly internals: ElementInternals | null;

  constructor() {
    super(buttonTemplate, buttonStyles);
    this.button = this.root.querySelector('button') as HTMLButtonElement;
    this.internals = typeof this.attachInternals === 'function' ? this.attachInternals() : null;
    this.button.addEventListener('click', (event) => {
      if (this.disabled) return;
      this.emit('press', { source: event.detail === 0 ? 'keyboard' : 'pointer' });
      this.runFormAction();
    });
  }

  get form(): HTMLFormElement | null {
    return this.internals?.form ?? this.closest('form');
  }

  get disabled(): boolean {
    return booleanAttribute(this, 'disabled');
  }

  set disabled(value: boolean) {
    reflectBoolean(this, 'disabled', value);
  }

  get type(): NukButtonType {
    const value = this.getAttribute('type');
    return value === 'submit' || value === 'reset' ? value : 'button';
  }

  set type(value: NukButtonType) {
    reflectString(this, 'type', value);
  }

  get value(): string {
    return this.getAttribute('value') ?? '';
  }

  set value(value: string) {
    reflectString(this, 'value', value);
  }

  connectedCallback(): void {
    this.sync();
  }

  attributeChangedCallback(): void {
    this.sync();
  }

  formDisabledCallback(disabled: boolean): void {
    this.button.disabled = disabled || this.disabled;
  }

  override focus(options?: FocusOptions): void {
    this.button.focus(options);
  }

  private sync(): void {
    this.button.disabled = this.disabled;
    const label = this.getAttribute('label');
    if (label === null) this.button.removeAttribute('aria-label');
    else this.button.setAttribute('aria-label', label);
  }

  private runFormAction(): void {
    const form = this.form;
    if (form === null) return;
    if (this.type === 'reset') {
      form.reset();
      return;
    }
    if (this.type !== 'submit') return;

    const name = this.getAttribute('name');
    let submittedValue: HTMLInputElement | null = null;
    if (name !== null && name !== '') {
      submittedValue = document.createElement('input');
      submittedValue.type = 'hidden';
      submittedValue.name = name;
      submittedValue.value = this.value;
      form.append(submittedValue);
    }
    if (this.hasAttribute('formnovalidate')) form.noValidate = true;
    try {
      form.requestSubmit();
    } finally {
      submittedValue?.remove();
    }
  }
}

const linkTemplate = createTemplate(`<a part="link"><slot></slot></a>`);
const linkStyles = `
  @layer nuk.components {
    :host { display: inline; font: inherit; }
    a { color: var(--nuk-color-accent, LinkText); text-underline-offset: 0.18em; }
    a:hover { color: var(--nuk-color-accent-hover, LinkText); text-decoration-thickness: 0.125em; }
    a:focus-visible {
      border-radius: var(--nuk-radius-sm, 0.25rem);
      outline: var(--nuk-focus-width, 0.1875rem) solid var(--nuk-color-focus, Highlight);
      outline-offset: 0.125rem;
    }
    @media (forced-colors: active) { a { color: LinkText; } }
  }
`;

export class NukLink extends NukElement {
  static readonly observedAttributes = ['download', 'href', 'hreflang', 'label', 'rel', 'target'];
  private readonly anchor: HTMLAnchorElement;

  constructor() {
    super(linkTemplate, linkStyles);
    this.anchor = this.root.querySelector('a') as HTMLAnchorElement;
  }

  get href(): string {
    return this.getAttribute('href') ?? '';
  }

  set href(value: string) {
    reflectString(this, 'href', value);
  }

  connectedCallback(): void {
    this.sync();
  }

  attributeChangedCallback(): void {
    this.sync();
  }

  override focus(options?: FocusOptions): void {
    this.anchor.focus(options);
  }

  private sync(): void {
    for (const name of ['download', 'href', 'hreflang', 'rel', 'target'] as const) {
      const value = this.getAttribute(name);
      if (value === null) this.anchor.removeAttribute(name);
      else this.anchor.setAttribute(name, value);
    }
    const label = this.getAttribute('label');
    if (label === null) this.anchor.removeAttribute('aria-label');
    else this.anchor.setAttribute('aria-label', label);
  }
}

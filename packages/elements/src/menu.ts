import {
  NukElement,
  createTemplate,
  isElementDisabled,
  reflectBoolean,
  reflectString,
} from './core.js';

const menuItemTemplate = createTemplate(
  `<button part="item" role="menuitem" type="button"><slot></slot></button>`,
);
const menuItemStyles = `
  @layer nuk.components {
    :host { display: block; font: inherit; }
    button {
      background: transparent;
      border: 0;
      border-radius: var(--nuk-radius-sm, 0.25rem);
      color: var(--nuk-color-text, CanvasText);
      cursor: pointer;
      display: block;
      font: inherit;
      inline-size: 100%;
      padding-block: 0.55em;
      padding-inline: 0.75em;
      text-align: start;
    }
    button:hover:not(:disabled), button:focus-visible { background: var(--nuk-color-surface, ButtonFace); }
    button:focus-visible { outline: var(--nuk-focus-width, 0.1875rem) solid var(--nuk-color-focus, Highlight); }
    button:disabled { cursor: not-allowed; opacity: 0.62; }
    @media (forced-colors: active) { button:disabled { opacity: 1; } }
  }
`;

export class NukMenuItem extends NukElement {
  static readonly observedAttributes = ['disabled'];
  private readonly button: HTMLButtonElement;

  constructor() {
    super(menuItemTemplate, menuItemStyles);
    this.button = this.root.querySelector('button') as HTMLButtonElement;
  }

  get disabled(): boolean {
    return this.hasAttribute('disabled');
  }

  set disabled(value: boolean) {
    reflectBoolean(this, 'disabled', value);
  }

  get value(): string {
    return this.getAttribute('value') ?? this.textContent?.trim() ?? '';
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

  override focus(options?: FocusOptions): void {
    this.button.focus(options);
  }

  private sync(): void {
    this.button.disabled = this.disabled;
    this.button.tabIndex = -1;
  }
}

const menuTemplate = createTemplate(`
  <button part="trigger" type="button" aria-haspopup="menu" aria-expanded="false"><slot name="trigger">Menu</slot></button>
  <div part="popover" role="menu" popover="manual"><slot></slot></div>
`);
const menuStyles = `
  @layer nuk.components {
    :host { display: inline-block; font: inherit; position: relative; }
    [part='trigger'] {
      background: var(--nuk-color-surface, ButtonFace);
      border: var(--nuk-border-width, 1px) solid var(--nuk-color-border, ButtonBorder);
      border-radius: var(--nuk-radius-sm, 0.25rem);
      color: var(--nuk-color-text, ButtonText);
      cursor: pointer;
      font: inherit;
      min-block-size: 2.75em;
      padding-block: 0.55em;
      padding-inline: 0.85em;
    }
    [part='trigger']:focus-visible {
      outline: var(--nuk-focus-width, 0.1875rem) solid var(--nuk-color-focus, Highlight);
      outline-offset: 0.125rem;
    }
    [part='popover'] {
      background: var(--nuk-color-surface-raised, Canvas);
      border: var(--nuk-border-width, 1px) solid var(--nuk-color-border, ButtonBorder);
      border-radius: var(--nuk-radius-md, 0.5rem);
      box-shadow: var(--nuk-shadow-md, 0 0.5rem 1.5rem rgb(0 0 0 / 0.2));
      color: var(--nuk-color-text, CanvasText);
      inline-size: max-content;
      margin: var(--nuk-space-1, 0.25rem) 0 0;
      max-inline-size: min(20rem, calc(100vi - 2rem));
      padding: var(--nuk-space-1, 0.25rem);
      position: absolute;
      inset-block-start: 100%;
      inset-inline-start: 0;
      z-index: var(--nuk-z-menu, 20);
    }
    [part='popover']:popover-open { position: fixed; }
    @media (forced-colors: active) { [part='popover'] { box-shadow: none; } }
    @media (prefers-reduced-motion: no-preference) {
      [part='popover']:popover-open { animation: nuk-menu-enter var(--nuk-duration-fast, 120ms) ease-out; }
      @keyframes nuk-menu-enter { from { opacity: 0; transform: translateY(-0.25rem); } }
    }
  }
`;

export class NukMenu extends NukElement {
  static readonly observedAttributes = ['disabled', 'label', 'open'];
  private readonly popoverPanel: HTMLElement;
  private readonly trigger: HTMLButtonElement;
  private readonly itemSlot: HTMLSlotElement;
  private items: NukMenuItem[] = [];
  private readonly handleOutsidePointer = (event: PointerEvent): void => {
    if (!event.composedPath().includes(this)) this.close(false);
  };

  constructor() {
    super(menuTemplate, menuStyles);
    this.popoverPanel = this.root.querySelector('[part="popover"]') as HTMLElement;
    this.trigger = this.root.querySelector('[part="trigger"]') as HTMLButtonElement;
    this.itemSlot = this.root.querySelector('slot:not([name])') as HTMLSlotElement;
    this.itemSlot.addEventListener('slotchange', () => this.collectItems());
    this.trigger.addEventListener('click', () => (this.open ? this.close(false) : this.show(0)));
    this.trigger.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        this.show(event.key === 'ArrowUp' ? -1 : 0);
      }
    });
    this.addEventListener('click', (event) => this.selectItem(event));
    this.addEventListener('keydown', (event) => this.handleKeydown(event));
  }

  get open(): boolean {
    return this.hasAttribute('open');
  }

  set open(value: boolean) {
    reflectBoolean(this, 'open', value);
  }

  connectedCallback(): void {
    this.collectItems();
    this.sync();
  }

  disconnectedCallback(): void {
    document.removeEventListener('pointerdown', this.handleOutsidePointer, true);
  }

  attributeChangedCallback(): void {
    this.sync();
  }

  show(focusIndex = 0): void {
    if (this.hasAttribute('disabled')) return;
    if (typeof this.popoverPanel.showPopover === 'function') this.popoverPanel.showPopover();
    else this.popoverPanel.hidden = false;
    reflectBoolean(this, 'open', true);
    this.trigger.setAttribute('aria-expanded', 'true');
    document.addEventListener('pointerdown', this.handleOutsidePointer, true);
    const enabled = this.items.filter((item) => !item.disabled);
    const target = focusIndex < 0 ? enabled.at(-1) : enabled[focusIndex];
    target?.focus();
    this.emit('toggle', { open: true });
  }

  close(restoreFocus = true): void {
    if (typeof this.popoverPanel.hidePopover === 'function') {
      if (this.popoverPanel.matches(':popover-open')) this.popoverPanel.hidePopover();
    } else {
      this.popoverPanel.hidden = true;
    }
    reflectBoolean(this, 'open', false);
    this.trigger.setAttribute('aria-expanded', 'false');
    document.removeEventListener('pointerdown', this.handleOutsidePointer, true);
    if (restoreFocus) this.trigger.focus();
    this.emit('toggle', { open: false });
  }

  private sync(): void {
    this.trigger.disabled = this.hasAttribute('disabled');
    this.trigger.setAttribute('aria-label', this.getAttribute('label') ?? 'Menu');
    this.trigger.setAttribute('aria-expanded', String(this.open));
    if (!this.open) {
      this.popoverPanel.hidden = typeof this.popoverPanel.showPopover !== 'function';
    }
  }

  private collectItems(): void {
    this.items = this.itemSlot
      .assignedElements({ flatten: true })
      .filter((element): element is NukMenuItem => element instanceof NukMenuItem);
  }

  private eventItem(event: Event): NukMenuItem | undefined {
    return event
      .composedPath()
      .find((target): target is NukMenuItem => target instanceof NukMenuItem);
  }

  private selectItem(event: Event): void {
    const item = this.eventItem(event);
    if (item === undefined || isElementDisabled(item)) return;
    this.emit('select', { item, value: item.value });
    this.close(true);
  }

  private handleKeydown(event: KeyboardEvent): void {
    const currentItem = this.eventItem(event);
    if (currentItem === undefined) return;
    const enabled = this.items.filter((item) => !item.disabled);
    const current = enabled.indexOf(currentItem);
    let nextIndex: number | null = null;
    if (event.key === 'ArrowDown') nextIndex = (current + 1) % enabled.length;
    if (event.key === 'ArrowUp') nextIndex = (current - 1 + enabled.length) % enabled.length;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = enabled.length - 1;
    if (event.key === 'Escape') {
      event.preventDefault();
      this.close(true);
      return;
    }
    if (event.key === 'Tab') {
      this.close(false);
      return;
    }
    if (nextIndex !== null && enabled.length > 0) {
      event.preventDefault();
      enabled[nextIndex]?.focus();
      return;
    }
    if (event.key.length === 1 && /\S/.test(event.key)) {
      const query = event.key.toLocaleLowerCase();
      const match = enabled.find((item) =>
        item.textContent?.trim().toLocaleLowerCase().startsWith(query),
      );
      match?.focus();
    }
  }
}

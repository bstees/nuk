import { NukElement, createTemplate, reflectBoolean, reflectString, uniqueId } from './core.js';

const tabTemplate = createTemplate(`<span part="tab"><slot></slot></span>`);
const tabStyles = `
  @layer nuk.components {
    :host {
      background: transparent;
      border-block-end: 0.1875rem solid transparent;
      color: var(--nuk-color-text-muted, CanvasText);
      cursor: pointer;
      display: inline-block;
      font: inherit;
      font-weight: 650;
      padding-block: 0.75em;
      padding-inline: 1em;
    }
    :host([aria-selected='true']) { border-block-end-color: var(--nuk-color-accent, Highlight); color: var(--nuk-color-text, CanvasText); }
    :host(:focus-visible) {
      border-radius: var(--nuk-radius-sm, 0.25rem);
      outline: var(--nuk-focus-width, 0.1875rem) solid var(--nuk-color-focus, Highlight);
      outline-offset: -0.125rem;
    }
    :host([disabled]) { cursor: not-allowed; opacity: 0.62; }
    @media (forced-colors: active) {
      :host([aria-selected='true']) { border-color: Highlight; }
      :host([disabled]) { opacity: 1; }
    }
  }
`;

export class NukTab extends NukElement {
  static readonly observedAttributes = ['active', 'aria-controls', 'disabled'];

  constructor() {
    // The ARIA tab is the host itself, so focus must remain in light DOM.
    super(tabTemplate, tabStyles, false);
  }

  get active(): boolean {
    return this.hasAttribute('active');
  }

  set active(value: boolean) {
    reflectBoolean(this, 'active', value);
  }

  get disabled(): boolean {
    return this.hasAttribute('disabled');
  }

  set disabled(value: boolean) {
    reflectBoolean(this, 'disabled', value);
  }

  connectedCallback(): void {
    this.setAttribute('role', 'tab');
    this.sync();
  }

  attributeChangedCallback(): void {
    this.sync();
  }

  private sync(): void {
    this.tabIndex = this.active ? 0 : -1;
    this.setAttribute('aria-selected', String(this.active));
    this.setAttribute('aria-disabled', String(this.disabled));
  }
}

const panelTemplate = createTemplate(`<div part="panel"><slot></slot></div>`);
const panelStyles = `
  @layer nuk.components {
    :host { display: block; }
    :host([hidden]) { display: none; }
    [part='panel'] { padding-block: var(--nuk-space-4, 1rem); }
    :host(:focus-visible) {
      outline: var(--nuk-focus-width, 0.1875rem) solid var(--nuk-color-focus, Highlight);
      outline-offset: 0.125rem;
    }
  }
`;

export class NukTabPanel extends NukElement {
  static readonly observedAttributes = ['active', 'aria-labelledby'];

  constructor() {
    // The focusable tabpanel is the host; its shadow content is only structural.
    super(panelTemplate, panelStyles, false);
  }

  get active(): boolean {
    return this.hasAttribute('active');
  }

  set active(value: boolean) {
    reflectBoolean(this, 'active', value);
  }

  connectedCallback(): void {
    this.setAttribute('role', 'tabpanel');
    this.tabIndex = 0;
    this.sync();
  }

  attributeChangedCallback(): void {
    this.sync();
  }

  private sync(): void {
    this.hidden = !this.active;
  }
}

const tabsTemplate = createTemplate(`
  <div part="tablist" role="tablist"><slot name="tab"></slot></div>
  <div part="panels"><slot></slot></div>
`);
const tabsStyles = `
  @layer nuk.components {
    :host { container-type: inline-size; display: block; }
    [part='tablist'] {
      border-block-end: var(--nuk-border-width, 1px) solid var(--nuk-color-border, ButtonBorder);
      display: flex;
      max-inline-size: 100%;
      overflow-x: auto;
      overscroll-behavior-inline: contain;
      scrollbar-width: thin;
    }
    @container (inline-size < 28rem) {
      [part='tablist'] { scroll-snap-type: inline proximity; }
      ::slotted(*) { flex: 0 0 auto; scroll-snap-align: start; }
    }
    :host([orientation='vertical']) { display: grid; gap: var(--nuk-space-4, 1rem); grid-template-columns: minmax(8rem, auto) minmax(0, 1fr); }
    :host([orientation='vertical']) [part='tablist'] { border-block-end: 0; border-inline-end: var(--nuk-border-width, 1px) solid var(--nuk-color-border, ButtonBorder); flex-direction: column; }
  }
`;

export class NukTabs extends NukElement {
  static readonly observedAttributes = ['active', 'label', 'orientation'];
  private readonly tabSlot: HTMLSlotElement;
  private tabs: NukTab[] = [];
  private panels: NukTabPanel[] = [];

  constructor() {
    super(tabsTemplate, tabsStyles);
    this.tabSlot = this.root.querySelector('slot[name="tab"]') as HTMLSlotElement;
    for (const slot of this.root.querySelectorAll('slot')) {
      slot.addEventListener('slotchange', () => this.collect());
    }
    this.addEventListener('click', (event) => this.handleClick(event));
    this.addEventListener('keydown', (event) => this.handleKeydown(event));
  }

  get active(): string {
    return this.getAttribute('active') ?? '';
  }

  set active(value: string) {
    reflectString(this, 'active', value);
  }

  connectedCallback(): void {
    this.collect();
  }

  attributeChangedCallback(): void {
    this.sync();
  }

  private collect(): void {
    this.tabs = this.tabSlot
      .assignedElements({ flatten: true })
      .filter((element): element is NukTab => element instanceof NukTab);
    this.panels = [...this.children].filter(
      (element): element is NukTabPanel => element instanceof NukTabPanel,
    );
    this.tabs.forEach((tab, index) => {
      if (tab.id === '') tab.id = uniqueId('nuk-tab');
      const panel = this.panels[index];
      if (panel === undefined) return;
      if (panel.id === '') panel.id = uniqueId('nuk-panel');
      tab.setAttribute('aria-controls', panel.id);
      panel.setAttribute('aria-labelledby', tab.id);
    });
    if (this.active === '' && this.tabs.length > 0) {
      const initial = this.tabs.find((tab) => tab.hasAttribute('active')) ?? this.tabs[0];
      if (initial !== undefined)
        this.setAttribute('active', initial.getAttribute('value') ?? initial.id);
    }
    this.sync();
  }

  private sync(): void {
    const tablist = this.root.querySelector('[role="tablist"]') as HTMLElement;
    tablist.setAttribute('aria-label', this.getAttribute('label') ?? 'Sections');
    tablist.setAttribute('aria-orientation', this.getAttribute('orientation') ?? 'horizontal');
    let matched = false;
    this.tabs.forEach((tab, index) => {
      const value = tab.getAttribute('value') ?? tab.id;
      const active = value === this.active || (!matched && this.active === '' && index === 0);
      if (active) matched = true;
      tab.active = active;
      const panel = this.panels[index];
      if (panel !== undefined) panel.active = active;
    });
  }

  private eventTab(event: Event): NukTab | undefined {
    return event.composedPath().find((target): target is NukTab => target instanceof NukTab);
  }

  private handleClick(event: Event): void {
    const tab = this.eventTab(event);
    if (tab === undefined || tab.disabled) return;
    this.activate(tab, true);
  }

  private handleKeydown(event: KeyboardEvent): void {
    const tab = this.eventTab(event);
    if (tab === undefined) return;
    const enabled = this.tabs.filter((candidate) => !candidate.disabled);
    const current = enabled.indexOf(tab);
    if (current < 0 || enabled.length === 0) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.activate(tab, true);
      return;
    }
    const vertical = this.getAttribute('orientation') === 'vertical';
    const rtl = getComputedStyle(this).direction === 'rtl';
    let nextIndex: number | null = null;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = enabled.length - 1;
    if ((vertical && event.key === 'ArrowDown') || (!vertical && event.key === 'ArrowRight')) {
      nextIndex = (current + (rtl && !vertical ? -1 : 1) + enabled.length) % enabled.length;
    }
    if ((vertical && event.key === 'ArrowUp') || (!vertical && event.key === 'ArrowLeft')) {
      nextIndex = (current + (rtl && !vertical ? 1 : -1) + enabled.length) % enabled.length;
    }
    if (nextIndex === null) return;
    event.preventDefault();
    const next = enabled[nextIndex];
    if (next === undefined) return;
    next.focus();
    if (!this.hasAttribute('manual')) this.activate(next, true);
  }

  private activate(tab: NukTab, notify: boolean): void {
    const value = tab.getAttribute('value') ?? tab.id;
    this.setAttribute('active', value);
    if (notify) this.emit('change', { index: this.tabs.indexOf(tab), value });
  }
}

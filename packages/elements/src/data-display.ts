import { NukElement, createTemplate } from './core.js';

const tableTemplate = createTemplate(
  `<div part="scroller" role="region" tabindex="0"><slot></slot></div>`,
);
const tableStyles = `
  @layer nuk.components {
    :host { container-type: inline-size; display: block; font: inherit; max-inline-size: 100%; }
    [part='scroller'] { max-inline-size: 100%; overflow: auto; overscroll-behavior-inline: contain; }
    [part='scroller']:focus-visible {
      border-radius: var(--nuk-radius-sm, 0.25rem);
      outline: var(--nuk-focus-width, 0.1875rem) solid var(--nuk-color-focus, Highlight);
      outline-offset: 0.125rem;
    }
    ::slotted(table) { border-collapse: collapse; inline-size: 100%; }
    @media (forced-colors: active) { [part='scroller'] { border: 1px solid CanvasText; } }
  }
`;

/** A keyboard-scrollable region for a semantic light-DOM table. */
export class NukTable extends NukElement {
  static readonly observedAttributes = ['label'];
  private readonly scroller: HTMLElement;

  constructor() {
    super(tableTemplate, tableStyles);
    this.scroller = this.root.querySelector('[part="scroller"]') as HTMLElement;
  }

  connectedCallback(): void {
    this.sync();
  }

  attributeChangedCallback(): void {
    this.sync();
  }

  private sync(): void {
    const authoredLabel = this.getAttribute('label')?.trim();
    this.scroller.setAttribute(
      'aria-label',
      authoredLabel === undefined || authoredLabel === '' ? 'Scrollable data table' : authoredLabel,
    );
  }
}

const messageTemplate = createTemplate(`<div part="message"><slot></slot></div>`);
const messageStyles = `
  @layer nuk.components {
    :host { display: block; font: inherit; }
    [part='message'] {
      border-inline-start: 0.25rem solid var(--nuk-message-accent, var(--nuk-color-accent, Highlight));
      padding-block: var(--nuk-space-3, 0.75rem);
      padding-inline: var(--nuk-space-4, 1rem);
    }
    :host([severity='danger']) [part='message'] { --nuk-message-accent: var(--nuk-color-danger, MarkText); }
    :host([severity='success']) [part='message'] { --nuk-message-accent: var(--nuk-color-success, CanvasText); }
    :host([severity='warning']) [part='message'] { --nuk-message-accent: var(--nuk-color-warning, CanvasText); }
    @media (forced-colors: active) { [part='message'] { border-color: CanvasText; } }
  }
`;

export class NukAlert extends NukElement {
  static readonly observedAttributes = ['label'];
  private readonly message: HTMLElement;

  constructor() {
    super(messageTemplate, messageStyles);
    this.message = this.root.querySelector('[part="message"]') as HTMLElement;
    this.message.setAttribute('role', 'alert');
  }

  connectedCallback(): void {
    this.sync();
  }

  attributeChangedCallback(): void {
    this.sync();
  }

  private sync(): void {
    const label = this.getAttribute('label');
    if (label === null) this.message.removeAttribute('aria-label');
    else this.message.setAttribute('aria-label', label);
  }
}

export class NukStatus extends NukElement {
  static readonly observedAttributes = ['label'];
  private readonly message: HTMLElement;

  constructor() {
    super(messageTemplate, messageStyles);
    this.message = this.root.querySelector('[part="message"]') as HTMLElement;
    this.message.setAttribute('role', 'status');
    this.message.setAttribute('aria-live', 'polite');
    this.message.setAttribute('aria-atomic', 'true');
  }

  connectedCallback(): void {
    this.sync();
  }

  attributeChangedCallback(): void {
    this.sync();
  }

  private sync(): void {
    const label = this.getAttribute('label');
    if (label === null) this.message.removeAttribute('aria-label');
    else this.message.setAttribute('aria-label', label);
  }
}

const cardTemplate = createTemplate(`
  <article part="article">
    <header part="header"><slot name="heading"></slot></header>
    <div part="body"><slot></slot></div>
    <footer part="footer"><slot name="footer"></slot></footer>
  </article>
`);
const cardStyles = `
  @layer nuk.components {
    :host { container-type: inline-size; display: block; font: inherit; }
    [part='article'] {
      background: var(--nuk-color-surface, Canvas);
      border: var(--nuk-border-width, 1px) solid var(--nuk-color-border, ButtonBorder);
      border-radius: var(--nuk-radius-md, 0.5rem);
      display: grid;
      gap: var(--nuk-space-3, 0.75rem);
      padding: var(--nuk-space-4, 1rem);
    }
    [part='header'] { font-size: var(--nuk-font-size-lg, 1.25rem); font-weight: 700; }
    [part='footer'] { display: flex; flex-wrap: wrap; gap: var(--nuk-space-2, 0.5rem); }
    @container (inline-size > 32rem) {
      :host([horizontal]) [part='article'] { grid-template-columns: minmax(0, 1fr) auto; }
      :host([horizontal]) [part='header'] { grid-column: 1 / -1; }
    }
    @media (forced-colors: active) { [part='article'] { border-color: CanvasText; } }
  }
`;

export class NukCard extends NukElement {
  static readonly observedAttributes = ['label'];
  private readonly article: HTMLElement;

  constructor() {
    super(cardTemplate, cardStyles);
    this.article = this.root.querySelector('article') as HTMLElement;
  }

  connectedCallback(): void {
    this.sync();
  }

  attributeChangedCallback(): void {
    this.sync();
  }

  private sync(): void {
    const label = this.getAttribute('label');
    if (label === null) this.article.removeAttribute('aria-label');
    else this.article.setAttribute('aria-label', label);
  }
}

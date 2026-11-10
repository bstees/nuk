import { NukElement, createTemplate } from './core.js';

const navTemplate = createTemplate(`<nav part="nav"><slot></slot></nav>`);
const navStyles = `
  @layer nuk.components {
    :host { display: block; font: inherit; }
    ::slotted(ul), ::slotted(ol) { margin: 0; padding: 0; }
  }
`;

export class NukNav extends NukElement {
  static readonly observedAttributes = ['label'];
  protected readonly nav: HTMLElement;

  constructor() {
    super(navTemplate, navStyles);
    this.nav = this.root.querySelector('nav') as HTMLElement;
  }

  connectedCallback(): void {
    this.sync();
  }

  attributeChangedCallback(): void {
    this.sync();
  }

  protected sync(): void {
    const label = this.getAttribute('label');
    if (label === null) this.nav.removeAttribute('aria-label');
    else this.nav.setAttribute('aria-label', label);
  }
}

const breadcrumbsTemplate = createTemplate(
  `<nav part="nav" aria-label="Breadcrumb"><slot></slot></nav>`,
);
const breadcrumbsStyles = `
  @layer nuk.components {
    :host { display: block; font: inherit; }
    ::slotted(ol) { align-items: baseline; display: flex; flex-wrap: wrap; gap: 0.45em 0.7em; list-style: none; margin: 0; padding: 0; }
    @media (forced-colors: active) { :host { color: CanvasText; } }
  }
`;

/** Hosts an authored semantic `<ol>` so current-page and separators remain application choices. */
export class NukBreadcrumbs extends NukElement {
  static readonly observedAttributes = ['label'];
  private readonly nav: HTMLElement;

  constructor() {
    super(breadcrumbsTemplate, breadcrumbsStyles);
    this.nav = this.root.querySelector('nav') as HTMLElement;
  }

  connectedCallback(): void {
    this.sync();
  }

  attributeChangedCallback(): void {
    this.sync();
  }

  private sync(): void {
    const authoredLabel = this.getAttribute('label')?.trim();
    this.nav.setAttribute(
      'aria-label',
      authoredLabel === undefined || authoredLabel === '' ? 'Breadcrumb' : authoredLabel,
    );
  }
}

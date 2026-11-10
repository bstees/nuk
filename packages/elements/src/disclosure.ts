import { NukElement, createTemplate, reflectBoolean } from './core.js';

const disclosureTemplate = createTemplate(`
  <details part="details">
    <summary part="summary"><slot name="summary">Details</slot><span part="indicator" aria-hidden="true">⌄</span></summary>
    <div part="content"><slot></slot></div>
  </details>
`);
const disclosureStyles = `
  @layer nuk.components {
    :host { color: var(--nuk-color-text, CanvasText); display: block; font: inherit; }
    details { border-block: var(--nuk-border-width, 1px) solid var(--nuk-color-border, ButtonBorder); }
    summary {
      align-items: center;
      cursor: pointer;
      display: flex;
      font-weight: 650;
      gap: var(--nuk-space-2, 0.5rem);
      justify-content: space-between;
      padding-block: var(--nuk-space-3, 0.75rem);
    }
    summary::-webkit-details-marker { display: none; }
    summary:focus-visible {
      border-radius: var(--nuk-radius-sm, 0.25rem);
      outline: var(--nuk-focus-width, 0.1875rem) solid var(--nuk-color-focus, Highlight);
      outline-offset: 0.125rem;
    }
    [part='content'] { padding-block-end: var(--nuk-space-4, 1rem); }
    [part='indicator'] { transform: rotate(0); }
    details[open] [part='indicator'] { transform: rotate(180deg); }
    @media (prefers-reduced-motion: no-preference) {
      [part='indicator'] { transition: transform var(--nuk-duration-fast, 120ms) ease; }
    }
  }
`;

export class NukDisclosure extends NukElement {
  static readonly observedAttributes = ['open'];
  private readonly details: HTMLDetailsElement;

  constructor() {
    super(disclosureTemplate, disclosureStyles);
    this.details = this.root.querySelector('details') as HTMLDetailsElement;
    this.details.addEventListener('toggle', () => {
      reflectBoolean(this, 'open', this.details.open);
      this.emit('toggle', { open: this.details.open });
    });
  }

  get open(): boolean {
    return this.details.open;
  }

  set open(value: boolean) {
    this.details.open = value;
    reflectBoolean(this, 'open', value);
  }

  connectedCallback(): void {
    this.details.open = this.hasAttribute('open');
  }

  attributeChangedCallback(): void {
    this.details.open = this.hasAttribute('open');
  }
}

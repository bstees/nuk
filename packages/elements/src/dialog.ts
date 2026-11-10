import { NukElement, createTemplate, reflectBoolean } from './core.js';

const dialogTemplate = createTemplate(`
  <dialog part="dialog">
    <div part="surface">
      <header part="header"><slot name="heading"></slot></header>
      <div part="body"><slot></slot></div>
      <footer part="footer"><slot name="footer"></slot></footer>
    </div>
  </dialog>
`);
const dialogStyles = `
  @layer nuk.components {
    :host { font: inherit; }
    dialog {
      background: transparent;
      border: 0;
      color: var(--nuk-color-text, CanvasText);
      inline-size: min(36rem, calc(100% - 2rem));
      max-block-size: calc(100% - 2rem);
      max-inline-size: none;
      padding: 0;
    }
    dialog::backdrop { background: rgb(0 0 0 / 0.58); }
    [part='surface'] {
      background: var(--nuk-color-surface-raised, Canvas);
      border: var(--nuk-border-width, 1px) solid var(--nuk-color-border, ButtonBorder);
      border-radius: var(--nuk-radius-lg, 0.75rem);
      box-shadow: var(--nuk-shadow-md, 0 0.5rem 1.5rem rgb(0 0 0 / 0.2));
      container-type: inline-size;
      max-block-size: inherit;
      overflow: auto;
      padding: var(--nuk-space-5, 1.5rem);
    }
    [part='header'] { font-size: var(--nuk-font-size-xl, 1.5rem); font-weight: 700; line-height: 1.25; }
    [part='body'] { margin-block-start: var(--nuk-space-3, 0.75rem); }
    [part='footer'] { display: flex; flex-wrap: wrap; gap: var(--nuk-space-2, 0.5rem); justify-content: end; margin-block-start: var(--nuk-space-5, 1.5rem); }
    @container (inline-size < 24rem) {
      [part='footer'] { align-items: stretch; flex-direction: column; }
    }
    @media (prefers-reduced-motion: no-preference) {
      dialog[open] { animation: nuk-dialog-enter var(--nuk-duration-normal, 200ms) ease-out; }
      @keyframes nuk-dialog-enter { from { opacity: 0; transform: translateY(0.5rem); } }
    }
    @media (forced-colors: active) {
      dialog::backdrop { background: Canvas; opacity: 0.75; }
      [part='surface'] { box-shadow: none; }
    }
  }
`;

export class NukDialog extends NukElement {
  static readonly observedAttributes = ['dismissible', 'label', 'modal', 'open'];
  private readonly dialog: HTMLDialogElement;

  constructor() {
    super(dialogTemplate, dialogStyles);
    this.dialog = this.root.querySelector('dialog') as HTMLDialogElement;
    this.dialog.addEventListener('cancel', (event) => {
      if (!this.hasAttribute('dismissible')) event.preventDefault();
    });
    this.dialog.addEventListener('close', () => {
      reflectBoolean(this, 'open', false);
      this.emit('close', { returnValue: this.dialog.returnValue });
    });
    this.dialog.addEventListener('click', (event) => {
      if (event.target === this.dialog && this.hasAttribute('dismissible')) this.close('backdrop');
    });
    this.addEventListener('submit', (event) => {
      const form = event.target;
      if (!(form instanceof HTMLFormElement) || form.method !== 'dialog') return;
      event.preventDefault();
      const submitter = event.submitter;
      this.close(submitter instanceof HTMLButtonElement ? submitter.value : '');
    });
  }

  get open(): boolean {
    return this.dialog.open;
  }

  set open(value: boolean) {
    reflectBoolean(this, 'open', value);
  }

  get returnValue(): string {
    return this.dialog.returnValue;
  }

  connectedCallback(): void {
    this.sync();
  }

  attributeChangedCallback(): void {
    this.sync();
  }

  show(): void {
    if (!this.dialog.open) this.dialog.show();
    reflectBoolean(this, 'open', true);
  }

  showModal(): void {
    if (!this.dialog.open) this.dialog.showModal();
    reflectBoolean(this, 'open', true);
  }

  close(returnValue = ''): void {
    if (this.dialog.open) this.dialog.close(returnValue);
    else reflectBoolean(this, 'open', false);
  }

  private sync(): void {
    const label = this.getAttribute('label');
    if (label === null) this.dialog.removeAttribute('aria-label');
    else this.dialog.setAttribute('aria-label', label);
    if (!this.isConnected) return;
    if (this.hasAttribute('open') && !this.dialog.open) {
      if (this.hasAttribute('modal')) this.dialog.showModal();
      else this.dialog.show();
    } else if (!this.hasAttribute('open') && this.dialog.open) {
      this.dialog.close();
    }
  }
}

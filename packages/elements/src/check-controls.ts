import { createTemplate, reflectBoolean, reflectString } from './core.js';
import { NukFormControl } from './form-control.js';

const checkTemplate = createTemplate(
  `<label part="label"><input part="control" type="checkbox" /><span part="indicator" aria-hidden="true"></span><span part="text"><slot></slot></span></label>`,
);
const checkStyles = `
  @layer nuk.components {
    :host { color: var(--nuk-color-text, CanvasText); display: inline-block; font: inherit; }
    *, *::before, *::after { box-sizing: border-box; }
    label { align-items: start; cursor: pointer; display: inline-grid; gap: 0.625em; grid-template-columns: auto minmax(0, 1fr); }
    input { block-size: 1px; inline-size: 1px; opacity: 0; position: absolute; }
    [part='indicator'] {
      align-items: center;
      background: var(--nuk-control-bg, Field);
      border: var(--nuk-border-width, 1px) solid var(--nuk-color-border, ButtonBorder);
      border-radius: var(--nuk-radius-sm, 0.25rem);
      display: inline-flex;
      block-size: 1.25em;
      inline-size: 1.25em;
      justify-content: center;
      margin-block-start: 0.125em;
    }
    input:checked + [part='indicator'] { background: var(--nuk-color-accent, Highlight); border-color: var(--nuk-color-accent, Highlight); }
    input:checked + [part='indicator']::after {
      border: solid var(--nuk-color-on-accent, HighlightText);
      border-width: 0 0.125em 0.125em 0;
      content: '';
      block-size: 0.55em;
      inline-size: 0.3em;
      transform: rotate(45deg) translate(-0.05em, -0.05em);
    }
    input:indeterminate + [part='indicator']::after {
      background: var(--nuk-color-on-accent, HighlightText);
      content: '';
      block-size: 0.125em;
      inline-size: 0.6em;
    }
    input:focus-visible + [part='indicator'] {
      outline: var(--nuk-focus-width, 0.1875rem) solid var(--nuk-color-focus, Highlight);
      outline-offset: 0.125rem;
    }
    input:disabled ~ * { cursor: not-allowed; opacity: 0.62; }
    :host([invalid]) [part='indicator'] { border-color: var(--nuk-color-danger, MarkText); }
    @media (forced-colors: active) {
      [part='indicator'] { forced-color-adjust: none; }
      input:checked + [part='indicator'] { background: Highlight; border-color: Highlight; }
      input:checked + [part='indicator']::after { border-color: HighlightText; }
      input:disabled ~ * { opacity: 1; }
    }
  }
`;

abstract class NukCheckControl extends NukFormControl {
  static readonly observedAttributes = [
    'checked',
    'disabled',
    'indeterminate',
    'label',
    'name',
    'required',
    'value',
  ];

  protected readonly control: HTMLInputElement;

  protected constructor(type: 'checkbox' | 'radio', role?: 'switch') {
    super(checkTemplate, checkStyles);
    this.control = this.root.querySelector('input') as HTMLInputElement;
    this.control.type = type;
    if (role !== undefined) this.control.setAttribute('role', role);
    this.control.addEventListener('change', () => {
      if (this.control.type === 'radio' && this.control.checked) this.uncheckRadioPeers();
      this.syncCheckedState();
      this.emit('change', { checked: this.checked, value: this.value });
    });
  }

  get checked(): boolean {
    return this.control.checked;
  }

  set checked(value: boolean) {
    this.control.checked = value;
    reflectBoolean(this, 'checked', value);
    if (value && this.control.type === 'radio') this.uncheckRadioPeers();
    this.syncCheckedState();
  }

  get indeterminate(): boolean {
    return this.control.indeterminate;
  }

  set indeterminate(value: boolean) {
    this.control.indeterminate = value;
    reflectBoolean(this, 'indeterminate', value);
  }

  get value(): string {
    return this.getAttribute('value') ?? 'on';
  }

  set value(value: string) {
    reflectString(this, 'value', value);
    this.syncCheckedState();
  }

  connectedCallback(): void {
    this.sync();
  }

  attributeChangedCallback(): void {
    this.sync();
  }

  formResetCallback(): void {
    this.control.checked = this.hasAttribute('checked');
    this.control.indeterminate = false;
    this.syncCheckedState();
  }

  formStateRestoreCallback(state: string | File | FormData | null): void {
    this.control.checked = typeof state === 'string' && state === this.value;
    this.syncCheckedState();
  }

  override focus(options?: FocusOptions): void {
    this.control.focus(options);
  }

  protected sync(): void {
    this.syncCommonAttributes();
    this.control.checked = this.hasAttribute('checked');
    this.control.indeterminate = this.hasAttribute('indeterminate');
    this.control.value = this.value;
    this.syncCheckedState();
  }

  protected syncCheckedState(): void {
    this.setAttribute('aria-checked', this.indeterminate ? 'mixed' : String(this.checked));
    this.syncFormValue(this.checked ? this.value : null, this.checked ? this.value : null);
    this.syncValidity();
  }

  private uncheckRadioPeers(): void {
    if (this.control.type !== 'radio' || this.name === '') return;
    for (const candidate of document.querySelectorAll(this.localName)) {
      if (
        candidate !== this &&
        candidate instanceof NukRadio &&
        candidate.name === this.name &&
        candidate.form === this.form
      ) {
        candidate.control.checked = false;
        candidate.removeAttribute('checked');
        candidate.syncCheckedState();
      }
    }
  }
}

export class NukCheckbox extends NukCheckControl {
  constructor() {
    super('checkbox');
  }
}

export class NukSwitch extends NukCheckControl {
  constructor() {
    super('checkbox', 'switch');
  }
}

export class NukRadio extends NukCheckControl {
  constructor() {
    super('radio');
    this.control.addEventListener('keydown', (event) => this.handleArrowKey(event));
  }

  private handleArrowKey(event: KeyboardEvent): void {
    const direction =
      event.key === 'ArrowRight' || event.key === 'ArrowDown'
        ? 1
        : event.key === 'ArrowLeft' || event.key === 'ArrowUp'
          ? -1
          : 0;
    if (direction === 0 || this.name === '') return;
    const peers = [...document.querySelectorAll(this.localName)].filter(
      (candidate): candidate is NukRadio =>
        candidate instanceof NukRadio &&
        candidate.name === this.name &&
        candidate.form === this.form &&
        !candidate.disabled,
    );
    const currentIndex = peers.indexOf(this);
    if (currentIndex < 0 || peers.length === 0) return;
    event.preventDefault();
    const nextIndex = (currentIndex + direction + peers.length) % peers.length;
    const next = peers[nextIndex];
    if (next === undefined) return;
    next.checked = true;
    next.focus();
    next.emit('change', { checked: true, value: next.value });
  }
}

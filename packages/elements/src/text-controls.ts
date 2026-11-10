import { booleanAttribute, createTemplate, reflectBoolean, reflectString } from './core.js';
import { NukFormControl, controlStyles } from './form-control.js';

const inputTemplate = createTemplate(`<input part="control" />`);

const textFieldTypes = new Set([
  'date',
  'email',
  'month',
  'number',
  'password',
  'search',
  'tel',
  'text',
  'time',
  'url',
  'week',
]);

export class NukTextField extends NukFormControl {
  static readonly observedAttributes = [
    'autocomplete',
    'disabled',
    'inputmode',
    'label',
    'max',
    'maxlength',
    'min',
    'minlength',
    'name',
    'pattern',
    'placeholder',
    'readonly',
    'required',
    'step',
    'type',
    'value',
  ];

  protected readonly control: HTMLInputElement;

  constructor() {
    super(inputTemplate, controlStyles);
    this.control = this.root.querySelector('input') as HTMLInputElement;
    this.control.addEventListener('input', () => {
      this.syncFormValue(this.control.value);
      this.syncValidity();
      this.emit('input', { value: this.control.value });
    });
    this.control.addEventListener('change', () => {
      this.syncFormValue(this.control.value);
      this.syncValidity();
      this.emit('change', { value: this.control.value });
    });
  }

  get value(): string {
    return this.control.value;
  }

  set value(value: string) {
    this.control.value = value;
    reflectString(this, 'value', value);
    this.syncFormValue(value);
  }

  get readOnly(): boolean {
    return booleanAttribute(this, 'readonly');
  }

  set readOnly(value: boolean) {
    reflectBoolean(this, 'readonly', value);
  }

  connectedCallback(): void {
    this.sync();
  }

  attributeChangedCallback(): void {
    this.sync();
  }

  formResetCallback(): void {
    this.control.value = this.getAttribute('value') ?? '';
    this.syncFormValue(this.control.value);
    this.syncValidity();
  }

  formStateRestoreCallback(state: string | File | FormData | null): void {
    if (typeof state === 'string') this.value = state;
  }

  override focus(options?: FocusOptions): void {
    this.control.focus(options);
  }

  select(): void {
    this.control.select();
  }

  private sync(): void {
    this.syncCommonAttributes();
    const requestedType = this.getAttribute('type') ?? 'text';
    this.control.type = textFieldTypes.has(requestedType) ? requestedType : 'text';
    this.control.readOnly = this.readOnly;
    for (const attribute of [
      'autocomplete',
      'inputmode',
      'max',
      'maxlength',
      'min',
      'minlength',
      'pattern',
      'placeholder',
      'step',
    ] as const) {
      const value = this.getAttribute(attribute);
      if (value === null) this.control.removeAttribute(attribute);
      else this.control.setAttribute(attribute, value);
    }
    const authoredValue = this.getAttribute('value') ?? '';
    if (!this.matches(':focus-within')) this.control.value = authoredValue;
    this.syncFormValue(this.control.value);
    this.syncValidity();
  }
}

const textareaTemplate = createTemplate(`<textarea part="control"></textarea>`);
const textareaStyles = `${controlStyles}
  @layer nuk.components {
    textarea { min-block-size: 6.5em; resize: block; }
  }
`;

export class NukTextarea extends NukFormControl {
  static readonly observedAttributes = [
    'disabled',
    'label',
    'maxlength',
    'minlength',
    'name',
    'placeholder',
    'readonly',
    'required',
    'rows',
    'value',
  ];

  protected readonly control: HTMLTextAreaElement;

  constructor() {
    super(textareaTemplate, textareaStyles);
    this.control = this.root.querySelector('textarea') as HTMLTextAreaElement;
    this.control.addEventListener('input', () => {
      this.syncFormValue(this.control.value);
      this.syncValidity();
      this.emit('input', { value: this.control.value });
    });
    this.control.addEventListener('change', () => {
      this.syncFormValue(this.control.value);
      this.syncValidity();
      this.emit('change', { value: this.control.value });
    });
  }

  get value(): string {
    return this.control.value;
  }

  set value(value: string) {
    this.control.value = value;
    reflectString(this, 'value', value);
    this.syncFormValue(value);
  }

  get readOnly(): boolean {
    return booleanAttribute(this, 'readonly');
  }

  set readOnly(value: boolean) {
    reflectBoolean(this, 'readonly', value);
  }

  connectedCallback(): void {
    this.sync();
  }

  attributeChangedCallback(): void {
    this.sync();
  }

  formResetCallback(): void {
    this.control.value = this.getAttribute('value') ?? '';
    this.syncFormValue(this.control.value);
    this.syncValidity();
  }

  formStateRestoreCallback(state: string | File | FormData | null): void {
    if (typeof state === 'string') this.value = state;
  }

  override focus(options?: FocusOptions): void {
    this.control.focus(options);
  }

  private sync(): void {
    this.syncCommonAttributes();
    this.control.readOnly = this.readOnly;
    for (const attribute of ['maxlength', 'minlength', 'placeholder', 'rows'] as const) {
      const value = this.getAttribute(attribute);
      if (value === null) this.control.removeAttribute(attribute);
      else this.control.setAttribute(attribute, value);
    }
    if (!this.matches(':focus-within')) this.control.value = this.getAttribute('value') ?? '';
    this.syncFormValue(this.control.value);
    this.syncValidity();
  }
}

const selectTemplate = createTemplate(
  `<span part="select-wrap"><select part="control"></select><span part="indicator" aria-hidden="true">⌄</span></span><slot hidden></slot>`,
);
const selectStyles = `${controlStyles}
  @layer nuk.components {
    [part='select-wrap'] { display: grid; }
    select, [part='indicator'] { grid-area: 1 / 1; }
    select { padding-inline-end: 2.25em; }
    [part='indicator'] { align-self: center; justify-self: end; margin-inline-end: 0.75em; pointer-events: none; }
  }
`;

export class NukSelect extends NukFormControl {
  static readonly observedAttributes = ['disabled', 'label', 'name', 'required', 'value'];
  protected readonly control: HTMLSelectElement;
  private readonly optionSlot: HTMLSlotElement;

  constructor() {
    super(selectTemplate, selectStyles);
    this.control = this.root.querySelector('select') as HTMLSelectElement;
    this.optionSlot = this.root.querySelector('slot') as HTMLSlotElement;
    this.optionSlot.addEventListener('slotchange', () => this.syncOptions());
    this.control.addEventListener('change', () => {
      this.syncFormValue(this.control.value);
      this.syncValidity();
      this.emit('change', { value: this.control.value });
    });
  }

  get value(): string {
    return this.control.value;
  }

  set value(value: string) {
    this.control.value = value;
    reflectString(this, 'value', value);
    this.syncFormValue(this.control.value);
  }

  connectedCallback(): void {
    this.sync();
    this.syncOptions();
  }

  attributeChangedCallback(): void {
    this.sync();
  }

  formResetCallback(): void {
    this.control.value = this.getAttribute('value') ?? '';
    this.syncFormValue(this.control.value);
    this.syncValidity();
  }

  formStateRestoreCallback(state: string | File | FormData | null): void {
    if (typeof state === 'string') this.value = state;
  }

  override focus(options?: FocusOptions): void {
    this.control.focus(options);
  }

  private sync(): void {
    this.syncCommonAttributes();
    const authoredValue = this.getAttribute('value');
    if (authoredValue !== null) this.control.value = authoredValue;
    this.syncFormValue(this.control.value);
    this.syncValidity();
  }

  private syncOptions(): void {
    const options = this.optionSlot
      .assignedElements({ flatten: true })
      .filter(
        (element) => element instanceof HTMLOptionElement || element instanceof HTMLOptGroupElement,
      );
    this.control.replaceChildren(...options.map((option) => option.cloneNode(true)));
    const authoredValue = this.getAttribute('value');
    if (authoredValue !== null) this.control.value = authoredValue;
    this.syncFormValue(this.control.value);
    this.syncValidity();
  }
}

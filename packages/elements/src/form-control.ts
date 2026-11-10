import { NukElement, reflectBoolean, reflectString } from './core.js';

type FormControl = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

function validityFlags(validity: ValidityState): ValidityStateFlags {
  return {
    badInput: validity.badInput,
    customError: validity.customError,
    patternMismatch: validity.patternMismatch,
    rangeOverflow: validity.rangeOverflow,
    rangeUnderflow: validity.rangeUnderflow,
    stepMismatch: validity.stepMismatch,
    tooLong: validity.tooLong,
    tooShort: validity.tooShort,
    typeMismatch: validity.typeMismatch,
    valueMissing: validity.valueMissing,
  };
}

export abstract class NukFormControl extends NukElement {
  static readonly formAssociated = true;

  protected readonly internals: ElementInternals | null;
  protected abstract readonly control: FormControl;
  private fallbackInput: HTMLInputElement | null = null;

  protected constructor(template: HTMLTemplateElement, styles: string) {
    super(template, styles);
    let internals: ElementInternals | null = null;
    if (typeof this.attachInternals === 'function') {
      try {
        const candidate = this.attachInternals();
        if (
          typeof candidate.setFormValue === 'function' &&
          typeof candidate.setValidity === 'function'
        ) {
          internals = candidate;
        }
      } catch {
        // A partial or scoped custom-element environment may expose but reject ElementInternals.
      }
    }
    this.internals = internals;
  }

  get form(): HTMLFormElement | null {
    return this.internals?.form ?? this.closest('form');
  }

  get name(): string {
    return this.getAttribute('name') ?? '';
  }

  set name(value: string) {
    reflectString(this, 'name', value);
  }

  get disabled(): boolean {
    return this.hasAttribute('disabled');
  }

  set disabled(value: boolean) {
    reflectBoolean(this, 'disabled', value);
  }

  get required(): boolean {
    return this.hasAttribute('required');
  }

  set required(value: boolean) {
    reflectBoolean(this, 'required', value);
  }

  get validity(): ValidityState {
    return this.control.validity;
  }

  get validationMessage(): string {
    return this.control.validationMessage;
  }

  get willValidate(): boolean {
    return this.internals?.willValidate ?? this.control.willValidate;
  }

  checkValidity(): boolean {
    this.syncValidity();
    return this.internals?.checkValidity() ?? this.control.checkValidity();
  }

  reportValidity(): boolean {
    this.syncValidity();
    return this.internals?.reportValidity() ?? this.control.reportValidity();
  }

  setCustomValidity(message: string): void {
    this.control.setCustomValidity(message);
    this.syncValidity();
  }

  formDisabledCallback(disabled: boolean): void {
    this.control.disabled = disabled || this.disabled;
  }

  protected syncFormValue(value: string | null, state = value): void {
    this.internals?.setFormValue(value, state);
    if (this.internals !== null) return;

    if (this.fallbackInput === null) {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.dataset.nukFormFallback = '';
      this.append(input);
      this.fallbackInput = input;
    }
    this.fallbackInput.name = this.name;
    this.fallbackInput.value = value ?? '';
    this.fallbackInput.disabled = value === null || this.disabled || this.name === '';
  }

  protected syncValidity(): void {
    const valid = this.control.validity.valid;
    this.toggleAttribute('invalid', !valid);
    this.control.setAttribute('aria-invalid', String(!valid));
    if (this.internals === null) return;

    if (valid) {
      this.internals.setValidity({});
    } else {
      this.internals.setValidity(
        validityFlags(this.control.validity),
        this.control.validationMessage,
        this.control,
      );
    }
  }

  protected syncCommonAttributes(): void {
    this.control.disabled = this.disabled;
    this.control.required = this.required;
    this.control.setAttribute('aria-label', this.getAttribute('label') ?? '');
    const describedBy = this.getAttribute('aria-describedby');
    if (describedBy === null) {
      this.control.removeAttribute('aria-describedby');
    } else {
      this.control.setAttribute('aria-describedby', describedBy);
    }
  }
}

export const controlStyles = `
  @layer nuk.components {
    :host { color: var(--nuk-color-text, CanvasText); font: inherit; max-inline-size: 100%; }
    *, *::before, *::after { box-sizing: border-box; }
    :where(input, textarea, select) {
      appearance: none;
      background: var(--nuk-control-bg, Field);
      border: var(--nuk-border-width, 1px) solid var(--nuk-color-border, ButtonBorder);
      border-radius: var(--nuk-radius-sm, 0.25rem);
      color: var(--nuk-color-text, FieldText);
      font: inherit;
      inline-size: 100%;
      min-block-size: 2.75em;
      padding-block: 0.55em;
      padding-inline: 0.75em;
    }
    :where(input, textarea, select):focus-visible {
      outline: var(--nuk-focus-width, 0.1875rem) solid var(--nuk-color-focus, Highlight);
      outline-offset: 0.125rem;
    }
    :where(input, textarea, select):disabled { cursor: not-allowed; opacity: 0.62; }
    :host([invalid]) :where(input, textarea, select) { border-color: var(--nuk-color-danger, MarkText); }
    @media (forced-colors: active) {
      :where(input, textarea, select):disabled { opacity: 1; }
      :host([invalid]) :where(input, textarea, select) { border-color: MarkText; }
    }
  }
`;

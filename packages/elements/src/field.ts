import { NukElement, createTemplate, textFromSlot, uniqueId } from './core.js';

const fieldTemplate = createTemplate(`
  <div part="field">
    <div part="label-row">
      <span part="label"><slot name="label"></slot></span>
      <span part="required" aria-hidden="true"></span>
    </div>
    <div part="control"><slot></slot></div>
    <div part="help"><slot name="help"></slot></div>
    <div part="error" aria-live="polite"><slot name="error"></slot></div>
  </div>
`);
const fieldStyles = `
  @layer nuk.components {
    :host { color: var(--nuk-color-text, CanvasText); display: block; font: inherit; }
    [part='field'] { display: grid; gap: var(--nuk-space-2, 0.5rem); }
    [part='label-row'] { align-items: baseline; display: flex; font-weight: 650; gap: 0.25em; }
    [part='required']::before { content: ''; }
    :host([required]) [part='required']::before { color: var(--nuk-color-danger, MarkText); content: '*'; }
    [part='control'] ::slotted(*) { max-inline-size: 100%; }
    [part='help'], [part='error'] { font-size: var(--nuk-font-size-sm, 0.875rem); line-height: 1.45; }
    [part='help'] { color: var(--nuk-color-text-muted, GrayText); }
    [part='error'] { color: var(--nuk-color-danger, MarkText); font-weight: 550; }
    [part='help']:has(slot:empty), [part='error']:has(slot:empty) { display: none; }
    @supports not selector(:has(*)) {
      [part='help'][hidden], [part='error'][hidden] { display: none; }
    }
    @media (forced-colors: active) { [part='error'] { color: MarkText; } }
  }
`;

type LabelTarget = HTMLElement & { required?: boolean };

export class NukField extends NukElement {
  static readonly observedAttributes = ['required'];
  private readonly controlSlot: HTMLSlotElement;
  private readonly errorPart: HTMLElement;
  private readonly errorSlot: HTMLSlotElement;
  private readonly helpPart: HTMLElement;
  private readonly helpSlot: HTMLSlotElement;
  private readonly labelSlot: HTMLSlotElement;
  private control: LabelTarget | null = null;

  constructor() {
    super(fieldTemplate, fieldStyles);
    const slots = [...this.root.querySelectorAll('slot')];
    this.controlSlot = slots.find((slot) => slot.name === '') as HTMLSlotElement;
    this.labelSlot = slots.find((slot) => slot.name === 'label') as HTMLSlotElement;
    this.helpSlot = slots.find((slot) => slot.name === 'help') as HTMLSlotElement;
    this.errorSlot = slots.find((slot) => slot.name === 'error') as HTMLSlotElement;
    this.helpPart = this.root.querySelector('[part="help"]') as HTMLElement;
    this.errorPart = this.root.querySelector('[part="error"]') as HTMLElement;
    for (const slot of slots) slot.addEventListener('slotchange', () => this.sync());
  }

  connectedCallback(): void {
    this.sync();
  }

  attributeChangedCallback(): void {
    this.sync();
  }

  private sync(): void {
    const candidate = this.controlSlot
      .assignedElements({ flatten: true })
      .find((element): element is LabelTarget => element instanceof HTMLElement);
    this.control = candidate ?? null;
    const label = textFromSlot(this.labelSlot);
    const help = textFromSlot(this.helpSlot);
    const error = textFromSlot(this.errorSlot);
    this.helpPart.hidden = help === '';
    this.errorPart.hidden = error === '';
    if (this.control === null) return;

    if (this.hasAttribute('required')) {
      this.control.setAttribute('required', '');
      this.control.required = true;
    }
    if (label !== '' && !this.control.hasAttribute('aria-label')) {
      if (this.control instanceof NukElement) {
        this.control.setAttribute('label', label);
      } else {
        const labelElement = this.labelSlot.assignedElements({ flatten: true })[0];
        if (labelElement !== undefined) {
          if (labelElement.id === '') labelElement.id = uniqueId('nuk-label');
          this.control.setAttribute('aria-labelledby', labelElement.id);
        } else {
          this.control.setAttribute('aria-label', label);
        }
      }
    }

    const description = [help, error].filter((value) => value !== '').join(' ');
    if (this.control instanceof NukElement) {
      if (description === '') this.control.removeAttribute('aria-description');
      else this.control.setAttribute('aria-description', description);
    } else {
      const describedBy: string[] = [];
      for (const slot of [this.helpSlot, this.errorSlot]) {
        for (const element of slot.assignedElements({ flatten: true })) {
          if (element.id === '') element.id = uniqueId('nuk-description');
          describedBy.push(element.id);
        }
      }
      if (describedBy.length === 0) this.control.removeAttribute('aria-describedby');
      else this.control.setAttribute('aria-describedby', describedBy.join(' '));
    }
    this.control.toggleAttribute('invalid', error !== '');
    if (error === '') this.control.removeAttribute('aria-invalid');
    else this.control.setAttribute('aria-invalid', 'true');
  }
}

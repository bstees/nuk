export class NukSafeFixture extends HTMLElement {
  connectedCallback(): void {
    const button = this.querySelector(':scope > button[type="button"]');
    if (button instanceof HTMLButtonElement) {
      button.addEventListener('click', () => {
        this.hidden = true;
      });
    }
  }
}

if (!customElements.get('nuk-safe-fixture')) {
  customElements.define('nuk-safe-fixture', NukSafeFixture);
}

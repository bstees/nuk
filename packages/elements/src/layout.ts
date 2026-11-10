import { NukElement, createTemplate } from './core.js';

const layoutTemplate = createTemplate(`<slot></slot>`);

const stackStyles = `
  @layer nuk.components {
    :host { display: flex; flex-direction: column; gap: var(--nuk-layout-gap, var(--nuk-space-4, 1rem)); min-inline-size: 0; }
    :host([gap='small']) { --nuk-layout-gap: var(--nuk-space-2, 0.5rem); }
    :host([gap='large']) { --nuk-layout-gap: var(--nuk-space-6, 2rem); }
    :host([align='start']) { align-items: start; }
    :host([align='center']) { align-items: center; }
    :host([align='end']) { align-items: end; }
    :host([align='stretch']) { align-items: stretch; }
  }
`;

export class NukStack extends NukElement {
  constructor() {
    super(layoutTemplate, stackStyles);
  }
}

const clusterStyles = `
  @layer nuk.components {
    :host { align-items: center; display: flex; flex-wrap: wrap; gap: var(--nuk-layout-gap, var(--nuk-space-3, 0.75rem)); min-inline-size: 0; }
    :host([gap='small']) { --nuk-layout-gap: var(--nuk-space-2, 0.5rem); }
    :host([gap='large']) { --nuk-layout-gap: var(--nuk-space-6, 2rem); }
    :host([justify='between']) { justify-content: space-between; }
    :host([justify='center']) { justify-content: center; }
    :host([justify='end']) { justify-content: end; }
  }
`;

export class NukCluster extends NukElement {
  constructor() {
    super(layoutTemplate, clusterStyles);
  }
}

const gridStyles = `
  @layer nuk.components {
    :host {
      container-type: inline-size;
      display: grid;
      gap: var(--nuk-layout-gap, var(--nuk-space-4, 1rem));
      grid-template-columns: repeat(auto-fit, minmax(min(100%, var(--nuk-grid-min, 15rem)), 1fr));
      min-inline-size: 0;
    }
    :host([gap='small']) { --nuk-layout-gap: var(--nuk-space-2, 0.5rem); }
    :host([gap='large']) { --nuk-layout-gap: var(--nuk-space-6, 2rem); }
    :host([min='small']) { --nuk-grid-min: 10rem; }
    :host([min='large']) { --nuk-grid-min: 22rem; }
  }
`;

export class NukGrid extends NukElement {
  constructor() {
    super(layoutTemplate, gridStyles);
  }
}

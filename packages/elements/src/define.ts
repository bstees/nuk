import { defineElements } from './registry.js';

export * from './index.js';

if (typeof customElements !== 'undefined') {
  defineElements();
}

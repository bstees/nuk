import { describe, expect, it } from 'vitest';

import { NukButton } from '../src/actions.js';
import {
  createStructuralStyles,
  defineElements,
  eventName,
  formatElementPrefix,
  normalizeElementPrefix,
} from '../src/registry.js';

describe('custom-element registry', () => {
  it('uses nuk as the zero-configuration namespace', () => {
    const registration = defineElements({ prefix: 'registry-default-test' });
    expect(registration.tags.button).toBe('registry-default-test-button');
    expect(registration.event('press')).toBe('registry-default-test-press');
    expect(registration.prefix).toBe('registry-default-test-');
  });

  it('normalizes a trailing hyphen and rejects unsafe prefixes', () => {
    expect(formatElementPrefix('acme')).toBe('acme-');
    expect(formatElementPrefix('acme-')).toBe('acme-');
    expect(formatElementPrefix()).toBe('nuk-');
    expect(normalizeElementPrefix('acme-ui-')).toBe('acme-ui');
    expect(eventName('acme-ui-', 'change')).toBe('acme-ui-change');
    expect(() => normalizeElementPrefix('Acme')).toThrow(/lowercase/);
    expect(() => normalizeElementPrefix('xml-tools')).toThrow(/reserved/);
    expect(() => normalizeElementPrefix('two--dashes')).toThrow(/lowercase/);
  });

  it('registers fresh aliases and derives events from the selected prefix', () => {
    const acme = defineElements({ prefix: 'acme-registry-test' });
    const other = defineElements({ prefix: 'other-registry-test' });
    const button = document.createElement(acme.tags.button) as NukButton;
    document.body.append(button);

    let presses = 0;
    button.addEventListener(acme.event('press'), () => presses++);
    button.shadowRoot?.querySelector('button')?.click();

    expect(button).toBeInstanceOf(NukButton);
    expect(button.elementPrefix).toBe('acme-registry-test');
    expect(button.componentName).toBe('button');
    expect(presses).toBe(1);
    expect(customElements.get(acme.tags.button)).not.toBe(customElements.get(other.tags.button));
  });

  it('is idempotent for its own registration and fails on a foreign collision', () => {
    expect(() => defineElements({ prefix: 'repeat-registry-test' })).not.toThrow();
    expect(() => defineElements({ prefix: 'repeat-registry-test-' })).not.toThrow();

    customElements.define('foreign-registry-test-button', class extends HTMLElement {});
    expect(() => defineElements({ prefix: 'foreign-registry-test' })).toThrow(
      /another constructor/,
    );
  });

  it('creates a matching structural fallback stylesheet', () => {
    const css = createStructuralStyles('brand-registry-test');
    expect(css).toContain('brand-registry-test-button');
    expect(css).toContain('@layer nuk.elements');
    expect(css).not.toContain('nuk-button');
  });
});

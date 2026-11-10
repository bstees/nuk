import axe from 'axe-core';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import type { NukButton } from '../src/actions.js';
import type { NukTabs } from '../src/tabs.js';
import type { NukTextField } from '../src/text-controls.js';
import { defineElements, type DefinedElements } from '../src/registry.js';

let registration: DefinedElements;

beforeAll(() => {
  registration = defineElements({ prefix: 'interaction-test' });
});

function element(name: keyof DefinedElements['tags']): HTMLElement {
  return document.createElement(registration.tags[name]);
}

describe('component interactions', () => {
  it('reports pointer and keyboard-equivalent button presses through the configured event', () => {
    const button = element('button') as NukButton;
    button.textContent = 'Save';
    document.body.append(button);
    const listener = vi.fn();
    button.addEventListener(registration.event('press'), listener);

    button.shadowRoot
      ?.querySelector('button')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true, detail: 1 }));

    expect(listener).toHaveBeenCalledOnce();
    expect((listener.mock.calls[0]?.[0] as CustomEvent).detail).toEqual({ source: 'pointer' });
  });

  it('keeps field labels, help, errors, and validation state attached to the real control', async () => {
    const field = element('field');
    const label = document.createElement('span');
    label.slot = 'label';
    label.textContent = 'Email address';
    const help = document.createElement('span');
    help.slot = 'help';
    help.textContent = 'Used for notices.';
    const error = document.createElement('span');
    error.slot = 'error';
    error.textContent = 'Enter a valid email.';
    const control = element('text-field') as NukTextField;
    control.setAttribute('type', 'email');
    field.append(label, control, help, error);
    document.body.append(field);
    await Promise.resolve();

    const input = control.shadowRoot?.querySelector('input');
    expect(input?.getAttribute('aria-label')).toBe('Email address');
    expect(control.getAttribute('aria-description')).toContain('Used for notices.');
    expect(control.getAttribute('aria-description')).toContain('Enter a valid email.');
    expect(control.getAttribute('aria-invalid')).toBe('true');
  });

  it('activates the next tab with the horizontal arrow-key contract', async () => {
    const tabs = element('tabs') as NukTabs;
    tabs.setAttribute('label', 'Project sections');
    for (const [value, label] of [
      ['overview', 'Overview'],
      ['activity', 'Activity'],
    ] as const) {
      const tab = element('tab');
      tab.slot = 'tab';
      tab.setAttribute('value', value);
      tab.textContent = label;
      tabs.append(tab);
      const panel = element('tab-panel');
      panel.textContent = `${label} panel`;
      tabs.append(panel);
    }
    document.body.append(tabs);
    await Promise.resolve();
    const [first] = [...tabs.querySelectorAll(registration.tags.tab)];
    (first as HTMLElement | undefined)?.focus();
    expect(document.activeElement).toBe(first);
    first?.dispatchEvent(
      new KeyboardEvent('keydown', {
        bubbles: true,
        composed: true,
        key: 'ArrowRight',
      }),
    );

    expect(tabs.getAttribute('active')).toBe('activity');
    expect(tabs.querySelectorAll(registration.tags.tab)[1]?.hasAttribute('active')).toBe(true);
    expect(tabs.querySelectorAll(registration.tags['tab-panel'])[1]?.hasAttribute('hidden')).toBe(
      false,
    );
  });

  it('uses native option semantics and emits a value change', async () => {
    const select = element('select');
    select.setAttribute('label', 'Review cadence');
    select.innerHTML =
      '<option value="weekly">Weekly</option><option value="monthly">Monthly</option>';
    document.body.append(select);
    await Promise.resolve();
    const nativeSelect = select.shadowRoot?.querySelector('select');
    const listener = vi.fn();
    select.addEventListener(registration.event('change'), listener);
    if (nativeSelect === null || nativeSelect === undefined)
      throw new Error('Missing native select');
    nativeSelect.value = 'monthly';
    nativeSelect.dispatchEvent(new Event('change', { bubbles: true }));

    expect((listener.mock.calls[0]?.[0] as CustomEvent).detail).toEqual({ value: 'monthly' });
  });
});

describe('automated accessibility smoke check', () => {
  it('finds no axe violations in a representative named control group', async () => {
    document.documentElement.lang = 'en';
    document.title = 'nuk accessibility test';
    const region = document.createElement('main');
    const heading = document.createElement('h1');
    heading.textContent = 'Preferences';
    const checkbox = element('checkbox');
    checkbox.textContent = 'Send the digest';
    const status = element('status');
    status.textContent = 'Preferences loaded.';
    region.append(heading, checkbox, status);
    document.body.append(region);
    await Promise.resolve();

    const result = await axe.run(document, {
      rules: {
        'color-contrast': { enabled: false },
        region: { enabled: false },
      },
    });
    expect(result.violations).toEqual([]);
  });
});

import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor } from 'storybook/test';

import { NukDisclosure, NukTab, NukTabPanel, NukTabs } from '@nuk-ui/react';

const meta = {
  title: 'Components/Disclosure and tabs',
  tags: ['autodocs'],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Disclosure: Story = {
  render: () => (
    <NukDisclosure>
      <span slot="summary">Why use custom elements?</span>
      <p>They keep the behavioral core usable in React, plain HTML, and other frameworks.</p>
    </NukDisclosure>
  ),
  play: async ({ canvasElement }) => {
    await customElements.whenDefined('nuk-disclosure');
    const host = canvasElement.querySelector('nuk-disclosure');
    const summary = host?.shadowRoot?.querySelector('summary');
    await waitFor(() => expect(summary).toBeInstanceOf(HTMLElement));
    await userEvent.click(summary as HTMLElement);
    await expect(host).toHaveAttribute('open');
  },
};

export const Tabs: Story = {
  render: () => (
    <NukTabs label="Project sections">
      <NukTab active slot="tab" value="overview">
        Overview
      </NukTab>
      <NukTab slot="tab" value="activity">
        Activity
      </NukTab>
      <NukTab slot="tab" value="settings">
        Settings
      </NukTab>
      <NukTabPanel active>
        <p>The component preserves semantic relationships between tabs and panels.</p>
      </NukTabPanel>
      <NukTabPanel>
        <p>Keyboard users can move through tabs with arrow, Home, and End keys.</p>
      </NukTabPanel>
      <NukTabPanel>
        <p>Manual activation is available for panels that are expensive to load.</p>
      </NukTabPanel>
    </NukTabs>
  ),
  play: async ({ canvasElement }) => {
    await customElements.whenDefined('nuk-tab');
    const tabs = [...canvasElement.querySelectorAll('nuk-tab')];
    const first = tabs[0];
    await waitFor(() => expect(first).toBeInstanceOf(HTMLElement));
    (first as HTMLElement).focus();
    await userEvent.keyboard('{ArrowRight}');
    await expect(tabs[1]).toHaveAttribute('active');
  },
};

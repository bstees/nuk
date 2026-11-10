import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor } from 'storybook/test';

import {
  NukCheckbox,
  NukField,
  NukRadio,
  NukSelect,
  NukStack,
  NukSwitch,
  NukTextField,
  NukTextarea,
} from '@nuk-ui/react';

const meta = {
  title: 'Components/Forms',
  tags: ['autodocs'],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const FieldPatterns: Story = {
  render: () => (
    <NukStack gap="large">
      <NukField required>
        <span slot="label">Email address</span>
        <NukTextField name="email" placeholder="you@example.com" required type="email" />
        <span slot="help">We only use this for account notices.</span>
      </NukField>
      <NukField>
        <span slot="label">Project summary</span>
        <NukTextarea name="summary" placeholder="What are you making?" rows={5} />
        <span slot="error">Add at least one sentence before continuing.</span>
      </NukField>
      <NukField>
        <span slot="label">Review cadence</span>
        <NukSelect name="cadence" value="weekly">
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </NukSelect>
      </NukField>
    </NukStack>
  ),
  play: async ({ canvasElement }) => {
    await customElements.whenDefined('nuk-text-field');
    const host = canvasElement.querySelector('nuk-text-field');
    const input = host?.shadowRoot?.querySelector('input');
    await waitFor(() => expect(input).toBeInstanceOf(HTMLInputElement));
    await userEvent.type(input as HTMLInputElement, 'reader@example.com');
    await expect(input).toHaveValue('reader@example.com');
  },
};

export const ChoiceControls: Story = {
  render: () => (
    <section className="story-section">
      <h2>Preferences</h2>
      <NukStack>
        <NukCheckbox name="terms" required>
          I agree to the contributor terms
        </NukCheckbox>
        <NukSwitch name="digest">Send the weekly digest</NukSwitch>
        <fieldset>
          <legend>Reading density</legend>
          <NukStack gap="small">
            <NukRadio checked name="density" value="comfortable">
              Comfortable
            </NukRadio>
            <NukRadio name="density" value="compact">
              Compact
            </NukRadio>
          </NukStack>
        </fieldset>
      </NukStack>
    </section>
  ),
};

import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor } from 'storybook/test';

import { NukButton, NukLink } from '@nuk-ui/react';

const meta = {
  title: 'Components/Actions',
  component: NukButton,
  tags: ['autodocs'],
  args: {
    children: 'Start review',
    disabled: false,
    onPress: fn(),
    type: 'button',
    variant: 'primary',
  },
  argTypes: {
    variant: { control: 'inline-radio', options: ['primary', 'secondary', 'quiet'] },
  },
} satisfies Meta<typeof NukButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Button: Story = {
  play: async ({ args, canvasElement }) => {
    await customElements.whenDefined('nuk-button');
    const host = canvasElement.querySelector('nuk-button');
    const button = host?.shadowRoot?.querySelector('button');
    await waitFor(() => expect(button).toBeInstanceOf(HTMLButtonElement));
    await userEvent.click(button as HTMLButtonElement);
    await expect(args.onPress).toHaveBeenCalledOnce();
  },
};

export const Variants: Story = {
  args: { onPress: fn() },
  render: () => (
    <section className="story-section">
      <h2>Action hierarchy</h2>
      <div className="story-row">
        <NukButton>Save changes</NukButton>
        <NukButton variant="secondary">Preview</NukButton>
        <NukButton variant="quiet">Cancel</NukButton>
        <NukButton disabled>Unavailable</NukButton>
      </div>
      <p>
        For navigation, use <NukLink href="#link-destination">a real link</NukLink> rather than a
        button.
      </p>
      <span id="link-destination">Link destination</span>
    </section>
  ),
};

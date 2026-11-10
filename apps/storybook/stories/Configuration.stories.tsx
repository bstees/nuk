import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';

import { NukButton, NukProvider, NukStack, useNukConfiguration } from '@nuk-ui/react';

const meta = {
  title: 'Configuration/Custom prefix',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Pass a company namespace to NukProvider. Tags and public events change together; the stable design-token contract remains --nuk-*.',
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

function PrefixReport() {
  const configuration = useNukConfiguration();
  return (
    <NukStack>
      <code>Rendered tag: &lt;{configuration.tags.button}&gt;</code>
      <code>Public event: {configuration.event('press')}</code>
      <NukButton>Company-prefixed action</NukButton>
    </NukStack>
  );
}

export const CompanyNamespace: Story = {
  render: () => (
    <section className="story-section">
      <h2>One implementation, another namespace</h2>
      <NukProvider prefix="acme">
        <PrefixReport />
      </NukProvider>
    </section>
  ),
  play: async ({ canvasElement }) => {
    await customElements.whenDefined('acme-button');
    await waitFor(() =>
      expect(canvasElement.querySelector('acme-button')).toBeInstanceOf(HTMLElement),
    );
  },
};

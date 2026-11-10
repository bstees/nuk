import { useRef } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor } from 'storybook/test';

import {
  NukButton,
  NukDialog,
  NukMenu,
  NukMenuItem,
  NukStack,
  type NukDialogElement,
} from '@nuk-ui/react';

const meta = {
  title: 'Components/Dialog and menu',
  tags: ['autodocs'],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

function DialogExample() {
  const dialog = useRef<NukDialogElement>(null);
  return (
    <section className="story-section">
      <h2>Native dialog behavior</h2>
      <NukButton onPress={() => dialog.current?.showModal()}>Open review dialog</NukButton>
      <NukDialog dismissible label="Confirm review" modal ref={dialog}>
        <h2 slot="heading">Ready for review?</h2>
        <p>The browser handles modality and focus containment; nuk adds structure and events.</p>
        <div className="story-row" slot="footer">
          <NukButton onPress={() => dialog.current?.close('cancel')} variant="quiet">
            Cancel
          </NukButton>
          <NukButton onPress={() => dialog.current?.close('approve')}>Approve</NukButton>
        </div>
      </NukDialog>
    </section>
  );
}

export const Dialog: Story = {
  render: () => <DialogExample />,
  play: async ({ canvasElement }) => {
    await customElements.whenDefined('nuk-button');
    const launcher = canvasElement.querySelector('nuk-button');
    const button = launcher?.shadowRoot?.querySelector('button');
    await waitFor(() => expect(button).toBeInstanceOf(HTMLButtonElement));
    await userEvent.click(button as HTMLButtonElement);
    const dialogHost = canvasElement.querySelector('nuk-dialog');
    const dialog = dialogHost?.shadowRoot?.querySelector('dialog');
    await waitFor(() => expect(dialog).toHaveAttribute('open'));
  },
};

export const Menu: Story = {
  render: () => (
    <NukStack align="start">
      <p>Menus are for commands; site navigation remains a list of links.</p>
      <NukMenu label="Issue actions">
        <span slot="trigger">Issue actions</span>
        <NukMenuItem value="edit">Edit draft</NukMenuItem>
        <NukMenuItem value="duplicate">Duplicate</NukMenuItem>
        <NukMenuItem disabled value="publish">
          Publish (approval required)
        </NukMenuItem>
      </NukMenu>
    </NukStack>
  ),
};

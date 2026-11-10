import type { Meta, StoryObj } from '@storybook/react-vite';

import {
  NukAlert,
  NukBreadcrumbs,
  NukCard,
  NukCluster,
  NukGrid,
  NukLink,
  NukNav,
  NukStatus,
  NukTable,
} from '@nuk-ui/react';

const meta = {
  title: 'Components/Data and navigation',
  tags: ['autodocs'],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const MessagesAndCards: Story = {
  render: () => (
    <div className="story-stack">
      <NukAlert severity="warning">The draft still needs editorial approval.</NukAlert>
      <NukStatus severity="success">All local checks passed.</NukStatus>
      <NukGrid min="small">
        <NukCard label="Component report">
          <h2 slot="heading">26 custom elements</h2>
          <p>Semantic foundations plus representative interactive patterns.</p>
          <NukLink href="#catalog" slot="footer">
            Review catalog
          </NukLink>
        </NukCard>
        <NukCard label="Accessibility report">
          <h2 slot="heading">WCAG 2.2 AA target</h2>
          <p>Keyboard, reflow, forced colors, reduced motion, names, and states are checked.</p>
        </NukCard>
      </NukGrid>
    </div>
  ),
};

export const SemanticTable: Story = {
  render: () => (
    <NukTable label="Component readiness">
      <table className="semantic-table">
        <caption>Initial catalog review status</caption>
        <thead>
          <tr>
            <th scope="col">Pattern</th>
            <th scope="col">Native base</th>
            <th scope="col">Status</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row">Disclosure</th>
            <td>details/summary</td>
            <td>Ready</td>
          </tr>
          <tr>
            <th scope="row">Dialog</th>
            <td>dialog</td>
            <td>Ready</td>
          </tr>
          <tr>
            <th scope="row">Select</th>
            <td>select/option</td>
            <td>Ready</td>
          </tr>
        </tbody>
      </table>
    </NukTable>
  ),
};

export const Navigation: Story = {
  render: () => (
    <section className="story-section">
      <NukBreadcrumbs>
        <ol>
          <li>
            <a href="#home">Home</a> /
          </li>
          <li>
            <a href="#components">Components</a> /
          </li>
          <li aria-current="page">Navigation</li>
        </ol>
      </NukBreadcrumbs>
      <NukNav label="Component sections">
        <ul className="story-row">
          <li>
            <a href="#foundations">Foundations</a>
          </li>
          <li>
            <a href="#patterns">Patterns</a>
          </li>
          <li>
            <a href="#guidance">Guidance</a>
          </li>
        </ul>
      </NukNav>
      <NukCluster justify="between">
        <strong>Intrinsic cluster</strong>
        <span>Wraps according to its own available space</span>
      </NukCluster>
    </section>
  ),
};

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
  title: 'Foundations/Design tokens',
  tags: ['autodocs'],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const colors = [
  ['Canvas', 'var(--nuk-color-canvas)'],
  ['Surface', 'var(--nuk-color-surface)'],
  ['Text', 'var(--nuk-color-text)'],
  ['Accent', 'var(--nuk-color-accent)'],
  ['Danger', 'var(--nuk-color-danger)'],
  ['Success', 'var(--nuk-color-success)'],
] as const;

export const SemanticColors: Story = {
  render: () => (
    <section className="story-section">
      <div>
        <h2>Semantic color roles</h2>
        <p>
          These aliases change with the selected theme; components never depend on raw palette
          values.
        </p>
      </div>
      <div className="token-grid">
        {colors.map(([name, value]) => (
          <div className="token-card" key={name}>
            <div className="token-swatch" style={{ '--swatch': value } as React.CSSProperties} />
            <strong>{name}</strong>
            <code>{value}</code>
          </div>
        ))}
      </div>
    </section>
  ),
};

export const SpacingAndType: Story = {
  render: () => (
    <section className="story-section">
      <h2>Spacing and type</h2>
      <p style={{ fontSize: 'var(--nuk-font-size-2xl)' }}>
        Readable interfaces start with a calm rhythm.
      </p>
      <div className="story-row" aria-label="Spacing scale">
        {[1, 2, 3, 4, 5, 6, 7].map((step) => (
          <div
            aria-label={`Space ${String(step)}`}
            key={step}
            style={{
              background: 'var(--nuk-color-accent)',
              blockSize: `var(--nuk-space-${String(step)})`,
              inlineSize: `var(--nuk-space-${String(step)})`,
            }}
          />
        ))}
      </div>
    </section>
  ),
};

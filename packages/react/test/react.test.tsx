import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { NukButton, NukProvider, NukTextField } from '../src/index.js';

describe('React adapters', () => {
  it('renders the default nuk namespace during SSR without accessing the DOM registry', () => {
    const markup = renderToStaticMarkup(<NukButton label="Launch">Launch</NukButton>);
    expect(markup).toContain('<nuk-button');
    expect(markup).toContain('label="Launch"');
  });

  it('renders a configured company namespace consistently', () => {
    const markup = renderToStaticMarkup(
      <NukProvider autoDefine={false} prefix="acme-ui-">
        <NukButton>Save</NukButton>
        <NukTextField label="Project name" />
      </NukProvider>,
    );
    expect(markup).toContain('<acme-ui-button');
    expect(markup).toContain('<acme-ui-text-field');
  });

  it('rejects an invalid configured prefix before rendering markup', () => {
    expect(() =>
      renderToStaticMarkup(
        <NukProvider autoDefine={false} prefix="Not Valid">
          <NukButton>Save</NukButton>
        </NukProvider>,
      ),
    ).toThrow(/Invalid custom-element prefix/);
  });
});

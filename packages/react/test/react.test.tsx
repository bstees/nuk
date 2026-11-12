import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { formatElementPrefix } from '@nuk-ui/elements/prefix';

import { NukButton, NukProvider, NukTextField, useNukConfiguration } from '../src/index.js';

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

  it('reports the prefix in the same normalized form as the custom-element registry', () => {
    function Report() {
      const configuration = useNukConfiguration();
      return <output>{`${configuration.prefix}|${configuration.event('press')}`}</output>;
    }
    const report = (prefix?: string) =>
      renderToStaticMarkup(
        prefix === undefined ? (
          <Report />
        ) : (
          <NukProvider autoDefine={false} prefix={prefix}>
            <Report />
          </NukProvider>
        ),
      );

    expect(report()).toContain('nuk-|nuk-press');
    for (const prefix of ['acme', 'acme-', 'acme-ui', 'acme-ui-']) {
      const expected = formatElementPrefix(prefix);
      expect(expected.endsWith('-') && !expected.endsWith('--')).toBe(true);
      expect(report(prefix)).toContain(`${expected}|${expected}press`);
    }
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

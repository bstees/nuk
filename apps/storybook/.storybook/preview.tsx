import type { Decorator, Preview } from '@storybook/react-vite';

import '@nuk-ui/elements/define';
import '@nuk-ui/theme/css';
import './preview.css';

import { NukProvider } from '@nuk-ui/react';

const widths = {
  narrow: '20rem',
  regular: '42rem',
  wide: '72rem',
} as const;

const withReviewEnvironment: Decorator = (Story, context) => {
  const theme = context.globals.theme as 'dark' | 'light' | 'system';
  const width = context.globals.container as keyof typeof widths;
  const themeAttribute = theme === 'system' ? undefined : theme;

  return (
    <NukProvider autoDefine={false}>
      <div className="nuk-story-surface" data-nuk-theme={themeAttribute}>
        <div
          className="nuk-story-container"
          data-container={width}
          style={{ maxInlineSize: widths[width] }}
        >
          <Story />
        </div>
      </div>
    </NukProvider>
  );
};

const preview: Preview = {
  decorators: [withReviewEnvironment],
  globalTypes: {
    container: {
      description: 'Review the story inside an intrinsic container',
      toolbar: {
        icon: 'grow',
        items: [
          { title: 'Narrow · 20rem', value: 'narrow' },
          { title: 'Regular · 42rem', value: 'regular' },
          { title: 'Wide · 72rem', value: 'wide' },
        ],
      },
    },
    theme: {
      description: 'Color theme',
      toolbar: {
        icon: 'contrast',
        items: [
          { icon: 'browser', title: 'System', value: 'system' },
          { icon: 'sun', title: 'Light', value: 'light' },
          { icon: 'moon', title: 'Dark', value: 'dark' },
        ],
      },
    },
  },
  initialGlobals: {
    container: 'regular',
    theme: 'system',
  },
  parameters: {
    a11y: {
      config: {
        rules: [{ id: 'region', enabled: false }],
      },
      test: 'error',
    },
    controls: {
      expanded: true,
      matchers: {
        color: /(background|color)$/iu,
        date: /Date$/u,
      },
    },
    docs: {
      source: { state: 'open' },
    },
    layout: 'fullscreen',
    options: {
      storySort: {
        order: ['Welcome', 'Foundations', 'Components', 'Patterns', 'Configuration'],
      },
    },
  },
};

export default preview;

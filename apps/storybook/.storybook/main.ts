import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  addons: ['./metadata-preset.cjs', '@storybook/addon-docs', '@storybook/addon-a11y'],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  stories: ['../stories/**/*.mdx', '../stories/**/*.stories.@(ts|tsx)'],
  typescript: {
    check: true,
  },
};

export default config;

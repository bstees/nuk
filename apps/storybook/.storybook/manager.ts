import { addons } from 'storybook/manager-api';
import { create } from 'storybook/theming';

addons.setConfig({
  theme: create({
    base: 'light',
    brandTarget: '_self',
    brandTitle: 'nuk · component system',
    brandUrl: '/',
    colorPrimary: '#1769aa',
    colorSecondary: '#0d568f',
  }),
});

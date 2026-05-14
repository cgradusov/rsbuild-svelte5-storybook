import type { StorybookConfig } from 'storybook-svelte-rsbuild';

const config: StorybookConfig = {
  framework: {
    name: 'storybook-svelte-rsbuild',
    options: {},
  },
  stories: ['../src/**/*.stories.@(ts|svelte)'],
  addons: [],
};

export default config;

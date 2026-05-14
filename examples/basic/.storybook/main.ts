import type { StorybookConfig } from 'storybook-svelte-rsbuild';

const config: StorybookConfig = {
  framework: {
    name: 'storybook-svelte-rsbuild',
    options: {
      svelte: {
        compilerOptions: { runes: true },
      },
    },
  },
  stories: ['../src/**/*.stories.ts'],
  addons: [],
};

export default config;

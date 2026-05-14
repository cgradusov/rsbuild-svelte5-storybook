import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    preset: 'src/preset.ts',
    preview: 'src/preview.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
  target: 'node18',
  splitting: false,
  external: [
    'storybook',
    'storybook/internal/types',
    'svelte',
    'svelte/compiler',
    '@storybook/svelte',
    '@storybook/addon-svelte-csf',
    'storybook-builder-rsbuild',
    'storybook-svelte-rsbuild',
    '@rsbuild/core',
    '@rsbuild/plugin-svelte',
    'svelte-loader',
  ],
});

import { defineConfig } from 'tsup';

const external = [
  'storybook',
  'storybook/internal/types',
  'svelte',
  'svelte/compiler',
  '@storybook/svelte',
  '@storybook/addon-svelte-csf',
  'storybook-builder-rsbuild',
  'storybook-svelte-rsbuild',
  '@rsbuild/core',
  'acorn',
  'magic-string',
  'svelte-ast-print',
];

export default defineConfig([
  {
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
    external,
  },
  {
    // Loader is ESM-only — uses top-level `import.meta.url`.
    entry: {
      'stories-svelte-loader': 'src/loaders/stories-svelte-loader.ts',
      'svelte-loader': 'src/loaders/svelte-loader.ts',
    },
    format: ['esm'],
    dts: true,
    clean: false,
    sourcemap: true,
    target: 'node18',
    splitting: false,
    external,
  },
]);

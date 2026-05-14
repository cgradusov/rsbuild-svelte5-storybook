# storybook-svelte-rsbuild

Storybook framework for **Svelte 5** powered by **Rsbuild**.

Requires **Storybook 10** and **Svelte 5**.

Supports classic CSF (`*.stories.ts`) out of the box. Native `*.stories.svelte`
support via [`@storybook/addon-svelte-csf`](https://github.com/storybookjs/addon-svelte-csf)
is on the roadmap — that addon ships a Vite plugin only, so an Rspack-side loader
needs to be authored to bridge it.

## Install

```sh
bun add -d storybook@^10 svelte@^5 \
  @rsbuild/core @rsbuild/plugin-svelte \
  storybook-builder-rsbuild storybook-svelte-rsbuild \
  @storybook/svelte
```

## Configure

`.storybook/main.ts`:

```ts
import type { StorybookConfig } from 'storybook-svelte-rsbuild';

const config: StorybookConfig = {
  framework: {
    name: 'storybook-svelte-rsbuild',
    options: {
      svelte: { compilerOptions: { runes: true } },
    },
  },
  stories: ['../src/**/*.stories.ts'],
  addons: [],
};

export default config;
```

## Run

```sh
bun x storybook dev -p 6006
bun x storybook build
```

## Framework options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `svelte.compilerOptions` | `CompileOptions` | `{ runes: true }` | Forwarded to the Svelte compiler. |
| `preprocess` | `PreprocessorGroup \| PreprocessorGroup[]` | — | Applied to `.svelte` and `.stories.svelte`. |
| `builder` | `BuilderOptions` | `{}` | Forwarded to `storybook-builder-rsbuild`. |

## Known limitations

- HMR for `.svelte` modules with Svelte 5 in `svelte-loader` is limited; full reload is used as fallback.
- Webpack-only addons are not compatible (same constraint as any Rsbuild/Rspack-based builder).

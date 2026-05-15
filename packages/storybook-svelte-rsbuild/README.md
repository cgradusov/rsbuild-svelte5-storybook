# storybook-svelte-rsbuild

[![npm version](https://img.shields.io/npm/v/storybook-svelte-rsbuild.svg?color=cb3837&label=npm)](https://www.npmjs.com/package/storybook-svelte-rsbuild)
[![npm downloads](https://img.shields.io/npm/dm/storybook-svelte-rsbuild.svg?color=blue)](https://www.npmjs.com/package/storybook-svelte-rsbuild)
[![CI](https://github.com/cgradusov/rsbuild-svelte5-storybook/actions/workflows/ci.yml/badge.svg)](https://github.com/cgradusov/rsbuild-svelte5-storybook/actions/workflows/ci.yml)
[![license](https://img.shields.io/npm/l/storybook-svelte-rsbuild.svg)](./LICENSE)

Storybook framework for **Svelte 5** powered by **Rsbuild** / **Rspack**.

Requires **Storybook 10** and **Svelte 5**.

Supports both story formats out of the box:

- classic CSF — `*.stories.ts`
- native — `*.stories.svelte` via [`@storybook/addon-svelte-csf`](https://github.com/storybookjs/addon-svelte-csf)
  (the addon ships a Vite plugin only, so this framework includes a custom
  Rspack loader that bridges it)

Native Svelte 5 compilation — `runes`, `.svelte.{js,ts}` runes modules,
injected CSS, and HMR are driven by `svelte/compiler` directly. The legacy
`svelte-loader` v3 and `@rsbuild/plugin-svelte` are not used.

## Install

```sh
bun add -d storybook@^10 svelte@^5 \
  @rsbuild/core \
  storybook-builder-rsbuild storybook-svelte-rsbuild \
  @storybook/svelte
```

`@storybook/addon-svelte-csf` is bundled as a dependency — no manual install
or addon registration needed.

## Configure

`.storybook/main.ts`:

```ts
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
```

## Run

```sh
bun x storybook dev -p 6006
bun x storybook build
```

## Story examples

`Button.stories.ts` (classic CSF):

```ts
import type { Meta, StoryObj } from '@storybook/svelte';
import Button from './Button.svelte';

const meta: Meta<Button> = { title: 'Example/Button', component: Button };
export default meta;

export const Primary: StoryObj<Button> = { args: { label: 'Primary' } };
```

`Counter.stories.svelte` (native):

```svelte
<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import Counter from './Counter.svelte';

  const { Story } = defineMeta({ title: 'Example/Counter', component: Counter });
</script>

<Story name="Default" args={{ initial: 0 }} />
<Story name="StartsAtTen" args={{ initial: 10 }} />
```

## Framework options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `svelte.compilerOptions` | `CompileOptions` | `{ dev: !isProduction, hmr: dev, css: 'injected' }` | Forwarded to `svelte/compiler`. `runes` is auto-detected per file — override here only to force a mode. |
| `preprocess` | `PreprocessorGroup \| PreprocessorGroup[]` | — | Applied to `.svelte` and `.stories.svelte`. |
| `builder` | `BuilderOptions` | `{}` | Forwarded to `storybook-builder-rsbuild`. |

## Hot Module Replacement

Editing a `.svelte` component triggers Rspack to rebuild only the affected
chunk and auto-reloads the Storybook preview iframe so the new code appears
immediately. Story state is reset on each update — same UX as clicking
"Reload story" in the Storybook UI, but automatic and sub-second.

Note: this is preview-iframe reload, not Vite-style component swap with
state preservation. `storybook-builder-rsbuild` caches the generated
`importFn` promise per story, so refreshing component references without
reloading is not currently possible from framework code alone.

## Known limitations

- **HMR resets story state.** See above — the preview iframe reloads after
  every edit. State-preserving component swap requires changes in
  `storybook-builder-rsbuild` and is tracked as a roadmap item.
- **Webpack-only addons are not compatible.** Same constraint as any
  Rsbuild/Rspack-based Storybook builder. Addons that reach into
  `webpack.Compiler` / `webpack.Compilation` internals fail; pure
  preview-side addons work fine.

# storybook-svelte-rsbuild

Storybook framework for **Svelte 5** powered by **Rsbuild**.

Requires **Storybook 10** and **Svelte 5**.

Supports both story formats out of the box:

- classic CSF — `*.stories.ts`
- native — `*.stories.svelte` via [`@storybook/addon-svelte-csf`](https://github.com/storybookjs/addon-svelte-csf)
  (the addon ships a Vite plugin only, so this framework includes a custom
  Rspack loader that bridges it)

## Install

```sh
bun add -d storybook@^10 svelte@^5 \
  @rsbuild/core @rsbuild/plugin-svelte \
  storybook-builder-rsbuild storybook-svelte-rsbuild \
  @storybook/svelte
```

`@storybook/addon-svelte-csf` is bundled as a dependency — you do not need to
install or register it manually.

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
| `svelte.compilerOptions` | `CompileOptions` | `{ dev: !isProduction }` | Forwarded to the Svelte compiler. `runes` is auto-detected per file by Svelte 5 — override here only if you need to force a mode. |
| `preprocess` | `PreprocessorGroup \| PreprocessorGroup[]` | — | Applied to `.svelte` and `.stories.svelte`. |
| `builder` | `BuilderOptions` | `{}` | Forwarded to `storybook-builder-rsbuild`. |

## Known limitations

- **HMR for `.svelte` modules is limited.** `svelte-loader` v3 was built for
  Svelte 3/4 `svelte-hmr` runtime and does not fully cover Svelte 5's new
  `mount()`/`unmount()` API, so updates frequently fall back to a full page
  reload. Vite-side users get proper HMR via `@sveltejs/vite-plugin-svelte`;
  on the Rspack side a v4 of `svelte-loader` (or a first-party Rspack-native
  Svelte plugin) is needed to close the gap.
- **Webpack-only addons are not compatible.** This applies to any
  Rsbuild/Rspack-based Storybook builder, not just this one. Addons that
  reach into `webpack.Compiler` / `webpack.Compilation` internals will fail;
  pure preview-side addons work fine.

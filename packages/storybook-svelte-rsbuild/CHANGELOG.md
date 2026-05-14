# storybook-svelte-rsbuild

## 0.3.0

### Minor Changes

- Native Svelte 5 compile + HMR. The framework now compiles `.svelte` and
  `.svelte.{js,ts}` files directly via `svelte/compiler` instead of
  `@rsbuild/plugin-svelte` + `svelte-loader` v3. Editing a component
  auto-reloads the preview iframe (sub-second; story state resets on update).
  CSS is injected at runtime via `css: 'injected'`. Drops
  `@rsbuild/plugin-svelte` from `peerDependencies` and `devDependencies`.

## 0.2.1

### Patch Changes

- Update README — .stories.svelte support is now stable.

## 0.2.0

### Minor Changes

- c8f9342: Add native .stories.svelte support via custom Rspack loader bridging @storybook/addon-svelte-csf with rsbuild.

# storybook-svelte-rsbuild

## 0.3.1

### Patch Changes

- Internal cleanup of the HMR pipeline. The `.svelte` loader now keeps
  Svelte 5's `if (import.meta.hot) { ... }` HMR block intact (rewriting
  `import.meta.hot` → `import.meta.webpackHot` so Rspack picks it up)
  instead of stripping it; `.stories.svelte` no longer adds a redundant
  self-accept. User-facing behaviour is unchanged — the preview iframe
  still does a sub-second reload after every edit. Adds doc comment in
  `preview.ts` explaining why true state-preserving HMR is not reachable
  without forking `@storybook/svelte`.

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

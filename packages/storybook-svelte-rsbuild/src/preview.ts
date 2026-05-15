/**
 * Preview annotations for storybook-svelte-rsbuild.
 *
 * After every Rspack HMR cycle, force a preview-iframe reload so the
 * updated component code lands on screen. The default `@storybook/svelte`
 * v10 renderer caches `meta.component` through a PreviewRender wrapper
 * whose `$derived.by(() => storyFn())` never invalidates on Svelte's
 * `$.hmr()` proxy `current` updates — state-preserving component swap is
 * not reachable without forking @storybook/svelte. Reload is sub-second
 * since Rspack's chunks are already warm.
 */
export const parameters = {
  docs: {
    source: { language: 'svelte' },
  },
};

declare global {
  interface ImportMeta {
    webpackHot?: {
      accept: (deps?: unknown, cb?: unknown) => void;
      addStatusHandler: (cb: (status: string) => void) => void;
    };
  }
}

if (typeof window !== 'undefined' && import.meta.webpackHot) {
  // Accept self so the listener survives.
  import.meta.webpackHot.accept();
  let inCycle = false;
  import.meta.webpackHot.addStatusHandler((status) => {
    if (status !== 'idle') {
      if (status === 'check' || status === 'prepare') inCycle = true;
      return;
    }
    if (!inCycle) return;
    inCycle = false;
    window.location.reload();
  });
}

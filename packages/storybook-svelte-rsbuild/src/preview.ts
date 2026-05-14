/**
 * Preview annotations for storybook-svelte-rsbuild.
 *
 * The @storybook/svelte renderer already provides `renderToCanvas`, `render`,
 * `mount`, decorators and parameters for Svelte 5. We only layer in
 * framework-specific defaults here, plus a bridge between Rspack's HMR and
 * Storybook's story renderer so editing a `.svelte` component repaints the
 * current story automatically.
 */
export const parameters = {
  docs: {
    source: { language: 'svelte' },
  },
};

declare global {
  interface Window {
    __STORYBOOK_ADDONS_CHANNEL__?: { emit: (event: string, payload?: unknown) => void };
    __STORYBOOK_PREVIEW__?: {
      currentSelection?: { storyId?: string };
    };
  }
  interface ImportMeta {
    webpackHot?: {
      accept: (deps?: unknown, cb?: unknown) => void;
      addStatusHandler: (cb: (status: string) => void) => void;
    };
  }
}

// Bridge Rspack HMR → Storybook re-render. Svelte 5's `$.hmr()` proxy already
// swaps the component implementation on `accept`, but Storybook keeps a
// reference to the previously-mounted instance and won't repaint without a
// nudge. When the HMR cycle settles, ask Storybook to force-remount the
// current story so the new code lands on screen.
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
    // Storybook's preview keeps cached references to story modules and won't
    // pick up new component code through `onStoriesChanged` alone. Do a fast
    // location.reload of the preview iframe — Rspack already has the new
    // chunks compiled, so the reload feels instant.
    window.location.reload();
  });
}

/**
 * Preview annotations for storybook-svelte-rsbuild.
 *
 * The @storybook/svelte renderer already provides `renderToCanvas`, `render`,
 * `mount`, decorators and parameters for Svelte 5. We only layer in
 * framework-specific defaults here.
 */
export const parameters = {
  docs: {
    source: { language: 'svelte' },
  },
};

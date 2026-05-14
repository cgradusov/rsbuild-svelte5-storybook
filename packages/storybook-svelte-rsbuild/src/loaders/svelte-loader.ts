import { compile, compileModule, preprocess } from 'svelte/compiler';
import type {
  CompileOptions,
  ModuleCompileOptions,
  PreprocessorGroup,
} from 'svelte/compiler';

type LoaderOptions = {
  compilerOptions?: CompileOptions;
  preprocess?: PreprocessorGroup | PreprocessorGroup[];
  dev?: boolean;
};

type LoaderContext = {
  resourcePath: string;
  async: () => (err: Error | null, code?: string, map?: object | string) => void;
  getOptions: () => LoaderOptions | undefined;
};

// Svelte 5 emits a self-accepting `if (import.meta.hot) { ... }` block per
// component. We strip it so HMR bubbles up to the parent `.stories.svelte`
// module, which self-accepts there and lets Storybook re-evaluate
// `defineMeta()` with the fresh `component` reference. Without this, the
// component would self-accept and Storybook's cached `meta.component` would
// never see new versions.
const stripSelfAcceptBlock = (code: string): string =>
  code.replace(/if\s*\(\s*import\.meta\.hot\s*\)\s*\{[\s\S]*?\n\}\n?/g, '');

const isSvelteModule = (id: string): boolean =>
  /\.svelte\.[jt]s$/.test(id);

export default function svelteLoader(this: LoaderContext, source: string) {
  const callback = this.async();
  const id = this.resourcePath;
  const opts = this.getOptions() ?? {};
  const dev = opts.dev ?? true;

  (async () => {
    if (isSvelteModule(id)) {
      // `.svelte.js` / `.svelte.ts` — runes module, not a component.
      const moduleOpts: ModuleCompileOptions = {
        ...(opts.compilerOptions ?? {}),
        generate: 'client',
        dev,
        filename: id,
      } as ModuleCompileOptions;
      const compiled = compileModule(source, moduleOpts);
      return { code: compiled.js.code, map: compiled.js.map };
    }

    let rawCode = source;
    if (opts.preprocess) {
      const processed = await preprocess(rawCode, opts.preprocess, {
        filename: id,
      });
      rawCode = processed.code;
    }

    const compilerOptions: CompileOptions = {
      css: 'injected',
      ...(opts.compilerOptions ?? {}),
      generate: 'client',
      dev,
      hmr: dev,
      filename: id,
    };

    const compiled = compile(rawCode, compilerOptions);
    const code = dev ? stripSelfAcceptBlock(compiled.js.code) : compiled.js.code;

    return { code, map: compiled.js.map };
  })().then(
    ({ code, map }) => callback(null, code, map as any),
    (err) => callback(err)
  );
}

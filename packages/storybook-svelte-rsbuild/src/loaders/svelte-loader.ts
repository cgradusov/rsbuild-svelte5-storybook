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

// Svelte 5 emits `if (import.meta.hot) { Counter = $.hmr(Counter); ... }`.
// Rspack recognises `import.meta.webpackHot`, so rewrite the identifier — the
// HMR proxy wraps the exported component and Svelte's reactive `current`
// source repaints existing instances in place when `update()` fires.
const rewriteHotApi = (code: string): string =>
  code.replace(/import\.meta\.hot/g, 'import.meta.webpackHot');

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
    const code = dev ? rewriteHotApi(compiled.js.code) : compiled.js.code;

    return { code, map: compiled.js.map };
  })().then(
    ({ code, map }) => callback(null, code, map as any),
    (err) => callback(err)
  );
}

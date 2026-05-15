import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import MagicString from 'magic-string';
import { parse as acornParse } from 'acorn';
import { compile, preprocess } from 'svelte/compiler';
import type { CompileOptions, PreprocessorGroup } from 'svelte/compiler';

type LoaderOptions = {
  compilerOptions?: CompileOptions;
  preprocess?: PreprocessorGroup | PreprocessorGroup[];
  legacyTemplate?: boolean;
};

type LoaderContext = {
  resourcePath: string;
  async: () => (err: Error | null, code?: string, map?: object | string) => void;
  getOptions: () => LoaderOptions | undefined;
};

// Loader is built as ESM only; `import.meta.url` is always available.
const req = createRequire(import.meta.url);

let addonDirCache: string | undefined;
const addonDir = () => {
  if (addonDirCache) return addonDirCache;
  addonDirCache = dirname(
    req.resolve('@storybook/addon-svelte-csf/package.json')
  );
  return addonDirCache;
};

const importAddon = <T>(rel: string): Promise<T> =>
  import(pathToFileURL(join(addonDir(), rel)).href) as Promise<T>;

type GetAST = (args: { code: string; filename: string }) => any;
type CodemodLegacyNodes = (args: { ast: any; filename: string }) => Promise<any>;
type ExtractSvelteASTNodes = (args: { ast: any; filename: string }) => Promise<any>;
type ExtractCompiledASTNodes = (args: { ast: any; filename: string }) => Promise<any>;
type TransformStoriesCode = (args: {
  code: MagicString;
  nodes: { svelte: any; compiled: any };
  filename: string;
  originalCode: string;
}) => Promise<void>;

export default function storiesSvelteLoader(this: LoaderContext, source: string) {
  const callback = this.async();
  const id = this.resourcePath;
  const opts = this.getOptions() ?? {};

  (async () => {
    let rawCode = source;

    if (opts.legacyTemplate) {
      const { getSvelteAST } = await importAddon<{ getSvelteAST: GetAST }>(
        'dist/parser/ast.js'
      );
      const { codemodLegacyNodes } = await importAddon<{
        codemodLegacyNodes: CodemodLegacyNodes;
      }>('dist/compiler/pre-transform/index.js');
      const { print } = await import('svelte-ast-print');
      let ast = getSvelteAST({ code: rawCode, filename: id });
      ast = await codemodLegacyNodes({ ast, filename: id });
      rawCode = (print as (n: any) => string)(ast);
    }

    if (opts.preprocess) {
      const processed = await preprocess(rawCode, opts.preprocess, {
        filename: id,
      });
      rawCode = processed.code;
    }

    const compileOptions: CompileOptions = {
      ...(opts.compilerOptions ?? {}),
      filename: id,
      generate: 'client',
    };
    const compiled = compile(rawCode, compileOptions);
    const compiledCode = compiled.js.code;

    const compiledAST = acornParse(compiledCode, {
      sourceType: 'module',
      ecmaVersion: 'latest',
      locations: true,
      ranges: true,
    });
    const magicCompiled = new MagicString(compiledCode);

    const { getSvelteAST } = await importAddon<{ getSvelteAST: GetAST }>(
      'dist/parser/ast.js'
    );
    const { extractSvelteASTNodes } = await importAddon<{
      extractSvelteASTNodes: ExtractSvelteASTNodes;
    }>('dist/parser/extract/svelte/nodes.js');
    const { extractCompiledASTNodes } = await importAddon<{
      extractCompiledASTNodes: ExtractCompiledASTNodes;
    }>('dist/parser/extract/compiled/nodes.js');
    const { transformStoriesCode } = await importAddon<{
      transformStoriesCode: TransformStoriesCode;
    }>('dist/compiler/post-transform/index.js');

    const svelteAST = getSvelteAST({ code: rawCode, filename: id });
    const svelteASTNodes = await extractSvelteASTNodes({
      ast: svelteAST,
      filename: id,
    });
    const compiledASTNodes = await extractCompiledASTNodes({
      ast: compiledAST,
      filename: id,
    });

    await transformStoriesCode({
      code: magicCompiled,
      nodes: { svelte: svelteASTNodes, compiled: compiledASTNodes },
      filename: id,
      originalCode: rawCode,
    });

    return {
      code: magicCompiled.toString(),
      map: magicCompiled.generateMap({ hires: true, source: id }),
    };
  })().then(
    ({ code, map }) => callback(null, code, map as any),
    (err) => callback(err)
  );
}

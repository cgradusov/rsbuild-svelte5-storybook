import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { RsbuildConfig } from '@rsbuild/core';
import type { FrameworkOptions, StorybookConfig } from './types';

// Works in both ESM and CJS output (tsup compiles import.meta.url away in CJS).
const req = createRequire(
  typeof __filename !== 'undefined'
    ? pathToFileURL(__filename).href
    : (eval('import.meta.url') as string)
);

const pkgDir = (input: string) =>
  dirname(req.resolve(join(input, 'package.json')));

export const core = {
  builder: 'storybook-builder-rsbuild',
  renderer: '@storybook/svelte',
};

// Pulls in `experimental_indexers` from addon-svelte-csf so `.stories.svelte`
// files are discovered. The addon's `viteFinal` is not invoked on the rsbuild
// builder, so it is safe to register here.
export const addons = ['@storybook/addon-svelte-csf'];

const selfDir = pkgDir('storybook-svelte-rsbuild');

export const previewAnnotations: NonNullable<
  StorybookConfig['previewAnnotations']
> = (entry = []) => {
  return [...entry, join(selfDir, 'dist/preview.js')];
};

const readFrameworkOptions = async (options: {
  presets: { apply: <T>(key: string, fallback?: T) => Promise<T> };
}): Promise<FrameworkOptions> => {
  const framework = await options.presets.apply<
    StorybookConfig['framework'] | undefined
  >('framework');
  if (!framework) return {};
  return typeof framework === 'string' ? {} : framework.options ?? {};
};

const storiesSvelteRe = /\.stories\.svelte$/;
// `.svelte` components + `.svelte.js` / `.svelte.ts` runes modules.
const svelteRe = /\.svelte(?:\.[jt]s)?$/;

export const rsbuildFinal: NonNullable<StorybookConfig['rsbuildFinal']> = async (
  config,
  options
) => {
  const frameworkOptions = await readFrameworkOptions(options as any);
  const isDev = (options as any).configType !== 'PRODUCTION';

  const userCompilerOptions = frameworkOptions.svelte?.compilerOptions ?? {};
  const compilerOptions = {
    ...userCompilerOptions,
  };

  const svelteLoaderPath = join(selfDir, 'dist/svelte-loader.js');
  const storiesLoaderPath = join(selfDir, 'dist/stories-svelte-loader.js');

  const svelteRspackMutator = (rspackConfig: any) => {
    rspackConfig.module = rspackConfig.module ?? {};
    rspackConfig.module.rules = rspackConfig.module.rules ?? [];

    // Order matters — `.stories.svelte` is more specific than `.svelte`,
    // declare it first so it wins in `oneOf`-like resolution. Rspack matches
    // all rules but `exclude` keeps them disjoint.
    rspackConfig.module.rules.push(
      {
        test: storiesSvelteRe,
        use: [
          {
            loader: storiesLoaderPath,
            options: {
              compilerOptions,
              preprocess: frameworkOptions.preprocess,
              legacyTemplate: false,
            },
          },
        ],
      },
      {
        test: svelteRe,
        exclude: storiesSvelteRe,
        use: [
          {
            loader: svelteLoaderPath,
            options: {
              compilerOptions,
              preprocess: frameworkOptions.preprocess,
              dev: isDev,
            },
          },
        ],
      }
    );

    // Make Svelte's package exports/source fields resolvable.
    rspackConfig.resolve = rspackConfig.resolve ?? {};
    const resolve = rspackConfig.resolve;
    resolve.conditionNames = Array.from(
      new Set([
        'svelte',
        ...(resolve.conditionNames ?? ['browser', 'import', 'require']),
      ])
    );
    resolve.mainFields = Array.from(
      new Set([
        'svelte',
        'browser',
        ...(resolve.mainFields ?? ['module', 'main']),
      ])
    );
    resolve.extensions = Array.from(
      new Set([...(resolve.extensions ?? []), '.svelte']),
    );
  };

  // Preserve any existing tools.rspack (builder-rsbuild uses it for the
  // virtual storybook-config-entry plugin). Chain via an array.
  const existingRspack = (config.tools as any)?.rspack;
  const rspackChain = existingRspack
    ? [
        ...(Array.isArray(existingRspack) ? existingRspack : [existingRspack]),
        svelteRspackMutator,
      ]
    : svelteRspackMutator;

  const merged: RsbuildConfig = {
    ...config,
    tools: {
      ...(config.tools ?? {}),
      rspack: rspackChain,
    },
  };

  return merged;
};

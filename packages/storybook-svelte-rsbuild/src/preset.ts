import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { RsbuildConfig } from '@rsbuild/core';
import { pluginSvelte } from '@rsbuild/plugin-svelte';
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
const svelteRe = /\.svelte$/;

const addExclude = (rule: any, pattern: RegExp) => {
  if (!rule) return;
  if (!rule.exclude) {
    rule.exclude = pattern;
  } else if (Array.isArray(rule.exclude)) {
    rule.exclude.push(pattern);
  } else {
    rule.exclude = [rule.exclude, pattern];
  }
};

export const rsbuildFinal: NonNullable<StorybookConfig['rsbuildFinal']> = async (
  config,
  options
) => {
  const frameworkOptions = await readFrameworkOptions(options as any);
  const isDev = (options as any).configType !== 'PRODUCTION';

  const userCompilerOptions = frameworkOptions.svelte?.compilerOptions ?? {};
  // Do not force `runes: true` — Svelte 5 auto-detects runes based on rune
  // usage in each file. Forcing it globally breaks legacy `.svelte` files in
  // dependencies (e.g. `@storybook/addon-svelte-csf/dist/runtime/*`).
  const compilerOptions = {
    dev: isDev,
    ...userCompilerOptions,
  };

  const sveltePlugin = pluginSvelte({
    svelteLoaderOptions: {
      compilerOptions,
      preprocess: frameworkOptions.preprocess,
      hotReload: isDev,
    } as any,
  });

  const loaderPath = join(selfDir, 'dist/stories-svelte-loader.js');

  const storiesSvelteRspackMutator = (rspackConfig: any) => {
    const rules: any[] = rspackConfig.module?.rules ?? [];

    const walk = (list: any[]) => {
      for (const r of list) {
        if (!r || typeof r !== 'object') continue;
        if (Array.isArray(r.oneOf)) walk(r.oneOf);
        if (Array.isArray(r.rules)) walk(r.rules);
        const t = r.test;
        if (
          t instanceof RegExp &&
          t.test('foo.svelte') &&
          !t.source.includes('stories')
        ) {
          addExclude(r, storiesSvelteRe);
        }
      }
    };
    walk(rules);

    rspackConfig.module = rspackConfig.module ?? {};
    rspackConfig.module.rules = rspackConfig.module.rules ?? [];
    rspackConfig.module.rules.push({
      test: storiesSvelteRe,
      use: [
        {
          loader: loaderPath,
          options: {
            compilerOptions,
            preprocess: frameworkOptions.preprocess,
            legacyTemplate: false,
          },
        },
      ],
    });
  };

  // Preserve any existing tools.rspack (builder-rsbuild uses it for the
  // virtual storybook-config-entry plugin). Chain via an array.
  const existingRspack = (config.tools as any)?.rspack;
  const rspackChain = existingRspack
    ? [
        ...(Array.isArray(existingRspack) ? existingRspack : [existingRspack]),
        storiesSvelteRspackMutator,
      ]
    : storiesSvelteRspackMutator;

  const merged: RsbuildConfig = {
    ...config,
    plugins: [...(config.plugins ?? []), sveltePlugin],
    tools: {
      ...(config.tools ?? {}),
      rspack: rspackChain,
    },
  };

  return merged;
};

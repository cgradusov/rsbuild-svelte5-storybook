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

export const rsbuildFinal: NonNullable<StorybookConfig['rsbuildFinal']> = async (
  config,
  options
) => {
  const frameworkOptions = await readFrameworkOptions(options as any);
  const isDev = (options as any).configType !== 'PRODUCTION';

  const userCompilerOptions = frameworkOptions.svelte?.compilerOptions ?? {};
  const compilerOptions = {
    runes: true,
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

  const merged: RsbuildConfig = {
    ...config,
    plugins: [...(config.plugins ?? []), sveltePlugin],
  };

  return merged;
};

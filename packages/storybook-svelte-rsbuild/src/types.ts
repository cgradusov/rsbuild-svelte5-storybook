import type {
  CompatibleString,
  StorybookConfig as StorybookConfigBase,
  TypescriptOptions as TypescriptOptionsBase,
} from 'storybook/internal/types';
import type {
  BuilderOptions,
  StorybookConfigRsbuild,
  TypescriptOptions as TypescriptOptionsBuilder,
} from 'storybook-builder-rsbuild';
import type { CompileOptions, PreprocessorGroup } from 'svelte/compiler';

export type FrameworkOptions = {
  builder?: BuilderOptions;
  /**
   * Svelte preprocess(es). Applied to both `.svelte` and `.stories.svelte` files.
   */
  preprocess?: PreprocessorGroup | PreprocessorGroup[];
  /**
   * Svelte compiler options forwarded to @rsbuild/plugin-svelte.
   * `runes` defaults to `true`.
   */
  svelte?: {
    compilerOptions?: CompileOptions;
  };
};

type FrameworkName = CompatibleString<'storybook-svelte-rsbuild'>;
type BuilderName = CompatibleString<'storybook-builder-rsbuild'>;

export type StorybookConfig = Omit<
  StorybookConfigBase,
  'framework' | 'core' | 'typescript'
> &
  Omit<StorybookConfigRsbuild, 'framework' | 'core' | 'typescript'> & {
    framework:
      | FrameworkName
      | {
          name: FrameworkName;
          options: FrameworkOptions;
        };
    core?: StorybookConfigBase['core'] & {
      builder?:
        | BuilderName
        | {
            name: BuilderName;
            options: BuilderOptions;
          };
    };
    typescript?: Partial<TypescriptOptionsBuilder & TypescriptOptionsBase> &
      StorybookConfigBase['typescript'];
  };

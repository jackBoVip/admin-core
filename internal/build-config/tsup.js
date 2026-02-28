/**
 * Shared tsup config helpers.
 */

import { copyFiles } from './copy.js';

function createBanner(packageName, mode) {
  if (mode === 'dev') {
    return `/* ${packageName} - CDN Development Build */`;
  }
  return `/* ${packageName} - CDN Build */`;
}

export function createCoreLibraryTsupConfig(options) {
  const {
    copyEntries = [],
    entry,
    external = [],
    globalName,
    noExternal = [],
    packageName,
  } = options;

  const shouldGenerateSourceMap = process.env.NODE_ENV !== 'production';
  const hasExternal = Array.isArray(external) && external.length > 0;
  const hasNoExternal = Array.isArray(noExternal) && noExternal.length > 0;
  const hasCopyEntries = Array.isArray(copyEntries) && copyEntries.length > 0;

  return [
    {
      entry,
      format: ['cjs', 'esm'],
      dts: true,
      clean: true,
      sourcemap: shouldGenerateSourceMap,
      treeshake: true,
      minify: true,
      target: 'es2020',
      ...(hasExternal ? { external } : {}),
      ...(hasCopyEntries
        ? {
            onSuccess() {
              copyFiles(copyEntries);
            },
          }
        : {}),
    },
    {
      entry: ['src/index.ts'],
      outDir: 'dist',
      format: ['iife'],
      globalName,
      clean: false,
      outExtension: () => ({ js: '.global.js' }),
      sourcemap: shouldGenerateSourceMap,
      treeshake: true,
      minify: true,
      target: 'es2020',
      ...(hasNoExternal ? { noExternal } : {}),
      esbuildOptions(esbuildConfig) {
        esbuildConfig.banner = {
          js: createBanner(packageName, 'prod'),
        };
      },
    },
    {
      entry: ['src/index.ts'],
      outDir: 'dist',
      format: ['iife'],
      globalName,
      clean: false,
      outExtension: () => ({ js: '.global.dev.js' }),
      sourcemap: true,
      treeshake: true,
      minify: false,
      target: 'es2020',
      ...(hasNoExternal ? { noExternal } : {}),
      esbuildOptions(esbuildConfig) {
        esbuildConfig.banner = {
          js: createBanner(packageName, 'dev'),
        };
      },
    },
  ];
}

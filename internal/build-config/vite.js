/**
 * Shared Vite config helpers.
 */

import { defineConfig } from 'vite';

export async function resolveDtsPlugin(options) {
  try {
    const { default: dts } = await import('vite-plugin-dts');
    return [dts(options)];
  } catch {
    console.warn(
      '[admin-core] vite-plugin-dts is unavailable, skip declaration generation in vite build.'
    );
    return [];
  }
}

function createCdnBanner(packageName, isDev) {
  return isDev
    ? `/* ${packageName} - CDN Development Build */`
    : `/* ${packageName} - CDN Build */`;
}

export function createCdnLibraryConfig(options) {
  const {
    cssCodeSplit = false,
    emptyOutDir = false,
    entry,
    external = [],
    globals = {},
    name,
    packageName,
    plugins = [],
    sourcemap = true,
    target = 'es2020',
  } = options;

  return defineConfig(({ mode }) => {
    const isDev = mode === 'development';

    return {
      plugins,
      build: {
        emptyOutDir,
        lib: {
          entry,
          name,
          formats: ['iife'],
          fileName: () => (isDev ? 'index.global.dev.js' : 'index.global.js'),
        },
        rollupOptions: {
          external,
          output: {
            globals,
            banner: createCdnBanner(packageName, isDev),
          },
        },
        cssCodeSplit,
        sourcemap,
        minify: isDev ? false : 'esbuild',
        ...(target ? { target } : {}),
      },
    };
  });
}

export function createLibraryViteConfig(options) {
  const {
    cssCodeSplit = false,
    dts,
    entry,
    external = [],
    globals = {},
    minify = 'esbuild',
    name,
    plugins = [],
    sourcemap = process.env.NODE_ENV !== 'production',
    target = 'es2020',
  } = options;

  return defineConfig(async () => {
    const dtsPlugins = await resolveDtsPlugin(dts);

    return {
      plugins: [...plugins, ...dtsPlugins],
      build: {
        lib: {
          entry,
          name,
          formats: ['es', 'cjs'],
          fileName: (format) => `index.${format === 'es' ? 'js' : 'cjs'}`,
        },
        rollupOptions: {
          external,
          output: {
            globals,
          },
        },
        cssCodeSplit,
        sourcemap,
        minify,
        target,
      },
    };
  });
}

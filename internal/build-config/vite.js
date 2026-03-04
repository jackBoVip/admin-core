/**
 * Shared Vite config helpers.
 */

import { defineConfig } from 'vite';

const STRIPPABLE_CHUNK_SUFFIXES = ['.js', '.cjs', '.mjs'];
const STRIPPABLE_ASSET_SUFFIXES = ['.d.ts', '.d.cts', '.d.mts'];

function hasSuffix(fileName, suffixes) {
  return suffixes.some((suffix) => fileName.endsWith(suffix));
}

function stripJSDocComments(content) {
  return content.replace(/\/\*\*(?!\!)[\s\S]*?\*\//g, '');
}

export function createStripJSDocCommentsPlugin() {
  return {
    name: 'admin-core-strip-jsdoc-comments',
    renderChunk(code, chunk) {
      if (!hasSuffix(chunk.fileName, STRIPPABLE_CHUNK_SUFFIXES)) {
        return null;
      }
      return {
        code: stripJSDocComments(code),
        map: null,
      };
    },
    generateBundle(_, bundle) {
      for (const [fileName, bundleItem] of Object.entries(bundle)) {
        if (
          bundleItem.type === 'asset' &&
          typeof bundleItem.source === 'string' &&
          hasSuffix(fileName, STRIPPABLE_ASSET_SUFFIXES)
        ) {
          bundleItem.source = stripJSDocComments(bundleItem.source);
        }
      }
    },
  };
}

function withRemoveCommentsDtsOptions(options = {}) {
  return {
    ...options,
    compilerOptions: {
      ...(options.compilerOptions ?? {}),
      removeComments: true,
    },
  };
}

export async function resolveDtsPlugin(options) {
  try {
    const { default: dts } = await import('vite-plugin-dts');
    return [dts(withRemoveCommentsDtsOptions(options))];
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
      plugins: [...plugins, createStripJSDocCommentsPlugin()],
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
        esbuild: {
          legalComments: 'none',
        },
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
      plugins: [...plugins, ...dtsPlugins, createStripJSDocCommentsPlugin()],
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
        esbuild: {
          legalComments: 'none',
        },
        target,
      },
    };
  });
}

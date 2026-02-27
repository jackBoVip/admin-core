import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: {
      index: 'src/index.ts',
      'styles/index': 'src/styles/index.ts',
    },
    format: ['cjs', 'esm'],
    dts: true,
    clean: true,
    sourcemap: process.env.NODE_ENV !== 'production',
    treeshake: true,
    minify: true,
    target: 'es2020',
  },
  {
    entry: ['src/index.ts'],
    outDir: 'dist',
    format: ['iife'],
    globalName: 'AdminCoreTabsCore',
    clean: false,
    outExtension: () => ({ js: '.global.js' }),
    sourcemap: process.env.NODE_ENV !== 'production',
    treeshake: true,
    minify: true,
    target: 'es2020',
    esbuildOptions(options) {
      options.banner = {
        js: '/* @admin-core/tabs-core - CDN Build */',
      };
    },
  },
  {
    entry: ['src/index.ts'],
    outDir: 'dist',
    format: ['iife'],
    globalName: 'AdminCoreTabsCore',
    clean: false,
    outExtension: () => ({ js: '.global.dev.js' }),
    sourcemap: true,
    treeshake: true,
    minify: false,
    target: 'es2020',
    esbuildOptions(options) {
      options.banner = {
        js: '/* @admin-core/tabs-core - CDN Development Build */',
      };
    },
  },
]);

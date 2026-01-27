import { defineConfig } from 'tsup';

export default defineConfig([
  // ESM 和 CJS 格式（NPM 使用）
  {
    entry: ['src/index.ts'],
    format: ['cjs', 'esm'],
    dts: true,
    splitting: true,
    sourcemap: process.env.NODE_ENV !== 'production',
    clean: true,
    treeshake: true,
    minify: true,
    target: 'es2020',
    external: ['react', 'react-dom', '@admin-core/preferences'],
    esbuildOptions(options) {
      options.banner = {
        js: '/* @admin-core/preferences-react */',
      };
    },
  },
  // IIFE 格式（CDN 使用）
  {
    entry: ['src/index.ts'],
    outDir: 'dist',
    format: ['iife'],
    globalName: 'AdminCorePreferencesReact',
    outExtension: () => ({ js: '.global.js' }),
    sourcemap: process.env.NODE_ENV !== 'production',
    treeshake: true,
    minify: true,
    target: 'es2020',
    // CDN 版本内联 @admin-core/preferences
    noExternal: ['@admin-core/preferences'],
    esbuildOptions(options) {
      options.banner = {
        js: '/* @admin-core/preferences-react - CDN Build */',
      };
    },
    esbuildPlugins: [
      {
        name: 'externalize-react',
        setup(build) {
          build.onResolve({ filter: /^react$/ }, () => ({
            path: 'react',
            namespace: 'external-react',
          }));
          build.onResolve({ filter: /^react-dom$/ }, () => ({
            path: 'react-dom',
            namespace: 'external-react-dom',
          }));
          build.onLoad({ filter: /.*/, namespace: 'external-react' }, () => ({
            contents: `module.exports = window.React`,
          }));
          build.onLoad({ filter: /.*/, namespace: 'external-react-dom' }, () => ({
            contents: `module.exports = window.ReactDOM`,
          }));
        },
      },
    ],
  },
]);

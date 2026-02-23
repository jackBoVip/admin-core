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
    // 核心包作为外部依赖（但资源文件需要内联）
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
    clean: false,
    outExtension: () => ({ js: '.global.js' }),
    sourcemap: process.env.NODE_ENV !== 'production',
    treeshake: true,
    minify: true,
    target: 'es2020',
    // CDN 版本内联 @admin-core/preferences，外部化 react 和 react-dom
    external: ['react', 'react-dom'],
    noExternal: ['@admin-core/preferences'],
    esbuildOptions(options) {
      options.banner = {
        js: '/* @admin-core/preferences-react - CDN Build */',
      };
    },
  },
  {
    entry: ['src/index.ts'],
    outDir: 'dist',
    format: ['iife'],
    globalName: 'AdminCorePreferencesReact',
    clean: false,
    outExtension: () => ({ js: '.global.dev.js' }),
    sourcemap: true,
    treeshake: true,
    minify: false,
    target: 'es2020',
    external: ['react', 'react-dom'],
    noExternal: ['@admin-core/preferences'],
    esbuildOptions(options) {
      options.banner = {
        js: '/* @admin-core/preferences-react - CDN Development Build */',
      };
    },
  },
]);

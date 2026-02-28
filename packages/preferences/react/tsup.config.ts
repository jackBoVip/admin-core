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
    // 发布包内联 core/shared，避免消费者额外安装内部包
    external: ['react', 'react-dom'],
    noExternal: ['@admin-core/preferences', '@admin-core/shared-react'],
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
    // CDN 版本内联 core/shared，外部化 react 和 react-dom
    external: ['react', 'react-dom'],
    noExternal: ['@admin-core/preferences', '@admin-core/shared-react'],
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
    noExternal: ['@admin-core/preferences', '@admin-core/shared-react'],
    esbuildOptions(options) {
      options.banner = {
        js: '/* @admin-core/preferences-react - CDN Development Build */',
      };
    },
  },
]);

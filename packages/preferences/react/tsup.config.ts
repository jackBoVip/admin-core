import { defineConfig } from 'tsup';
import { stripJSDocCommentsFromDist } from '../../../internal/build-config/tsup.js';

export default defineConfig([
  // ESM 和 CJS 格式（NPM 使用）
  {
    entry: ['src/index.ts'],
    format: ['cjs', 'esm'],
    dts: {
      compilerOptions: {
        removeComments: true,
      },
    },
    splitting: true,
    sourcemap: process.env.NODE_ENV !== 'production',
    clean: true,
    treeshake: true,
    minify: true,
    target: 'es2020',
    // 发布包内联 core/shared，避免消费者额外安装内部包
    external: ['react', 'react-dom'],
    noExternal: ['@admin-core/preferences', '@admin-core/shared-react'],
    /**
     * 注入 NPM 构建横幅信息。
     * @param options esbuild 配置对象。
     */
    esbuildOptions(options) {
      options.legalComments = 'none';
      options.banner = {
        js: '/* @admin-core/preferences-react */',
      };
    },
    onSuccess() {
      stripJSDocCommentsFromDist();
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
    /**
     * 注入 CDN 生产包横幅信息。
     * @param options esbuild 配置对象。
     */
    esbuildOptions(options) {
      options.legalComments = 'none';
      options.banner = {
        js: '/* @admin-core/preferences-react - CDN Build */',
      };
    },
    onSuccess() {
      stripJSDocCommentsFromDist();
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
    /**
     * 注入 CDN 开发包横幅信息。
     * @param options esbuild 配置对象。
     */
    esbuildOptions(options) {
      options.legalComments = 'none';
      options.banner = {
        js: '/* @admin-core/preferences-react - CDN Development Build */',
      };
    },
    onSuccess() {
      stripJSDocCommentsFromDist();
    },
  },
]);

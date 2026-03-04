import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';
import { createStripJSDocCommentsPlugin } from '../../../internal/build-config/vite.js';

/**
 * CDN 构建配置。
 * @description 输出 IIFE 格式，支持通过 `<script>` 标签直接引入。
 */
export default defineConfig(({ mode }) => {
  const isDev = mode === 'development';

  return {
    plugins: [vue(), createStripJSDocCommentsPlugin()],
    build: {
      emptyOutDir: false, // 不清空 dist 目录
      lib: {
        entry: resolve(__dirname, 'src/index.ts'),
        name: 'AdminCorePreferencesVue',
        formats: ['iife'],
        fileName: () => (isDev ? 'index.global.dev.js' : 'index.global.js'),
      },
      rollupOptions: {
        // 只排除 vue，其他依赖内联
        external: ['vue'],
        output: {
          globals: {
            vue: 'Vue',
          },
          banner: isDev
            ? '/* @admin-core/preferences-vue - CDN Development Build */'
            : '/* @admin-core/preferences-vue - CDN Build */',
        },
      },
      sourcemap: true,
      minify: isDev ? false : 'esbuild',
      esbuild: {
        legalComments: 'none',
      },
    },
  };
});

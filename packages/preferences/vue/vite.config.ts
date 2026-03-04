import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';
import { createStripJSDocCommentsPlugin, resolveDtsPlugin } from '../../../internal/build-config/vite.js';

/**
 * `@admin-core/preferences-vue` 的 NPM 构建配置。
 * @description 产物仅外部化 `vue`，并将 core/shared 资源内联到当前包，便于消费者直接使用单包能力。
 */
const npmConfig = defineConfig(async () => {
  const dtsPlugins = await resolveDtsPlugin({
    include: ['src/**/*.ts', 'src/**/*.vue'],
    outDir: 'dist',
    rollupTypes: false,
    insertTypesEntry: true,
    compilerOptions: {
      removeComments: true,
    },
  });

  return {
    plugins: [vue(), ...dtsPlugins, createStripJSDocCommentsPlugin()],
    resolve: {
      alias: {
        // 解析 core 包的资源文件，以便内联
        '@admin-core/preferences/assets': resolve(__dirname, '../core/src/assets'),
      },
    },
    build: {
      lib: {
        entry: resolve(__dirname, 'src/index.ts'),
        name: 'AdminCorePreferencesVue',
        formats: ['es', 'cjs'],
        fileName: (format) => `index.${format === 'es' ? 'js' : 'cjs'}`,
      },
      rollupOptions: {
        // 仅外部化 Vue，内联 core/shared
        external: ['vue'],
        output: {
          globals: {
            vue: 'Vue',
          },
          banner: '/* @admin-core/preferences-vue */',
        },
      },
      sourcemap: process.env.NODE_ENV !== 'production',
      minify: 'esbuild',
      esbuild: {
        legalComments: 'none',
      },
      target: 'es2020',
      // 内联小于 100KB 的资源为 base64
      assetsInlineLimit: 102400,
    },
  };
});

/**
 * 默认导出 npm 构建配置。
 */
export default npmConfig;

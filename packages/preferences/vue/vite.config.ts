import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';
import { resolveDtsPlugin } from '../../../internal/build-config/vite.js';

// NPM 构建配置
const npmConfig = defineConfig(async () => {
  const dtsPlugins = await resolveDtsPlugin({
    include: ['src/**/*.ts', 'src/**/*.vue'],
    outDir: 'dist',
    rollupTypes: false,
    insertTypesEntry: true,
  });

  return {
    plugins: [vue(), ...dtsPlugins],
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
      target: 'es2020',
      // 内联小于 100KB 的资源为 base64
      assetsInlineLimit: 102400,
    },
  };
});

export default npmConfig;

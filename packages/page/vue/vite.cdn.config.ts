import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig(({ mode }) => {
  const isDev = mode === 'development';

  return {
    plugins: [vue()],
    build: {
      emptyOutDir: false,
      lib: {
        entry: resolve(__dirname, 'src/index.ts'),
        name: 'AdminCorePageVue',
        formats: ['iife'],
        fileName: () => (isDev ? 'index.global.dev.js' : 'index.global.js'),
      },
      rollupOptions: {
        external: [
          'vue',
          '@admin-core/form-vue',
          '@admin-core/page-core',
          '@admin-core/table-vue',
        ],
        output: {
          globals: {
            vue: 'Vue',
            '@admin-core/form-vue': 'AdminCoreFormVue',
            '@admin-core/page-core': 'AdminCorePageCore',
            '@admin-core/table-vue': 'AdminCoreTableVue',
          },
          banner: isDev
            ? '/* @admin-core/page-vue - CDN Development Build */'
            : '/* @admin-core/page-vue - CDN Build */',
        },
      },
      cssCodeSplit: false,
      sourcemap: true,
      minify: isDev ? false : 'esbuild',
      target: 'es2020',
    },
  };
});

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
        name: 'AdminCoreTableVue',
        formats: ['iife'],
        fileName: () => (isDev ? 'index.global.dev.js' : 'index.global.js'),
      },
      rollupOptions: {
        external: [
          'vue',
          'vxe-table',
          'vxe-pc-ui',
          '@admin-core/table-core',
          '@admin-core/form-vue',
          '@admin-core/preferences',
        ],
        output: {
          globals: {
            vue: 'Vue',
            'vxe-table': 'VXETable',
            'vxe-pc-ui': 'VxeUI',
            '@admin-core/table-core': 'AdminCoreTableCore',
            '@admin-core/form-vue': 'AdminCoreFormVue',
            '@admin-core/preferences': 'AdminCorePreferences',
          },
          banner: isDev
            ? '/* @admin-core/table-vue - CDN Development Build */'
            : '/* @admin-core/table-vue - CDN Build */',
        },
      },
      cssCodeSplit: false,
      sourcemap: true,
      minify: isDev ? false : 'esbuild',
      target: 'es2020',
    },
  };
});

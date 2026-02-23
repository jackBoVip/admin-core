import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  const isDev = mode === 'development';

  return {
    plugins: [vue(), tailwindcss()],
    build: {
      emptyOutDir: false,
      lib: {
        entry: resolve(__dirname, 'src/index.ts'),
        name: 'AdminCoreLayoutVue',
        formats: ['iife'],
        fileName: () => (isDev ? 'index.global.dev.js' : 'index.global.js'),
      },
      rollupOptions: {
        external: [
          'vue',
          'vue-router',
          '@admin-core/layout',
          '@admin-core/preferences',
          '@admin-core/preferences-vue',
        ],
        output: {
          globals: {
            vue: 'Vue',
            'vue-router': 'VueRouter',
            '@admin-core/layout': 'AdminCoreLayout',
            '@admin-core/preferences': 'AdminCorePreferences',
            '@admin-core/preferences-vue': 'AdminCorePreferencesVue',
          },
          banner: isDev
            ? '/* @admin-core/layout-vue - CDN Development Build */'
            : '/* @admin-core/layout-vue - CDN Build */',
        },
      },
      cssCodeSplit: false,
      sourcemap: true,
      minify: isDev ? false : 'esbuild',
      target: 'es2020',
    },
  };
});

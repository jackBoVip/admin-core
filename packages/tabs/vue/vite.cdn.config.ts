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
        name: 'AdminCoreTabsVue',
        formats: ['iife'],
        fileName: () => (isDev ? 'index.global.dev.js' : 'index.global.js'),
      },
      rollupOptions: {
        external: ['vue', '@admin-core/tabs-core'],
        output: {
          globals: {
            vue: 'Vue',
            '@admin-core/tabs-core': 'AdminCoreTabsCore',
          },
          banner: isDev
            ? '/* @admin-core/tabs-vue - CDN Development Build */'
            : '/* @admin-core/tabs-vue - CDN Build */',
        },
      },
      cssCodeSplit: false,
      sourcemap: true,
      minify: isDev ? false : 'esbuild',
      target: 'es2020',
    },
  };
});

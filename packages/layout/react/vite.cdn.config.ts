import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  const isDev = mode === 'development';

  return {
    plugins: [react(), tailwindcss()],
    build: {
      emptyOutDir: false,
      lib: {
        entry: resolve(__dirname, 'src/index.ts'),
        name: 'AdminCoreLayoutReact',
        formats: ['iife'],
        fileName: () => (isDev ? 'index.global.dev.js' : 'index.global.js'),
      },
      rollupOptions: {
        external: [
          'react',
          'react-dom',
          'react-router-dom',
          '@admin-core/layout',
          '@admin-core/preferences',
          '@admin-core/preferences-react',
        ],
        output: {
          globals: {
            react: 'React',
            'react-dom': 'ReactDOM',
            'react-router-dom': 'ReactRouterDOM',
            '@admin-core/layout': 'AdminCoreLayout',
            '@admin-core/preferences': 'AdminCorePreferences',
            '@admin-core/preferences-react': 'AdminCorePreferencesReact',
          },
          banner: isDev
            ? '/* @admin-core/layout-react - CDN Development Build */'
            : '/* @admin-core/layout-react - CDN Build */',
        },
      },
      cssCodeSplit: false,
      sourcemap: true,
      minify: isDev ? false : 'esbuild',
      target: 'es2020',
    },
  };
});

import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const isDev = mode === 'development';

  return {
    plugins: [react()],
    build: {
      emptyOutDir: false,
      lib: {
        entry: resolve(__dirname, 'src/index.ts'),
        name: 'AdminCoreTabsReact',
        formats: ['iife'],
        fileName: () => (isDev ? 'index.global.dev.js' : 'index.global.js'),
      },
      rollupOptions: {
        external: ['react', 'react-dom', 'antd', '@admin-core/tabs-core'],
        output: {
          globals: {
            react: 'React',
            'react-dom': 'ReactDOM',
            antd: 'antd',
            '@admin-core/tabs-core': 'AdminCoreTabsCore',
          },
          banner: isDev
            ? '/* @admin-core/tabs-react - CDN Development Build */'
            : '/* @admin-core/tabs-react - CDN Build */',
        },
      },
      cssCodeSplit: false,
      sourcemap: true,
      minify: isDev ? false : 'esbuild',
      target: 'es2020',
    },
  };
});

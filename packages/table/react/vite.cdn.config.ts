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
        name: 'AdminCoreTableReact',
        formats: ['iife'],
        fileName: () => (isDev ? 'index.global.dev.js' : 'index.global.js'),
      },
      rollupOptions: {
        external: [
          'react',
          'react-dom',
          'antd',
          '@admin-core/table-core',
          '@admin-core/form-react',
          '@admin-core/preferences',
        ],
        output: {
          globals: {
            react: 'React',
            'react-dom': 'ReactDOM',
            antd: 'antd',
            '@admin-core/table-core': 'AdminCoreTableCore',
            '@admin-core/form-react': 'AdminCoreFormReact',
            '@admin-core/preferences': 'AdminCorePreferences',
          },
          banner: isDev
            ? '/* @admin-core/table-react - CDN Development Build */'
            : '/* @admin-core/table-react - CDN Build */',
        },
      },
      cssCodeSplit: false,
      sourcemap: true,
      minify: isDev ? false : 'esbuild',
      target: 'es2020',
    },
  };
});
